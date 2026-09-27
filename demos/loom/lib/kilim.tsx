import type { ReactNode } from 'react';

/**
 * Flat-weave rug drawing. Everything is laid out on a grid of weave "cells"
 * (one cell is roughly a few rows of weft), so shapes step the way real
 * kilim motifs do. Shapes are drawn as single outlines, not stacks of rows,
 * so there are no hairline seams when the art is scaled.
 */

export type Motif = 'diamond' | 'lozenge' | 'chevron' | 'bands' | 'ralli';

export interface Palette {
  ground: string;
  motif: string;
  accent: string;
  light: string;
  border: string;
  fringe: string;
}

export interface RugSpec {
  palette: Palette;
  motif: Motif;
  /** Width over length. */
  ratio: number;
  fringe?: boolean;
  seed?: number;
}

export interface RugGeometry {
  W: number;
  H: number;
  /** Fringe length above and below the body, in cells. */
  F: number;
  defs: ReactNode;
  body: ReactNode;
}

const OUTER = 2;
const TEETH = 3;
const INSET = OUTER + TEETH + 1;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const odd = (n: number) => (n % 2 === 0 ? n + 1 : n);

/** Outline of a stepped diamond centred on cell (cx, cy). */
export function steppedPath(cx: number, cy: number, rx: number, ry: number): string {
  const right: string[] = [];
  const left: string[] = [];
  for (let dy = -ry; dy <= ry; dy++) {
    const half = ry === 0 ? rx : Math.round((rx * (ry - Math.abs(dy))) / ry);
    const y = cy + dy;
    const xr = cx + half + 1;
    const xl = cx - half;
    right.push(`${xr} ${y}`, `${xr} ${y + 1}`);
    left.unshift(`${xl} ${y + 1}`, `${xl} ${y}`);
  }
  return `M${[...right, ...left].join('L')}Z`;
}

/** Stepped right-angled triangle filling the upper-right half of an n x n square. */
function stairPath(x0: number, y0: number, n: number, flip: boolean): string {
  const pts: string[] = [];
  if (!flip) {
    pts.push(`${x0} ${y0}`, `${x0 + n} ${y0}`, `${x0 + n} ${y0 + n}`);
    for (let i = n - 1; i >= 0; i--) pts.push(`${x0 + i} ${y0 + i + 1}`, `${x0 + i} ${y0 + i}`);
  } else {
    pts.push(`${x0} ${y0}`);
    for (let i = 0; i < n; i++) pts.push(`${x0 + i + 1} ${y0 + i}`, `${x0 + i + 1} ${y0 + i + 1}`);
    pts.push(`${x0} ${y0 + n}`);
  }
  return `M${pts.join('L')}Z`;
}

/** A stepped zigzag stripe across a tile of width p. */
function zigzagPath(p: number, amp: number, y0: number, h: number): string {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let x = 0; x < p; x++) {
    const o = x < p / 2 ? Math.min(x, amp) : Math.min(p - 1 - x, amp);
    top.push(`${x} ${y0 + o}`, `${x + 1} ${y0 + o}`);
    bottom.unshift(`${x + 1} ${y0 + o + h}`, `${x} ${y0 + o + h}`);
  }
  return `M${[...top, ...bottom].join('L')}Z`;
}

export function rugSize(ratio: number) {
  const area = 5200;
  const W = odd(Math.max(29, Math.round(Math.sqrt(area * ratio))));
  const H = odd(Math.round(W / ratio));
  return { W, H };
}

