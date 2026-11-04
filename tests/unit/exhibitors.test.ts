import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PLAN_LOTS } from '@/data/map-plans';
import {
  PHOTO_ROWS,
  PHOTO_COMPANIES,
  PHOTO_PLACEMENTS,
  EXHIBITOR_PLACEMENTS,
  VERIFIED_LOGOS,
  companiesAtLot,
  photoCompany,
  placementMapUrl,
} from '@/features/exhibitors/model';

describe('directorio fotografiado y marcas verificadas', () => {
  it('conserva las 349 filas de origen y las dos ubicaciones municipales confirmadas', () => {
    expect(PHOTO_ROWS).toHaveLength(349);
    expect(EXHIBITOR_PLACEMENTS).toHaveLength(351);
    expect(new Set(EXHIBITOR_PLACEMENTS.map((p) => p.id)).size).toBe(351);
    for (const p of PHOTO_PLACEMENTS) {
      expect(p.sourceImage).toMatch(/^IMG_20261104_\d+\.jpg$/);
      if (p.lotCode)
        expect(PLAN_LOTS[p.planId].some(([code]) => String(code) === p.lotCode)).toBe(true);
      else expect(p.match).toBe('unresolved');
      expect(photoCompany(p.companyKey)?.placements).toContain(p);
    }
  });
  it('agrupa los tres expositores del 34 y las subdivisiones comerciales del 54', () => {
    expect(companiesAtLot('red-lower', 34).map((c) => c.name)).toEqual(
      expect.arrayContaining(['D - Openbrands', 'Swissôtel', 'Sisife']),
    );
    expect(companiesAtLot('red-upper', 54)).toHaveLength(2);
    expect(
      PHOTO_PLACEMENTS.find((p) => p.planId === 'red-upper' && p.printedCode === '54A')?.match,
    ).toBe('shared');
  });
  it('no inventa ubicación para códigos ambiguos ni sobrescribe los dos Ferrotodo', () => {
    for (const code of ['49', '51'])
      expect(
        PHOTO_PLACEMENTS.find((p) => p.planId === 'yellow-lower' && p.printedCode === code)
          ?.lotCode,
      ).toBeNull();
    for (const code of ['25', '5J', '10J'])
      expect(
        PHOTO_PLACEMENTS.find((p) => p.planId === 'food-court' && p.printedCode === code)?.lotCode,
      ).toBeNull();
    for (const code of ['110', '117'])
      expect(companiesAtLot('yellow-upper', code).map((c) => c.id)).toContain('ferrotodo');
  });
  it('distingue la Gobernación del GAMLP y conserva el sector conjunto municipal', () => {
    expect(companiesAtLot('green-upper', 'V5').map((c) => c.id)).toEqual(['gobernacion-de-la-paz']);
    for (const code of ['P14-A', 'P14-B'])
      expect(companiesAtLot('yellow-upper', code).map((c) => c.id)).toEqual(['gamlp']);
    expect(photoCompany('gamlp')?.placements).toHaveLength(3);
    expect(photoCompany('gamlp')?.logo?.src).not.toBe(
      photoCompany('gobernacion-de-la-paz')?.logo?.src,
    );
  });
  it('sirve logos locales con fuente verificable y sin SVG activo', () => {
    expect(VERIFIED_LOGOS.length).toBeGreaterThanOrEqual(22);
    expect(new Set(VERIFIED_LOGOS.map((l) => l.companyKey)).size).toBe(VERIFIED_LOGOS.length);
    for (const logo of VERIFIED_LOGOS) {
      expect(photoCompany(logo.companyKey)).toBeDefined();
      expect(logo.sourcePage).toMatch(/^https:\/\//);
      expect(logo.imageUrl).toMatch(/^https:\/\//);
      expect(logo.src).toMatch(/^\/brands\//);
      const path = resolve('public', logo.src.slice(1));
      expect(existsSync(path)).toBe(true);
      if (path.endsWith('.svg'))
        expect(readFileSync(path, 'utf8')).not.toMatch(
          /<script|<foreignObject|\bonload\s*=|(?:href|src)=["'](?:https?:|javascript:)/i,
        );
    }
  });
  it('los enlaces usan la revisión fotografiada y no convierten IDs locales en UUID de stands', () => {
    for (const company of PHOTO_COMPANIES)
      for (const p of company.placements) {
        const url = placementMapUrl(p);
        if (!p.lotCode) expect(url).toBeNull();
        else {
          const parsed = new URL(url!, 'https://app.fexpo.lat');
          expect(parsed.searchParams.get('reference')).toBe('2026-11-04');
          expect(parsed.searchParams.get('lot')).toBe(p.lotCode);
          expect(parsed.searchParams.has('stand')).toBe(false);
        }
      }
  });
});
