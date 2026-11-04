import red from './data/red.json';
import yellow from './data/yellow.json';
import green from './data/green.json';
import entrance from './data/entrance.json';
import food from './data/food.json';
import logoData from './data/logos.json';
import { PLAN_GEOMETRY, PLAN_LOTS } from '@/data/map-plans';

export interface VerifiedLogo {
  companyKey: string;
  src: string;
  sourcePage: string;
  imageUrl: string;
  verifiedAt: string;
  background?: 'light' | 'dark';
  assetKind: 'logo' | 'brand-icon';
}
export interface PhotoRow {
  planId: string;
  printedCode: string;
  name: string;
  sourceImage: string;
}
export interface Placement extends PhotoRow {
  id: string;
  companyKey: string;
  lotCode: string | null;
  match: 'exact' | 'shared' | 'unresolved' | 'user-confirmed';
}
export interface PhotoCompany {
  id: string;
  name: string;
  kind: 'company' | 'service';
  placements: Placement[];
  logo?: VerifiedLogo;
}
export const foldCompany = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const aliases: Record<string, string> = { 'cepas-mendocina': 'cepas-mendocinas' };
export const companyKey = (name: string) => aliases[foldCompany(name)] ?? foldCompany(name);
export const VERIFIED_LOGOS = logoData as VerifiedLogo[];
const logos = new Map(VERIFIED_LOGOS.map((logo) => [logo.companyKey, logo]));
const services = new Set([
  'domo-decorativo',
  'boleteria',
  'enfermeria',
  'juegos-extremos',
  'escenario-principal',
]);
export const PHOTO_ROWS: readonly PhotoRow[] = [...red, ...yellow, ...green, ...entrance, ...food];

export function resolvePlacement(row: PhotoRow): Pick<Placement, 'lotCode' | 'match'> {
  const lots = PLAN_LOTS[row.planId] ?? [];
  const code = row.planId === 'food-court' ? `G-${row.printedCode}` : row.printedCode;
  // The drawing has two 49s and no 51. Do not decide that the directory's 51
  // belongs to either 49, and do not silently choose one for directory code 49.
  if (row.planId === 'yellow-lower' && ['49', '51'].includes(row.printedCode))
    return { lotCode: null, match: 'unresolved' };
  if (lots.some(([id]) => String(id) === code)) return { lotCode: code, match: 'exact' };
  // A/B/C commercial subdivisions share the unsplit physical polygon.
  // Codes ending J are not inferred to be numbered restaurant plots.
  if (/^\d+[A-D]$/.test(row.printedCode)) {
    const parent = row.printedCode.replace(/[A-D]$/, '');
    if (lots.some(([id]) => String(id) === parent)) return { lotCode: parent, match: 'shared' };
  }
  return { lotCode: null, match: 'unresolved' };
}
export const PHOTO_PLACEMENTS: readonly Placement[] = PHOTO_ROWS.map((row, index) => ({
  ...row,
  id: `photo-assignment-${index + 1}`,
  companyKey: companyKey(row.name),
  ...resolvePlacement(row),
}));
const confirmed: Placement[] = ['P14-A', 'P14-B'].map((code) => ({
  id: `confirmed-gamlp-${code.toLowerCase()}`,
  companyKey: 'gamlp',
  name: 'GAMLP',
  planId: 'yellow-upper',
  printedCode: code,
  lotCode: code,
  match: 'user-confirmed',
  sourceImage: 'IMG_20261104_094841.jpg',
}));
export const EXHIBITOR_PLACEMENTS: readonly Placement[] = [...PHOTO_PLACEMENTS, ...confirmed];
const grouped = new Map<string, PhotoCompany>();
for (const placement of EXHIBITOR_PLACEMENTS) {
  const id = placement.companyKey;
  if (!grouped.has(id))
    grouped.set(id, {
      id,
      name: placement.name,
      kind: services.has(id) ? 'service' : 'company',
      placements: [],
      logo: logos.get(id),
    });
  grouped.get(id)!.placements.push(placement);
}
export const PHOTO_COMPANIES: readonly PhotoCompany[] = [...grouped.values()].sort((a, b) =>
  a.name.localeCompare(b.name, 'es'),
);
const companies = new Map(PHOTO_COMPANIES.map((company) => [company.id, company]));
export const photoCompany = (id: string) => companies.get(id);
const occupancy = new Map<string, PhotoCompany[]>();
for (const company of PHOTO_COMPANIES)
  for (const p of company.placements) {
    if (!p.lotCode) continue;
    const key = `${p.planId}:${p.lotCode}`;
    const items = occupancy.get(key) ?? [];
    if (!items.includes(company)) items.push(company);
    occupancy.set(key, items);
  }
export function companiesAtLot(planId: string, code: string | number) {
  return occupancy.get(`${planId}:${code}`) ?? [];
}
export const companyProfileUrl = (id: string) => `/companies/${encodeURIComponent(id)}`;
export function placementMapUrl(placement: Placement) {
  if (!placement.lotCode) return null;
  return `/map?reference=2026-11-04&view=2d&plan=${placement.planId}&lot=${encodeURIComponent(placement.lotCode)}&company=${placement.companyKey}`;
}
export const planName = (id: string) => PLAN_GEOMETRY.find((plan) => plan.id === id)?.name ?? id;
export const planLocation = (id: string) => {
  const plan = PLAN_GEOMETRY.find((p) => p.id === id);
  return plan
    ? `${plan.zoneId === 'red' ? 'Rojo' : plan.zoneId === 'yellow' ? 'Amarillo' : plan.zoneId === 'green' ? 'Verde' : plan.name} · ${plan.level}`
    : id;
};
export function findPhotoPlacements(query: string) {
  const terms = foldCompany(query).split('-').filter(Boolean);
  return EXHIBITOR_PLACEMENTS.filter((p) =>
    terms.every((term) =>
      foldCompany(`${p.name} ${p.printedCode} ${planName(p.planId)}`).includes(term),
    ),
  );
}
