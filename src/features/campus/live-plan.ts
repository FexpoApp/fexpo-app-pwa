import type { Lot, PlanGeometry } from '@/data/map-plans';
import type { MapFloorDto, MapStandDto } from '@/types/api';

/** Convert the published floor into the geometry used by Omar's 3D renderer. */
export function livePlan(
  floor: MapFloorDto,
): { plan: PlanGeometry; lots: Lot[]; stands: MapStandDto[] } | null {
  const view = floor.viewBox.trim().split(/[ ,]+/).map(Number);
  if (view.length !== 4 || !view.every(Number.isFinite) || view[2] <= 0 || view[3] <= 0)
    return null;
  const [x, y, width, height] = view;
  const stands = floor.stands.filter((stand) =>
    [stand.x, stand.y, stand.width ?? 0.035, stand.height ?? 0.035].every(Number.isFinite),
  );
  const lots: Lot[] = stands.map((stand) => {
    const w = Math.max(0.01, stand.width ?? 0.035) * width;
    const h = Math.max(0.01, stand.height ?? 0.035) * height;
    return [stand.boothCode, x + stand.x * width - w / 2, y + stand.y * height - h / 2, w, h];
  });
  return {
    plan: {
      id: floor.id,
      zoneId: floor.code,
      name: floor.name,
      level: 'Planta baja',
      color: '#087ec2',
      viewBox: view.join(' '),
      outline: floor.outline || `M${x} ${y}H${x + width}V${y + height}H${x}Z`,
      origin: { x: x + width / 2, y: y + height / 2 },
      structures: floor.structures.map((item) => ({
        path: item.path,
        label: item.label || undefined,
        // map_structures labels use floor SVG coordinates, unlike stand locations.
        x: item.labelX ?? undefined,
        y: item.labelY ?? undefined,
      })),
    },
    lots,
    stands,
  };
}
