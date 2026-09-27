import { useId } from 'react';
import { buildRug, type Motif, type Palette } from '@/lib/kilim';

export type KilimView = 'full' | 'corner' | 'weave';

interface Props {
  palette: Palette;
  motif: Motif;
  /** Width over length of the piece. */
  ratio: number;
  fringe?: boolean;
  seed?: number;
  view?: KilimView;
  /** Accessible description. Omit for decorative use. */
  label?: string;
  className?: string;
}

function cleanId(raw: string) {
  return `k${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/** A flat-weave rug drawn as SVG, at the proportions of the chosen size. */
export default function KilimPattern({
  palette,
  motif,
  ratio,
  fringe = true,
  seed = 1,
  view = 'full',
  label,
  className,
}: Props) {
  const id = cleanId(useId());
  const { W, H, F, defs, body } = buildRug({ palette, motif, ratio, fringe, seed }, id);

  let viewBox: string;
  let preserve = 'xMidYMid meet';
  if (view === 'corner') {
    viewBox = `-1.5 ${-F - 1} 24 30`;
    preserve = 'xMinYMin slice';
  } else if (view === 'weave') {
    const w = 14;
    const h = 17.5;
    viewBox = `${(W - w) / 2} ${Math.round(H * 0.5 - h / 2)} ${w} ${h}`;
    preserve = 'xMidYMid slice';
  } else {
    viewBox = `0 ${-F} ${W} ${H + F * 2}`;
  }

  const a11y = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const, focusable: 'false' as const };

  return (
    <svg
      className={className}
      viewBox={viewBox}
      preserveAspectRatio={preserve}
      xmlns="http://www.w3.org/2000/svg"
      {...a11y}
    >
      <defs>
        {defs}
        {view === 'weave' && (
          <pattern id={`${id}-p`} width={1} height={1 / 3} patternUnits="userSpaceOnUse">
            <rect y={0.3} width={1} height={0.035} fill="#000" opacity={0.14} />
            <rect width={0.5} height={1 / 3} fill="#fff" opacity={0.05} />
          </pattern>
        )}
      </defs>
      {body}
      {view === 'weave' && <rect width={W} height={H} fill={`url(#${id}-p)`} />}
    </svg>
  );
}
