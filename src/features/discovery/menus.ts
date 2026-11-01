export interface RestaurantMenu {
  standId: string;
  updatedOn: string;
  example: boolean;
  items: { id: string; name: string; priceBs: number; available: boolean }[];
}
/** Live menus require an approved publication contract; no prices inferred from a promotion. */
export const PUBLISHED_MENUS: readonly RestaurantMenu[] = [];
export const DEMO_MENUS: readonly RestaurantMenu[] = [
  {
    standId: 'stand-sabor-andino',
    updatedOn: '2026-11-01',
    example: true,
    items: [
      { id: 'demo-plato', name: 'Plato del día', priceBs: 30, available: true },
      { id: 'demo-bebida', name: 'Refresco de la casa', priceBs: 8, available: true },
      { id: 'demo-postre', name: 'Postre de la casa', priceBs: 12, available: false },
    ],
  },
];
