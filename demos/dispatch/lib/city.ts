import { createRng } from "./rng";

/**
 * A stylised Lahore: a slightly wavy street grid, a handful of curved
 * arterials, the river on the north-west edge and the canal running through
 * the middle. World units are metres. Everything is built once from a seed.
 */

export type Pt = { x: number; y: number };

export type Area = { name: string; x: number; y: number; node: number };
export type Hub = { area: string; node: number };
export type Park = { kind: "circle"; x: number; y: number; r: number } | { kind: "rect"; x: number; y: number; w: number; h: number };

export type City = {
  width: number;
  height: number;
  xs: Float64Array;
  ys: Float64Array;
  adj: number[][];
  /** Edges drawn as ordinary streets. */
  streets: [number, number][];
  /** Short links from arterials to the grid. */
  connectors: [number, number][];
  /** Arterials as node sequences, drawn as smooth polylines. */
  arterials: number[][];
  river: { line: Pt[]; half: number };
  canal: Pt[];
  parks: Park[];
  areas: Area[];
  hubs: Hub[];
  /** Nodes on the connected road network (couriers only use these). */
  main: number[];
};

export const AREA_NAMES = [
  "Model Town",
  "Gulberg III",
  "Johar Town",
  "DHA Phase 5",
  "Garden Town",
  "Cantt",
  "Township",
  "Bahria Town",
  "Faisal Town",
  "Iqbal Town",
  "Wapda Town",
  "Shadman",
] as const;

const AREA_POS: Record<(typeof AREA_NAMES)[number], Pt> = {
  Shadman: { x: 3500, y: 1250 },
  Cantt: { x: 6700, y: 1500 },
  "Gulberg III": { x: 4900, y: 2150 },
  "Garden Town": { x: 3900, y: 2850 },
  "Iqbal Town": { x: 2500, y: 2750 },
  "Faisal Town": { x: 3100, y: 3700 },
  "Model Town": { x: 4700, y: 3650 },
  "DHA Phase 5": { x: 7500, y: 3250 },
  "Johar Town": { x: 2000, y: 4050 },
  Township: { x: 3900, y: 4800 },
  "Wapda Town": { x: 1300, y: 4900 },
  "Bahria Town": { x: 1000, y: 5600 },
};

type Cubic = [Pt, Pt, Pt, Pt];

function cubicAt(c: Cubic, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x,
    y: a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y,
  };
}

