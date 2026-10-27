import { STANDS } from '@/data/demo-data';
import { extractStandIds } from '@/services/nfc-payload';
import { EVENT_ID } from '@/services/config';
import { PLAN_GEOMETRY, PLAN_LOTS, type PlanGeometry } from '@/data/map-plans';
import type { Stand } from '@/types/domain';

export type CampusStand = Stand & { lotCode?: string | number | null };
const lotCode = (stand: CampusStand) => {
  if (stand.lotCode !== undefined) return stand.lotCode;
  const suffix = stand.boothCode.split('-').at(-1) || '';
  return /^\d+$/.test(suffix) ? Number(suffix) : suffix;
};
export function lotAtPublishedPosition(plan: PlanGeometry, x: number, y: number) {
  const [minX, minY, width, height] = plan.viewBox.split(' ').map(Number);
  const px = minX + x * width;
  const py = minY + y * height;
  return (
    PLAN_LOTS[plan.id].find(
      ([, left, top, lotWidth, lotHeight]) =>
        px >= left && px <= left + lotWidth && py >= top && py <= top + lotHeight,
    )?.[0] ?? null
  );
}
export const pointsForStands = (stands: readonly CampusStand[]) =>
  stands.flatMap((stand) => {
    const code = lotCode(stand);
    if (code === null) return [];
    const lot = PLAN_LOTS[stand.planId]?.find(([value]) => String(value) === String(code));
    if (!lot) return [];
    return [
      {
        id: stand.id,
        planId: stand.planId,
        x: lot[1] + lot[3] / 2,
        y: lot[2] + lot[4] / 2,
        color: PLAN_GEOMETRY.find((p) => p.id === stand.planId)!.color,
      },
    ];
  });
export const CAMPUS_POINTS = pointsForStands(STANDS);
export type CampusPoint = (typeof CAMPUS_POINTS)[number];
export type PlanPosition = { x: number; y: number };
export const WORLD_SCALE = 0.04;
export function toWorld(plan: PlanGeometry, point: PlanPosition) {
  const [x, y, w, h] = plan.viewBox.split(' ').map(Number);
  return { x: (point.x - x - w / 2) * WORLD_SCALE, z: (point.y - y - h / 2) * WORLD_SCALE };
}
export function standAtLot(planId: string, code: string | number) {
  return standAtLotIn(STANDS, planId, code);
}
export function standAtLotIn(
  stands: readonly CampusStand[],
  planId: string,
  code: string | number,
) {
  return stands.find(
    (s) => s.planId === planId && lotCode(s) !== null && String(lotCode(s)) === String(code),
  );
}
export function resolveCampusTag(
  records: readonly string[],
  points: CampusPoint[] = CAMPUS_POINTS,
): CampusPoint {
  const ids = extractStandIds(records);
  if (ids.length !== 1)
    throw new Error(
      'Tarjeta leída. Necesita identificar un único stand de Fexpo para ubicarte en el mapa.',
    );
  for (const record of records) {
    const event = record.match(/\/e\/([^/]+)\/s\//)?.[1];
    if (event && event !== EVENT_ID)
      throw new Error('Esta etiqueta pertenece a otra feria. Tu ubicación no cambió.');
  }
  const point = points.find((p) => p.id === ids[0]);
  if (!point)
    throw new Error('Tarjeta leída. Este stand todavía no tiene una ubicación en la maqueta.');
  return point;
}
