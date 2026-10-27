import { beforeEach, describe, expect, it } from 'vitest';
import { useCampusLocation } from '@/features/campus/location';
import { lotAtPublishedPosition } from '@/features/campus/model';
import { PLAN_GEOMETRY, PLAN_LOTS } from '@/data/map-plans';
describe('ubicación NFC en la maqueta', () => {
  beforeEach(() => useCampusLocation.getState().clear());
  it('acepta un stand conocido y conserva solo su ID y la hora', () => {
    const id = useCampusLocation.getState().locate(['FIPAZ:2026:STAND:stand-altura-labs']);
    expect(id).toBe('stand-altura-labs');
    expect(Object.keys(useCampusLocation.getState().last!)).toEqual(['standId', 'at']);
  });
  it('una tarjeta desconocida no sobrescribe la última ubicación', () => {
    useCampusLocation.getState().locate(['stand-altura-labs']);
    expect(() => useCampusLocation.getState().locate(['Tarjeta bancaria'])).toThrow(/único stand/);
    expect(() => useCampusLocation.getState().locate(['stand-desconocido'])).toThrow(/ubicación/);
    expect(useCampusLocation.getState().last?.standId).toBe('stand-altura-labs');
  });
  it('rechaza etiquetas ambiguas y de otra feria', () => {
    expect(() =>
      useCampusLocation.getState().locate(['stand-altura-labs', 'stand-sabor-andino']),
    ).toThrow();
    expect(() =>
      useCampusLocation.getState().locate(['https://fexpo.test/e/otra-feria/s/stand-altura-labs']),
    ).toThrow(/otra feria/);
    expect(useCampusLocation.getState().last).toBeNull();
  });
});
describe('ubicación publicada de stands', () => {
  it('encuentra el espacio físico aunque el código comercial tenga otro prefijo', () => {
    const plan = PLAN_GEOMETRY.find((item) => item.id === 'food-court')!;
    const lot = PLAN_LOTS[plan.id].find(([code]) => code === 'G-22')!;
    const [minX, minY, width, height] = plan.viewBox.split(' ').map(Number);
    const x = (lot[1] + lot[3] / 2 - minX) / width;
    const y = (lot[2] + lot[4] / 2 - minY) / height;
    expect(lotAtPublishedPosition(plan, x, y)).toBe('G-22');
  });
});
