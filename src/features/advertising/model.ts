export interface Advertisement {
  id: string;
  eventId: string;
  standId: string;
  advertiser: string;
  title: string;
  subtitle: string;
  category: 'technology' | 'gastronomy';
  status: 'draft' | 'published';
  startsAt: string;
  endsAt: string;
  example: boolean;
}

export function activeAdvertisements(
  items: readonly Advertisement[],
  eventId: string,
  now: number,
) {
  return items.filter(
    (item) =>
      item.status === 'published' &&
      item.eventId === eventId &&
      Date.parse(item.startsAt) <= now &&
      now < Date.parse(item.endsAt),
  );
}

// No paid campaign is inferred from a stand's featured flag or promotion text.
// Replace this empty source with the authorized campaign API once its contract is approved.
export const PUBLISHED_ADVERTISEMENTS: readonly Advertisement[] = [];

export const DEMO_ADVERTISEMENTS: readonly Advertisement[] = [
  {
    id: 'example-altura',
    eventId: 'event-fipaz-2026',
    standId: 'stand-altura-labs',
    advertiser: 'Altura Labs',
    title: 'Tu próxima gran idea empieza aquí.',
    subtitle: 'Descubre nuevas formas de conectar con la tecnología.',
    category: 'technology',
    status: 'published',
    startsAt: '2026-10-28T00:00:00-04:00',
    endsAt: '2026-11-09T00:00:00-04:00',
    example: true,
  },
  {
    id: 'example-sabor',
    eventId: 'event-fipaz-2026',
    standId: 'stand-sabor-andino',
    advertiser: 'Sabor Andino',
    title: 'Haz una pausa. Descubre otro sabor.',
    subtitle: 'Conoce una propuesta gastronómica en la feria.',
    category: 'gastronomy',
    status: 'published',
    startsAt: '2026-10-28T00:00:00-04:00',
    endsAt: '2026-11-09T00:00:00-04:00',
    example: true,
  },
];
