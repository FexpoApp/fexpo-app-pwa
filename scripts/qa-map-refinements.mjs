import { chromium, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5178'],
  { env: { ...process.env, VITE_DATA_MODE: 'demo' }, windowsHide: true, stdio: 'ignore' },
);
let browser;
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
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5178/map');
  await expect(page.locator('.indoor-viewer')).toHaveAttribute('data-mode', '2d');
  await page.goto('http://127.0.0.1:5178/stands/stand-altura-labs');
  await page.getByRole('link', { name: 'Ubicación', exact: true }).click();
  await expect(page.locator('.indoor-viewer')).toHaveAttribute('data-plan-id', 'yellow-upper');
  await expect(page.locator('.indoor-viewer')).toHaveAttribute('data-mode', '2d');
  await expect(page.locator('.route-summary')).toHaveCount(0);
  await expect(page.getByText('Ubicarme con NFC', { exact: true })).toHaveCount(0);
  const selected = page.locator('[data-lot="117"]');
  await expect(selected).toBeInViewport();
  await page.waitForTimeout(500);
  const focus = await page.evaluate(() => {
    const lot = document.querySelector('[data-lot="117"]').getBoundingClientRect();
    const viewer = document.querySelector('.indoor-viewer').getBoundingClientRect();
    return {
      dx: Math.abs(lot.x + lot.width / 2 - viewer.x - viewer.width / 2),
      dy: Math.abs(lot.y + lot.height / 2 - viewer.y - viewer.height / 2),
      width: lot.width,
    };
  });
  if (focus.dx > 25 || focus.dy > 25 || focus.width < 30)
    throw new Error('Stand not centered: ' + JSON.stringify(focus));
  await selected.click();
  await expect(page.getByRole('dialog', { name: 'Altura Labs' })).toBeVisible();
  const sheet = await page.locator('.stand-bottom-sheet').boundingBox();
  if (Math.abs(sheet.y + sheet.height - 844) > 2)
    throw new Error('Sheet is not anchored to viewport bottom');
  await fs.mkdir('test-results/mobile-refinements', { recursive: true });
  await page.screenshot({ path: 'test-results/mobile-refinements/map-sheet.png' });
  await page.getByRole('button', { name: 'Cerrar ficha' }).click();
  await page.getByRole('button', { name: 'Cómo llegar', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Punto de inicio del recorrido' })
    .selectOption('red-lower');
  await page.getByRole('button', { name: 'Trazar recorrido' }).click();
  await expect(page.locator('[data-route=campus]')).toBeVisible();
  await page.getByRole('button', { name: 'Ver interior', exact: true }).click();
  await expect(page.locator('[data-route=indoor]')).toBeVisible();
  if (errors.length) throw new Error(errors.join(';'));
  console.log(
    JSON.stringify({
      map: 'passed',
      default: '2d',
      focus,
      bottomSheet: 'anchored',
      routes: 'passed',
      errors,
    }),
  );
} finally {
  await browser?.close();
  server.kill();
}
