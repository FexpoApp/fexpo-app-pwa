import { describe, it, expect } from 'vitest';
import { PUC_ISSUED_QRS } from '../../src/features/events/issued-qr';
import {
  PUC_BASE,
  PUC_EXPERIENCES,
  PUC_QR_DESTINATIONS,
  resolvePucQr,
  ratingUrl,
  FAIRS,
  pucPrintedQrUrl,
  PUC_TEST_QR,
  isPucExternalQr,
} from '@/features/events/catalog';
import { PUC_LOTS, PUC_LOT_EXPERIENCES, PUC_DOME } from '@/features/events/geometry';
describe('GAMLP PUC: recorrido acordado y destinos QR', () => {
  it('publica GAMLP, FIPAZ finalizado y siete destinos HTTPS para GAMLP', () => {
    expect(FAIRS.map((f) => [f.slug, f.status])).toEqual([
      ['gamlp-puc-2026', null],
      ['fipaz-2026', 'Finalizado'],
    ]);
    for (const point of PUC_QR_DESTINATIONS) {
      const url = new URL(pucPrintedQrUrl(point.slug)!);
      expect(url.origin).toBe('https://app.fexpo.lat');
      expect(url.pathname).toBe(point.path);
      expect(url.searchParams.get('via')).toBe(point.slug === 'inicio' ? null : 'qr');
    }
    expect(pucPrintedQrUrl('desconocido')).toBeNull();
  });
  it('mantiene las cinco paradas y agrega el domo como sexta experiencia central', () => {
    expect(PUC_EXPERIENCES.map((p) => p.slug)).toEqual([
      'mercados',
      'tunel-mercados',
      'desarrollo-economico',
      'tunel-cites',
      'publicidad',
      'domo',
    ]);
    expect(PUC_EXPERIENCES.map((p) => p.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(PUC_QR_DESTINATIONS).toHaveLength(7);
    expect(new Set(PUC_QR_DESTINATIONS.map((q) => q.path)).size).toBe(7);
    expect(PUC_QR_DESTINATIONS[0].path).toBe(PUC_BASE);
  });
  it('conserva cuatro carpas, dos pasajes y un domo; las dos superiores evalúan juntas', () => {
    expect(PUC_LOTS).toHaveLength(6);
    expect(PUC_LOT_EXPERIENCES.filter((p) => p === 'desarrollo-economico')).toHaveLength(2);
    const [entry, tunnel, a, b, cites, exit] = PUC_LOTS;
    expect(entry[1]).toBeGreaterThan(exit[1]);
    expect(entry[2]).toBe(exit[2]);
    expect(tunnel[1]).toBeGreaterThan(PUC_DOME.x);
    expect(cites[1] + cites[3]).toBeLessThan(PUC_DOME.x);
    expect(a[2]).toBe(b[2]);
    expect(a[1] + a[3]).toBe(b[1]);
    expect(a[2] + a[4]).toBeLessThan(cites[2]);
    expect(PUC_EXPERIENCES.find((p) => p.slug === 'domo')?.type).toBe('domo');
  });
  it('acepta los destinos de esta feria y únicamente los seis enlaces emitidos', () => {
    expect(PUC_ISSUED_QRS).toHaveLength(6);
    for (const qr of PUC_ISSUED_QRS) {
      const target = new URL(qr.target);
      expect(resolvePucQr(qr.shortUrl, 'https://app.fexpo.lat')).toBe(
        target.pathname + target.search,
      );
      expect(isPucExternalQr(qr.slug, qr.code)).toBe(true);
    }
    for (const destination of PUC_QR_DESTINATIONS) {
      expect(
        resolvePucQr('https://app.fexpo.lat' + destination.path, 'http://localhost:5174'),
      ).toBe(destination.path);
      expect(resolvePucQr(destination.path, 'http://localhost:5174')).toBe(destination.path);
    }
    for (const value of [
      'https://otro.example' + ratingUrl('mercados'),
      'javascript:alert(1)',
      PUC_BASE + '/calificar/desconocido',
      '/e/fipaz/s/stand',
      '/map',
      'https://app.fexpo.lat.evil.example' + ratingUrl('mercados'),
      'https://is.gd/otro_enlace',
      'https://is.gd/fexpo_gamlp_mercados?url=otro',
    ])
      expect(resolvePucQr(value, 'http://localhost:5174')).toBeNull();
    const target = new URL(PUC_TEST_QR.target);
    expect(resolvePucQr(PUC_TEST_QR.shortUrl, 'http://localhost:5174')).toBe(
      target.pathname + target.search,
    );
    expect(resolvePucQr(PUC_TEST_QR.target, 'http://localhost:5174')).toBe(
      target.pathname + target.search,
    );
    expect(isPucExternalQr('mercados', null)).toBe(false);
    expect(isPucExternalQr('domo', PUC_TEST_QR.code)).toBe(false);
    expect(isPucExternalQr('mercados', PUC_TEST_QR.code)).toBe(true);
    expect(
      resolvePucQr(ratingUrl('domo') + '?qr=' + PUC_TEST_QR.code, 'http://localhost:5174'),
    ).toBeNull();
  });
});
