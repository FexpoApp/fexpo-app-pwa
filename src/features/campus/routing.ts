import { PLAN_LOTS, type PlanGeometry } from '@/data/map-plans';
import type { PlanPosition } from './model';

// Orthogonal grid constrained to the published outline and booth-free aisles.
// These are orientation routes, not surveyed/accessibility or emergency routes.
function polygon(path: string): PlanPosition[] {
  const tokens = path.match(/[MLHVZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const points: PlanPosition[] = [];
  let x = 0,
    y = 0,
    i = 0,
    op = '';
  while (i < tokens.length) {
    if (/^[MLHVZ]$/.test(tokens[i])) op = tokens[i++];
    if (op === 'Z') break;
    if (op === 'M' || op === 'L') {
      x = Number(tokens[i++]);
      y = Number(tokens[i++]);
    } else if (op === 'H') x = Number(tokens[i++]);
    else if (op === 'V') y = Number(tokens[i++]);
    else break;
    if (!Number.isFinite(x + y)) break;
    points.push({ x, y });
    if (op === 'M') op = 'L';
  }
  return points;
}
function inside(p: PlanPosition, shape: PlanPosition[]) {
  let result = false;
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    const a = shape[i],
      b = shape[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      result = !result;
  }
  return result;
}
const grids = new Map<
  string,
  { nodes: PlanPosition[]; free: Uint8Array; cols: number; rows: number }
>();
function grid(plan: PlanGeometry) {
  const cached = grids.get(plan.id);
  if (cached) return cached;
  const [x, y, w, h] = plan.viewBox.split(' ').map(Number);
  const step = 6,
    cols = Math.ceil(w / step),
    rows = Math.ceil(h / step);
  const outline = polygon(plan.outline);
  const obstacles = plan.structures
    .filter((s) => /baños|mesas/i.test(s.label ?? ''))
    .map((s) => polygon(s.path));
  const lots = PLAN_LOTS[plan.id] ?? [];
  const nodes: PlanPosition[] = [],
    free = new Uint8Array(cols * rows);
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const p = { x: x + col * step + step / 2, y: y + row * step + step / 2 };
      const index = row * cols + col;
      nodes.push(p);
      free[index] = Number(
        inside(p, outline) &&
          !lots.some(
            ([, bx, by, bw, bh]) =>
              p.x >= bx - 2 && p.x <= bx + bw + 2 && p.y >= by - 2 && p.y <= by + bh + 2,
          ) &&
          !obstacles.some((shape) => inside(p, shape)),
      );
    }
  const value = { nodes, free, cols, rows };
  grids.set(plan.id, value);
  return value;
}
export function routeThroughAisles(
  plan: PlanGeometry,
  from: PlanPosition,
  to: PlanPosition,
): PlanPosition[] {
  const { nodes, free, cols } = grid(plan);
  const nearest = (point: PlanPosition) => {
    let best = -1,
      distance = Infinity;
    nodes.forEach((p, i) => {
      const d = (p.x - point.x) ** 2 + (p.y - point.y) ** 2;
      if (free[i] && d < distance) {
        distance = d;
        best = i;
      }
    });
    return best;
  };
  const start = nearest(from),
    end = nearest(to);
  if (start < 0 || end < 0) return [];
  const parent = new Int32Array(nodes.length).fill(-1),
    queue = [start];
  parent[start] = start;
  for (let q = 0; q < queue.length && parent[end] === -1; q++) {
    const at = queue[q],
      col = at % cols;
    for (const next of [col ? at - 1 : -1, col < cols - 1 ? at + 1 : -1, at - cols, at + cols]) {
      if (next >= 0 && next < nodes.length && free[next] && parent[next] === -1) {
        parent[next] = at;
        queue.push(next);
      }
    }
  }
  if (parent[end] === -1) return [];
  const path = [nodes[end]];
  for (let at = end; at !== start; ) {
    at = parent[at];
    path.push(nodes[at]);
  }
  path.reverse();
  return path.filter(
    (p, i) =>
      !i ||
      i === path.length - 1 ||
      (p.x - path[i - 1].x) * (path[i + 1].y - p.y) !==
        (p.y - path[i - 1].y) * (path[i + 1].x - p.x),
  );
}
