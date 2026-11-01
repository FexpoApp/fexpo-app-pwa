import type { ProgrammeItem } from './programme';

/** Transcription of the posters supplied by Omar on 2026-11-01. Not a social feed. */
export const OFFICIAL_PUBLICATIONS: readonly ProgrammeItem[] = [
  ...[
    ['mala-kumbala', 'Mala Kumbala'],
    ['dulce-sentimiento', 'Dulce Sentimiento'],
    ['lucy', 'Lucy'],
    ['tatiana-vera', 'Estudio Artístico de Danza Tatiana Vera'],
    ['inspira-dance', 'Inspira Dance Academy'],
    ['los-pinos', 'Instituto Educativo Los Pinos'],
  ].map(
    ([slug, title]): ProgrammeItem => ({
      id: `poster-${slug}-2026-11-01`,
      title,
      day: '2026-11-01',
      startsAt: null,
      endsAt: null,
      description: null,
      location: 'Escenario principal',
      standId: null,
      category: ['mala-kumbala', 'dulce-sentimiento', 'lucy'].includes(slug)
        ? 'music'
        : 'experience',
      status: 'scheduled',
      example: false,
      poster: `/assets/events/publications/${slug}.jpg`,
      sourceLabel: 'Afiche FIPAZ · 1 nov',
    }),
  ),
  {
    id: 'poster-chichi-kim-2026-11-02',
    title: 'Chichi Kim en Pío Rico',
    day: '2026-11-02',
    startsAt: '2026-11-02T18:00:00-04:00',
    endsAt: null,
    description: 'Invitado especial en el stand de Pío Rico.',
    location: 'Stand de Pío Rico · ubicación por publicar',
    standId: null,
    category: 'experience',
    status: 'scheduled',
    example: false,
    poster: '/assets/events/publications/chichi-kim.jpg',
    sourceLabel: 'Publicación Pío Rico compartida por FIPAZ',
  },
  {
    id: 'poster-noche-chaquena-2026-10-31',
    title: 'Noche Chaqueña',
    day: '2026-10-31',
    startsAt: null,
    endsAt: null,
    description: 'Grupos musicales, fraternidades, ballets y concurso al mejor zapateador.',
    location: 'Escenario principal',
    standId: null,
    category: 'experience',
    status: 'scheduled',
    example: false,
    poster: '/assets/events/publications/noche-chaquena.jpg',
    sourceLabel: 'Afiche FIPAZ · 31 oct',
  },
  {
    id: 'poster-ninos-2026-10-31',
    title: 'Ingreso libre para niños disfrazados',
    day: '2026-10-31',
    startsAt: null,
    endsAt: null,
    description: 'Promoción del 31 de octubre. Ingreso únicamente por el patio del Bloque Verde.',
    location: 'Patio del Bloque Verde',
    standId: null,
    category: 'experience',
    status: 'scheduled',
    example: false,
    poster: '/assets/events/publications/ninos-disfrazados.jpg',
    sourceLabel: 'Afiche FIPAZ · 31 oct',
  },
];

export const POSTER_VISITOR_INFO = {
  weekendHours: '11:30–23:00',
  adultPrice: '35 Bs',
  childAndSeniorPrice: '15 Bs',
  sourceLabel: 'Afiches de cartelera del 1 de noviembre compartidos por Omar',
} as const;
