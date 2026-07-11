"use client";

interface WeightPieProps {
  /** Numeric weights of every comp in grid order (coerce via numericWeight before passing). */
  segments: number[];
  /** Index into `segments` of the comp this icon belongs to — its slice gets the accent fill. */
  index: number;
  /** RGB triple for the accent color, e.g. "0, 0, 0" (see GridTheme.weightBarRGB). */
  colorRGB?: string;
}

const SIZE = 16;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 0.75;

function wedgePath(startFrac: number, endFrac: number): string {
  const a0 = 2 * Math.PI * startFrac - Math.PI / 2;
  const a1 = 2 * Math.PI * endFrac - Math.PI / 2;
  const x0 = CENTER + RADIUS * Math.cos(a0);
  const y0 = CENTER + RADIUS * Math.sin(a0);
  const x1 = CENTER + RADIUS * Math.cos(a1);
  const y1 = CENTER + RADIUS * Math.sin(a1);
  const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}

/**
 * Compact pie icon showing every comp's weight as a slice, with only this
 * comp's slice highlighted. The full circle is always drawn (muted base disc
 * covers any unweighted remainder), so the pie never renders partially.
 */
export default function WeightPie({
  segments,
  index,
  colorRGB = "0, 0, 0",
}: WeightPieProps) {
  const accent = `rgb(${colorRGB})`;
  const muted = `rgba(${colorRGB}, 0.16)`;
  const total = segments.reduce((sum, w) => sum + Math.max(0, w), 0);

  const wedges: { path?: string; full?: boolean; active: boolean }[] = [];
  if (total > 0) {
    let cursor = 0;
    segments.forEach((w, i) => {
      const frac = Math.max(0, w) / total;
      if (frac <= 0) return;
      if (frac >= 0.9995) {
        wedges.push({ full: true, active: i === index });
      } else {
        wedges.push({ path: wedgePath(cursor, cursor + frac), active: i === index });
      }
      cursor += frac;
    });
  }

  return (
    <svg
      width={13}
      height={13}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill={muted}
        stroke={`rgba(${colorRGB}, 0.35)`}
        strokeWidth={0.5}
      />
      {wedges.map((w, i) =>
        w.full ? (
          <circle
            key={i}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill={w.active ? accent : muted}
          />
        ) : (
          <path
            key={i}
            d={w.path}
            fill={w.active ? accent : muted}
            stroke="#fff"
            strokeWidth={0.75}
            strokeLinejoin="round"
          />
        )
      )}
    </svg>
  );
}
