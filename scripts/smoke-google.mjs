// Fresh anonymous browser: validate origins and open Google without signing in.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const base = 'https://app.fexpo.lat';
const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
assert.ok(clientId, 'Set VITE_GOOGLE_CLIENT_ID');
const aliases = ['fexpo-app.vercel.app', 'fexpo-app-quispevargasomar-7449s-projects.vercel.app'];
for (const host of aliases) {
  const response = await fetch(`https://${host}/profile?origin-check=1`, {
    headers: { Accept: 'text/html' }, redirect: 'manual', signal: AbortSignal.timeout(20_000),
  });
  const location = response.headers.get('location');
  if (response.status === 302 && new URL(location).hostname === 'vercel.com' &&
      new URL(location).pathname === '/sso-api') {
    assert.equal(host, aliases[1], 'The public production alias must redirect without SSO');
    console.log('OK team alias retains Vercel deployment protection');
    continue;
  }
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), `${base}/profile?origin-check=1`);
  const sw = await fetch(`https://${host}/sw.js`, {
    headers: { Accept: '*/*' }, redirect: 'manual', signal: AbortSignal.timeout(20_000),
  });
  assert.equal(sw.status, 200, 'Legacy service workers must still be able to update');
}
const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => {
    if (/origin_mismatch|origin.*not allowed/i.test(message.text())) errors.push(message.text());
  });
  // Accept */* bypasses the HTML redirect to exercise the client guard used by PWAs.
  await page.setExtraHTTPHeaders({ Accept: '*/*' });
  await page.goto(`https://${aliases[0]}/profile?client-guard=1`);
  await page.waitForURL(`${base}/profile?client-guard=1`, { timeout: 20_000 });
  await page.setExtraHTTPHeaders({});
  const frame = page.frameLocator('iframe[src*="accounts.google.com/gsi/button"]').first();
  const button = frame.getByRole('button').first();
  await button.waitFor({ state: 'visible', timeout: 20_000 });
  const source = page.frames().find(item => item.url().includes('/gsi/button'));
  assert.equal(new URL(source.url()).searchParams.get('client_id'), clientId);
  const [popup] = await Promise.all([page.waitForEvent('popup'), button.click()]);
  await popup.waitForLoadState('domcontentloaded');
  const url = new URL(popup.url());
  assert.equal(url.hostname, 'accounts.google.com');
  assert.equal(url.searchParams.get('client_id'), clientId);
  assert.equal(url.searchParams.get('origin'), base);
  assert.doesNotMatch(await popup.locator('body').innerText(), /origin_mismatch/i);
  assert.deepEqual(errors, []);
  console.log('OK canonical redirects preserve paths/queries and legacy SW updates');
  console.log('OK client guard, Google button and popup use the configured client and app origin');
  console.log('No account credentials entered; post-login OAuth completion is not tested.');
  await context.close();
} finally { await browser.close(); }
