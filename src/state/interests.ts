import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CATEGORIES } from '@/data/demo-data';
import { EVENT_ID, LIVE, LOCAL } from '@/services/config';
import { useLive } from './live';
import { useLocalAccount } from './local-account';
import { visitorInterestKey } from '@/features/discovery/model';
import type { StandCategory } from '@/types/domain';
type Preference = { categories: StandCategory[]; completed: true };
const EMPTY: StandCategory[] = [];
const sanitize = (items: unknown): StandCategory[] =>
  Array.isArray(items)
    ? [
        ...new Set(
          items.filter((c): c is StandCategory => CATEGORIES.some((item) => item.id === c)),
        ),
      ]
    : [];
export const useInterestStore = create<{
  byVisitor: Record<string, Preference>;
  save: (key: string, categories: StandCategory[]) => void;
}>()(
  persist(
    (set) => ({
      byVisitor: {},
      save: (key, categories) =>
        set((s) => ({
          byVisitor: {
            ...s.byVisitor,
            [key]: { categories: sanitize(categories), completed: true },
          },
        })),
    }),
    {
      name: 'fexpo-interests-v1',
      version: 1,
      partialize: (s) => ({ byVisitor: s.byVisitor }),
      merge: (persisted, current) => {
        const values = (persisted as { byVisitor?: Record<string, Preference> } | undefined)
          ?.byVisitor;
        const byVisitor: Record<string, Preference> = {};
        if (values && typeof values === 'object')
          for (const [key, value] of Object.entries(values)) {
            if (key.length <= 200 && value?.completed === true)
              byVisitor[key] = { categories: sanitize(value.categories), completed: true };
          }
        return { ...current, byVisitor };
      },
    },
  ),
);
export const useInterestEditor = create<{ open: boolean; show: () => void; close: () => void }>(
  (set) => ({ open: false, show: () => set({ open: true }), close: () => set({ open: false }) }),
);
export function useVisitorInterests() {
  const user = useLive((s) => (s.status === 'signedIn' ? s.user : null));
  const local = useLocalAccount((s) => s.profile);
  const key = visitorInterestKey(
    LIVE ? 'live' : LOCAL ? 'local' : 'demo',
    EVENT_ID,
    LIVE ? (user?.id ?? 'guest') : LOCAL ? (local?.id ?? 'guest') : 'demo',
  );
  const preference = useInterestStore((s) => s.byVisitor[key]);
  const save = useInterestStore((s) => s.save);
  return {
    key,
    categories: preference?.categories ?? EMPTY,
    completed: preference?.completed ?? false,
    autoAsk: LIVE && !!user,
    save: (categories: StandCategory[]) => save(key, categories),
  };
}
