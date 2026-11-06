import { describe, it, expect } from 'vitest';
import config from '../../vercel.json';

describe('Archivos de actualización de la PWA en Vercel', () => {
  it('sirve el worker y su migración como JavaScript sin sustituirlos por el HTML', () => {
    const rewrite = new RegExp('^' + config.rewrites[0].source + '$');
    expect(rewrite.test('/ferias/gamlp-puc-2026/calificar/mercados')).toBe(true);
    for (const asset of [
      '/sw.js',
      '/pwa-auto-migrate-v1.js',
      '/workbox-hash.js',
      '/manifest.webmanifest',
      '/api/backend',
      '/assets/index-hash.js',
    ])
      expect(rewrite.test(asset)).toBe(false);
    const headers = config.headers.find((h) => h.source === '/pwa-auto-migrate-v1.js')?.headers;
    expect(headers?.find((h) => h.key === 'Cache-Control')?.value).toContain('must-revalidate');
  });
});
