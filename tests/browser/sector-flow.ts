import { test, expect, type Page } from '@playwright/test';

/** Shared behavior across local, demo and live (including an unrelated API floor). */
export function sectorFlow(prepare: (page: Page) => Promise<void | (() => void)> = async () => {}) {
  test('GAMLP: anuncio, dos espacios, una ficha y mini perfiles de muestra explícitos', async ({
    page,
  }) => {
    const assertNoWrites = await prepare(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/ferias/fipaz-2026');
    await page.locator('.poster-municipal').click();
    await expect(page).toHaveURL(/plan=yellow-upper.*sector=gamlp/);
    await expect(page.getByRole('heading', { name: 'Pabellón Bolivia' })).toBeVisible();
    await expect(page.locator('[data-sector="gamlp"][data-sector-selected="true"]')).toHaveCount(2);
    await page.locator('[data-lot="P14-B"]').click();
    await expect(page.getByRole('dialog', { name: 'Sector GAMLP' })).toBeVisible();
    await expect(
      page.getByText('Gobierno Autónomo Municipal de La Paz', { exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Ver emprendedores', exact: true }).click();
    await expect(page.getByRole('button', { name: /Ejemplo ·/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Probar demo del sector', exact: true }).click();
    await expect(page.getByText('Demostración · emprendimientos ficticios')).toBeVisible();
    await page.getByRole('button', { name: /Ejemplo · Artesanía/ }).click();
    const profile = page.getByRole('dialog', { name: 'Ejemplo · Artesanía' });
    await expect(profile.getByText('Accesorios artesanales', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(profile).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Ejemplo · Artesanía/ })).toBeFocused();
    await page.getByRole('tab', { name: 'Emprendedores', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Visita QR', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('tab', { name: 'Visita QR', exact: true })).toBeFocused();
    const points = await page.locator('.app-header .points-pill').textContent();
    await expect(page.locator('.sector-qr svg')).toHaveCount(1);
    await page.getByRole('button', { name: 'Simular lectura del personal' }).click();
    await expect(page.locator('.sector-demo-total > strong')).toHaveText('1');
    await page.getByRole('button', { name: 'Simular lectura del personal' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Sin duplicar el conteo.' }),
    ).toBeVisible();
    await expect(page.locator('.sector-demo-total > strong')).toHaveText('1');
    await page.reload();
    await expect(page.locator('.sector-demo-total > strong')).toHaveText('1');
    await page.getByRole('button', { name: 'Probar otro pase', exact: true }).click();
    await page.getByRole('button', { name: 'Simular lectura del personal' }).click();
    await expect(page.locator('.sector-demo-total > strong')).toHaveText('2');
    await expect(page.locator('.app-header .points-pill')).toHaveText(points || '');
    await page.getByRole('button', { name: 'Salir de la demostración', exact: true }).click();
    await expect(page.locator('.sector-qr')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Mostrar mi QR', exact: true })).toHaveAttribute(
      'href',
      '/scan?sector=gamlp',
    );
    assertNoWrites?.();
  });

  test('GAMLP: cerrar el perfil no roba el foco a la pestaña elegida', async ({ page }) => {
    const assertNoWrites = await prepare(page);
    await page.goto('/sectors/gamlp?demo=1');
    await page.getByRole('button', { name: /Ejemplo · Artesanía/ }).click();
    await expect(page.getByRole('dialog', { name: 'Ejemplo · Artesanía' })).toBeVisible();
    // A native close event is queued. A visitor may focus another control before
    // React unmounts the dialog; that later cleanup must respect the new target.
    await page.evaluate(() => {
      document.querySelector<HTMLDialogElement>('.sector-mini-profile')!.close();
      document.getElementById('entrepreneurs-tab')!.focus();
    });
    await expect(page.locator('.sector-mini-profile')).toHaveCount(0);
    const tab = page.getByRole('tab', { name: 'Emprendedores', exact: true });
    await expect(tab).toBeFocused();
    await tab.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Visita QR', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    assertNoWrites?.();
  });

  test('GAMLP: búsqueda, selección por teclado y ficha en 3D', async ({ page }) => {
    const assertNoWrites = await prepare(page);
    await page.goto('/map?plan=yellow-upper&view=2d&sector=gamlp');
    await page.getByRole('textbox', { name: 'Buscar stands y empresas' }).fill('GAMLP');
    await page.getByRole('link', { name: /Sector GAMLP P14-A/ }).click();
    await page.locator('[data-lot="P14-A"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Sector GAMLP' })).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar ficha' }).click();
    await page.getByRole('button', { name: '3D', exact: true }).click();
    await expect(page.locator('[data-campus-canvas]')).toHaveAttribute(
      'data-plan-id',
      'yellow-upper',
    );
    await page
      .getByRole('button', { name: 'Ver sector GAMLP, P14-A y P14-B', exact: true })
      .click();
    await expect(page.getByRole('dialog', { name: 'Sector GAMLP' })).toBeVisible();
    assertNoWrites?.();
  });
}
