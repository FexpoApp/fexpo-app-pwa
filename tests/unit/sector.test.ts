import { beforeEach, describe, expect, it } from 'vitest';
import { PLAN_LOTS } from '@/data/map-plans';
import { GAMLP, GAMLP_ENTREPRENEURS, isGamlpLot } from '@/features/sectors/gamlp';
import { parseSectorDemoQr, sectorDemoPayload, useSectorDemo } from '@/features/sectors/visit-demo';

describe('sector municipal conjunto', () => {
  beforeEach(() => useSectorDemo.setState({ visits: [], visitorId: 'visitor-1' }));
  it('conserva ambos espacios contiguos, sin absorber P14 del otro extremo', () => {
    const lots = PLAN_LOTS[GAMLP.planId].filter(([code]) => isGamlpLot(GAMLP.planId, code));
    expect(lots.map(([code]) => code)).toEqual(['P14-A', 'P14-B']);
    expect(lots[0][2] + lots[0][4]).toBe(lots[1][2]);
    expect(lots[0][1]).toBe(lots[1][1]);
    expect(lots[0][3]).toBe(lots[1][3]);
    expect(isGamlpLot('yellow-upper', 'P14')).toBe(false);
    expect(isGamlpLot('yellow-lower', 'P14-A')).toBe(false);
    expect(
      GAMLP_ENTREPRENEURS.some((entry) => entry.example || entry.id.startsWith('example-')),
    ).toBe(false);
  });
  it('rechaza códigos ajenos, malformados o de otra feria', () => {
    const raw = sectorDemoPayload('visitor-1');
    for (const value of [
      'https://app.fexpo.lat/',
      'FEXPO-SECTOR-DEMO:null',
      raw.replace('gamlp', 'P14-B'),
      raw.replace('fipaz-2026', 'otra-feria'),
      raw.replace('visitor-1', ''),
    ]) {
      expect(parseSectorDemoQr(value)).toBeNull();
      expect(useSectorDemo.getState().confirm(value)).toBe('invalid');
    }
    expect(useSectorDemo.getState().visits).toHaveLength(0);
  });
  it('cuenta una visita por pase para todo el sector; otro pase sí incrementa', () => {
    const raw = sectorDemoPayload('visitor-1');
    expect(useSectorDemo.getState().confirm(raw)).toBe('recorded');
    expect(useSectorDemo.getState().confirm(raw)).toBe('duplicate');
    expect(useSectorDemo.getState().visits).toHaveLength(1);
    expect(useSectorDemo.getState().confirm(sectorDemoPayload('visitor-2'))).toBe('recorded');
    expect(useSectorDemo.getState().visits).toHaveLength(2);
    expect(useSectorDemo.getState().visits[0]).toEqual({
      visitorId: 'visitor-1',
      at: expect.any(String),
    });
  });
});