/** Sample a cubic at roughly even spacing. */
function sampleCubic(c: Cubic, spacing: number): Pt[] {
  const fine: Pt[] = [];
  for (let i = 0; i <= 400; i++) fine.push(cubicAt(c, i / 400));
  const out: Pt[] = [fine[0]];
  let acc = 0;
  for (let i = 1; i < fine.length; i++) {
    acc += Math.hypot(fine[i].x - fine[i - 1].x, fine[i].y - fine[i - 1].y);
    if (acc >= spacing) {
      out.push(fine[i]);
      acc = 0;
    }
  }
  const last = fine[fine.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

function distToPolyline(p: Pt, line: Pt[]): number {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
    if (d < best) best = d;
  }
  return best;
}

const P = (x: number, y: number): Pt => ({ x, y });

export function buildCity(seed = 48213): City {
  const rng = createRng(seed);
  const width = 9000;
  const height = 6000;
  const spacing = 300;

  const river = { line: sampleCubic([P(3000, -200), P(2000, 900), P(900, 1500), P(-200, 2700)], 60), half: 210 };
  const canal = sampleCubic([P(2600, -200), P(3800, 1800), P(4300, 3600), P(6600, 6200)], 60);

  const xs: number[] = [];
  const ys: number[] = [];
  const addNode = (x: number, y: number) => {
    xs.push(x);
    ys.push(y);
    return xs.length - 1;
  };

  const edgeSet = new Set<string>();
  const streets: [number, number][] = [];
  const connectors: [number, number][] = [];
  const key = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const link = (a: number, b: number, list: [number, number][]) => {
    if (a === b) return;
    const k = key(a, b);
    if (edgeSet.has(k)) return;
    edgeSet.add(k);
    list.push([a, b]);
  };

  // Street grid, gently wavy so it doesn't read as graph paper.
  const cols = Math.floor(width / spacing) + 1;
  const rows = Math.floor(height / spacing) + 1;
  const grid: number[][] = [];
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      const x = i * spacing + 28 * Math.sin(j * 0.45 + i * 1.3);
      const y = j * spacing + 28 * Math.sin(i * 0.37 + j * 1.1);
      const p = { x, y };
      grid[i][j] = distToPolyline(p, river.line) < river.half + 70 ? -1 : addNode(x, y);
    }
  }
  const gridNodes: number[] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const n = grid[i][j];
      if (n < 0) continue;
      gridNodes.push(n);
      if (i + 1 < cols && grid[i + 1][j] >= 0 && rng.next() > 0.07) link(n, grid[i + 1][j], streets);
      if (j + 1 < rows && grid[i][j + 1] >= 0 && rng.next() > 0.07) link(n, grid[i][j + 1], streets);
    }
  }

  const nearestGrid = (p: Pt) => {
    let best = -1;
    let bd = Infinity;
    for (const n of gridNodes) {
      const d = (xs[n] - p.x) ** 2 + (ys[n] - p.y) ** 2;
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return { node: best, dist: Math.sqrt(bd) };
  };

  // Arterials: canal bank road, Ferozepur Road, Main Boulevard, the ring road and a river bridge.
  const arterialCurves: Cubic[] = [
    [P(2690, -200), P(3890, 1800), P(4390, 3600), P(6690, 6200)],
    [P(3950, -200), P(4350, 2000), P(3400, 4200), P(3750, 6200)],
    [P(2800, 1500), P(4200, 1850), P(5600, 2450), P(7700, 3350)],
    [P(-200, 4300), P(2500, 6250), P(6500, 5900), P(9200, 4000)],
    [P(1300, -200), P(1700, 900), P(2300, 1700), P(2900, 2300)],
    [P(-200, 3100), P(1500, 3050), P(2600, 2400), P(3600, 1150)],
    [P(5200, -200), P(5900, 1200), P(6400, 2400), P(9200, 2600)],
  ];
  const arterials: number[][] = [];
  for (const curve of arterialCurves) {
    const pts = sampleCubic(curve, 130).filter((p) => p.x > -150 && p.x < width + 150 && p.y > -150 && p.y < height + 150);
    const seq: number[] = [];
    pts.forEach((p, idx) => {
      const n = addNode(p.x, p.y);
      if (seq.length) link(seq[seq.length - 1], n, []);
      seq.push(n);
      if (idx % 3 === 1) {
        const near = nearestGrid(p);
        if (near.node >= 0 && near.dist < 200) link(n, near.node, connectors);
      }
    });
    arterials.push(seq);
  }

  const count = xs.length;
  const adj: number[][] = Array.from({ length: count }, () => []);
  for (const k of edgeSet) {
    const [a, b] = k.split(":").map(Number);
    adj[a].push(b);
    adj[b].push(a);
  }

  // Keep the largest connected component.
  const comp = new Int32Array(count).fill(-1);
  let bestComp = -1;
  let bestSize = 0;
  let c = 0;
  for (let s = 0; s < count; s++) {
    if (comp[s] >= 0 || adj[s].length === 0) continue;
    const stack = [s];
    comp[s] = c;
    let size = 0;
    while (stack.length) {
      const n = stack.pop()!;
      size++;
      for (const m of adj[n]) {
        if (comp[m] < 0) {
          comp[m] = c;
          stack.push(m);
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      bestComp = c;
    }
    c++;
  }
  const main: number[] = [];
  for (let n = 0; n < count; n++) if (comp[n] === bestComp) main.push(n);

  const nearestMain = (p: Pt) => {
    let best = main[0];
    let bd = Infinity;
    for (const n of main) {
      if (adj[n].length < 2) continue;
      const d = (xs[n] - p.x) ** 2 + (ys[n] - p.y) ** 2;
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  };

  const areas: Area[] = AREA_NAMES.map((name) => {
    const p = AREA_POS[name];
    return { name, x: p.x, y: p.y, node: nearestMain(p) };
  });
  const hubs: Hub[] = areas.map((a) => ({ area: a.name, node: nearestMain({ x: a.x + 260, y: a.y - 180 }) }));

  const parks: Park[] = [
    { kind: "circle", x: 4700, y: 3650, r: 230 },
    { kind: "rect", x: 3700, y: 1450, w: 520, h: 330 },
    { kind: "rect", x: 5500, y: 1300, w: 380, h: 520 },
    { kind: "rect", x: 1700, y: 4450, w: 300, h: 260 },
    { kind: "circle", x: 7200, y: 3900, r: 170 },
  ];

  return {
    width,
    height,
    xs: Float64Array.from(xs),
    ys: Float64Array.from(ys),
    adj,
    streets,
    connectors,
    arterials,
    river,
    canal,
    parks,
    areas,
    hubs,
    main,
  };
}

/** A* over the road graph. Returns node ids from `from` to `to` inclusive. */
export function findPath(city: City, from: number, to: number): number[] {
  if (from === to) return [from];
  const { xs, ys, adj } = city;
  const n = xs.length;
  const g = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heapN: number[] = [];
  const heapF: number[] = [];
  const h = (a: number) => Math.hypot(xs[a] - xs[to], ys[a] - ys[to]);
  const push = (node: number, f: number) => {
    heapN.push(node);
    heapF.push(f);
    let i = heapN.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heapF[p] <= heapF[i]) break;
      [heapN[p], heapN[i]] = [heapN[i], heapN[p]];
      [heapF[p], heapF[i]] = [heapF[i], heapF[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heapN[0];
    const lastN = heapN.pop()!;
    const lastF = heapF.pop()!;
    if (heapN.length) {
      heapN[0] = lastN;
      heapF[0] = lastF;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < heapN.length && heapF[l] < heapF[m]) m = l;
        if (r < heapN.length && heapF[r] < heapF[m]) m = r;
        if (m === i) break;
        [heapN[m], heapN[i]] = [heapN[i], heapN[m]];
        [heapF[m], heapF[i]] = [heapF[i], heapF[m]];
        i = m;
      }
    }
    return top;
  };
  g[from] = 0;
  push(from, h(from));
  while (heapN.length) {
    const cur = pop();
    if (cur === to) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    for (const nb of adj[cur]) {
      if (closed[nb]) continue;
      const cost = g[cur] + Math.hypot(xs[nb] - xs[cur], ys[nb] - ys[cur]);
      if (cost < g[nb]) {
        g[nb] = cost;
        prev[nb] = cur;
        push(nb, cost + h(nb));
      }
    }
  }
  if (prev[to] < 0) return [from];
  const path: number[] = [];
  for (let c = to; c >= 0; c = prev[c]) {
    path.push(c);
    if (c === from) break;
  }
  return path.reverse();
}

export function pathLength(city: City, path: number[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    len += Math.hypot(city.xs[path[i]] - city.xs[path[i - 1]], city.ys[path[i]] - city.ys[path[i - 1]]);
  }
  return len;
}
