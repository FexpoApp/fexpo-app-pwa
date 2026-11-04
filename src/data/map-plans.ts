/**
 * Geometria vectorial original de los planos de FIPAZ 2026.
 *
 * ORIGEN: fexpo-web-fe/src/features/map/data/fipaz2026Plans.ts (demo /demo/map).
 * Se conserva su marco de coordenadas, viewBox y funciones box/row/column.
 * Esta revision de la PWA se coteja con las fotografias; no modifica por si
 * sola la demo web ni los registros persistidos del backend. El visor habitual
 * requiere compatibilidad del API; la referencia fotografica es seleccionable
 * de forma explicita. Geometria simplificada, no relevada. Revision del 04/11/2026:
 * IMG_20261104_094828.jpg (rojo), 094841 (amarillo/plaza), 094853 (verde/comidas).
 * Los contornos y viewBox estables conservan el marco de coordenadas del API;
 * los lotes, formas y zonas interiores reflejan el plano operativo fotografiado.
 *
 * Unidades: las del `viewBox` de cada plano (como en el SVG de la web).
 */

export interface PlanGeometry {
  id: string;
  zoneId: string;
  name: string;
  level: 'Planta baja' | 'Planta alta' | 'Exterior';
  color: string;
  viewBox: string;
  outline: string;
  origin: { x: number; y: number };
  structures: { path: string; label?: string; x?: number; y?: number }[];
}
export const PHOTO_PLAN_REVISION = '2026-11-04';

