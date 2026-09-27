import { useId } from 'react';
import { buildRug, type Motif, type Palette } from '@/lib/kilim';

interface Props {
  palette: Palette;
  motif: Motif;
  ratio: number;
  seed?: number;
  label?: string;
  className?: string;
}

/** The piece folded into a stack, as it arrives. Drawn on a 400 x 500 stage. */
export default function FoldedKilim({ palette, motif, ratio, seed = 1, label, className }: Props) {
  const id = `f${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { W, H, F, defs, body } = buildRug({ palette, motif, ratio, fringe: true, seed }, id);
  const sym = `${id}-rug`;

  const left = 58;
  const width = 284;
  const slab = 20;
  const layers = 4;
  const base = 392;
  const topY = base - slab * layers;
  const depth = 150;
  const skew = 46;
  // Slices of the rug that show on each folded edge, top to bottom.
  const slices = [0.18, 0.46, 0.7, 0.9];
  const sliceH = (W * slab) / width;

  const a11y = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const, focusable: 'false' as const };

  return (
    <svg className={className} viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" {...a11y}>
      <defs>
        {defs}
        <symbol id={sym} viewBox={`0 ${-F} ${W} ${H + F * 2}`}>
          {body}
        </symbol>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.14} />
          <stop offset="0.35" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.38} />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={0.16} />
          <stop offset="1" stopColor="#fff" stopOpacity={0.06} />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop offset="0" stopColor="#2a211b" stopOpacity={0.32} />
          <stop offset="1" stopColor="#2a211b" stopOpacity={0} />
        </radialGradient>
      </defs>

      <ellipse cx={218} cy={base + 6} rx={200} ry={26} fill={`url(#${id}-shadow)`} />

      {slices.map((s, i) => {
        const y = topY + i * slab;
        const shift = [0, 4, -3, 2][i];
        const vy = Math.round(H * s);
        return (
          <g key={i}>
            <svg
              x={left + shift}
              y={y}
              width={width}
              height={slab}
              viewBox={`0 ${vy} ${W} ${sliceH}`}
              preserveAspectRatio="none"
            >
              <use href={`#${sym}`} x={0} y={-F} width={W} height={H + F * 2} />
            </svg>
            <rect x={left + shift} y={y} width={width} height={slab} rx={3} fill={`url(#${id}-edge)`} />
          </g>
        );
      })}

      <g transform={`matrix(1 0 ${-skew / depth} 1 ${left + skew} ${topY - depth})`}>
        <svg width={width} height={depth} viewBox={`0 1 ${W} ${(W * depth * 1.8) / width}`} preserveAspectRatio="none">
          <use href={`#${sym}`} x={0} y={-F} width={W} height={H + F * 2} />
        </svg>
        <rect width={width} height={depth} fill={`url(#${id}-top)`} />
      </g>
    </svg>
  );
}
