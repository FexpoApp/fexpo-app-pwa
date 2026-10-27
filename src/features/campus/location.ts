import { create } from 'zustand';
import { resolveCampusTag, type CampusPoint } from './model';

/** Session-only last tag location. Never retain the tag UID or its contents. */
export const useCampusLocation = create<{
  last: { standId: string; at: string } | null;
  locate: (records: readonly string[], points?: CampusPoint[]) => string;
  clear: () => void;
}>((set) => ({
  last: null,
  locate(records, points) {
    const point = resolveCampusTag(records, points);
    set({ last: { standId: point.id, at: new Date().toISOString() } });
    return point.id;
  },
  clear: () => set({ last: null }),
}));
