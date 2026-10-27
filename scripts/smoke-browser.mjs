// Actual browser smoke against production. No API mocks or real user login.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = (process.argv[2] ?? 'https://app.fexpo.lat').replace(/\/$/, '');
const event = process.env.VITE_EVENT_ID;
assert.ok(event, 'Set VITE_EVENT_ID');
const output = process.env.PWA_QA_OUTPUT ?? 'test-results/production-smoke';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors = [];
const warnings = [];
const requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && /GSI_LOGGER|origin.*allowed|origin_mismatch/i.test(message.text()))
    warnings.push(message.text());
});
page.on('response', response => {
  const url = new URL(response.url());
  if (url.origin === new URL(base).origin && url.pathname.startsWith('/api/'))
    requests.push({ path: url.pathname, status: response.status() });
});
try {
  const response = await context.request.get(`${base}/api/backend`, {
    params: { path: `/events/${event}/stands?limit=2` }, timeout: 30_000,
  });
  assert.equal(response.status(), 200, await response.text());
  const catalogue = await response.json();
  assert.ok(catalogue.data.length, 'Need an existing public stand to verify the rendered catalogue');
  const stand = catalogue.data[0];
  await page.goto(`${base}/stands`, { waitUntil: 'domcontentloaded' });
  await page.getByText(stand.displayName, { exact: true }).first().waitFor({ timeout: 30_000 });
  await page.screenshot({ path: `${output}/stands-mobile.png`, fullPage: true });
  console.log('OK real server catalogue rendered on mobile');

  await page.goto(`${base}/stands/${stand.id}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: stand.displayName, exact: true }).waitFor({ timeout: 30_000 });
  console.log('OK direct stand URL and real detail data');

  await page.goto(`${base}/map`, { waitUntil: 'domcontentloaded' });
  await page.locator('.page').waitFor();
  await page.screenshot({ path: `${output}/map-mobile.png`, fullPage: true });
  await page.goto(`${base}/profile`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Tu recorrido empieza aquí', { exact: true }).waitFor({ timeout: 20_000 });
  await page.screenshot({ path: `${output}/profile-mobile.png`, fullPage: true });
  console.log('OK map and connected account screen');

  await page.evaluate(() => Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker not ready')), 20_000)),
  ]));
  const apiCached = await page.evaluate(async () => {
    const keys = await Promise.all((await caches.keys()).map(async key =>
      (await (await caches.open(key)).keys()).map(request => new URL(request.url).pathname)));
    return keys.flat().some(path => path.startsWith('/api/'));
  });
  assert.equal(apiCached, false, 'Private API must not enter service worker caches');
  assert.deepEqual(errors, [], `Browser errors: ${errors.join('; ')}`);
  assert.ok(requests.some(item => item.path === '/api/backend' && item.status === 200));
  assert.ok(await page.evaluate(() => window.isSecureContext));
  const report = { base, event, requests, errors, oauthWarnings: [...new Set(warnings)], apiCached };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log('OK HTTPS, service worker, no API cache and no uncaught browser errors');
  if (warnings.length) console.log('OAuth configuration warnings captured in report; real Google login not tested.');
} finally {
  await context.close();
  await browser.close();
}
