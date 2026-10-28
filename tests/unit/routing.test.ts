import { describe, expect, it } from 'vitest';
import { PLAN_GEOMETRY, PLAN_LOTS } from '@/data/map-plans';
import { CAMPUS_POINTS } from '@/features/campus/model';
import { routeThroughAisles } from '@/features/campus/routing';
import { siteRoute } from '@/features/campus/site';
describe('recorridos de orientación', () => {
  for (const target of CAMPUS_POINTS)
    it(`conecta el ingreso con ${target.id}`, () => {
      const plan = PLAN_GEOMETRY.find((p) => p.id === target.planId)!;
      const route = routeThroughAisles(plan, plan.origin, target);
      expect(route.length).toBeGreaterThan(1);
    });
  it('conecta el ingreso con un stand por pasillos sin atravesar otros puestos', () => {
    const plan = PLAN_GEOMETRY.find((p) => p.id === 'red-lower')!;
    const target = CAMPUS_POINTS.find((p) => p.planId === plan.id)!;
    const route = routeThroughAisles(plan, plan.origin, target);
    expect(route.length).toBeGreaterThan(1);
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1],
        b = route[i];
      expect(a.x === b.x || a.y === b.y).toBe(true);
      for (let j = 0; j <= 30; j++) {
        const x = a.x + ((b.x - a.x) * j) / 30,
          y = a.y + ((b.y - a.y) * j) / 30;
        expect(
          PLAN_LOTS[plan.id].some(
            ([, bx, by, w, h]) => x > bx && x < bx + w && y > by && y < by + h,
          ),
        ).toBe(false);
      }
    }
  });
  it('no simula un origen ni ruta exterior cuando falta el inicio', () => {
    expect(siteRoute(undefined, 'green')).toEqual([]);
    expect(siteRoute('red', 'red')).toEqual([]);
    const path = siteRoute('red', 'green');
    expect(path).toHaveLength(4);
    expect(path[1].y).toBe(465);
    expect(path[2].y).toBe(465);
  });
});