export const PLAN_GEOMETRY: PlanGeometry[] = [
  {
    id: 'red-lower',
    zoneId: 'red',
    name: 'Internacional I',
    level: 'Planta baja',
    color: '#dc4545',
    viewBox: '0 90 800 630',
    outline: 'M20 138H640V105H778V695H642V666H20Z',
    origin: { x: 625, y: 460 },
    structures: [
      { path: 'M646 240V160H769V240Z', label: 'Baños', x: 708, y: 204 },
      { path: 'M647 565H770V687H647Z', label: 'Escaleras / ascensor', x: 708, y: 646 },
      { path: 'M40 609H645V661H40Z', label: 'Rampas', x: 340, y: 640 },
      { path: 'M652 316H763V493H652Z', label: 'Ingreso', x: 708, y: 407 },
    ],
  },
  {
    id: 'red-upper',
    zoneId: 'red',
    name: 'Internacional II',
    level: 'Planta alta',
    color: '#dc4545',
    viewBox: '10 120 805 635',
    outline: 'M28 170H660V135H795V287H729V512H793V737H661V700H28Z',
    origin: { x: 640, y: 545 },
    structures: [
      { path: 'M663 189H794V271H663Z', label: 'Baños', x: 727, y: 224 },
      { path: 'M28 616H660V700H28Z', label: 'Rampas', x: 330, y: 660 },
      { path: 'M684 664H795V736H684Z', label: 'Escaleras / ascensor', x: 739, y: 715 },
    ],
  },
  {
    id: 'yellow-lower',
    zoneId: 'yellow',
    name: 'Pabellón La Paz',
    level: 'Planta baja',
    color: '#d5ae13',
    viewBox: '10 110 1090 620',
    outline: 'M28 128H176V164H937V128H1083V267H941V537L1080 530V707L941 714V675H177V704H28Z',
    origin: { x: 188, y: 490 },
    structures: [
      { path: 'M30 182H171V273H30Z', label: 'Baños', x: 98, y: 220 },
      { path: 'M943 184H1080V266H943Z', label: 'Baños', x: 1010, y: 223 },
      { path: 'M177 585H935V670H177Z', label: 'Rampas', x: 554, y: 636 },
      { path: 'M39 633H170V703H39Z', label: 'Escaleras / ascensor', x: 106, y: 678 },
      { path: 'M960 622L1060 605V695L960 710Z', label: 'Ascensor', x: 1007, y: 665 },
      { path: 'M37 338H88V491H37Z', label: 'Ingreso', x: 117, y: 420 },
    ],
  },
  {
    id: 'yellow-upper',
    zoneId: 'yellow',
    name: 'Pabellón Bolivia',
    level: 'Planta alta',
    color: '#d5ae13',
    viewBox: '20 110 1090 625',
    outline: 'M44 128H184V164H949V128H1092V697L952 716V672H181V706H44Z',
    origin: { x: 228, y: 521 },
    structures: [
      { path: 'M44 177H96V272H44Z', label: 'Baños', x: 70, y: 215 },
      { path: 'M953 177H1092V270H953Z', label: 'Baños', x: 1021, y: 219 },
      { path: 'M180 584H946V671H180Z', label: 'Rampas', x: 557, y: 636 },
      { path: 'M46 629H176V704H46Z', label: 'Escaleras / ascensor', x: 111, y: 674 },
      { path: 'M964 632L1065 615V690L964 709Z', label: 'Ascensor', x: 1012, y: 667 },
      { path: 'M77 356H148V529H77Z', label: 'Mesas', x: 111, y: 442 },
    ],
  },
  {
    id: 'green-upper',
    zoneId: 'green',
    name: 'Pabellón Americano',
    level: 'Planta alta',
    color: '#299461',
    viewBox: '0 110 1125 640',
    outline: 'M14 124L179 148V190L1102 255V730H182V741H15V470H98V283H14Z',
    origin: { x: 199, y: 511 },
    structures: [
      { path: 'M17 201H177V283H17Z', label: 'Baños', x: 89, y: 244 },
      { path: 'M184 589H1098V727H184Z', label: 'Rampas', x: 617, y: 667 },
      { path: 'M20 667H176V736H20Z', label: 'Escaleras / ascensor', x: 98, y: 707 },
      { path: 'M603 238L765 249V288H807V327H644V312H603Z', label: 'Selfies FIPAZ', x: 702, y: 303 },
      { path: 'M644 312H685V449H644V408H643V354H644Z' },
      { path: 'M685 327H726V449H685Z', label: 'Mesas', x: 705, y: 391 },
    ],
  },
  {
    id: 'entrance',
    zoneId: 'entrance',
    name: 'Plaza Akapana',
    level: 'Exterior',
    color: '#638b9b',
    viewBox: '0 100 565 655',
    outline: 'M123 118H268L559 170V307H525V588H552V733H360V710H142V746H11V592H125Z',
    origin: { x: 321, y: 690 },
    structures: [{ path: 'M255 422H365V426H255Z', label: 'Ingreso peatonal', x: 310, y: 430 }],
  },
  {
    id: 'food-court',
    zoneId: 'food',
    name: 'Patio de comidas',
    level: 'Exterior',
    color: '#b4b73b',
    viewBox: '0 130 640 620',
    outline: 'M81 145L226 172L213 202L478 239V204L626 222V736H17L39 520L66 381Z',
    origin: { x: 311, y: 704 },
    structures: [
      { path: 'M82 194L218 217L205 299L70 281Z', label: 'Baños', x: 144, y: 249 },
      { path: 'M484 247L623 264V331H481Z', label: 'Baños', x: 551, y: 295 },
      { path: 'M38 584H160V688H23Z', label: 'Escaleras / ascensor', x: 97, y: 640 },
      { path: 'M480 586H622V690H480Z', label: 'Escaleras / ascensor', x: 550, y: 640 },
    ],
  },
];

