import { describe, expect, it } from 'vitest';
import {
  PLAN_GEOMETRY,
  PLAN_LOTS,
  lotContains,
  lotDetail,
  lotFootprint,
  lotLabel,
} from '@/data/map-plans';
import { lotAtPublishedPosition, publishedLotCode } from '@/features/campus/model';

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
// Independent transcription of the labels visible in the three source photos.
const photographed: Record<string, (number | string)[]> = {
  'red-lower': [
    ...range(1, 49).filter((n) => n !== 40 && n !== 49),
    '40A',
    '40B',
    '49A',
    '49B',
    '49C',
    '49D',
    'R1',
    'R2',
  ],
  'red-upper': [...range(50, 110).filter((n) => n !== 56 && n !== 93), '56A', '56B', '93A', '93B'],
  'yellow-lower': [
    ...range(1, 86).filter((n) => n !== 51 && n !== 53),
    '49-ref',
    '53A',
    '53B',
    '53C',
    ...range(1, 6).map((n) => `A${n}`),
  ],
  'yellow-upper': [
    ...range(87, 205).filter((n) => n !== 90 && n !== 142),
    '90A',
    '90B',
    ...range(1, 11).map((n) => `P${n}`),
    'P14',
    'P14-A',
    'P14-B',
    'A8',
  ],
  'green-upper': [...range(1, 23), 31, 32, 33, ...range(50, 86), ...range(90, 95), 'CDT', 'V5'],
  entrance: range(1, 9),
  'food-court': range(1, 24).map((n) => `G-${n}`),
};
describe('plano operativo fotografiado el 04/11/2026', () => {
  for (const [plan, codes] of Object.entries(photographed))
    it(`conserva todos los rótulos de ${plan}, sin añadir espacios del plano anterior`, () => {
      const actual = PLAN_LOTS[plan].map(([code]) => String(code));
      expect(actual.toSorted()).toEqual(codes.map(String).toSorted());
      expect(new Set(actual).size).toBe(actual.length);
    });
  it('conserva el rótulo 49 duplicado sin inventar 51 ni confundir sus identidades físicas', () => {
    expect(lotLabel('yellow-lower', '49-ref')).toBe('49');
    expect(lotLabel('yellow-lower', 49)).toBe('49');
    expect(lotDetail('yellow-lower', '49-ref')?.note).toMatch(/dos ubicaciones/);
    expect(PLAN_LOTS['yellow-lower'].find(([code]) => code === 51)).toBeUndefined();
  });
  it('el puesto hexagonal 22 no ocupa las esquinas de su caja ni las selecciona por posición del API', () => {
    const lot = PLAN_LOTS['food-court'].find(([code]) => code === 'G-22')!;
    expect(lotFootprint('food-court', lot)).toHaveLength(6);
    expect(lotContains('food-court', lot, 339, 369.5)).toBe(true);
    expect(lotContains('food-court', lot, 301, 339)).toBe(false);
    const plan = PLAN_GEOMETRY.find((p) => p.id === 'food-court')!;
    expect(lotAtPublishedPosition(plan, 301 / 640, (339 - 130) / 620)).toBeNull();
  });
  it('el hueco de CDT queda libre y sus dos brazos siguen siendo seleccionables', () => {
    const lot = PLAN_LOTS['green-upper'].find(([code]) => code === 'CDT')!;
    expect(lotContains('green-upper', lot, 780, 260)).toBe(true);
    expect(lotContains('green-upper', lot, 828, 350)).toBe(true);
    expect(lotContains('green-upper', lot, 780, 350)).toBe(false);
  });
  it('un ocupante de un sublote retirado no se atribuye automáticamente al sector V5', () => {
    const plan = PLAN_GEOMETRY.find((p) => p.id === 'green-upper')!;
    const position = { x: 1000 / 1125, y: (400 - 110) / 640 };
    expect(lotAtPublishedPosition(plan, position.x, position.y)).toBe('V5');
    expect(publishedLotCode(plan, { ...position, boothCode: 'V-98' })).toBeNull();
    expect(publishedLotCode(plan, { ...position, boothCode: 'V5' })).toBe('V5');
  });
  it('la boletería está a la izquierda del domo y la enfermería encima del espacio 5', () => {
    const lot = (id: number) => PLAN_LOTS.entrance.find(([code]) => code === id)!;
    expect(lot(2)[1] + lot(2)[3]).toBeLessThan(lot(1)[1]);
    expect(lot(6)[2] + lot(6)[4]).toBe(lot(5)[2]);
    expect(lotFootprint('entrance', lot(1))).toHaveLength(24);
    expect(lotDetail('entrance', 6)?.label).toBe('Enfermería');
  });
  it('todas las formas trazadas permanecen dentro de su caja de coordenadas', () => {
    for (const [plan, lots] of Object.entries(PLAN_LOTS))
      for (const lot of lots)
        for (const [x, y] of lotFootprint(plan, lot)) {
          expect(x).toBeGreaterThanOrEqual(lot[1] - 1e-8);
          expect(x).toBeLessThanOrEqual(lot[1] + lot[3] + 1e-8);
          expect(y).toBeGreaterThanOrEqual(lot[2] - 1e-8);
          expect(y).toBeLessThanOrEqual(lot[2] + lot[4] + 1e-8);
        }
  });
});
