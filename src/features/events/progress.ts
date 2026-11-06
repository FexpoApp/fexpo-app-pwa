import { useSyncExternalStore } from 'react';
import { PUC_EXPERIENCES } from './catalog';

const KEY = 'fexpo-puc-scans-v1';
const EVENT = 'fexpo-puc-progress';
const valid = new Set(PUC_EXPERIENCES.map((point) => point.slug));

// Device-local QR history, never a server-confirmed visit or rating.
export function readPucScans(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(stored)
      ? [
          ...new Set(
            stored.filter((slug): slug is string => typeof slug === 'string' && valid.has(slug)),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export function markPucScanned(slug: string) {
  if (!valid.has(slug)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...new Set([...readPucScans(), slug])]));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* A blocked storage must not prevent opening the rating form. */
  }
}
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}
export function usePucScans() {
  // Primitive snapshot is stable between updates, including malformed storage.
  return useSyncExternalStore(
    subscribe,
    () => readPucScans().join(','),
    () => '',
  )
    .split(',')
    .filter(Boolean);
}
