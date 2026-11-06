import { beforeEach, describe, expect, it, vi } from 'vitest';
import catalog from '../../docs/data/gamlp-api-catalog-2026-11-06.json';
const { handler } = vi.hoisted(() => ({ handler: vi.fn() }));
vi.mock('@/services/api', async (original) => ({
  ...(await original<typeof import('@/services/api')>()),
  request: handler,
}));
import { ApiError } from '@/services/api';
import { useLive } from '@/state/live';
import {
  usePucServer,
  syncPucProgress,
  savePucRating,
  ensurePucScan,
} from '@/features/events/server';
import { grantPucRatingAccess } from '@/features/events/scan-access';

// Codigos realmente emitidos (docs/data/gamlp-issued-qr-2026-11-06.json).
const QR_MERCADOS = 'mercados_3f7d1a9c6e4b48a5b1c2d0ef9a65b732';
const QR_DOMO = 'domo_e66180ffcba84f48874a3a85da52fc74';
const RECEIPT = '66666666-6666-4666-8666-666666666666';
const owner = 'qa-owner';
const rating = {
  id: 'qa-rating',
  eventId: catalog.id,
  experienceId: catalog.experiences[0].id,
  stars: 4,
  comment: 'Bien',
  createdAt: '2026-11-06T10:00:00Z',
  updatedAt: '2026-11-06T10:00:00Z',
};
const summary = { totalExperiences: 5, scannedCount: 1, ratedCount: 1 };
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => values.get(k) || null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
  vi.stubGlobal('window', new EventTarget());
  useLive.setState({ status: 'guest', user: null });
  useLive.setState({
    status: 'signedIn',
    user: { id: owner, displayName: 'QA', avatarUrl: null, authProvider: 'google' },
  });
  usePucServer.setState({ catalog: null, progress: null, owner, loading: false, error: '' });
  handler.mockReset().mockImplementation(async (path: string) => {
    if (path.includes('/resolve/')) return { data: catalog };
    if (path.endsWith('/experience-progress'))
      return {
        data: {
          eventId: catalog.id,
          progress: { ...summary, scannedCount: 0, ratedCount: 0 },
          experiences: catalog.experiences.map((p) => ({
            ...p,
            experienceId: p.id,
            scannedAt: null,
            myRating: null,
            status: 'pending',
          })),
        },
      };
    if (path.endsWith('/scans'))
      return {
        data: {
          scan: { experienceId: rating.experienceId, lastScannedAt: rating.createdAt },
          firstScan: true,
          scanReceipt: RECEIPT,
          receiptExpiresAt: '2026-11-06T22:00:00Z',
          progress: { ...summary, ratedCount: 0 },
        },
      };
    if (path.endsWith('/my-rating')) return { data: { rating, progress: summary, created: true } };
    throw new Error('Unexpected request: ' + path);
  });
});
describe('Calificaciones GAMLP conectadas al contrato publicado', () => {
  it('resuelve UUID del catálogo, registra lectura y confirma solo la respuesta guardada', async () => {
    grantPucRatingAccess('mercados', owner, 'camera', QR_MERCADOS);
    await syncPucProgress(owner);
    await ensurePucScan('mercados', owner);
    const result = await savePucRating('mercados', owner, 4, 'Bien');
    expect(result.rating.id).toBe('qa-rating');
    expect(usePucServer.getState().progress?.progress.ratedCount).toBe(1);
    const mutation = handler.mock.calls.find(([p]) => p.endsWith('/my-rating'))!;
    expect(mutation[0]).toContain(catalog.experiences[0].id);
    // El comprobante sale de la lectura registrada en el servidor, no del navegador.
    expect(mutation[1].body).toEqual({
      stars: 4,
      comment: 'Bien',
      scanReceipt: RECEIPT,
      requestKey: expect.any(String),
    });
    expect(mutation[1].body).not.toHaveProperty('userId');
    const scan = handler.mock.calls.filter(([p]) => p.endsWith('/scans'));
    expect(scan).toHaveLength(1);
    // El código del QR impreso viaja con la lectura: el servidor lo exige.
    expect(scan[0][1].body).toEqual({
      qrCode: QR_MERCADOS,
      source: 'camera',
      requestKey: expect.any(String),
    });
  });
  it('conserva clave de idempotencia tras un fallo y cambia clave si cambia el contenido', async () => {
    grantPucRatingAccess('mercados', owner, 'external-qr', QR_MERCADOS);
    const defaultHandler = handler.getMockImplementation()!;
    let failures = 2;
    handler.mockImplementation(async (...args) => {
      if (args[0].endsWith('/my-rating') && failures-- > 0)
        throw new ApiError('UPSTREAM_UNAVAILABLE', 'Reintenta', 502);
      return defaultHandler(...args);
    });
    await expect(savePucRating('mercados', owner, 4, 'Bien')).rejects.toThrow('Reintenta');
    await expect(savePucRating('mercados', owner, 4, 'Bien')).rejects.toThrow('Reintenta');
    await savePucRating('mercados', owner, 5, 'Mejor');
    const bodies = handler.mock.calls
      .filter(([p]) => p.endsWith('/my-rating'))
      .map(([, o]) => o.body);
    expect(bodies[0].requestKey).toBe(bodies[1].requestKey);
    expect(bodies[2].requestKey).not.toBe(bodies[1].requestKey);
  });
  it('impide enviar sin lectura y no inventa un UUID para el domo todavía no publicado', async () => {
    await expect(savePucRating('mercados', owner, 4, '')).rejects.toThrow('Escanea');
    grantPucRatingAccess('domo', owner, 'image', QR_DOMO);
    await expect(savePucRating('domo', owner, 4, '')).rejects.toThrow('todavía no está disponible');
    expect(handler.mock.calls.filter(([, o]) => o?.method === 'PUT')).toHaveLength(0);
  });
  it('rechaza otras cuentas y respuestas de una sesión anterior', async () => {
    // `internal` es lo que guarda app_users para una cuenta de correo y
    // contraseña; el servidor nunca publica 'password'.
    useLive.setState({
      user: { id: owner, displayName: 'QA', avatarUrl: null, authProvider: 'internal' },
    });
    await expect(syncPucProgress(owner)).rejects.toThrow('Google');
    useLive.setState({
      user: { id: owner, displayName: 'QA', avatarUrl: null, authProvider: 'google' },
    });
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => (finish = resolve));
    const defaultHandler = handler.getMockImplementation()!;
    handler.mockImplementation(async (...args) => {
      if (args[0].endsWith('/experience-progress')) await gate;
      return defaultHandler(...args);
    });
    const work = syncPucProgress(owner);
    await vi.waitFor(() =>
      expect(handler.mock.calls.some(([p]) => p.endsWith('/experience-progress'))).toBe(true),
    );
    useLive.setState({
      user: { id: 'another', displayName: 'Otra', avatarUrl: null, authProvider: 'google' },
    });
    finish();
    await expect(work).rejects.toThrow('La sesión cambió');
    expect(usePucServer.getState().progress).toBeNull();
  });
});
