const root = '/assets/events/ciudad-productiva';
export const PUC_ASSETS = {
  banner: `${root}/banner.webp`,
  secretaria: `${root}/secretaria-logo.png`,
  lapaz: `${root}/la-paz-logo.png`,
};
// Illustrative assets describe the experience; they are not photographs of the installed fair.
export const PUC_CONTENT: Record<
  string,
  { image: string; teaser: string; detail: string; location: string; art?: boolean }
> = {
  mercados: {
    image: `${root}/mercados.webp`,
    teaser: 'Conoce el trabajo de Actividades Económicas y la Unidad de Mercados.',
    detail:
      'Empieza por la carpa de ingreso. Conoce el espacio de Actividades Económicas y Mercados y comparte qué te pareció la atención y la información recibida.',
    location: 'Ingreso · Carpa inferior derecha',
  },
  'tunel-mercados': {
    image: `${root}/mercados.webp`,
    teaser: 'Mira en las pantallas cómo se verán los nuevos mercados.',
    detail:
      'Sigue por el pasaje del lado derecho. Las pantallas presentan cómo se verán los nuevos mercados; al terminar, escanea el QR para valorar esta experiencia audiovisual.',
    location: 'Pasaje derecho · QR al final del túnel',
  },
  'desarrollo-economico': {
    image: `${root}/innovacion.webp`,
    teaser: 'Talento paceño, emprendimiento y desarrollo productivo.',
    detail:
      'Las dos carpas unidas de la parte superior forman una sola experiencia. Conoce mediante sus pantallas el trabajo de Desarrollo Económico, Competitividad e Inversiones y comparte tu opinión del conjunto.',
    location: 'Parte superior · Dos carpas, una experiencia',
  },
  'tunel-cites': {
    image: `${root}/cites.webp`,
    teaser: 'Continúa por el pasaje dedicado a los CITEs.',
    detail:
      'Recorre el segundo túnel, en el lado izquierdo del recinto, dedicado a los CITEs. Al salir del pasaje encontrarás el cuarto QR de opinión.',
    location: 'Pasaje izquierdo · QR al final del túnel',
  },
  publicidad: {
    image: '/assets/experience/contact.png',
    art: true,
    teaser: 'La última parada antes de salir: tu opinión también cuenta.',
    detail:
      'El recorrido concluye en la carpa de la Unidad Publicidad, junto a la salida. Escanea el último QR y valora esta quinta experiencia antes de finalizar tu visita.',
    location: 'Salida · Carpa inferior izquierda',
  },
};
