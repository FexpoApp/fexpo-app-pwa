// Read-only integration checks against the deployed PWA and the real backend.
import assert from 'node:assert/strict';

const app = (process.argv[2] ?? 'https://app.fexpo.lat').replace(/\/$/, '');
const api = (process.env.BACKEND_URL ?? 'https://api.fexpo.lat').replace(/\/$/, '');
const event = process.env.VITE_EVENT_ID;
assert.match(event ?? '', /^[\da-f-]{36}$/i, 'Set VITE_EVENT_ID to the deployed event UUID');
let checks = 0;
async function json(url, status, init) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
  const body = await response.json();
  assert.equal(response.status, status, `${url}: ${JSON.stringify(body)}`);
  checks++;
  return { response, body };
}
function bridge(path) { return `${app}/api/backend?path=${encodeURIComponent(path)}`; }
for (const path of ['/', '/stands', '/map', '/profile']) {
  const response = await fetch(`${app}${path}`, { signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/);
  assert.match(await response.text(), /id="root"/);
  checks++;
}
console.log('OK public HTTPS and SPA routes');
const manifest = await json(`${app}/manifest.webmanifest`, 200);
assert.equal(manifest.body.display, 'standalone');
const sw = await fetch(`${app}/sw.js`, { signal: AbortSignal.timeout(30_000) });
assert.equal(sw.status, 200);
assert.match(sw.headers.get('cache-control') ?? '', /no-cache/);
checks++;
console.log('OK manifest and service worker update headers');

const standPath = `/events/${event}/stands?limit=2&page=1`;
const [direct, via] = await Promise.all([
  json(`${api}/api/v1${standPath}`, 200), json(bridge(standPath), 200),
]);
assert.equal(via.body.success, true);
assert.deepEqual(via.body.data, direct.body.data, 'PWA must return real server catalogue');
assert.match(via.response.headers.get('cache-control') ?? '', /no-store/);
for (const path of [`/events/${event}/map`, `/events/${event}/activities?limit=2`, `/events/${event}/leaderboard?limit=2`]) {
  const { body, response } = await json(bridge(path), 200);
  assert.equal(body.success, true, path);
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
}
if (via.body.data.length) {
  const { body } = await json(bridge(`/stands/${via.body.data[0].id}`), 200);
  assert.equal(body.data.id, via.body.data[0].id);
}
console.log(`OK Vercel → backend: real catalogue, map, activities, ranking and stand detail`);
await json(bridge('/me/profile'), 401);
const refresh = await json(`${app}/api/session/refresh`, 401, { method: 'POST', headers: { Origin: app } });
assert.equal(refresh.body.error.code, 'AUTH_REQUIRED');
const invalid = await json(`${app}/api/session/google`, 401, {
  method: 'POST', headers: { Origin: app, 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken: 'invalid-production-smoke-token', deviceId: '00000000-0000-4000-8000-000000000011' }),
});
assert.equal(invalid.body.success, false);
await json(bridge('https://example.invalid'), 404);
const crossSite = await json(`${app}/api/session/google`, 403, {
  method: 'POST', headers: { Origin: 'https://example.invalid', 'Content-Type': 'application/json' }, body: '{}',
});
assert.equal(crossSite.body.error.code, 'ORIGIN_REJECTED');
console.log('OK authentication boundaries, invalid Google token, CSRF and proxy allowlist');
console.log(`${checks} live HTTP checks passed; no production records created.`);
