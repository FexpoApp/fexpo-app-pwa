/* One-time migration for older installed builds that only offered an update prompt. */
const migrationCache = 'fexpo-auto-update-migration-v1';
const marker = new URL('__auto_update_done__', self.registration.scope).href;
const pending = new URL('__auto_update_pending__', self.registration.scope).href;

self.addEventListener('install', (event) => {
  if (!self.registration.active) return;
  event.waitUntil((async () => {
    const cache = await caches.open(migrationCache);
    if (!(await cache.match(marker))) await cache.put(pending, new Response('1'));
  })().catch(() => {}));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(migrationCache);
    if (await cache.match(marker)) return;
    const shouldMigrate = !!(await cache.match(pending));
    await cache.put(marker, new Response('1'));
    await cache.delete(pending);
    if (!shouldMigrate) return; // Fresh installs already run the automatic registration.
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    windows.forEach((client) => {
      const url = new URL(client.url);
      if (!client.url.startsWith(self.registration.scope) || /^\/(api|assets|fonts|icons|brands)(\/|$)/.test(url.pathname)) return;
      // Navigation waits for activation to finish. Awaiting it here would deadlock
      // this activate event and leave the old installed page open indefinitely.
      void client.navigate(client.url).catch(() => {});
    });
  })().catch(() => {}));
});
