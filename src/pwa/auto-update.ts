import { registerSW } from 'virtual:pwa-register';

export const PWA_UPDATE_INTERVAL_MS = 60_000;
let started = false;

/** One registration for all screens, including installed/returning clients. */
export function startAutomaticUpdates() {
  if (started || !('serviceWorker' in navigator)) return;
  started = true;
  registerSW({
    immediate: true,
    onNeedReload() {
      // Forms persist their current draft before the new UI replaces this document.
      window.dispatchEvent(new Event('fexpo-before-update'));
      window.location.reload();
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      let lastCheck = -Infinity;
      const check = () => {
        if (
          !navigator.onLine ||
          document.visibilityState === 'hidden' ||
          Date.now() - lastCheck < 10_000
        )
          return;
        lastCheck = Date.now();
        void registration.update().catch(() => {
          /* Keep the installed version while offline. */
        });
      };
      check();
      window.setInterval(check, PWA_UPDATE_INTERVAL_MS);
      window.addEventListener('online', check);
      window.addEventListener('focus', check);
      document.addEventListener('visibilitychange', check);
    },
  });
}
