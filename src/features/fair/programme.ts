import type { ActivityDto } from '@/types/api';

export const FAIR = {
  route: '/events/event-fipaz-2026',
  startsOn: '2026-10-28',
  endsOn: '2026-11-08',
  timeZone: 'America/La_Paz',
  website: 'https://www.fipaz.com.bo/',
  facebook: 'https://www.facebook.com/feriafipaz/',
  source:
    'https://www.fipaz.com.bo/docs/FIPAZ%202026%20-%20DEL%2028%20DE%20OCT%20AL%208%20DE%20NOV%20-%20CFCM%20-%20LA%20PAZ%20-%20BOLIVIA.pdf',
  logo: '/assets/events/fipaz-official-2026.png',
  map: '/assets/events/fipaz-2026-oficial.pdf#page=3',
} as const;

export interface ProgrammeItem {
  id: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  /** A dated poster may omit the show time. Never assign the opening time to it. */
  day?: string;
  poster?: string;
  sourceLabel?: string;
  endsAt: string | null;
  location: string | null;
  standId: string | null;
  category: 'experience' | 'food' | 'music';
  status: 'scheduled' | 'completed';
  example: boolean;
}

export function dateInLaPaz(value: number | string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: FAIR.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function fairDays(): string[] {
  const days: string[] = [];
  for (
    let at = Date.parse(`${FAIR.startsOn}T12:00:00Z`);
    at <= Date.parse(`${FAIR.endsOn}T12:00:00Z`);
    at += 86_400_000
  ) {
    days.push(new Date(at).toISOString().slice(0, 10));
  }
  return days;
}

export function selectedFairDay(requested: string | null, now: number): string {
  const days = fairDays();
  if (requested && days.includes(requested)) return requested;
  const today = dateInLaPaz(now);
  return today < FAIR.startsOn ? FAIR.startsOn : today > FAIR.endsOn ? FAIR.endsOn : today;
}

export function dayLabel(day: string, short = false): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: FAIR.timeZone,
    weekday: short ? 'short' : 'long',
    ...(short ? {} : { day: 'numeric', month: 'long' }),
  }).format(new Date(`${day}T12:00:00Z`));
}

export function programmeTime(value: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: FAIR.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
}

export function programmeForDay(items: readonly ProgrammeItem[], day: string): ProgrammeItem[] {
  return items
    .filter((item) => (item.day || dateInLaPaz(item.startsAt || '')) === day)
    .sort(
      (a, b) =>
        (a.startsAt ? Date.parse(a.startsAt) : Infinity) -
          (b.startsAt ? Date.parse(b.startsAt) : Infinity) || a.id.localeCompare(b.id),
    );
}

/** API content wins matching title/day; examples never fill a day with known publications. */
export function mergeProgramme(
  published: readonly ProgrammeItem[],
  posters: readonly ProgrammeItem[],
  examples: readonly ProgrammeItem[],
) {
  const key = (item: ProgrammeItem) =>
    `${item.day || dateInLaPaz(item.startsAt || '')}:${item.title.trim().toLocaleLowerCase()}`;
  const merged = new Map<string, ProgrammeItem>();
  for (const item of [...published, ...posters])
    if (!merged.has(key(item))) merged.set(key(item), item);
  const realDays = new Set(
    [...merged.values()].map((item) => item.day || dateInLaPaz(item.startsAt || '')),
  );
  for (const item of examples)
    if (!realDays.has(item.day || dateInLaPaz(item.startsAt || ''))) merged.set(key(item), item);
  return [...merged.values()];
}

/** Only the public activity contract supplies live programming; never infer shows from ads. */
export function fromPublishedActivity(activity: ActivityDto): ProgrammeItem | null {
  if (
    !activity.id ||
    !activity.title?.trim() ||
    !dateInLaPaz(activity.startsAt ?? '') ||
    !['scheduled', 'completed'].includes(activity.status ?? '')
  )
    return null;
  return {
    id: activity.id,
    title: activity.title,
    description: activity.description,
    startsAt: activity.startsAt!,
    endsAt: activity.endsAt && dateInLaPaz(activity.endsAt) ? activity.endsAt : null,
    location: activity.locationText?.trim() || null,
    standId: activity.standId ?? null,
    category: 'experience',
    status: activity.status as 'scheduled' | 'completed',
    example: false,
  };
}

/** Fictional review content. No artists, prices or dated promotions are asserted as official. */
export const DEMO_PROGRAMME: readonly ProgrammeItem[] = fairDays().flatMap((day) => [
  {
    id: `example-discover-${day}`,
    title: 'Ideas que se viven en primera persona',
    description: 'Una demostración para descubrir lo que están creando los expositores.',
    startsAt: `${day}T17:00:00-04:00`,
    endsAt: `${day}T18:00:00-04:00`,
    location: 'Zona de experiencias · ejemplo',
    standId: null,
    category: 'experience' as const,
    status: 'scheduled' as const,
    example: true,
  },
  {
    id: `example-food-${day}`,
    title: 'Una pausa con sabor local',
    description: 'Ejemplo de una experiencia gastronómica dentro de la feria.',
    startsAt: `${day}T18:30:00-04:00`,
    endsAt: null,
    location: 'Patio de comidas · ejemplo',
    standId: null,
    category: 'food' as const,
    status: 'scheduled' as const,
    example: true,
  },
  {
    id: `example-music-${day}`,
    title: 'La noche también se disfruta',
    description: 'Así se verá un espectáculo cuando la organización publique su cartelera.',
    startsAt: `${day}T20:00:00-04:00`,
    endsAt: `${day}T21:00:00-04:00`,
    location: 'Escenario · ejemplo',
    standId: null,
    category: 'music' as const,
    status: 'scheduled' as const,
    example: true,
  },
]);
