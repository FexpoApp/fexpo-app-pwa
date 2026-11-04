import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SECTOR_DEMO_EVENT = 'fipaz-2026';
export const SECTOR_DEMO_PREFIX = 'FEXPO-SECTOR-DEMO:';
// This presentation may run over a local-network HTTP preview, where randomUUID
// is unavailable. getRandomValues also works there; this is never a real token.
function demoVisitorId() {
  return (
    'demo-' +
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
  );
}
export function sectorDemoPayload(visitorId: string) {
  return (
    SECTOR_DEMO_PREFIX +
    JSON.stringify({
      version: 1,
      eventId: SECTOR_DEMO_EVENT,
      sectorId: 'gamlp',
      visitorId,
    })
  );
}
export function parseSectorDemoQr(raw: string) {
  if (!raw.startsWith(SECTOR_DEMO_PREFIX)) return null;
  try {
    const data = JSON.parse(raw.slice(SECTOR_DEMO_PREFIX.length));
    return data.version === 1 &&
      data.eventId === SECTOR_DEMO_EVENT &&
      data.sectorId === 'gamlp' &&
      typeof data.visitorId === 'string' &&
      /^[\w-]{1,80}$/.test(data.visitorId)
      ? (data.visitorId as string)
      : null;
  } catch {
    return null;
  }
}

interface DemoVisit {
  visitorId: string;
  at: string;
}
interface SectorDemoState {
  visitorId: string;
  visits: DemoVisit[];
  confirm: (qr: string) => 'recorded' | 'duplicate' | 'invalid';
  reset: () => void;
  nextVisitor: () => void;
}
// Isolated presentation ledger: never writes to the real check-in API, points,
// personal progress or location. One visit per visitor to the combined sector.
export const useSectorDemo = create<SectorDemoState>()(
  persist(
    (set, get) => ({
      visitorId: demoVisitorId(),
      visits: [],
      confirm: (qr) => {
        const visitorId = parseSectorDemoQr(qr);
        if (!visitorId) return 'invalid';
        if (get().visits.some((visit) => visit.visitorId === visitorId)) return 'duplicate';
        set({ visits: [...get().visits, { visitorId, at: new Date().toISOString() }] });
        return 'recorded';
      },
      reset: () => set({ visitorId: demoVisitorId(), visits: [] }),
      nextVisitor: () => set({ visitorId: demoVisitorId() }),
    }),
    { name: 'fexpo-gamlp-sector-demo-v1' },
  ),
);
