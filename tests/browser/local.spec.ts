import { test, expect, type Page } from '@playwright/test';
import { PLAN_GEOMETRY, PLAN_LOTS } from '../../src/data/map-plans';
import { sectorFlow } from './sector-flow';
sectorFlow(async (page) => {
  await setup(page);
  await page.goto('/');
  await enterTrial(page);
});
async function setup(page: Page) {
  const apiCalls: string[] = [];
  page.on('request', (request) => {
    if (
      new URL(request.url()).pathname.startsWith('/api/') ||
      /googleapis\.com|accounts\.google\.com/.test(request.url())
    )
      apiCalls.push(request.url());
  });
  await page.route('**/api/**', (route) => route.abort());
  await page.addInitScript(() => {
    const w = window as any;
    w.__nfcAttempts = 0;
    w.NDEFReader = class extends EventTarget {
      constructor() {
        super();
        w.__nfcAttempts++;
      }
      async scan() {
        throw new Error('NFC debe permanecer desactivado');
      }
    };
  });
  return apiCalls;
}
async function enterTrial(page: Page) {
  await page.getByRole('button', { name: 'Entrar y probar la app' }).click();
  // Rehydration is async. Do not navigate away until the session and Shell are ready.
  await expect(page.locator('.bottom-nav')).toBeVisible();
}
async function expectNoNfc(page: Page) {
  expect(await page.evaluate(() => (window as any).__nfcAttempts)).toBe(0);
  await expect(page.getByRole('button', { name: /Leer.*NFC|Ubicarme con NFC/ })).toHaveCount(0);
}

