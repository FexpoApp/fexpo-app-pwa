export const PUC_SLUG = 'gamlp-puc-2026';
export const PUC_BASE = `/ferias/${PUC_SLUG}`;
export const FIPAZ_HOME = '/ferias/fipaz-2026';
export const FAIRS = [
  {
    slug: PUC_SLUG,
    name: 'Feria GAMLP',
    venue: 'Parque Urbano Central',
    organizer: 'Secretaría Municipal de Ciudad Productiva',
    path: PUC_BASE,
  },
] as const;
export interface PucExperience {
  slug: string;
  order: number;
  name: string;
  shortName: string;
  type: 'carpa' | 'tunel';
  description: string;
}
export const PUC_EXPERIENCES: readonly PucExperience[] = [
  {
    slug: 'mercados',
    order: 1,
    name: 'Dirección de Administración de Actividades Económicas con la Unidad de Mercados',
    shortName: 'Actividades Económicas y Mercados',
    type: 'carpa',
    description:
      'El recorrido empieza en la carpa de ingreso, con la Dirección de Administración de Actividades Económicas y la Unidad de Mercados.',
  },
  {
    slug: 'tunel-mercados',
    order: 2,
    name: 'Túnel de los nuevos mercados',
    shortName: 'Nuevos mercados',
    type: 'tunel',
    description:
      'Recorre el pasaje con pantallas que muestran cómo se verán los nuevos mercados. El QR de opinión se encuentra al finalizar el túnel.',
  },
  {
    slug: 'desarrollo-economico',
    order: 3,
    name: 'Dirección de Desarrollo Económico, Competitividad e Inversiones',
    shortName: 'Desarrollo Económico',
    type: 'carpa',
    description:
      'Dos carpas unidas con pantallas para conocer el trabajo de la Dirección de Desarrollo Económico, Competitividad e Inversiones. Ambas forman una sola experiencia.',
  },
  {
    slug: 'tunel-cites',
    order: 4,
    name: 'Túnel de los CITEs',
    shortName: 'CITEs',
    type: 'tunel',
    description:
      'Continúa por el segundo pasaje, dedicado a los CITEs. Al terminar encontrarás el QR para compartir tu experiencia.',
  },
  {
    slug: 'publicidad',
    order: 5,
    name: 'Unidad Publicidad',
    shortName: 'Publicidad',
    type: 'carpa',
    description:
      'La última carpa del recorrido corresponde a la Unidad Publicidad. Comparte tu opinión antes de salir.',
  },
];
export const pucExperience = (slug: string) => PUC_EXPERIENCES.find((p) => p.slug === slug);
export const experienceUrl = (slug: string) => `${PUC_BASE}/experiencias/${slug}`;
export const ratingUrl = (slug: string) => `${PUC_BASE}/calificar/${slug}`;
// Stable public destinations. They are slugs, not fabricated backend UUIDs.
export const PUC_QR_DESTINATIONS = [
  { slug: 'inicio', name: 'Ingreso general', path: PUC_BASE },
  ...PUC_EXPERIENCES.map((p) => ({ slug: p.slug, name: p.name, path: ratingUrl(p.slug) })),
];
// Printed codes include attribution. Manual map/profile links keep ratingUrl unchanged.
export const pucPrintedQrUrl = (slug: string) => {
  const destination = PUC_QR_DESTINATIONS.find((point) => point.slug === slug);
  return destination
    ? `https://app.fexpo.lat${destination.path}${slug === 'inicio' ? '' : '?via=qr'}`
    : null;
};
export function resolvePucQr(value: string, origin: string) {
  try {
    const url = new URL(value, origin);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      (url.origin !== origin && url.origin !== 'https://app.fexpo.lat')
    )
      return null;
    const destination = PUC_QR_DESTINATIONS.find((p) => p.path === url.pathname.replace(/\/$/, ''));
    return destination?.path ?? null;
  } catch {
    return null;
  }
}