export type Lot = [
  code: string | number,
  x: number,
  y: number,
  width: number,
  height: number,
  area?: number,
];
export interface LotDetail {
  color?: string;
  printedCode?: string;
  label?: string;
  labelAt?: [number, number];
  note?: string;
  footprint?: readonly [number, number][];
}
export const PLAN_LOT_DETAILS: Record<string, Record<string, LotDetail>> = {};
export function lotDetail(planId: string, code: string | number) {
  return PLAN_LOT_DETAILS[planId]?.[String(code)];
}
export function lotLabel(planId: string, code: string | number) {
  return lotDetail(planId, code)?.printedCode ?? String(code);
}
export function lotFootprint(planId: string, lot: Lot): readonly [number, number][] {
  const [, x, y, w, h] = lot;
  return (
    lotDetail(planId, lot[0])?.footprint ?? [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ]
  );
}
export function lotPath(planId: string, lot: Lot) {
  return (
    lotFootprint(planId, lot)
      .map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`)
      .join('') + 'Z'
  );
}
/** Picking and aisle obstacles use the same footprint as both renderers. */
export function lotContains(planId: string, lot: Lot, x: number, y: number, padding = 0) {
  const [, bx, by, w, h] = lot;
  if (x < bx - padding || x > bx + w + padding || y < by - padding || y > by + h + padding)
    return false;
  const polygon = lotDetail(planId, lot[0])?.footprint;
  if (!polygon) return true;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [ax, ay] = polygon[j],
      [cx, cy] = polygon[i];
    const dx = cx - ax,
      dy = cy - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    if ((x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2 <= Math.max(1e-10, padding * padding))
      return true;
    if (ay > y !== cy > y && x < ((cx - ax) * (y - ay)) / (cy - ay) + ax) inside = !inside;
  }
  return inside;
}
export function lotTextColor(color: string) {
  const rgb = color
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((channel) => parseInt(channel, 16));
  return rgb?.length === 3 && rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 145
    ? '#132d46'
    : '#ffffff';
}
export const PLAN_LOTS: Record<string, Lot[]> = Object.fromEntries(
  PLAN_GEOMETRY.map((plan) => [plan.id, []]),
);
function box(
  plan: string,
  code: string | number,
  x: number,
  y: number,
  width: number,
  height: number,
  area?: number,
) {
  PLAN_LOTS[plan].push([code, x, y, width, height, area]);
}
// Rows/columns retain source order, including descending and paired numbering.
function row(
  plan: string,
  codes: (string | number)[],
  x: number,
  y: number,
  widths: number | number[],
  height: number,
  area?: number,
) {
  codes.forEach((code, index) => {
    const width = typeof widths === 'number' ? widths : widths[index];
    box(plan, code, x, y, width, height, area);
    x += width;
  });
}
function column(
  plan: string,
  codes: (string | number)[],
  x: number,
  y: number,
  width: number,
  heights: number | number[],
  area?: number,
) {
  codes.forEach((code, index) => {
    const height = typeof heights === 'number' ? heights : heights[index];
    box(plan, code, x, y, width, height, area);
    y += height;
  });
}

const rl = 'red-lower';
row(rl, [9, 8, 7, 6, 5], 21, 138, [65, 65, 65, 49, 65], 34);
row(rl, [4, 3, 2, 1], 364, 138, [65, 49, 65, 65], 34);
column(rl, [10, 11], 21, 204, 33, 49, 13.5);
column(rl, ['49A', '49B'], 87, 204, 65, 32.5);
column(rl, ['49D', '49C'], 152, 204, 33, 32.5);
column(rl, [48, 47], 185, 204, 65, 32.5, 18);
box(rl, 46, 250, 204, 65, 65, 36);
row(rl, [45, 43, 41], 315, 204, 65, 32.5, 18);
row(rl, [44, 42], 315, 236.5, 65, 32.5, 18);
row(rl, ['40A', '40B'], 445, 236.5, 32.5, 32.5);
box(rl, 39, 510, 204, 93, 65, 51);
column(rl, [38, 37], 510, 269, 93, 81, 63.75);
row(rl, [12, 13, 14, 15, 16], 21, 302, [98, 87, 98, 87, 85], 97);
column(rl, [17, 18], 21, 400, 33, [65, 33]);
box(rl, 27, 87, 432, 65, 65, 36);
row(rl, [28, 30, 32], 152, 432, [65, 33, 65], 32.5);
row(rl, [29, 31, 33], 152, 464.5, [65, 33, 65], 32.5);
row(rl, [34, 35, 36], 315, 432, [119, 76, 93], 65);
row(rl, [19, 20, 21, 22, 23, 24, 25, 26], 21, 531, [65, 65, 65, 65, 65, 65, 65, 127], 65);
box(rl, 'R1', 657, 240, 110, 64, 63);
box(rl, 'R2', 648, 499, 115, 65, 63);

const ru = 'red-upper';
row(ru, [68, 69, 70, 71, 72], 28, 169, [66, 66, 50, 66, 66], 35);
row(ru, [73, 74, 75, 76], 376, 169, [66, 50, 66, 66], 35);
column(ru, [67, 66], 28, 236, 34, 49, 13.5);
box(ru, 77, 94, 236, 67, 67, 36);
column(ru, [78, 79], 161, 236, 33, 33.5, 9);
row(ru, [81, 83, 85, 87, 89], 194, 236, 66.4, 33.5, 18);
row(ru, [80, 82, 84, 86, 88], 194, 269.5, 66.4, 33.5, 18);
column(ru, [90, 91, 92, '93A', '93B'], 526, 236, 94, [67, 66, 67, 61, 33]);
row(ru, [61, 62, 63, 64, 65], 28, 335, [100, 89, 88, 88, 100], 94);
column(ru, [60, 59], 28, 439, 34, 49, 13.5);
box(ru, 106, 94, 462, 67, 68, 36);
column(ru, [104, 105], 161, 462, 33, 34, 9);
row(ru, [102, 100, 98, 96, 94], 194, 462, [66.4, 66.4, 33.2, 99.6, 66.4], 34);
row(ru, [103, 101, 99, 97, 95], 194, 496, 66.4, 34, 18);
row(
  ru,
  [58, 57, '56B', '56A', 55, 54, 53, 52, 51, 50],
  28,
  562,
  [66, 83, 33, 33, 66, 66, 66, 66, 66, 66],
  34,
);
column(ru, [107, 108, 109], 660, 272, 68, [73, 55, 110]);
box(ru, 110, 729, 512, 63, 88, 46.4);

const yl = 'yellow-lower';
row(yl, [86, 85, 84, 83], 210, 164, 35, 42, 9);
box(yl, 69, 350, 164, 69, 81, 42);
row(yl, [68, 67], 419, 164, [69, 53], 42);
box(yl, '53B', 592, 164, 35, 37);
box(yl, '53A', 592, 201, 35, 44);
box(yl, '53C', 627, 164, 34, 81);
// The photographed plan actually prints 49 twice. Preserve its printed label
// with distinct physical IDs instead of silently substituting directory code 51.
row(yl, [52, '49-ref', 50], 661, 164, 35, 42, 9);
row(yl, [49, 48, 47, 46], 766, 164, [35, 34, 35, 34], 42);
column(yl, [1, 2, 3, 4], 210, 234, 104, [88, 58, 57, 69]);
box(yl, 5, 174, 506, 104, 71, 54);
box(yl, 6, 278, 506, 36, 71, 18);
column(yl, [82, 81, 80, 79, 78, 77], 350, 245, 35, 35, 9);
column(yl, [70, 71, 72, 73, 74, 75], 385, 245, 34, 35, 9);
box(yl, 76, 350, 455, 69, 51, 27);
box(yl, 14, 454, 234, 104, 88, 67.5);
row(yl, [13, 15], 454, 322, 52, 68, 27);
box(yl, 12, 454, 390, 104, 82, 63);
row(yl, [11, 16], 454, 472, 52, 105, 40.5);
column(yl, [66, 65, 64, 63, 62, 61], 592, 245, 35, 35, 9);
column(yl, [54, 55, 56, 57, 58, 59], 627, 245, 34, 35, 9);
box(yl, 60, 592, 455, 69, 51, 27);
box(yl, 28, 696, 234, 70, 58, 30);
column(yl, [27, 26, 25, 24, 23, 22], 696, 292, 35, 35, 9);
column(yl, [29, 30, 31, 32, 33, 34], 731, 292, 35, 35, 9);
box(yl, 21, 696, 502, 70, 75, 39);
column(yl, [44, 43], 800, 234, 70, 52, 27);
box(yl, 42, 800, 338, 104, 70, 54);
row(yl, [41, 40], 800, 408, 52, 47, 19.12);
row(yl, [39, 38], 800, 455, 52, 47, 19.12);
box(yl, 45, 905, 228, 33, 69, 18);
row(yl, [7, 8, 9, 10], 314, 542, 35, 35, 9);
row(yl, [17, 18, 19, 20], 558, 542, [35, 35, 34, 34], 35, 9);
row(yl, [35, 36, 37], 766, 542, [35, 34, 69], 35);
box(yl, 'A1', 38, 273, 135, 63, 62);
box(yl, 'A2', 37, 495, 35, 70, 22);
column(yl, ['A3', 'A4', 'A5'], 139, 496, 35, [35, 35, 20]);
box(yl, 'A6', 36, 565, 35, 64, 15.82);

const yu = 'yellow-upper';
row(yu, [92, 93, 94, 95], 226, 165, 29, 30, 6.25);
box(yu, 96, 342, 165, 76, 64, 41.25);
row(yu, [106, 107, 108], 430, 165, 29, 30, 6.25);
box(yu, 109, 555, 165, 76, 64, 41.25);
row(yu, [119, 120, 121, 122], 644, 165, [32, 29, 29, 35], 30);
box(yu, 123, 769, 165, 70, 64, 33);
row(yu, [139, 140], 839, 165, [29, 46], 30);
column(yu, [91, '90A', '90B', 89, 88, 87], 184, 229, 29, [47, 29, 29, 58, 58, 59]);
column(yu, [203, 202, 201, 200, 199, 198], 249, 229, 58, [58, 57, 58, 58, 47, 71]);
column(yu, [97, 98, 99, 100], 342, 229, 44, 58, 18.75);
column(yu, [105, 104, 103, 102], 386, 229, 44, 58, 18.75);
box(yu, 101, 342, 461, 88, 47, 30);
box(yu, 184, 463, 229, 58, 47, 20);
column(yu, [185, 186, 187, 188, 189, 190, 191, 192], 463, 276, 29, 29, 6.25);
column(yu, [183, 182, 181, 180, 179, 178, 177, 176], 492, 276, 29, 29, 6.25);
box(yu, 175, 463, 508, 58, 61, 27.5);
column(yu, [110, 111, 112, 113], 555, 229, 44, 58, 18.75);
column(yu, [118, 117, 116, 115], 599, 229, 45, 58, 18.75);
box(yu, 114, 555, 461, 89, 47, 30);
box(yu, 161, 677, 229, 58, 47, 20);
column(yu, [162, 163, 164, 165, 166, 167, 168, 169], 677, 276, 29, 29, 6.25);
column(yu, [160, 159, 158, 157, 156, 155, 154, 153], 706, 276, 29, 29, 6.25);
box(yu, 152, 677, 508, 58, 61, 27.5);
column(yu, [124, 125, 126, 127, 128, 129, 130], 769, 229, 35, 35, 9);
column(yu, [138, 137, 136, 135, 134, 133, 132], 804, 229, 35, 35, 9);
box(yu, 131, 769, 474, 70, 35, 18);
column(yu, [143, 144, 145, 146, 147], 874, 234, 41, [83, 58, 58, 58, 83]);
box(yu, 141, 919, 541, 29, 29, 7.5);
row(yu, [205, 204], 135, 541, 57, 29, 11.88);
row(yu, [197, 196, 195, 194, 193], 307, 541, [35, 29, 29, 29, 34], 29);
row(yu, [174, 173, 172, 171, 170], 521, 541, [34, 29, 29, 29, 35], 29);
row(yu, [151, 150, 149, 148], 735, 541, [34, 35, 35, 35], 29, 7.5);
box(yu, 'P14', 44, 184, 121, 160, 125);
column(yu, ['P6', 'P5', 'P4', 'P3', 'P2', 'P1'], 44, 344, 24, 35, 6);
column(yu, ['P7', 'P8', 'P9', 'P10', 'P11'], 152, 362, 28, 29, 6.25);
box(yu, 'P14-A', 950, 271, 143, 242, 257.67);
box(yu, 'P14-B', 950, 513, 143, 43, 49.26);
box(yu, 'A8', 978, 568, 57, 24, 15);

const gu = 'green-upper';
column(gu, [5, 4, 3], 99, 285, 84, [81, 54, 55]);
column(gu, [2, 1], 17, 475, 84, 57, 24);
row(gu, [6, 7], 230, 199, 42, 44, 9);
box(gu, 8, 314, 208, 82, 83, 36);
row(gu, [14, 15, 16, 17, 18, 19], 396, 220, 28, 40, 6);
box(gu, 20, 564, 227, 39, 85, 18);
box(gu, 'CDT', 765, 249, 84, 125);
box(gu, 33, 849, 249, 42, 82, 18);
box(gu, 32, 849, 331, 42, 43, 9);
box(gu, 'V5', 891, 261, 207, 313);
column(gu, [67, 68, 69, 70], 230, 285, 41, 41, 9);
row(gu, [9, 13], 314, 291, 41, 41, 9);
row(gu, [10, 12], 314, 332, 41, 42, 9);
box(gu, 11, 314, 374, 82, 34, 15);
row(gu, [79, 80], 438, 305, 41, 61, 13.5);
row(gu, [78, 81], 438, 366, 41, 42, 9);
row(gu, [77, 82], 438, 408, 41, 41, 9);
box(gu, 21, 561, 312, 41, 42, 9);
row(gu, [22, 23], 561, 354, 41, 54, 12);
column(gu, [90, 91, 92], 726, 327, 41, [40, 41, 41], 9);
box(gu, 31, 808, 374, 82, 34, 15);
row(gu, [71, 72, 73, 74, 75, 76, 83], 230, 449, 41.4, 43, 9);
row(gu, [84, 85, 86], 520, 449, 82.5, 43, 18);
row(gu, [93, 94, 95], 767.5, 449, [41.2, 41.2, 41.1], 43, 9);
row(
  gu,
  [66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50],
  189,
  533,
  702 / 17,
  41,
  9,
);

const en = 'entrance';
box(en, 1, 210, 450, 200, 200);
box(en, 2, 140, 645, 65, 45);
box(en, 3, 140, 470, 35, 100);
box(en, 4, 430, 465, 60, 90);
box(en, 5, 140, 265, 35, 75);
box(en, 6, 140, 194, 35, 71);
box(en, 7, 350, 200, 140, 210);
box(en, 8, 190, 190, 175, 95);
box(en, 9, 430, 580, 50, 80);

const fc = 'food-court';
box(fc, 'G-1', 77, 284, 65, 65, 36);
box(fc, 'G-2', 142, 294, 64, 64, 36);
column(fc, ['G-5', 'G-4', 'G-3'], 210, 209, 32, [49, 55, 55], 15);
box(fc, 'G-6', 252, 213, 48, 32, 15);
box(fc, 'G-7', 393, 235, 49, 33, 15);
column(fc, ['G-8', 'G-9', 'G-10'], 447, 247, 32, 52, 15);
box(fc, 'G-23', 57, 406, 31, 32, 9);
box(fc, 'G-24', 447, 427, 32, 32, 9);
box(fc, 'G-22', 300, 338, 78, 63, 30);
box(fc, 'G-21', 277.5, 539, 74, 59, 30);
column(fc, ['G-11', 'G-12', 'G-13'], 447, 499, 32, [32, 51, 51]);
box(fc, 'G-14', 427, 633, 52, 56);
box(fc, 'G-20', 34, 507, 34, 50, 15);
box(fc, 'G-19', 107, 527, 61, 32, 18);
box(fc, 'G-18', 163, 574, 36, 52, 15);
row(fc, ['G-17', 'G-16'], 156, 657, 54, 32, 15);
box(fc, 'G-15', 370, 657, 56, 32, 15);

// Visual keys transcribed from the photographed operating plan. Colors identify
// physical areas; they do not assert a category, tenant, price or availability.
function detail(plan: string, codes: string, value: LotDetail) {
  const target = (PLAN_LOT_DETAILS[plan] ??= {});
  for (const code of codes.split(' ')) target[code] = { ...target[code], ...value };
}
const gold = '#d6c85b',
  blue = '#7f9bbd',
  orange = '#c69772',
  green = '#a7b38c',
  grey = '#b4b2ae',
  red = '#c88376';
detail(rl, '1 3 4 5 7 8 28 29 32 33 35 41 42 43 44 45 47 48 49A 49B', { color: gold });
detail(rl, '2 6 10 11 18 30 31 40A 40B 49C 49D', { color: red });
detail(rl, '9 17 19 20 21 22 23 24 25 26 27 34 36 39 46', { color: grey });
detail(rl, '12 14', { color: blue });
detail(rl, '13 15 16 37 38', { color: orange });
detail(rl, 'R1 R2', { color: '#baad6b' });
detail(
  ru,
  '50 51 52 53 54 55 69 70 72 73 75 76 80 81 82 83 84 85 86 87 88 89 94 95 97 99 100 101 102 103',
  { color: gold },
);
detail(ru, '56A 56B 59 60 66 67 71 74 78 79 98 104 105', { color: red });
detail(ru, '57 58 68 93B 96', { color: grey });
detail(ru, '61 65 90 91', { color: blue });
detail(ru, '62 63 64 109', { color: orange });
detail(ru, '77 92 93A 106 108', { color: green });
detail(ru, '107 110', { color: '#baad6b' });
detail(yl, '1 12', { color: grey });
detail(yl, '2 3 4 5 6 21 28 42 43 44 45 53A 60 69 76', { color: green });
detail(
  yl,
  '7 8 9 10 17 18 19 20 22 23 24 25 26 27 29 30 31 32 33 34 35 36 46 47 48 49 49-ref 50 52 54 55 56 57 58 59 61 62 63 64 65 66 77 78 79 80 81 82 83 84 85 86',
  { color: orange },
);
detail(yl, '11 14 53B 53C 67', { color: grey });
detail(yl, '13 15 16 37 68', { color: gold });
detail(yl, '38 39 40 41', { color: blue });
detail(yl, 'A1 A2 A3 A4 A5 A6', { color: '#cfbc86' });
detail(yl, '49-ref', {
  printedCode: '49',
  note: 'El plano fotografiado imprime 49 en dos ubicaciones. Este rótulo no confirma el código 51 del directorio.',
});
detail(
  yu,
  '87 88 89 90A 90B 91 92 93 94 95 106 107 108 119 120 121 122 139 140 148 149 150 151 153 154 155 156 157 158 159 160 162 163 164 165 166 167 168 169 170 171 172 173 174 183 185 186 187 188 189 190 191 192 193 194 195 196 197 204 205',
  { color: gold },
);
detail(yu, '97 98 99 100 102 103 104 105 110 111 112 113 115 116 117 118 P14-A P14-B', {
  color: blue,
});
detail(yu, '96 109 124 125 126 127 128 129 130', { color: orange });
detail(yu, '101 114 123 131 132 133 134 135 136 137 138 141 144 145 146 152 175 184 198', {
  color: grey,
});
detail(yu, '143 147 199 200 201 202 203', { color: green });
detail(yu, 'P14 P1 P2 P3 P4 P5 P6 P7 P8 P9 P10 P11 A8', { color: '#cfbc86' });
detail(gu, '1 2 22 23', { color: '#ceb084' });
detail(gu, '3 4 20 33 79 80 84 85 86', { color: grey });
detail(gu, '5 8', { color: red });
detail(
  gu,
  '6 7 9 10 12 13 14 15 16 17 18 19 21 32 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 81 82 83 90 91 92 93 94 95',
  { color: gold },
);
detail(gu, '11 31', { color: '#78a6c8' });
detail(gu, 'CDT', {
  color: '#c75e62',
  label: 'CDT',
  labelAt: [807, 268],
  footprint: [
    [765, 249],
    [849, 249],
    [849, 374],
    [807, 374],
    [807, 288],
    [765, 288],
  ],
});
detail(gu, 'V5', {
  color: '#bd99bd',
  label: 'Sector V5',
  footprint: [
    [891, 261],
    [1098, 270],
    [1098, 574],
    [891, 574],
  ],
});
for (const lot of PLAN_LOTS[fc])
  detail(fc, String(lot[0]), { printedCode: String(lot[0]).replace('G-', ''), color: gold });
detail(fc, 'G-1 G-2', { color: '#b89983' });
detail(fc, 'G-11 G-21 G-22 G-23 G-24', { color: '#9dab72' });
detail(fc, 'G-14', {
  color: '#7a9dc4',
  footprint: [
    [447, 633],
    [479, 633],
    [479, 689],
    [427, 689],
    [427, 656],
    [447, 656],
  ],
});
for (const code of ['G-21', 'G-22']) {
  const [, x, y, w, h] = PLAN_LOTS[fc].find(([id]) => id === code)!;
  detail(fc, code, {
    footprint: [
      [x + w / 4, y],
      [x + (w * 3) / 4, y],
      [x + w, y + h / 2],
      [x + (w * 3) / 4, y + h],
      [x + w / 4, y + h],
      [x, y + h / 2],
    ],
  });
}
detail(en, '2 3 4 5 9', { color: gold });
detail(en, '1', {
  color: '#8498bf',
  label: 'Domo decorado',
  footprint: Array.from(
    { length: 24 },
    (_, i) =>
      [310 + 100 * Math.cos((i * Math.PI) / 12), 550 + 100 * Math.sin((i * Math.PI) / 12)] as [
        number,
        number,
      ],
  ),
});
detail(en, '7', {
  color: grey,
  label: 'Juegos extremos',
  footprint: [
    [365, 200],
    [490, 220],
    [450, 410],
    [350, 390],
  ],
});
detail(en, '8', {
  color: grey,
  label: 'Escenario principal',
  footprint: [
    [190, 285],
    [196, 250],
    [214, 220],
    [245, 198],
    [277, 190],
    [309, 198],
    [340, 220],
    [358, 250],
    [365, 285],
  ],
});

// Table clusters are furniture, not booths or extra commercial spaces.
detail(en, '2', { label: 'Boletería' });
detail(en, '6', { label: 'Enfermería', color: '#cdd2dc' });
const tableCenters = [
  [270, 274],
  [310, 274],
  [350, 274],
  [390, 280],
  [270, 306],
  [310, 306],
  [390, 310],
  [270, 340],
  [410, 340],
  [270, 375],
  [410, 375],
  ...[400, 435, 470].flatMap((y) => [120, 160, 200, 240].map((x) => [x, y])),
  ...[435, 470].flatMap((y) => [290, 330, 370, 410].map((x) => [x, y])),
  [260, 520],
  [300, 510],
  [340, 510],
  [380, 525],
  [250, 555],
  [380, 555],
  [250, 590],
  [380, 590],
  [260, 630],
  [300, 630],
  [340, 630],
  [380, 630],
];
for (const [x, y] of tableCenters) {
  PLAN_GEOMETRY.find((plan) => plan.id === fc)!.structures.push({
    path: `M${x - 5} ${y - 5}h10v10h-10Z M${x - 2} ${y - 9}h4v3h-4Z M${x - 2} ${y + 6}h4v3h-4Z M${x - 9} ${y - 2}h3v4h-3Z M${x + 6} ${y - 2}h3v4h-3Z`,
  });
}
