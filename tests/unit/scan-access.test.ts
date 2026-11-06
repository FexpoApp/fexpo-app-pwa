import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { hasPucRatingAccess, grantPucRatingAccess } from '@/features/events/scan-access';

// Códigos realmente emitidos (docs/data/gamlp-issued-qr-2026-11-06.json).
const QR_MERCADOS = 'mercados_3f7d1a9c6e4b48a5b1c2d0ef9a65b732';
const QR_DOMO = 'domo_e66180ffcba84f48874a3a85da52fc74';

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  vi.stubGlobal('sessionStorage', storage);
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
  vi.stubGlobal('window', new EventTarget());
});
afterEach(() => vi.unstubAllGlobals());

describe('Lectura obligatoria por cuenta y experiencia', () => {
  it('no permite una calificación sin lectura ni reutilizar la lectura de otra cuenta o punto', () => {
    expect(hasPucRatingAccess('mercados', 'ana')).toBe(false);
    expect(grantPucRatingAccess('mercados', 'ana', 'camera', QR_MERCADOS)).toBe(true);
    expect(hasPucRatingAccess('mercados', 'ana')).toBe(true);
    expect(hasPucRatingAccess('domo', 'ana')).toBe(false);
    expect(hasPucRatingAccess('mercados', 'omar')).toBe(false);
    expect(grantPucRatingAccess('desconocido', 'ana', 'camera', QR_MERCADOS)).toBe(false);
    expect(grantPucRatingAccess('mercados', undefined, 'camera', QR_MERCADOS)).toBe(false);
  });
  it('exige el código del QR emitido para ese punto', () => {
    // Sin código, inventado, o el de otra parada: no habilita nada.
    expect(grantPucRatingAccess('mercados', 'ana', 'camera', null)).toBe(false);
    expect(grantPucRatingAccess('mercados', 'ana', 'camera', 'mercados_000')).toBe(false);
    expect(grantPucRatingAccess('mercados', 'ana', 'camera', QR_DOMO)).toBe(false);
    expect(hasPucRatingAccess('mercados', 'ana')).toBe(false);
    expect(grantPucRatingAccess('domo', 'ana', 'external-qr', QR_DOMO)).toBe(true);
  });
  it('conserva la autorización al recargar durante la sesión pero caduca a las seis horas', () => {
    grantPucRatingAccess('domo', 'ana', 'image', QR_DOMO);
    expect(hasPucRatingAccess('domo', 'ana', Date.now() + 60_000)).toBe(true);
    expect(hasPucRatingAccess('domo', 'ana', Date.now() + 6 * 60 * 60 * 1000)).toBe(false);
  });
  it('rechaza historial corrupto o un supuesto acceso manual', () => {
    grantPucRatingAccess('mercados', 'ana', 'external-qr', QR_MERCADOS);
    const key = [...values.keys()][0];
    values.set(key, '{');
    expect(hasPucRatingAccess('mercados', 'ana')).toBe(false);
    values.set(key, JSON.stringify({ source: 'manual', at: Date.now(), qrCode: QR_MERCADOS }));
    expect(hasPucRatingAccess('mercados', 'ana')).toBe(false);
  });
  it('invalida un acceso guardado antes de que el servidor exigiera el código', () => {
    grantPucRatingAccess('mercados', 'ana', 'camera', QR_MERCADOS);
    const key = [...values.keys()][0];
    const previo = JSON.parse(values.get(key)!);
    delete previo.qrCode;
    values.set(key, JSON.stringify(previo));
    expect(hasPucRatingAccess('mercados', 'ana')).toBe(false);
  });
  it('no acredita una lectura cuando el navegador impide conservarla', () => {
    vi.stubGlobal('sessionStorage', {
      setItem() {
        throw new Error('blocked');
      },
      getItem() {
        return null;
      },
    });
    expect(grantPucRatingAccess('domo', 'ana', 'camera', QR_DOMO)).toBe(false);
    expect(hasPucRatingAccess('domo', 'ana')).toBe(false);
  });
});
