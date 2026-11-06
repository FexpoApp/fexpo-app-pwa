import { test, expect, type Page } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QRCode from 'react-qr-code';
import { PUC_TEST_QR } from '../../src/features/events/catalog';
// @ts-expect-error JavaScript fixture is shared with the standalone SW test.
import { setupPucApi } from './puc-api-fixture.mjs';
const base = '/ferias/gamlp-puc-2026';
type Prepare = (page: Page, guest?: boolean) => Promise<unknown>;
export function multieventFlow(mode: 'local' | 'demo' | 'live', prepare: Prepare = async () => {}) {
  const originalPrepare = prepare;
  prepare = async (page, guest) => {
    const result = await originalPrepare(page, guest);
    if (mode === 'live') await setupPucApi(page);
    return result;
  };
  if (mode === 'live') {
    test('GAMLP conectado: fallo, reintento idempotente, edición y progreso separado por cuenta', async ({
      page,
    }) => {
      await prepare(page);
      const api = await setupPucApi(page);
      api.failRatings = 1;
      const target = new URL(PUC_TEST_QR.target);
      await page.goto(target.pathname + target.search);
      await page.getByRole('radio', { name: '4 estrellas', exact: true }).check();
      await page.getByRole('textbox', { name: 'Comentario' }).fill('La información fue clara.');
      await page.getByRole('button', { name: 'Enviar calificación', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Reintenta');
      await expect(page.getByRole('heading', { name: '¡Gracias por tu opinión!' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Enviar calificación', exact: true }).click();
      await expect(page.getByRole('heading', { name: '¡Gracias por tu opinión!' })).toBeVisible();
      const writes = api.requests.filter((r: { method: string }) => r.method === 'PUT');
      expect(writes).toHaveLength(2);
      expect(writes[0].body.requestKey).toBe(writes[1].body.requestKey);
      expect(Object.keys(writes[1].body).sort()).toEqual(['comment', 'requestKey', 'stars']);
      await page.getByRole('button', { name: 'Editar mi calificación' }).click();
      await page.getByRole('radio', { name: '5 estrellas', exact: true }).check();
      await page.getByRole('button', { name: 'Actualizar calificación', exact: true }).click();
      await expect(page.getByRole('heading', { name: '¡Gracias por tu opinión!' })).toBeVisible();
      expect(api.ratings.size).toBe(1);
      expect(
        api.requests.filter((r: { method: string }) => r.method === 'PUT')[2].body.requestKey,
      ).not.toBe(writes[1].body.requestKey);
      await page.getByRole('link', { name: 'Perfil', exact: true }).click();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
      await expect(page.locator('.puc-progress-counts')).toContainText(
        '1/5 Calificaciones confirmadas',
      );
      await page.reload();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
      api.owner = 'another-user';
      await page.reload();
      await expect(page.locator('.puc-progress-counts')).toContainText(
        '0/5 Calificaciones confirmadas',
      );
      await page.goto(base + '/calificar/mercados');
      await expect(
        page.getByRole('heading', { name: 'Escanea el QR de este lugar' }),
      ).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(0);
    });
    test('GAMLP conectado: domo sin publicar y sesión ajena a Google no habilitan calificación', async ({
      page,
    }) => {
      await prepare(page);
      const api = await setupPucApi(page);
      const { PUC_ISSUED_QRS } = await import('../../src/features/events/issued-qr');
      const target = new URL(PUC_ISSUED_QRS.find((qr) => qr.slug === 'domo')!.target);
      await page.goto(target.pathname + target.search);
      await expect(page.getByRole('alert')).toContainText('todavía no está disponible');
      await expect(page.getByRole('radio')).toHaveCount(0);
      expect(api.requests).toHaveLength(0);
      api.provider = 'password';
      await page.goto(base + '/escanear');
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Inicia sesión para escanear' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Activar cámara' })).toHaveCount(0);
    });
  }
  test('multievento: Google protege cámara y QR directo, conserva el destino y no acredita una lectura como invitado', async ({
    page,
  }) => {
    await prepare(page, true);
    await page.goto(base + '/escanear');
    await expect(
      page.getByRole('heading', { name: 'Inicia sesión para escanear', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activar cámara', exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Seleccionar imagen de un QR')).toHaveCount(0);
    const trial = new URL(PUC_TEST_QR.target);
    await page.goto(trial.pathname + trial.search);
    await expect(
      page.getByRole('heading', { name: 'Inicia sesión para calificar', exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('fexpo-puc-scans-v1'))).toBeNull();
    if (mode === 'live') {
      await page.getByRole('button', { name: 'Continuar con Google', exact: true }).click();
      await expect(page).toHaveURL(base + '/calificar/mercados');
      await expect(page.locator('.puc-rating-target')).toContainText('Unidad de Mercados');
      await page.getByRole('link', { name: 'Perfil', exact: true }).click();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
      await expect(page.locator('.puc-progress-counts')).toContainText('1/5 QR confirmados');
    } else
      await expect(
        page.getByRole('button', { name: 'Continuar con Google', exact: true }),
      ).toBeDisabled();
  });
  if (mode === 'live')
    test('multievento: permiso de cámara denegado permite reintentar y salir libera una apertura pendiente', async ({
      page,
    }) => {
      await prepare(page);
      await page.addInitScript(() => {
        const w = window as any;
        w.BarcodeDetector = undefined;
        w.__cameraCalls = 0;
        w.__cancelledTrackStops = 0;
        Object.defineProperty(navigator, 'mediaDevices', {
          configurable: true,
          value: {
            getUserMedia: async () => {
              if (++w.__cameraCalls === 1)
                throw new DOMException('Permission denied', 'NotAllowedError');
              return new Promise((resolve) => {
                w.__releaseCamera = () => {
                  const media = new MediaStream();
                  Object.defineProperty(media, 'getTracks', {
                    value: () => [{ stop: () => w.__cancelledTrackStops++ }],
                  });
                  resolve(media);
                };
              });
            },
          },
        });
      });
      await page.goto(base + '/escanear');
      const start = page.getByRole('button', { name: 'Activar cámara', exact: true });
      await start.click();
      await expect(page.getByRole('alert')).toContainText('Permite el acceso a la cámara');
      await expect(start).toBeEnabled();
      await start.click();
      await page.waitForFunction(() => typeof (window as any).__releaseCamera === 'function');
      await page.getByRole('link', { name: 'Perfil', exact: true }).click();
      await page.evaluate(() => (window as any).__releaseCamera());
      await expect.poll(() => page.evaluate(() => (window as any).__cancelledTrackStops)).toBe(1);
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });
  if (mode === 'live')
    test('multievento: decodifica píxeles QR sin lector nativo y registra avance sin calificación falsa', async ({
      page,
    }) => {
      await prepare(page);
      const qr = renderToStaticMarkup(
        createElement(QRCode, {
          value: PUC_TEST_QR.shortUrl,
          size: 360,
        }),
      );
      await page.addInitScript(
        ({ svg }) => {
          const w = window as any;
          w.BarcodeDetector = undefined;
          w.__realQrTrackStops = 0;
          Object.defineProperty(navigator, 'mediaDevices', {
            configurable: true,
            value: {
              getUserMedia: async () => {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 440;
                const context = canvas.getContext('2d')!;
                context.fillStyle = '#fff';
                context.fillRect(0, 0, 440, 440);
                const image = new Image();
                image.src = 'data:image/svg+xml;base64,' + btoa(svg);
                await image.decode();
                context.drawImage(image, 40, 40, 360, 360);
                const stream = canvas.captureStream(10);
                stream.getTracks().forEach((track) => {
                  const stop = track.stop.bind(track);
                  track.stop = () => {
                    w.__realQrTrackStops++;
                    stop();
                  };
                });
                return stream;
              },
            },
          });
        },
        { svg: qr },
      );
      await page.goto(base + '/escanear');
      await page.getByRole('button', { name: 'Activar cámara', exact: true }).click();
      await expect(page).toHaveURL(base + '/calificar/mercados');
      expect(await page.evaluate(() => (window as any).__realQrTrackStops)).toBe(1);
      await page.getByRole('radio', { name: '5 estrellas', exact: true }).check();
      await page.getByRole('link', { name: 'Perfil', exact: true }).click();
      await expect(
        page.getByRole('progressbar', { name: 'Lugares con calificación confirmada' }),
      ).toHaveAttribute('aria-valuenow', '0');
      await expect(page.locator('.puc-progress-counts')).toContainText(
        '0/5 Calificaciones confirmadas',
      );
      await page.reload();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
      await expect(page.getByRole('link', { name: 'Cambiar feria', exact: true })).toBeVisible();
    });
  if (mode === 'live')
    test('multievento: lee un QR de imagen, rechaza una imagen sin QR y permite reintentar', async ({
      page,
      context,
    }) => {
      await prepare(page);
      const fixture = await context.newPage();
      await fixture.setContent(
        '<main style="background:white;padding:30px;width:360px">' +
          renderToStaticMarkup(
            createElement(QRCode, {
              value: 'https://app.fexpo.lat' + base + '/calificar/publicidad',
              size: 360,
            }),
          ) +
          '</main>',
      );
      const qr = await fixture.locator('main').screenshot();
      await fixture.setContent('<main style="background:white;width:440px;height:440px"></main>');
      const blank = await fixture.locator('main').screenshot();
      await fixture.close();
      await page.goto(base + '/escanear');
      const upload = page.getByLabel('Seleccionar imagen de un QR');
      await upload.setInputFiles({ name: 'sin-qr.png', mimeType: 'image/png', buffer: blank });
      await expect(page.getByRole('alert')).toContainText('No encontramos un QR');
      await upload.setInputFiles({ name: 'qr.png', mimeType: 'image/png', buffer: qr });
      await expect(page).toHaveURL(base + '/calificar/publicidad');
      await page.getByRole('link', { name: 'Perfil', exact: true }).click();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });
  if (mode === 'local')
    test('multievento: sin WebGL conserva el punto y ofrece el plano 2D', async ({ page }) => {
      await prepare(page);
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
          this: HTMLCanvasElement,
          type: string,
          ...args: any[]
        ) {
          if (/webgl/i.test(type)) return null;
          return original.apply(this, [type, ...args] as any);
        } as typeof original;
      });
      await page.goto(base + '/mapa?view=3d&point=publicidad');
      await expect(page.locator('[data-puc-view]')).toHaveAttribute('data-puc-view', '2d');
      await expect(page.getByRole('status')).toContainText('Activamos el plano 2D');
      await expect(page.locator('.puc-map-selection')).toContainText('Unidad Publicidad');
    });
  if (mode === 'demo')
    test('multievento: mapa público offline y calificación protegida sin una cuenta Google', async ({
      page,
      context,
    }) => {
      await page.goto(base + '/mapa');
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      await page.reload();
      await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
      await context.setOffline(true);
      try {
        await page.goto(base + '/calificar/mercados');
        await expect(page.getByRole('radio')).toHaveCount(0);
        await expect(
          page.getByRole('button', { name: 'Continuar con Google', exact: true }),
        ).toBeDisabled();
        await page.goto(base + '/mapa');
        await expect(page.locator('[data-puc-lot]')).toHaveCount(6);
      } finally {
        await context.setOffline(false);
      }
    });
  if (mode === 'live')
    test('multievento: la lectura por cámara abre el punto y libera el dispositivo', async ({
      page,
    }) => {
      await prepare(page);
      await page.addInitScript(
        ({ destination }) => {
          const w = window as any;
          w.__pucCameraStopped = 0;
          w.BarcodeDetector = class {
            static async getSupportedFormats() {
              return ['qr_code'];
            }
            async detect() {
              return [{ rawValue: destination }];
            }
          };
          const stream = new MediaStream();
          Object.defineProperty(stream, 'getTracks', {
            value: () => [
              {
                stop: () => {
                  w.__pucCameraStopped++;
                },
              },
            ],
          });
          Object.defineProperty(navigator, 'mediaDevices', {
            configurable: true,
            value: { getUserMedia: async () => stream },
          });
          HTMLMediaElement.prototype.play = async () => {};
        },
        { destination: 'https://app.fexpo.lat' + base + '/calificar/tunel-mercados' },
      );
      await page.goto(base + '/escanear');
      await page.getByRole('button', { name: 'Activar cámara', exact: true }).click();
      await expect(page).toHaveURL(base + '/calificar/tunel-mercados');
      await expect(page.locator('.puc-rating-target')).toContainText(
        'Túnel de los nuevos mercados',
      );
      expect(await page.evaluate(() => (window as any).__pucCameraStopped)).toBe(1);
    });
  test('multievento: selector vertical, recorrido exacto y dos carpas con una ficha', async ({
    page,
  }) => {
    await prepare(page);
    const paths: string[] = [];
    page.on('request', (r) => {
      const path = new URL(r.url()).searchParams.get('path');
      if (path) paths.push(path);
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Elige tu feria' })).toBeVisible();
    const cards = page.locator('.fair-event-card');
    await expect(cards).toHaveCount(1);
    await expect(cards).toContainText('Feria GAMLP');
    await expect(page.locator('.fair-cards')).not.toContainText('FIPAZ');
    await cards.nth(0).click();
    await expect(page).toHaveURL(base);
    await expect(page.locator('.puc-hero')).toBeVisible();
    await expect(page.locator('.fair-header .fexpo-brand')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Cambiar feria', exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Recorrido', exact: true }).last().click();
    await expect(page.locator('.puc-experience-list li')).toHaveCount(6);
    await expect(page.locator('.fair-shell')).not.toContainText('FIPAZ');
    await page.getByRole('link', { name: 'Mapa', exact: true }).last().click();
    await expect(page.locator('[data-puc-lot]')).toHaveCount(6);
    await page.locator('[data-puc-lot="3B"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-selected="true"]')).toHaveCount(2);
    await expect(page.locator('.puc-map-selection')).toContainText(
      'Dirección de Desarrollo Económico, Competitividad e Inversiones',
    );
    await page.getByRole('button', { name: '3D', exact: true }).click();
    await expect(page.locator('[data-campus-canvas]')).toHaveAttribute('data-plan-id', 'gamlp-puc');
    await expect(page.locator('[data-campus-canvas]')).toHaveAttribute('data-lot-count', '6');
    await expect(page.locator('[data-campus-canvas]')).toHaveAttribute('data-dome-count', '1');
    await page.reload();
    await expect(page.locator('.puc-map-selection')).toContainText('Competitividad e Inversiones');
    await page
      .getByRole('button', { name: 'Punto 6: Domo de Ciudad Productiva', exact: true })
      .click();
    await expect(page.locator('.puc-map-selection')).toContainText('Domo de Ciudad Productiva');
    expect(paths.filter((p) => /\/stands|\/me\/gamification/.test(p))).toEqual([]);
  });
  test('multievento: QR directo conserva punto y borrador, Google obligatorio, sin opinión falsa', async ({
    page,
  }) => {
    await prepare(page, true);
    const writes: string[] = [];
    page.on('request', (r) => {
      if (r.method() !== 'GET' && r.url().includes('/api/')) writes.push(r.url());
    });
    await page.goto(base + '/calificar/tunel-cites');
    await expect(
      page.getByRole('heading', { name: 'Inicia sesión para calificar', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
    await expect(page.locator('.puc-rating-target')).toHaveCount(0);
    if (mode !== 'live') {
      await expect(
        page.getByRole('button', { name: 'Continuar con Google', exact: true }),
      ).toBeDisabled();
      return;
    }
    await page.getByRole('button', { name: 'Continuar con Google', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Escanea el QR de este lugar', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
    const target = new URL(PUC_TEST_QR.target);
    await page.goto(target.pathname + target.search);
    await expect(page.locator('.puc-rating-target')).toContainText('Unidad de Mercados');
    await page.getByRole('radio', { name: '4 estrellas', exact: true }).check();
    await page
      .getByRole('textbox', { name: 'Comentario' })
      .fill('Me gustó el recorrido de los CITEs.');
    await expect(
      page.getByRole('button', { name: 'Enviar calificación', exact: true }),
    ).toBeEnabled();
    if (mode === 'live') {
      await expect(page.locator('.puc-signed-in')).toContainText('Ana Visitante');
      await expect(page).toHaveURL(base + '/calificar/mercados');
      await expect(page.getByRole('radio', { name: '4 estrellas', exact: true })).toBeChecked();
      await page.getByRole('button', { name: 'Enviar calificación', exact: true }).click();
      await expect(page.getByRole('heading', { name: '¡Gracias por tu opinión!' })).toBeVisible();
    } else
      await expect(
        page.getByRole('button', { name: 'Continuar con Google', exact: true }),
      ).toBeDisabled();
    await page.reload();
    await expect(page.getByRole('radio', { name: '4 estrellas', exact: true })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Comentario' })).toHaveValue(
      'Me gustó el recorrido de los CITEs.',
    );
    await page.goto(base + '/calificar/tunel-cites?via=qr');
    await expect(
      page.getByRole('heading', { name: 'Escanea el QR de este lugar', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Comentario' })).toHaveCount(0);
    expect(writes.filter((url) => url.includes('my-rating'))).toHaveLength(1);
    await expect(page.getByRole('heading', { name: '¡Gracias por tu opinión!' })).toHaveCount(0);
  });
  test('multievento: lector abre solo los enlaces correctos y superficies compactas', async ({
    page,
  }) => {
    await prepare(page);
    await page.goto(base + '/escanear');
    if (mode === 'live') {
      await expect(page.locator('.puc-qr-link')).toHaveCount(0);
      await expect(page.getByRole('textbox')).toHaveCount(0);
      await page.goto(base + '/calificar/publicidad?via=qr');
      await expect(
        page.getByRole('heading', { name: 'Escanea el QR de este lugar', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('radio')).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Escanear QR', exact: true })).toHaveAttribute(
        'href',
        base + '/escanear?point=publicidad',
      );
    } else {
      await expect(
        page.getByRole('heading', { name: 'Inicia sesión para escanear', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Activar cámara', exact: true })).toHaveCount(
        0,
      );
      await expect(page.getByLabel('Seleccionar imagen de un QR')).toHaveCount(0);
    }
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      for (const path of ['/', base, base + '/mapa', base + '/calificar/mercados']) {
        await page.goto(path);
        await expect(page.locator('.fair-content')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false,
        );
      }
    }
  });
}
