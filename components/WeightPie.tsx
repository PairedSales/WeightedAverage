"use client";

interface WeightPieProps {
  /** Numeric weights of every comp in grid order (coerce via numericWeight before passing). */
  segments: number[];
  /** Index into `segments` of the comp this icon belongs to — its cumulative wedge gets the accent fill. */
  index: number;
  /** RGB triple for the accent color, e.g. "0, 0, 0" (see GridTheme.weightBarRGB). */
  colorRGB?: string;
}

/* Rendered on a generous viewBox for crisp arcs, downscaled by width/height. */
const VB = 40;
const CENTER = VB / 2;
const RADIUS = 18;

/**
 * A point on the circle at cumulative fraction `f` (0–1), measured from the
 * 6 o'clock position (bottom-center) and progressing clockwise.
 */
function point(f: number): [number, number] {
  const angle = Math.PI / 2 + 2 * Math.PI * f; // 90° = bottom; increasing = clockwise (y-down)
  return [CENTER + RADIUS * Math.cos(angle), CENTER + RADIUS * Math.sin(angle)];
}

function wedgePath(startFrac: number, endFrac: number): string {
  const [x0, y0] = point(startFrac);
  const [x1, y1] = point(endFrac);
  const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1} Z`;
}

/**
 * Compact pie indicator showing the weights as one cumulative 0–100% scale
 * starting at 6 o'clock and sweeping clockwise. Each comp owns a sequential
 * wedge (Sale 1 = 0→w1, Sale 2 = w1→w1+w2, …). Every row renders the full set
 * of divisions but highlights only its own wedge in the accent color, leaving
 * the rest muted — so the complete circle is always drawn and, across all rows,
 * the highlights account for the entire 100%.
 */
export default function WeightPie({
  segments,
  index,
  colorRGB = "0, 0, 0",
}: WeightPieProps) {
  const accent = `rgb(${colorRGB})`;
  const muted = `rgba(${colorRGB}, 0.13)`;
  const ring = `rgba(${colorRGB}, 0.30)`;
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
      width={20}
      height={20}
      viewBox={`0 0 ${VB} ${VB}`}
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Muted base disc — guarantees a complete circle even with 0/partial weights. */}
      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill={muted} />

      {/* Inactive wedges first, then the active wedge on top so it always reads cleanly. */}
      {wedges.map((w, i) =>
        w.active ? null : w.full ? (
          <circle key={i} cx={CENTER} cy={CENTER} r={RADIUS} fill={muted} stroke="#fff" strokeWidth={1.25} />
        ) : (
          <path key={i} d={w.path} fill={muted} stroke="#fff" strokeWidth={1.25} strokeLinejoin="round" />
        )
      )}
      {wedges.map((w, i) =>
        !w.active ? null : w.full ? (
          <circle key={i} cx={CENTER} cy={CENTER} r={RADIUS} fill={accent} />
        ) : (
          <path key={i} d={w.path} fill={accent} stroke="#fff" strokeWidth={1.25} strokeLinejoin="round" />
        )
      )}

      {/* Crisp outer ring for definition. */}
      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={ring} strokeWidth={1} />
    </svg>
  );
}
