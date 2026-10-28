import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
const root = 'docs/qa/2026-10-28-v2';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5178'],
  { env: { ...process.env, VITE_DATA_MODE: 'demo' }, windowsHide: true, stdio: 'ignore' },
);
let browser;
const failures = [];
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5178')).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', (e) => failures.push(e.message));
  await fs.mkdir(root, { recursive: true });
  const go = (path) => page.goto('http://127.0.0.1:5178' + path);
  const capture = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(320);
    await page.screenshot({ path: root + '/' + name + '.png', fullPage: true });
  };
  for (const theme of ['light', 'dark']) {
    await page.addInitScript((t) => localStorage.setItem('fexpo-pwa-theme', t), theme);
    await go('/');
    await capture(theme + '-home');
    await page.getByRole('button', { name: 'Cambiar mis intereses' }).click();
    await capture(theme + '-interests');
    await page.getByRole('button', { name: 'Tecnología', exact: true }).click();
    await page.getByRole('button', { name: 'Guardar intereses', exact: true }).click();
    await expect(page.locator('.offer-card')).toHaveCount(1);
    await page.locator('.offers-heading .shelf-heading').click();
    await capture(theme + '-offer-explorer');
    await page.getByRole('button', { name: 'Cerrar ventana' }).click();
    await page.getByRole('button', { name: 'Cambiar mis intereses' }).click();
    await page.getByRole('button', { name: 'Ver todas las categorías', exact: true }).click();
    await go('/missions');
    await capture(theme + '-badges');
    await go('/map');
    await capture(theme + '-map-general');
    await page.getByRole('button', { name: '3D', exact: true }).click();
    await expect(page.locator('[data-campus-canvas]')).toBeVisible();
    await capture(theme + '-map-general-3d');
    await go('/stands/stand-altura-labs');
    await page.getByRole('link', { name: 'Ubicación', exact: true }).click();
    await expect(page.locator('.indoor-viewer')).toHaveAttribute('data-mode', '2d');
    await page.waitForTimeout(350);
    await capture(theme + '-map-focus');
    await page.locator('[data-lot="117"]').click();
    await capture(theme + '-map-sheet');
    await page.getByRole('button', { name: 'Cerrar ficha' }).click();
    await page.getByRole('button', { name: 'Cómo llegar', exact: true }).click();
    await page
      .getByRole('combobox', { name: 'Punto de inicio del recorrido' })
      .selectOption('red-lower');
    await page.getByRole('button', { name: 'Trazar recorrido' }).click();
    await expect(page.locator('[data-route=campus]')).toBeVisible();
    await capture(theme + '-route-campus');
    await page.getByRole('button', { name: 'Ver interior', exact: true }).click();
    await expect(page.locator('[data-route=indoor]')).toBeVisible();
    await capture(theme + '-route-indoor');
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/', '/map', '/stands/stand-altura-labs', '/missions']) {
        await go(path);
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        if (overflow) failures.push(theme + ' ' + width + ' ' + path + ' overflow');
      }
      if (width === 1440) {
        await go('/');
        await capture(theme + '-desktop');
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
  }
  await fs.writeFile(root + '/report.json', JSON.stringify({ failures }, null, 2));
  console.log(JSON.stringify({ failures, captures: root }));
} finally {
  await browser?.close();
  server.kill();
}
