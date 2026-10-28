import type { Lot, PlanGeometry } from '@/data/map-plans';
import type { PlanPosition } from './model';

// Spatial order and plaza names transcribed from IMG_20261026_174114.jpg.
// Schematic footprint; no geographic coordinates or measured distances.
export const SITE_PLAN: PlanGeometry = {
  id: 'campus-overview',
  zoneId: 'general',
  name: 'Campo ferial Chuquiago Marka',
  level: 'Exterior',
  color: '#132d46',
  viewBox: '0 0 1000 650',
  outline: 'M25 40H975V590H25Z',
  origin: { x: 320, y: 480 },
  structures: [
    { path: 'M305 155H385V440H305Z', label: 'Plaza Akapana', x: 345, y: 330 },
    { path: 'M625 155H725V440H625Z', label: 'Plaza Kalasasaya', x: 675, y: 330 },
    { path: 'M45 455H955V530H45Z', label: 'Av. Costanera · accesos', x: 500, y: 505 },
    { path: 'M40 100H85V440H40Z', label: 'Parqueo', x: 63, y: 275 },
  ],
};
export const SITE_LOTS: Lot[] = [
  ['Rojo', 95, 170, 205, 260],
  ['Amarillo', 390, 170, 230, 260],
  ['Verde', 730, 170, 215, 260],
  ['T1', 95, 85, 95, 65],
  ['T2', 390, 85, 90, 65],
  ['T3', 530, 85, 90, 65],
  ['T4', 850, 85, 95, 65],
];
export const SITE_ZONES = ['red', 'yellow', 'green', 'red', 'yellow', 'yellow', 'green'];
export const SITE_COLORS = [
  '#dc4545',
  '#dfb82b',
  '#299461',
  '#dc4545',
  '#dfb82b',
  '#dfb82b',
  '#299461',
];
export const SITE_ENTRIES: Record<string, PlanPosition> = {
  red: { x: 300, y: 430 },
  yellow: { x: 390, y: 430 },
  green: { x: 730, y: 430 },
  entrance: { x: 345, y: 430 },
  food: { x: 675, y: 430 },
};
export function siteRoute(from?: string, to?: string) {
  const a = from ? SITE_ENTRIES[from] : null,
    b = to ? SITE_ENTRIES[to] : null;
  if (!a || !b || from === to) return [];
  return [a, { x: a.x, y: 465 }, { x: b.x, y: 465 }, b];
}
