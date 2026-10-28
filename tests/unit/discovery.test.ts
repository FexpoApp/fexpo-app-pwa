import { describe, expect, it } from 'vitest';
import { offersFor, explorationBadges, visitorInterestKey } from '@/features/discovery/model';
import { STANDS } from '@/data/demo-data';
describe('ofertas según intereses', () => {
  it('solo muestra promociones publicadas y respeta el rubro seleccionado', () => {
    const offers = offersFor(STANDS, ['technology'], true);
    expect(offers.map((o) => o.stand.id)).toEqual(['stand-altura-labs']);
    expect(offers[0].example).toBe(false);
    expect(offers[0].title).toBe(STANDS[0].promotion);
  });
  it('no fabrica ofertas para empresas sin promoción', () =>
    expect(offersFor(STANDS, ['education'], true)).toEqual([]));
  it('sin intereses permite todos los rubros y marca los ejemplos', () => {
    const offers = offersFor(STANDS, [], false);
    expect(offers).toHaveLength(3);
    expect(offers.every((o) => o.example)).toBe(true);
  });
  it('separa preferencias por cuenta, evento y modo', () => {
    const first = visitorInterestKey('live', 'evento-1', 'usuario-1');
    expect(first).not.toBe(visitorInterestKey('live', 'evento-1', 'usuario-2'));
    expect(first).not.toBe(visitorInterestKey('live', 'evento-2', 'usuario-1'));
    expect(first).not.toBe(visitorInterestKey('demo', 'evento-1', 'usuario-1'));
  });
});
describe('insignias de recorrido', () => {
  it('no cuenta lecturas pendientes ni duplicados como visitas nuevas', () => {
    const badges = explorationBadges(STANDS, [
      { standId: STANDS[0].id },
      { standId: STANDS[0].id },
      { standId: STANDS[1].id, pending: true },
    ]);
    expect(badges.find((b) => b.id === 'first')?.complete).toBe(true);
    expect(badges.find((b) => b.id === 'explorer')?.progress).toBe(1);
    expect(badges.find((b) => b.id === 'health')?.complete).toBe(false);
  });
  it('la insignia por rubro requiere una visita de ese rubro', () => {
    const badges = explorationBadges(STANDS, [{ standId: STANDS[1].id }]);
    expect(badges.find((b) => b.id === 'health')?.complete).toBe(true);
    expect(badges.find((b) => b.id === 'technology')?.complete).toBe(false);
  });
});