test('entrada de prueba sin Google ni backend y perfil persistido', async ({ page }) => {
  const api = await setup(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /FIPAZ/ })).toBeVisible();
  await expect(page.locator('.bottom-nav')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeDisabled();
  await enterTrial(page);
  await expect(page.locator('.bottom-nav')).toBeVisible();
  await expect(page.locator('.app-header .points-pill')).toHaveText('0');
  await page.getByRole('link', { name: 'Perfil', exact: true }).last().click();
  await expect(page.getByText('Visitante de prueba', { exact: true })).toBeVisible();
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  expect(saved).not.toContain('test-only-local-google-token');
  expect(saved).not.toContain('accessToken');
  await page.reload();
  await expect(page.getByText('Visitante de prueba', { exact: true })).toBeVisible();
  expect(api).toEqual([]);
});
test('Google queda como mock y cerrar la prueba devuelve a bienvenida', async ({ page }) => {
  const api = await setup(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeDisabled();
  await expect(page.getByText('Próximamente', { exact: true })).toBeVisible();
  await enterTrial(page);
  await page.getByRole('link', { name: 'Perfil', exact: true }).last().click();
  await expect(page.getByText('Visitante · modo de prueba')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar sesión y limpiar dispositivo' }).click();
  await expect(page.locator('.welcome-screen')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Entrar y probar la app' })).toBeVisible();
  expect(api).toEqual([]);
});
test('acceso QR de bienvenida abre la prueba sin Google, NFC ni puntos reales', async ({
  page,
}) => {
  const api = await setup(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Ver mi pase QR', exact: true }).click();
  await expect(page).toHaveURL('/scan');
  await expect(page.getByRole('heading', { name: 'Muéstralo en el stand' })).toBeVisible();
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await expect(page.getByText('CÓDIGO DE DEMOSTRACIÓN', { exact: true })).toBeVisible();
  await expect(page.locator('.app-header .points-pill')).toHaveText('0');
  await expectNoNfc(page);
  expect(api).toEqual([]);
});

test('la antigua ruta NFC requiere entrada local y redirige al pase QR', async ({ page }) => {
  const api = await setup(page);
  await page.goto('/nfc-test');
  await expect(page.getByRole('button', { name: 'Entrar y probar la app' })).toBeVisible();
  await enterTrial(page);
  await expect(page).toHaveURL('/scan');
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await expectNoNfc(page);
  expect(api).toEqual([]);
});

test('mostrar y recargar el QR no registra visitas ni suma puntos', async ({ page }) => {
  const api = await setup(page);
  await page.goto('/');
  await enterTrial(page);
  await page.goto('/scan?stand=stand-kawsay-salud');
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await expect(page.getByText('En Kawsay Salud', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await expect(page.locator('.app-header .points-pill')).toHaveText('0');
  await expectNoNfc(page);
  await page.goto('/profile');
  await expect(page.getByRole('link', { name: 'Misiones y progreso', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mis premios', exact: true })).toBeVisible();
  expect(api).toEqual([]);
});

test('cancelar una confirmación QR de ejemplo no modifica el saldo local', async ({ page }) => {
  const api = await setup(page);
  await page.goto('/');
  await enterTrial(page);
  await page.goto('/scan');
  await page.getByText('Probar una visita de ejemplo', { exact: true }).click();
  await page.getByRole('button', { name: 'Simular confirmación QR', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar lectura', exact: true }).click();
  await page.waitForTimeout(1700);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.app-header .points-pill')).toHaveText('0');
  await expectNoNfc(page);
  expect(api).toEqual([]);
});

test('sin API y sin red: perfil guardado, mapa y pase QR siguen disponibles', async ({
  page,
  context,
}) => {
  const api = await setup(page);
  await page.goto('/');
  await enterTrial(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.goto('/map');
  await expect(page.getByRole('region', { name: 'Mapa interactivo FIPAZ' })).toBeVisible();
  await page.goto('/scan');
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await expect(page.locator('.app-header .points-pill')).toHaveText('0');
  await expectNoNfc(page);
  expect(api).toEqual([]);
  await context.setOffline(false);
});

test('planos originales 2D, planta y búsqueda entre pabellones', async ({ page }) => {
  await setup(page);
  await page.goto('/');
  await enterTrial(page);
  await expect(page.locator('.bottom-nav')).toBeVisible();
  await page.goto('/map?plan=red-lower&view=2d');
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.getByLabel('Plano de Internacional I')).toBeVisible();
  await expect(page.locator('.indoor-svg path').first()).toHaveAttribute(
    'd',
    'M20 138H640V105H778V695H642V666H20Z',
  );
  await page.getByRole('button', { name: 'Alta', exact: true }).click();
  await expect(page.getByLabel('Plano de Internacional II')).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar stands y empresas' }).fill('altura');
  await page
    .locator('.indoor-results')
    .getByRole('button', { name: /Altura Labs/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Pabellón Bolivia' })).toBeVisible();
  await expect(page.locator('.route-summary')).toHaveCount(0);
  await page.locator('[data-lot="117"]').click();
  await page.getByRole('link', { name: 'Ver perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Altura Labs' })).toBeVisible();
});
test('las siete plantas mantienen contorno y cantidad de lotes en 2D y 3D', async ({ page }) => {
  await setup(page);
  await page.goto('/');
  await enterTrial(page);
  for (const plan of PLAN_GEOMETRY) {
    await page.goto(`/map?plan=${plan.id}&view=3d`);
    await expect(page.locator('[data-campus-canvas]')).toHaveAttribute('data-plan-id', plan.id);
    await expect(page.locator('[data-campus-canvas]')).toHaveAttribute(
      'data-lot-count',
      String(PLAN_LOTS[plan.id].length),
    );
    await page.getByRole('button', { name: '2D', exact: true }).click();
    await expect(page.locator('.indoor-svg [data-lot]')).toHaveCount(PLAN_LOTS[plan.id].length);
    await expect(page.locator('.indoor-svg path').first()).toHaveAttribute('d', plan.outline);
  }
});
test('mapa y Check-in no abren lectores NFC ni acreditan una visita al mostrar QR', async ({
  page,
}) => {
  const api = await setup(page);
  await page.goto('/');
  await enterTrial(page);
  await page.goto('/map');
  await expect(page.locator('.indoor-viewer')).toHaveAttribute('data-mode', '2d');
  await expectNoNfc(page);
  await page.goto('/scan');
  await expect(page.locator('.qr-paper svg')).toHaveCount(1);
  await expectNoNfc(page);
  await page.goto('/map?plan=red-lower&view=2d');
  await expect(page.locator('.indoor-viewer')).toHaveAttribute(
    'data-position-source',
    'unconfirmed',
  );
  await expect(page.locator('.app-header .points-pill')).toHaveText('0');
  expect(api).toEqual([]);
});

test('cámara interior, mismo pabellón en 2D y 3D y ayuda GPS', async ({ page }) => {
  await setup(page);
  await page.goto('/');
  await enterTrial(page);
  await page.goto('/map?plan=red-lower&view=3d');
  await expect(page.locator('[data-campus-canvas]')).toHaveAttribute('data-plan-id', 'red-lower');
  const marker = page.getByRole('button', { name: /Ver Kawsay Salud/ });
  await expect.poll(() => marker.evaluate((el) => el.style.left)).toMatch(/px$/);
  const before = await marker.evaluate((el) => el.style.left);
  await page.getByRole('button', { name: 'Girar mapa', exact: true }).click();
  await expect.poll(() => marker.evaluate((el) => el.style.left)).not.toBe(before);
  await page.getByRole('button', { name: 'Alternar vista aérea' }).click();
  await expect(page.getByRole('button', { name: 'Alternar vista aérea' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Acercar mapa' }).click();
  await page.getByRole('button', { name: 'Alejar mapa' }).click();
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.getByLabel('Plano de Internacional I')).toBeVisible();
  await page.getByRole('button', { name: 'Acerca del mapa' }).click();
  await expect(page.getByRole('dialog')).toContainText('GPS exacta');
  await page.keyboard.press('Escape');
});
test('sin WebGL se activa el plano original 2D', async ({ page }) => {
  await setup(page);
  await page.addInitScript(() => {
    const context = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: any[]
    ) {
      return type.startsWith('webgl') ? null : (context as any).call(this, type, ...args);
    } as any;
  });
  await page.goto('/');
  await enterTrial(page);
  await expect(page.locator('.bottom-nav')).toBeVisible();
  await page.goto('/map?plan=red-lower&view=3d');
  await expect(page.getByRole('status')).toContainText('Vista 2D activada');
  await expect(page.getByLabel('Plano de Internacional I')).toBeVisible();
  await page.getByRole('button', { name: /Ver Kawsay Salud/ }).click();
  await page.getByRole('link', { name: 'Ver perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kawsay Salud' })).toBeVisible();
});
async function gpsSetup(page: Page) {
  await setup(page);
  await page.addInitScript(() => {
    const w = window as any;
    w.__gpsCleared = [];
    w.__gpsCount = 0;
    w.__gpsTime = Date.now();
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        watchPosition: (success: any, failure: any) => {
          w.__gps = success;
          w.__gpsError = failure;
          return ++w.__gpsCount;
        },
        clearWatch: (id: number) => w.__gpsCleared.push(id),
      },
    });
  });
  await page.goto('/');
  await enterTrial(page);
  await expect(page.locator('.bottom-nav')).toBeVisible();
  await page.goto('/map?plan=red-lower&view=2d');
}
async function gpsEmit(page: Page, latitude = -16.5, accuracy = 4) {
  await page.evaluate(
    ({ latitude, accuracy }) => {
      const w = window as any;
      w.__gps({ coords: { latitude, longitude: -68.1, accuracy }, timestamp: ++w.__gpsTime });
    },
    { latitude, accuracy },
  );
}
test('GPS real API: mueve avatar, filtra ruido, pausa señal débil y cancela el seguimiento', async ({
  page,
}) => {
  await gpsSetup(page);
  await page.getByRole('button', { name: 'Mi ubicación', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar GPS relativo', exact: true }).click();
  await gpsEmit(page);
  await expect(page.locator('.map-gps-indicator')).toContainText('GPS relativo');
  const viewer = page.locator('.indoor-viewer'),
    initial = await viewer.getAttribute('data-avatar-y');
  await gpsEmit(page, -16.49995);
  await expect.poll(() => viewer.getAttribute('data-avatar-y')).not.toBe(initial);
  const moved = await viewer.getAttribute('data-avatar-y');
  await gpsEmit(page, -16.4999499);
  await expect(viewer).toHaveAttribute('data-avatar-y', moved!);
  await gpsEmit(page, -16.4998, 80);
  await expect(page.getByRole('alert')).toContainText('Señal GPS débil');
  await expect(viewer).toHaveAttribute('data-avatar-y', moved!);
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.locator('.indoor-avatar')).toHaveAttribute('data-avatar-y', moved!);
  await page.getByRole('button', { name: 'Detener GPS', exact: true }).click();
  await gpsEmit(page, -16.4997);
  await expect(viewer).toHaveAttribute('data-avatar-y', moved!);
  expect(await page.evaluate(() => (window as any).__gpsCleared.length)).toBe(1);
});
test('GPS: permiso rechazado, cambio de planta y salida cancelan el watch', async ({ page }) => {
  await gpsSetup(page);
  await page.getByRole('button', { name: 'Mi ubicación', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar GPS relativo', exact: true }).click();
  await page.evaluate(() => (window as any).__gpsError({ code: 1 }));
  await expect(page.getByRole('alert')).toContainText('Permite la ubicación');
  await page.getByRole('button', { name: 'Mi ubicación', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar GPS relativo', exact: true }).click();
  await gpsEmit(page);
  await page.getByRole('button', { name: 'Alta', exact: true }).click();
  await expect(page.locator('.indoor-viewer')).toHaveAttribute(
    'data-position-source',
    'unconfirmed',
  );
  expect(await page.evaluate(() => (window as any).__gpsCleared.length)).toBe(2);
  await page.getByRole('button', { name: 'Mi ubicación', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar GPS relativo', exact: true }).click();
  await gpsEmit(page);
  await page.getByRole('link', { name: 'Inicio', exact: true }).last().click();
  await expect(page).toHaveURL('/');
  await expect.poll(() => page.evaluate(() => (window as any).__gpsCleared.length)).toBe(3);
});
for (const width of [320, 390, 768, 1440])
  test(`entrada y QR adaptados a ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await setup(page);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if ([390, 1440].includes(width))
      await page.screenshot({
        path: `test-results/screenshots/local/welcome-${width}.png`,
        fullPage: true,
      });
    await page.getByRole('button', { name: 'Ver mi pase QR', exact: true }).click();
    await expect(page.locator('.qr-paper svg')).toHaveCount(1);
    await expectNoNfc(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 390)
      await page.screenshot({
        path: 'test-results/screenshots/local/qr-pass.png',
        fullPage: true,
      });
    expect(errors).toEqual([]);
  });
