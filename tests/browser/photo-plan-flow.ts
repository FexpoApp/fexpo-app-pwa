import { test, expect, type Page } from '@playwright/test';

export function photoPlanFlow(
  prepare: (page: Page) => Promise<void | (() => void)> = async () => {},
) {
  test('planos fotografiados: numeración vigente y paridad de las siete zonas en 2D/3D', async ({
    page,
  }) => {
    test.setTimeout(90000);
    const noWrites = await prepare(page);
    const counts: Record<string, number> = {
      'red-lower': 55,
      'red-upper': 63,
      'yellow-lower': 94,
      'yellow-upper': 134,
      'green-upper': 71,
      entrance: 9,
      'food-court': 24,
    };
    for (const [plan, count] of Object.entries(counts)) {
      await page.goto(`/map?reference=2026-11-04&plan=${plan}&view=2d`);
      await expect(page.locator('.indoor-svg')).toHaveAttribute('data-plan-revision', '2026-11-04');
      await expect(page.locator('.indoor-svg [data-lot]')).toHaveCount(count);
      const codes = await page
        .locator('.indoor-svg [data-lot]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-lot')));
      if (plan === 'green-upper') {
        await expect(page.locator('[data-lot="V5"]')).toHaveAttribute('data-footprint', 'polygon');
        await expect(page.locator('[data-lot="98"]')).toHaveCount(0);
        await page.locator('[data-lot="V5"]').focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('dialog', { name: 'Gobernación de La Paz' })).toBeVisible();
        await page.getByRole('button', { name: 'Cerrar ficha' }).click();
      }
      if (plan === 'food-court')
        await expect(page.locator('[data-lot="G-22"]')).toHaveAttribute(
          'data-footprint',
          'polygon',
        );
      await page.getByRole('button', { name: '3D', exact: true }).click();
      const canvas = page.locator('[data-campus-canvas]');
      await expect(canvas).toHaveAttribute('data-plan-revision', '2026-11-04');
      await expect(canvas).toHaveAttribute('data-lot-count', String(count));
      expect((await canvas.getAttribute('data-lot-codes'))?.split(',').toSorted()).toEqual(
        codes.toSorted(),
      );
      await expect(page).toHaveURL(/reference=2026-11-04/);
    }
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      await page.goto('/map?reference=2026-11-04&plan=green-upper&view=2d');
      await expect(page.locator('.indoor-svg')).toBeVisible();
      const footer = await page.locator('.map-footer-controls').boundingBox();
      const nav = await page.locator('.bottom-nav').boundingBox();
      expect(footer!.y + footer!.height).toBeLessThanOrEqual(nav!.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false,
      );
    }
    noWrites?.();
  });
}