export function buildRug(spec: RugSpec, id: string): RugGeometry {
  const { palette: c, motif, ratio } = spec;
  const rand = mulberry32(spec.seed ?? 1);
  const { W, H } = rugSize(ratio);
  const F = spec.fringe === false ? 0 : 5;

  const fx = INSET;
  const fy = INSET;
  const fw = W - INSET * 2;
  const fh = H - INSET * 2;
  const cx = fx + (fw - 1) / 2; // centre cell index (fw is odd)
  const cy = fy + (fh - 1) / 2;

  const ids = {
    teeth: `${id}-t`,
    field: `${id}-f`,
    weft: `${id}-w`,
    light: `${id}-l`,
    clip: `${id}-c`,
  };

  const defs: ReactNode[] = [];
  const field: ReactNode[] = [];

  defs.push(
    <pattern key="teeth" id={ids.teeth} width={6} height={TEETH} patternUnits="userSpaceOnUse">
      <rect width={6} height={TEETH} fill={c.light} />
      <path d="M0 0L5 0L5 1L4 1L4 2L3 2L3 3L2 3L2 2L1 2L1 1L0 1Z" fill={c.border} />
    </pattern>,
    <pattern key="weft" id={ids.weft} width={1} height={1} patternUnits="userSpaceOnUse">
      <rect x={0.55} width={0.45} height={1} fill="#000" opacity={0.09} />
      <rect width={0.14} height={1} fill="#fff" opacity={0.07} />
    </pattern>,
    <linearGradient key="light" id={ids.light} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity={0.08} />
      <stop offset="0.55" stopColor="#fff" stopOpacity={0} />
      <stop offset="1" stopColor="#000" stopOpacity={0.12} />
    </linearGradient>,
    <clipPath key="clip" id={ids.clip}>
      <rect x={fx} y={fy} width={fw} height={fh} />
    </clipPath>,
  );

  field.push(<rect key="g" x={fx} y={fy} width={fw} height={fh} fill={c.ground} />);

  if (motif === 'diamond') {
    const T = 12;
    // Put a diamond column on the centre line of the field.
    const ox = cx - T / 2;
    const oy = cy - T / 2;
    const at = (x: number, y: number, r: number) => steppedPath(x, y, r, r);
    const corners = [
      [0, 0],
      [T, 0],
      [0, T],
      [T, T],
    ];
    defs.push(
      <pattern key="field" id={ids.field} x={ox} y={oy} width={T} height={T} patternUnits="userSpaceOnUse">
        <path d={at(6, 6, 6)} fill={c.light} />
        <path d={at(6, 6, 5)} fill={c.motif} />
        <path d={at(6, 6, 3)} fill={c.light} />
        <path d={at(6, 6, 1)} fill={c.accent} />
        <path d={corners.map(([x, y]) => at(x, y, 3)).join('')} fill={c.accent} />
        <path d={corners.map(([x, y]) => at(x, y, 1)).join('')} fill={c.light} />
      </pattern>,
    );
    field.push(<rect key="m" x={fx} y={fy} width={fw} height={fh} fill={`url(#${ids.field})`} />);
  }

  if (motif === 'chevron') {
    const P = 12;
    const Q = 12;
    const stripes: [number, number, string][] = [
      [0, 2, c.light],
      [2, 3, c.motif],
      [5, 1, c.light],
      [6, 2, c.accent],
    ];
    const paths: ReactNode[] = [];
    stripes.forEach(([y0, h, fill], i) => {
      paths.push(
        <path key={i} d={zigzagPath(P, 5, y0, h) + zigzagPath(P, 5, y0 - Q, h)} fill={fill} />,
      );
    });
    defs.push(
      <pattern key="field" id={ids.field} x={cx + 0.5 - P / 2} y={fy} width={P} height={Q} patternUnits="userSpaceOnUse">
        {paths}
      </pattern>,
    );
    field.push(<rect key="m" x={fx} y={fy} width={fw} height={fh} fill={`url(#${ids.field})`} />);
  }

  if (motif === 'lozenge') {
    const wide = fw > 35;
    const Rx = Math.max(4, (fw - 1) / 2 - (wide ? 7 : 4));
    let Ry = Math.round(Rx * 0.8);
    const n = Math.max(1, Math.round(fh / (2 * Ry + 3)));
    Ry = Math.max(3, Math.min(Math.round(Rx * 1.2), Math.floor((fh / n - 3) / 2)));
    const pitch = fh / n;
    const rings: [number, string][] = [
      [0, c.light],
      [1, c.motif],
      [3, c.light],
      [4, c.accent],
      [6, c.ground],
      [8, c.motif],
      [10, c.light],
      [11, c.accent],
      [13, c.ground],
      [15, c.motif],
    ];
    // Paint ring by ring to preserve nesting.
    for (let i = 0; i < n; i++) {
      const ly = Math.round(fy + pitch * i + pitch / 2 - 0.5);
      rings.forEach(([k, fill], j) => {
        const rx = Rx - k;
        const ry = Ry - Math.round((k * Ry) / Rx);
        if (rx < 1 || ry < 1) return;
        field.push(<path key={`l${i}-${j}`} d={steppedPath(cx, ly, rx, ry)} fill={fill} />);
      });
    }
    // Hooks, chains and side diamonds, grouped by colour.
    const extras = new Map<string, string>();
    for (let i = 0; i < n; i++) {
      const ly = Math.round(fy + pitch * i + pitch / 2 - 0.5);
      for (const s of [-1, 1]) {
        const hx = s < 0 ? cx - Rx - 1 : cx + Rx + 1;
        const bar = s < 0 ? cx - Rx - 2 : cx + Rx + 2;
        extras.set(c.motif, (extras.get(c.motif) ?? '') + `M${hx} ${ly}h1v1h-1Z M${bar} ${ly - 1}h1v3h-1Z`);
      }
      if (i < n - 1) {
        extras.set(
          c.motif,
          (extras.get(c.motif) ?? '') + `M${cx} ${ly + Ry + 1}h1v${Math.ceil(pitch - 2 * Ry - 1)}h-1Z`,
        );
      }
    }
    if (wide) {
      let lightD = '';
      let accentD = '';
      for (let y = fy + 3; y <= fy + fh - 4; y += 6) {
        for (const x of [fx + 2, fx + fw - 3]) {
          lightD += steppedPath(x, y, 2, 2);
          accentD += steppedPath(x, y, 0, 0);
        }
      }
      field.push(<path key="sl" d={lightD} fill={c.light} />, <path key="sa" d={accentD} fill={c.accent} />);
    }
    extras.forEach((d, fill) => field.push(<path key={`x${fill}`} d={d} fill={fill} />));
  }

  if (motif === 'bands') {
    type Band = { h: number; fill?: string; kind?: 'dots' | 'teeth' };
    const seq: Band[] = [
      { h: 5, fill: c.ground },
      { h: 1, fill: c.light },
      { h: 2, fill: c.motif },
      { h: 1, fill: c.light },
      { h: 5, kind: 'dots' },
      { h: 1, fill: c.light },
      { h: 2, fill: c.motif },
      { h: 1, fill: c.light },
      { h: 6, fill: c.ground },
      { h: 1, fill: c.accent },
      { h: 2, fill: c.ground },
      { h: 1, fill: c.accent },
    ];
    const half = Math.floor(fh / 2);
    const rows: { y: number; h: number; band: Band }[] = [];
    let y = 0;
    let i = 0;
    while (y < half) {
      const band = seq[i % seq.length];
      const h = Math.min(band.h, half - y);
      rows.push({ y, h, band });
      y += h;
      i++;
    }
    const dotXs: number[] = [];
    for (let x = cx % 6; x < fw + fx; x += 6) if (x >= fx + 1 && x <= fx + fw - 2) dotXs.push(x);
    const draw = (top: number, r: { h: number; band: Band }, key: string) => {
      if (r.band.kind === 'dots') {
        field.push(<rect key={`${key}b`} x={fx} y={top} width={fw} height={r.h} fill={c.light} />);
        if (r.h === 5) {
          const my = top + 2;
          field.push(
            <path key={`${key}d`} d={dotXs.map((x) => steppedPath(x, my, 2, 2)).join('')} fill={c.motif} />,
            <path key={`${key}a`} d={dotXs.map((x) => steppedPath(x, my, 0, 0)).join('')} fill={c.accent} />,
          );
        }
      } else if (r.band.fill && r.band.fill !== c.ground) {
        field.push(<rect key={key} x={fx} y={top} width={fw} height={r.h} fill={r.band.fill} />);
      }
    };
    rows.forEach((r, k) => {
      draw(fy + r.y, r, `t${k}`);
      draw(fy + fh - r.y - r.h, r, `b${k}`);
    });
    // Centre row when the field has an odd height.
    if (fh % 2 === 1) {
      const last = rows[rows.length - 1];
      if (last.band.fill && last.band.fill !== c.ground) {
        field.push(<rect key="mid" x={fx} y={fy + half} width={fw} height={1} fill={last.band.fill} />);
      }
    }
  }

  if (motif === 'ralli') {
    const S = 10;
    const T = S * 2;
    const n = S - 1;
    defs.push(
      <pattern key="field" id={ids.field} x={cx + 0.5 - T / 2 - S / 2} y={cy + 0.5 - T / 2 - S / 2} width={T} height={T} patternUnits="userSpaceOnUse">
        <rect width={T} height={T} fill={c.border} />
        {/* A: ground with a light diamond */}
        <rect x={1} y={1} width={n} height={n} fill={c.ground} />
        <path d={steppedPath(5, 5, 3, 3)} fill={c.light} />
        <path d={steppedPath(5, 5, 1, 1)} fill={c.accent} />
        {/* B: light with a stepped triangle */}
        <rect x={S + 1} y={1} width={n} height={n} fill={c.light} />
        <path d={stairPath(S + 1, 1, n, false)} fill={c.ground} />
        {/* C: motif colour with a hollow diamond */}
        <rect x={1} y={S + 1} width={n} height={n} fill={c.light} />
        <path d={stairPath(1, S + 1, n, true)} fill={c.accent} />
        {/* D: ground with a small cross of diamonds */}
        <rect x={S + 1} y={S + 1} width={n} height={n} fill={c.ground} />
        <path d={steppedPath(S + 5, S + 5, 3, 3)} fill={c.light} />
        <path d={steppedPath(S + 5, S + 5, 2, 2)} fill={c.motif} />
        <path d={steppedPath(S + 5, S + 5, 0, 0)} fill={c.light} />
      </pattern>,
    );
    field.push(<rect key="m" x={fx} y={fy} width={fw} height={fh} fill={`url(#${ids.field})`} />);
  }

  // Abrash: the gentle tonal bands that come from dyeing wool in small lots.
  const abrash: ReactNode[] = [];
  const bands = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < bands; i++) {
    const h = 2 + Math.floor(rand() * 5);
    const y = fy + Math.floor(rand() * Math.max(1, fh - h));
    const dark = rand() > 0.4;
    abrash.push(
      <rect
        key={`a${i}`}
        x={fx}
        y={y}
        width={fw}
        height={h}
        fill={dark ? '#000' : '#fff'}
        opacity={dark ? 0.05 + rand() * 0.04 : 0.05}
      />,
    );
  }

  // Fringe: knotted bundles of warp threads at both short ends.
  let fringe: ReactNode = null;
  if (F > 0) {
    let threads = '';
    let knots = '';
    for (let g = 0; g * 2 + 1 < W; g++) {
      const x0 = 1 + g * 2;
      for (const [edge, dir] of [
        [-0.6, -1],
        [H + 0.6, 1],
      ] as const) {
        const len = F - 0.9 - rand() * 1.6;
        const sway = (rand() - 0.5) * 0.9;
        for (const k of [-1, 0, 1]) {
          const xs = x0 + k * 0.28;
          threads += `M${xs.toFixed(2)} ${edge}L${(xs + k * 0.35 + sway).toFixed(2)} ${(edge + dir * len).toFixed(2)}`;
        }
        const ky = edge + dir * 1.1;
        knots += `M${(x0 - 0.5).toFixed(2)} ${(ky - 0.35).toFixed(2)}h1v0.7h-1Z`;
      }
    }
    fringe = (
      <g>
        <path d={threads} stroke={c.fringe} strokeWidth={0.2} strokeLinecap="round" fill="none" />
        <path d={knots} fill={c.fringe} />
        <rect x={0} y={-0.8} width={W} height={0.8} fill={c.fringe} />
        <rect x={0} y={H} width={W} height={0.8} fill={c.fringe} />
        <rect x={0} y={-0.8} width={W} height={0.8} fill="#000" opacity={0.08} />
        <rect x={0} y={H} width={W} height={0.8} fill="#000" opacity={0.08} />
      </g>
    );
  }

  const teethFill = `url(#${ids.teeth})`;
  const sideLen = H - (OUTER + TEETH) * 2;
  const body = (
    <g>
      {fringe}
      <rect width={W} height={H} fill={c.border} />
      <g transform={`translate(${OUTER} ${OUTER})`}>
        <rect width={W - OUTER * 2} height={TEETH} fill={teethFill} />
      </g>
      <g transform={`translate(${OUTER} ${H - OUTER}) scale(1 -1)`}>
        <rect width={W - OUTER * 2} height={TEETH} fill={teethFill} />
      </g>
      <g transform={`translate(${OUTER} ${H - OUTER - TEETH}) rotate(-90)`}>
        <rect width={sideLen} height={TEETH} fill={teethFill} />
      </g>
      <g transform={`translate(${W - OUTER} ${OUTER + TEETH}) rotate(90)`}>
        <rect width={sideLen} height={TEETH} fill={teethFill} />
      </g>
      <rect x={INSET - 1} y={INSET - 1} width={fw + 2} height={fh + 2} fill={c.accent} />
      <g clipPath={`url(#${ids.clip})`}>
        {field}
        {abrash}
      </g>
      <rect width={W} height={H} fill={`url(#${ids.weft})`} />
      <rect width={W} height={H} fill={`url(#${ids.light})`} />
    </g>
  );

  return { W, H, F, defs, body };
}
