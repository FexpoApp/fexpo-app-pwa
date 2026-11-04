import { test, expect } from '@playwright/test';
import { sectorFlow } from './sector-flow';
sectorFlow();

test('la PWA instalada abre afiches y PDF como archivos, sin sustituirlos por la aplicación', async ({
  page,
  context,
}) => {
  await page.goto('/events/event-fipaz-2026?day=2026-11-01');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const imagePagePromise = context.waitForEvent('page');
  await page.getByRole('link', { name: 'Ver afiche de Mala Kumbala', exact: true }).click();
  const imagePage = await imagePagePromise;
  await expect(imagePage.locator('body > img')).toHaveAttribute('src', /mala-kumbala.jpg$/);
  await imagePage.close();
  await page.goto('/discover?section=servicios');
  const responsePromise = context.waitForEvent('response', (response) =>
    response.url().endsWith('/assets/events/fipaz-2026-oficial.pdf'),
  );
  await page.getByRole('link', { name: /Patio de comidas Entre bloques Amarillo y Verde/ }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test('Descubre abre menú ilustrativo, servicios y afiches; Perfil conserva misiones y premios', async ({
  page,
}) => {
  await page.goto('/discover?section=comer');
  await expect(page.getByRole('button', { name: 'Comer', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /Sabor Andino/ }).click();
  const menu = page.getByRole('dialog', { name: 'Sabor Andino' });
  await expect(menu.getByText('Menú de ejemplo · precios ilustrativos en Bs')).toBeVisible();
  await expect(menu.getByText('30 Bs', { exact: true })).toBeVisible();
  await expect(menu.getByText('No disponible', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar ventana' }).click();
  await page.getByRole('button', { name: 'Servicios', exact: true }).click();
  await expect(page.getByRole('link', { name: /Enfermería y boletería/ })).toHaveAttribute(
    'href',
    /fipaz-2026-oficial.pdf#page=3$/,
  );
  await page.goto('/events/event-fipaz-2026?day=2026-11-01');
  await expect(page.locator('.agenda-entry')).toHaveCount(6);
  await expect(page.getByText('Horario no publicado', { exact: true })).toHaveCount(6);
  await page.goto('/profile');
  await page.getByRole('link', { name: 'Misiones y progreso', exact: true }).click();
  await expect(page).toHaveURL(/\/missions$/);
  await page.goto('/profile');
  await page.getByRole('link', { name: 'Mis premios', exact: true }).click();
  await expect(page).toHaveURL(/\/rewards$/);
});

test('anuncios rotan automáticamente, se pueden pausar y respetan movimiento reducido', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.mouse.move(1, 1);
  await expect(page.locator('.advertisement-rail')).toHaveAttribute('data-active', '1', {
    timeout: 8500,
  });
  await page.getByRole('button', { name: 'Pausar anuncios', exact: true }).click();
  await page.getByRole('button', { name: 'Reanudar anuncios', exact: true }).blur();
  await page.mouse.move(1, 1);
  await page.waitForTimeout(6300);
  await expect(page.locator('.advertisement-rail')).toHaveAttribute('data-active', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Anuncio siguiente', exact: true }).click();
  await expect(page.locator('.advertisement-rail')).toHaveAttribute('data-active', '2');
  await page.getByRole('button', { name: 'Anuncio siguiente', exact: true }).click();
  await expect(page.locator('.advertisement-rail')).toHaveAttribute('data-active', '0');
  await expect(page.getByRole('button', { name: 'Pausar anuncios', exact: true })).toHaveCount(0);
});

test('inicio compacto, anuncios independientes y agenda navegable con Descubre y progreso en Perfil', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.fair-compact')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: 'FIPAZ 2026: ver agenda e información de la feria' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Anuncios de la feria' })).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Descubre' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Anuncio siguiente' }).click();
  await expect(page.locator('.advertisement-rail')).toHaveAttribute('data-active', '1');
  await page.getByRole('button', { name: 'Anuncio siguiente' }).click();
  await expect(page.locator('.advertisement-rail')).toHaveAttribute('data-active', '2');
  await page.locator('.advertisement[href="/stands/stand-sabor-andino"]').click();
  await expect(page).toHaveURL(/\/stands\/stand-sabor-andino$/);
  await page.goto('/');
  await page
    .getByRole('link', { name: 'FIPAZ 2026: ver agenda e información de la feria' })
    .click();
  await expect(page.locator('main h1')).toHaveText('Cartelera FIPAZ');
  await expect(
    page.getByRole('group', { name: 'Elegir un día de la feria' }).getByRole('button'),
  ).toHaveCount(12);
  await page.getByRole('button', { name: 'domingo, 8 de noviembre', exact: true }).click();
  await expect(page).toHaveURL(/day=2026-11-08/);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'domingo, 8 de noviembre', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByText('Actividades de ejemplo para explorar el diseño.', { exact: false }),
  ).toBeVisible();
});

