import { useId } from 'react';
import { buildRug, type Motif, type Palette } from '@/lib/kilim';

interface Props {
  palette: Palette;
  motif: Motif;
  seed?: number;
  className?: string;
}

/** An upright loom with a kilim half woven on its warps. Drawn on a 600 x 460 stage. */
export default function LoomArt({ palette, motif, seed = 1, className }: Props) {
  const id = `l${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { W, H, defs, body } = buildRug({ palette, motif, ratio: 0.8, fringe: false, seed }, id);

  const x0 = 150;
  const x1 = 450;
  const top = 58;
  const bottom = 404;
  const wovenTop = 238;
  const wovenH = bottom - wovenTop;
  const width = x1 - x0;
  const sliceH = (W * wovenH) / width;
  const warps = Array.from({ length: 49 }, (_, i) => x0 + 4 + (i * (width - 8)) / 48);

  return (
    <svg className={className} viewBox="0 0 600 460" aria-hidden="true" focusable="false">
      <defs>
        {defs}
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b4a31" />
          <stop offset="0.5" stopColor="#8a6443" />
          <stop offset="1" stopColor="#5c3f2a" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6443" />
          <stop offset="1" stopColor="#5c3f2a" />
        </linearGradient>
      </defs>

      {/* Uprights */}
      <rect x={112} y={20} width={22} height={430} rx={4} fill={`url(#${id}-wood)`} />
      <rect x={466} y={20} width={22} height={430} rx={4} fill={`url(#${id}-wood)`} />

      {/* Warp threads */}
      <path
        d={warps.map((x) => `M${x.toFixed(1)} ${top + 10}V${wovenTop}`).join('')}
        stroke="#efe3c8"
        strokeWidth={1.4}
      />

      {/* Shed stick holding alternate warps apart */}
      <rect x={128} y={150} width={344} height={8} rx={4} fill="#a47b52" />

      {/* The woven part: the lower half of the rug */}
      <svg x={x0} y={wovenTop} width={width} height={wovenH} viewBox={`0 ${H - sliceH} ${W} ${sliceH}`} preserveAspectRatio="none">
        {body}
      </svg>

      {/* Weft yarn trailing from the fell of the weave */}
      <path
        d={`M${x0 + 180} ${wovenTop + 1}C ${x0 + 200} ${wovenTop - 30}, ${x0 + 250} ${wovenTop - 20}, ${x0 + 262} ${wovenTop - 52}`}
        stroke={palette.motif}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx={x0 + 266} cy={wovenTop - 62} rx={15} ry={12} fill={palette.motif} />
      <path
        d={`M${x0 + 254} ${wovenTop - 68}q12 -6 24 2M${x0 + 252} ${wovenTop - 60}q14 -6 28 2`}
        stroke="#000"
        strokeOpacity={0.2}
        strokeWidth={1.4}
        fill="none"
      />

      {/* Beams */}
      <rect x={96} y={top - 8} width={408} height={20} rx={10} fill={`url(#${id}-beam)`} />
      <rect x={96} y={bottom} width={408} height={22} rx={11} fill={`url(#${id}-beam)`} />

      {/* Beater comb resting on the weave */}
      <g transform={`translate(${x0 + 40} ${wovenTop - 22}) rotate(-6)`}>
        <rect width={120} height={14} rx={5} fill="#a47b52" />
        <path
          d={Array.from({ length: 14 }, (_, i) => `M${8 + i * 8} 14v16`).join('')}
          stroke="#8a6443"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
