import type { Stand, StandCategory } from '@/types/domain';

export interface PublishedOffer {
  id: string;
  stand: Stand;
  title: string;
  example: boolean;
}
export function offersFor(
  stands: readonly Stand[],
  interests: readonly StandCategory[],
  live: boolean,
): PublishedOffer[] {
  return stands
    .filter((s) => s.promotion?.trim() && (!interests.length || interests.includes(s.category)))
    .map((stand) => ({
      id: 'offer:' + stand.id,
      stand,
      title: stand.promotion!.trim(),
      example: !live,
    }));
}
export function visitorInterestKey(
  mode: 'live' | 'local' | 'demo',
  eventId: string,
  visitorId: string,
) {
  return mode + ':' + eventId + ':' + visitorId;
}
export interface ExplorationBadge {
  id: string;
  title: string;
  target: number;
  progress: number;
  category?: StandCategory;
  complete: boolean;
}
const badgeRules: Omit<ExplorationBadge, 'progress' | 'complete'>[] = [
  { id: 'first', title: 'Primer encuentro', target: 1 },
  { id: 'explorer', title: 'Explorador', target: 3 },
  { id: 'technology', title: 'Pulso tech', category: 'technology', target: 1 },
  { id: 'education', title: 'Siempre aprendiendo', category: 'education', target: 1 },
  { id: 'health', title: 'Bienestar', category: 'health', target: 1 },
  { id: 'gastronomy', title: 'Sabores de feria', category: 'gastronomy', target: 1 },
  { id: 'finance', title: 'Nuevas oportunidades', category: 'finance', target: 1 },
  { id: 'startups', title: 'Ideas que conectan', category: 'startups', target: 1 },
];
export function explorationBadges(
  stands: readonly Stand[],
  visits: readonly { standId: string; pending?: boolean }[],
): ExplorationBadge[] {
  const ids = new Set(visits.filter((v) => !v.pending).map((v) => v.standId));
  return badgeRules.map((rule) => {
    const count = rule.category
      ? stands.filter((s) => s.category === rule.category && ids.has(s.id)).length
      : ids.size;
    return { ...rule, progress: Math.min(count, rule.target), complete: count >= rule.target };
  });
}