for (const theme of ['light', 'dark'])
  for (const width of [320, 390, 768, 1440])
    test(`pantallas sin desbordamiento: ${theme} a ${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/profile');
      await page
        .getByRole('button', { name: theme === 'light' ? 'Claro' : 'Oscuro', exact: true })
        .click();
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        '/',
        '/map',
        '/scan',
        '/missions',
        '/discover',
        '/discover?section=hoy',
        '/discover?section=servicios',
        '/profile',
        '/stands',
        '/my-qr',
        '/rewards',
        '/notifications',
        '/stands/stand-altura-labs',
        '/events/event-fipaz-2026',
        '/map?plan=yellow-upper&sector=gamlp&lot=P14-A',
        '/sectors/gamlp?demo=1',
        '/sectors/gamlp?demo=1&tab=visit',
      ]) {
        await page.goto(route);
        await expect(page.locator('main')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const measurements = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          broken: [...document.images]
            .filter((i) => i.complete && !i.naturalWidth)
            .map((i) => i.src),
        }));
        expect(measurements, `${theme} ${width} ${route}`).toEqual({ overflow: false, broken: [] });
      }
      expect(errors).toEqual([]);
    });

test('la visita simulada persiste y los duplicados no suman puntos', async ({ page }) => {
  await page.goto('/scan?stand=stand-kawsay-salud');
  await page.getByText('Probar una visita de ejemplo', { exact: true }).click();
  await page.getByRole('button', { name: 'Simular confirmación QR', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '¡Una nueva conexión!' })).toBeVisible();
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await expect(page.locator('.app-header .points-pill')).toContainText('100');
  await page.getByRole('button', { name: 'Simular confirmación QR' }).click();
  await expect(page.getByRole('dialog', { name: 'Visita ya registrada' })).toBeVisible();
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await expect(page.locator('.app-header .points-pill')).toContainText('100');
  await page.reload();
  await expect(page.locator('.app-header .points-pill')).toContainText('100');
  await page.goto('/profile');
  await expect(
    page.locator('main').getByRole('link').filter({ hasText: 'Kawsay Salud' }),
  ).toBeVisible();
  await page.goto('/notifications');
  await expect(page.getByText('Kawsay Salud · +50 puntos de demostración.')).toBeVisible();
});

test('cancelar la lectura no registra visitas', async ({ page }) => {
  await page.goto('/scan?stand=stand-kawsay-salud');
  await page.getByText('Probar una visita de ejemplo', { exact: true }).click();
  await page.getByRole('button', { name: 'Simular confirmación QR', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar lectura' }).click();
  await page.waitForTimeout(1800);
  await expect(page.locator('.app-header .points-pill')).toContainText('50');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('búsqueda traza una orientación desde un origen elegido y abre el perfil', async ({
  page,
}) => {
  await page.goto('/map?view=2d');
  await expect(page.locator('.campus-overview')).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar stands y empresas' }).fill('altura');
  await page.getByRole('button', { name: /Altura Labs/ }).click();
  await page.getByRole('button', { name: 'Cómo llegar', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Punto de inicio del recorrido' })
    .selectOption('red-lower');
  await page.getByRole('button', { name: 'Trazar recorrido' }).click();
  await expect(page.locator('[data-route=campus]')).toBeVisible();
  await page.getByRole('button', { name: 'Ver interior' }).click();
  await expect(page.locator('[data-route=indoor]')).toBeVisible();
  await page.locator('[data-lot="117"]').click();
  await page.getByRole('link', { name: 'Ver perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Altura Labs' })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardado', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
test('ejemplo de raspadita no cambia el saldo ni habilita el módulo', async ({ page }) => {
  await page.goto('/stands/stand-altura-labs');
  await page.getByRole('tab', { name: 'Dinámicas' }).click();
  await page.getByRole('button', { name: 'Ver ejemplo', exact: true }).click();
  await page.getByRole('button', { name: /Desliza para raspar/ }).click();
  await expect(page.getByText('¡Sorpresa descubierta!')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar ventana' }).click();
  await expect(page.getByText('Módulo no habilitado')).toBeVisible();
  await expect(page.locator('.app-header .points-pill')).toContainText('50');
});
test('la PWA abre rutas y recursos offline después de la primera carga', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const manifest = await page.request.get('/manifest.webmanifest');
  expect((await manifest.json()).display).toBe('standalone');
  await context.setOffline(true);
  await page.goto('/map');
  await expect(page.getByRole('region', { name: 'Mapa interactivo FIPAZ' })).toBeVisible();
  await expect(page.getByText('Sin conexión · puedes explorar la demo')).toBeVisible();
  expect(
    await page.evaluate(
      () => [...document.images].filter((i) => !i.complete || !i.naturalWidth).length,
    ),
  ).toBe(0);
  await context.setOffline(false);
});
test('perfil demo conserva nombre, apariencia, preferencias y pase al recargar', async ({
  page,
}) => {
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Editar perfil demo' }).click();
  await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill('Visitante QA');
  await page.getByRole('button', { name: 'Guardar perfil demo' }).click();
  await expect(page.getByText('Visitante QA', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Oscuro', exact: true }).click();
  await page.getByRole('switch', { name: /Sonidos/ }).click();
  await page.reload();
  await expect(page.getByText('Visitante QA', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Oscuro', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('switch', { name: /Sonidos/ })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  await page.getByRole('link', { name: 'Mi código QR', exact: true }).click();
  await expect(page.getByText('Visitante QA', { exact: true })).toBeVisible();
  await expect(page.getByText('CÓDIGO DE DEMOSTRACIÓN')).toBeVisible();
});
test('avisos y recompensas demo se pueden consultar y reiniciar', async ({ page }) => {
  await page.goto('/rewards');
  await page.getByRole('button', { name: /Cafe de cortesia/ }).click();
  await expect(page.getByRole('button', { name: /Te faltan/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Cerrar ventana' }).click();
  await page.goto('/scan?stand=stand-kawsay-salud');
  await page.getByText('Probar una visita de ejemplo', { exact: true }).click();
  await page.getByRole('button', { name: 'Simular confirmación QR', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '¡Una nueva conexión!' })).toBeVisible();
  await page.getByRole('button', { name: 'Listo', exact: true }).click();
  await page.goto('/notifications');
  await expect(page.getByText('Kawsay Salud · +50 puntos de demostración.')).toBeVisible();
  await page.getByRole('button', { name: 'Borrar avisos' }).click();
  await expect(page.getByText('Tu próxima aventura te espera')).toBeVisible();
  await page.goto('/profile');
  await page.getByRole('button', { name: 'Reiniciar recorrido demo' }).click();
  await page.getByRole('button', { name: 'Reiniciar demo' }).click();
  await expect(page.getByText('Tu primera parada te espera')).toBeVisible();
});
