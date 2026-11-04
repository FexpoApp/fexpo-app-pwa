import { test, expect, type Page } from '@playwright/test';

export function exhibitorFlow(
  prepare: (page: Page) => Promise<void | (() => void)> = async () => {},
) {
  test('directorio fotografiado: logo, perfil, espacio compartido y lectura sin escrituras', async ({
    page,
  }) => {
    const verify = await prepare(page);
    await page.goto('/map?reference=2026-11-04&plan=yellow-upper&view=2d');
    const ferrotodo = page.locator('[data-lot="117"]');
    await expect(ferrotodo).toHaveAttribute('data-company-ids', 'ferrotodo');
    await expect(ferrotodo.locator('[data-company-logo="ferrotodo"] image')).toHaveAttribute(
      'href',
      /ferrotodo\.png$/,
    );
    await ferrotodo.focus();
    await page.keyboard.press('Enter');
    const sheet = page.getByRole('dialog', { name: 'Ferrotodo', exact: true });
    await expect(sheet.getByRole('img', { name: 'Logo de Ferrotodo' })).toBeVisible();
    await sheet.getByRole('link', { name: /Ferrotodo/ }).click();
    await expect(page).toHaveURL(/\/companies\/ferrotodo$/);
    await expect(page.getByRole('heading', { name: 'Ferrotodo', exact: true })).toBeVisible();
    await expect(page.locator('.exhibitor-locations a')).toHaveCount(2);
    await expect(
      page.getByRole('button', { name: /Registrar visita|Guardar|Check-in/ }),
    ).toHaveCount(0);
    await page.goto('/map?reference=2026-11-04&plan=red-lower&lot=34&detail=1');
    await expect(page.locator('.stand-bottom-sheet .exhibitor-rows > a')).toHaveCount(3);
    await expect(
      page.locator('.stand-bottom-sheet').getByText('Swissôtel', { exact: true }),
    ).toBeVisible();
    await page.goto('/companies?q=Hotel%20Gloria');
    await page.getByRole('link', { name: /Hotel Gloria/ }).click();
    await expect(page.getByText('Ubicación por confirmar', { exact: true })).toBeVisible();
    await expect(page.locator('.exhibitor-locations a')).toHaveCount(0);
    await page.goto('/map?reference=2026-11-04&plan=green-upper');
    await page.getByRole('textbox', { name: 'Buscar stands y empresas' }).fill('Gobernación');
    await page
      .locator('.indoor-results')
      .getByRole('link', { name: /Gobernación de La Paz/ })
      .click();
    await expect(page).toHaveURL(/lot=V5/);
    await page.getByRole('button', { name: '3D', exact: true }).click();
    await expect
      .poll(async () =>
        Number(await page.locator('[data-campus-canvas]').getAttribute('data-company-logo-count')),
      )
      .toBeGreaterThan(0);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/companies/ferrotodo');
      await expect(page.locator('.exhibitor-identity img')).toBeVisible();
      expect(
        await page
          .locator('.exhibitor-identity img')
          .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
      ).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      );
    }
    verify?.();
  });
}
