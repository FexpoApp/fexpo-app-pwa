import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { hasPucRatingAccess, grantPucRatingAccess } from '@/features/events/scan-access';

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
    expect(grantPucRatingAccess('mercados', 'ana', 'camera')).toBe(true);
    expect(hasPucRatingAccess('mercados', 'ana')).toBe(true);
    expect(hasPucRatingAccess('domo', 'ana')).toBe(false);
    expect(hasPucRatingAccess('mercados', 'omar')).toBe(false);
    expect(grantPucRatingAccess('desconocido', 'ana', 'camera')).toBe(false);
    expect(grantPucRatingAccess('mercados', undefined, 'camera')).toBe(false);
  });
  it('conserva la autorización al recargar durante la sesión pero caduca a las seis horas', () => {
    grantPucRatingAccess('domo', 'ana', 'image');
    expect(hasPucRatingAccess('domo', 'ana', Date.now() + 60_000)).toBe(true);
    expect(hasPucRatingAccess('domo', 'ana', Date.now() + 6 * 60 * 60 * 1000)).toBe(false);
  });
  it('rechaza historial corrupto o un supuesto acceso manual', () => {
    grantPucRatingAccess('mercados', 'ana', 'external-qr');
    const key = [...values.keys()][0];
    values.set(key, '{');
    expect(hasPucRatingAccess('mercados', 'ana')).toBe(false);
    values.set(key, JSON.stringify({ source: 'manual', at: Date.now() }));
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
    expect(grantPucRatingAccess('domo', 'ana', 'camera')).toBe(false);
    expect(hasPucRatingAccess('domo', 'ana')).toBe(false);
  });
});
