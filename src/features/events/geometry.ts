import type { PlanGeometry, Lot } from '@/data/map-plans';
export const PUC_PLAN: PlanGeometry = {
  id: 'gamlp-puc',
  zoneId: 'ciudad-productiva',
  name: 'Ciudad Productiva',
  level: 'Exterior',
  color: '#132d46',
  viewBox: '20 10 860 880',
  outline: 'M105 45H795V800H105Z',
  origin: { x: 690, y: 830 },
  structures: [
    {
      path: 'M560 425A110 110 0 1 1 340 425A110 110 0 1 1 560 425Z',
      label: 'Domo',
      x: 450,
      y: 425,
    },
  ],
};
export const PUC_LOTS: Lot[] = [
  ['1', 450, 605, 320, 175],
  ['2', 610, 300, 160, 250],
  ['3A', 130, 70, 320, 175],
  ['3B', 450, 70, 320, 175],
  ['4', 130, 300, 160, 250],
  ['5', 130, 605, 320, 175],
];
export const PUC_LOT_EXPERIENCES = [
  'mercados',
  'tunel-mercados',
  'desarrollo-economico',
  'desarrollo-economico',
  'tunel-cites',
  'publicidad',
] as const;
export const PUC_DOME = { x: 450, y: 425, radius: 110 };
