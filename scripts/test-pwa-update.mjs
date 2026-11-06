import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { setupPucApi } from '../tests/browser/puc-api-fixture.mjs';

// Run after build:live. Uses fake session responses, never real accounts or submissions.
const dist = resolve('dist');
const reportDir = resolve('test-results/pwa-auto-update');
const port = Number(process.env.PWA_UPDATE_TEST_PORT || 5199);
const appPath =
  '/ferias/gamlp-puc-2026/calificar/mercados?via=qr&qr=mercados_3f7d1a9c6e4b48a5b1c2d0ef9a65b732';
let fixture = 'current',
  revision = 1;
const oldWorker =
  "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>e.respondWith(fetch(e.request)));";
const oldPage = `<!doctype html><html><body><h1>Versión anterior con actualización manual</h1><script>navigator.serviceWorker.register('/sw.js');</script></body></html>`;
const mime = {
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
};
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  try {
    if (fixture === 'legacy' && pathname === '/sw.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' });
      res.end(oldWorker);
      return;
    }
    if (fixture === 'legacy' && pathname.startsWith('/ferias/')) {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
      res.end(oldPage);
      return;
    }
    let path = resolve(dist, '.' + decodeURIComponent(pathname));
    if (path !== dist && !path.startsWith(dist + sep)) throw new Error('Invalid path');
    if (!extname(pathname) || pathname === '/') path = resolve(dist, 'index.html');
    let body = await readFile(path);
    if (pathname === '/sw.js')
      body = Buffer.concat([body, Buffer.from(`\n// update-test-revision-${revision}\n`)]);
    res.writeHead(200, {
      'Content-Type': mime[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((accept, reject) => {
  server.once('error', reject);
  server.listen(port, '127.0.0.1', accept);
});
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
const results = [];
let activePage;
let activeScenario;
const events = [];
try {
  await mkdir(reportDir, { recursive: true });
  for (const scenario of process.env.PWA_UPDATE_SCENARIO
    ? [process.env.PWA_UPDATE_SCENARIO]
    : ['current', 'legacy']) {
    activeScenario = scenario;
    fixture = scenario;
    revision++;
    const context = await browser.newContext();
    const page = await context.newPage();
    activePage = page;
    context.on('console', (message) =>
      events.push({ scenario, type: message.type(), text: message.text() }),
    );
    page.on('pageerror', (error) => events.push({ scenario, error: error.message }));
    await page.addInitScript(() =>
      sessionStorage.setItem(
        'qa-starts',
        String(Number(sessionStorage.getItem('qa-starts') || 0) + 1),
      ),
    );
    await page.route('**/api/session/**', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: {
            accessToken: 'qa-only',
            expiresIn: 900,
            user: { id: 'qa-user', displayName: 'QA', avatarUrl: null },
          },
          meta: null,
        },
      }),
    );
    await page.route('**/api/backend?*', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: { id: 'qa-user', profile: { displayName: 'QA', avatarUrl: null } },
          meta: null,
        },
      }),
    );
    await setupPucApi(page, 'qa-user', 'QA');
    await page.goto(`http://127.0.0.1:${port}` + appPath);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller)
        await new Promise((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
        );
    });
    if (scenario === 'current') {
      await expect(page.getByRole('radio', { name: '4 estrellas', exact: true })).toBeVisible();
      await page.getByRole('radio', { name: '4 estrellas', exact: true }).check();
      await page
        .getByRole('textbox', { name: 'Comentario' })
        .fill('Borrador conservado tras actualización automática.');
    } else {
      await page.evaluate(() =>
        sessionStorage.setItem(
          'fexpo-rating-draft-v1:gamlp-puc-2026:mercados:qa-user',
          JSON.stringify({
            stars: 4,
            comment: 'Borrador conservado tras actualización automática.',
          }),
        ),
      );
    }
    const starts = await page.evaluate(() => Number(sessionStorage.getItem('qa-starts')));
    const before = page.url();
    events.push({
      scenario,
      before,
      state: await page.evaluate(async () => ({
        keys: await caches.keys(),
        active: (await navigator.serviceWorker.getRegistration())?.active?.state,
      })),
    });
    fixture = 'current';
    revision++;
    await page
      .evaluate(async () => (await navigator.serviceWorker.getRegistration()).update())
      .catch(() => {});
    await expect
      .poll(() => page.evaluate(() => Number(sessionStorage.getItem('qa-starts'))).catch(() => 0), {
        timeout: 30_000,
      })
      .toBeGreaterThan(starts);
    await expect(page.getByRole('radio', { name: '4 estrellas', exact: true })).toBeChecked();
    await expect(page.getByRole('textbox', { name: 'Comentario' })).toHaveValue(
      'Borrador conservado tras actualización automática.',
    );
    await expect(page).toHaveURL(
      `http://127.0.0.1:${port}/ferias/gamlp-puc-2026/calificar/mercados`,
    );
    await expect(page.getByRole('button', { name: 'Actualizar', exact: true })).toHaveCount(0);
    await page.screenshot({ path: resolve(reportDir, scenario + '.png'), fullPage: true });
    results.push({ scenario, reload: true, draftPreserved: true, routePreserved: true, before });
    await context.close();
  }
  await writeFile(resolve(reportDir, 'result.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ passed: results.length, scenarios: results }));
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    await activePage
      .screenshot({
        path: resolve(reportDir, 'failure-' + activeScenario + '.png'),
        fullPage: true,
      })
      .catch(() => {});
    events.push({
      scenario: activeScenario,
      state: await activePage
        .evaluate(async () => {
          const reg = await navigator.serviceWorker.getRegistration();
          const migrations = await caches.open('fexpo-auto-update-migration-v1');
          return {
            url: location.href,
            active: reg?.active?.state,
            installing: reg?.installing?.state,
            waiting: reg?.waiting?.state,
            cacheKeys: (await migrations.keys()).map((r) => r.url),
          };
        })
        .catch(() => null),
    });
  }
  await writeFile(
    resolve(reportDir, 'failure.json'),
    JSON.stringify({ events, error: String(error) }, null, 2),
  );
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
