/** Location confirmed by Omar, 04/11/2026; boundaries from IMG_20261104_094841.jpg. */
export const GAMLP = {
  id: 'gamlp',
  name: 'Gobierno Autónomo Municipal de La Paz',
  shortName: 'GAMLP',
  planId: 'yellow-upper',
  lots: ['P14-A', 'P14-B'] as readonly string[],
  location: 'Bloque amarillo · Planta alta · Pabellón Bolivia',
  logo: '/brands/gamlp-2026.png',
  mapUrl: '/map?plan=yellow-upper&view=2d&sector=gamlp&lot=P14-A',
  profileUrl: '/sectors/gamlp',
};

export function isGamlpLot(planId: string, code: string | number) {
  return planId === GAMLP.planId && GAMLP.lots.includes(String(code));
}

export interface Entrepreneur {
  id: string;
  name: string;
  category: string;
  description: string;
  products: readonly string[];
  example?: boolean;
}

// Add only the roster supplied/authorized by GAMLP. These are directory entries,
// not independent stands: all visits belong to the single municipal sector.
export const GAMLP_ENTREPRENEURS: readonly Entrepreneur[] = [];

export const EXAMPLE_ENTREPRENEURS: readonly Entrepreneur[] = [
  {
    id: 'example-craft',
    name: 'Ejemplo · Artesanía',
    category: 'Hecho a mano',
    description: 'Así se verá el mini perfil de un emprendimiento del sector.',
    products: ['Accesorios artesanales', 'Regalos personalizados'],
    example: true,
  },
  {
    id: 'example-food',
    name: 'Ejemplo · Alimentos',
    category: 'Sabores locales',
    description: 'Espacio de muestra para presentar productos y orientar al visitante.',
    products: ['Productos envasados', 'Especialidades locales'],
    example: true,
  },
  {
    id: 'example-design',
    name: 'Ejemplo · Diseño',
    category: 'Creación local',
    description: 'Los datos definitivos se cargarán con la lista de emprendedores.',
    products: ['Textiles', 'Artículos de diseño'],
    example: true,
  },
];
