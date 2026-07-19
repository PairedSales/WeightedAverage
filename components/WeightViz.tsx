"use client";

import type { CompSale, DecimalPrecision, WeightVizMode } from "@/lib/types";
import { numericWeight } from "@/lib/calculations";
import { formatPercent } from "@/lib/formatting";

/** Selector metadata for the Options drawer. */
export const WEIGHT_VIZ_OPTIONS: { id: WeightVizMode; label: string; title: string }[] = [
  { id: "shade", label: "Shade", title: "Shaded cells — fill deepens with weight" },
  { id: "meter", label: "Blocks", title: "Segmented meter — each block represents 10% weight" },
  { id: "scale", label: "Scale", title: "Marker on a 0–100% scale" },
  { id: "pie", label: "Pie", title: "Mini pie — each cell highlights that comp's slice of the total weight" },
  { id: "pie-classic", label: "Pie Classic", title: "Classic pie — a filled wedge equal to the comp's weight %" },
];


/* ── Blocks: quantized tally meter (each block = 10 percentage points) ── */

function BlocksMeter({ pct, colorRGB }: { pct: number; colorRGB: string }) {
  const filled = `rgba(${colorRGB}, 0.8)`;
  const track = `rgba(${colorRGB}, 0.12)`;
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: 10 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, (pct - i * 10) / 10));
        return (
          <div
            key={i}
            className="h-[5px] flex-1 transition-all duration-300"
            style={{
              background:
                fill >= 1
                  ? filled
                  : fill <= 0
                    ? track
                    : `linear-gradient(to right, ${filled} ${fill * 100}%, ${track} ${fill * 100}%)`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Scale: marker positioned along a ticked 0–100% axis ──────────── */

function ScaleAxis({ pct, colorRGB }: { pct: number; colorRGB: string }) {
  return (
    <div className="relative h-[9px]">
      <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-300" />
      {[0, 25, 50, 75, 100].map((t) => (
        <div
          key={t}
          className="absolute top-1/2 -translate-y-1/2 w-px h-[7px] bg-neutral-300"
          style={{ left: t === 100 ? "calc(100% - 1px)" : `${t}%` }}
        />
      ))}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[6px] h-[6px] transition-all duration-300"
        style={{ left: `${pct}%`, backgroundColor: `rgb(${colorRGB})` }}
      />
    </div>
  );
}

/**
 * Per-cell strip rendered directly beneath the weight value for the
 * "meter" and "scale" modes. `hidden` keeps the row height stable for
 * text-weight comps (e.g. "Listing") without implying a measured zero.
 */
export function WeightCellViz({
  mode,
  pct,
  hidden = false,
  colorRGB,
}: {
  mode: "meter" | "scale";
  pct: number;
  hidden?: boolean;
  colorRGB: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={`px-2 pb-1.5 -mt-0.5 ${hidden ? "invisible" : ""}`} aria-hidden="true">
      {mode === "meter" ? (
        <BlocksMeter pct={clamped} colorRGB={colorRGB} />
      ) : (
        <ScaleAxis pct={clamped} colorRGB={colorRGB} />
      )}
    </div>
  );
}

/* ── Pie: mini pie in each cell, this comp's slice emphasized ─────── */

function polarPoint(cx: number, cy: number, r: number, frac: number): [number, number] {
  // frac 0 → 12 o'clock, clockwise.
  const rad = (frac * 360 - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function slicePath(cx: number, cy: number, r: number, startFrac: number, endFrac: number): string {
  const [x0, y0] = polarPoint(cx, cy, r, startFrac);
  const [x1, y1] = polarPoint(cx, cy, r, endFrac);
  const large = endFrac - startFrac > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

/**
 * Every cell draws the same full pie (all comps' slices, in table order from
 * 12 o'clock) with only this comp's slice filled solid — so each cell shows
 * its own slice of one shared pie.
 */
export function PieGlyph({
  comps,
  compId,
  totalWeight,
  colorRGB,
}: {
  comps: CompSale[];
  compId: string;
  totalWeight: number;
  colorRGB: string;
}) {
  const size = 18;
  const c = size / 2;
  const r = c - 0.5;

  let cum = 0;
  const slices = comps
    .map((comp) => {
      const frac = numericWeight(comp) / totalWeight;
      const start = cum;
      cum += frac;
      return { id: comp.id, start, end: cum, frac };
    })
    .filter((s) => s.frac > 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
      aria-hidden="true"
    >
      {slices.map((s) => {
        const emphasized = s.id === compId;
        const fill = emphasized ? `rgb(${colorRGB})` : `rgba(${colorRGB}, 0.15)`;
        return s.frac >= 0.9999 ? (
          <circle key={s.id} cx={c} cy={c} r={r} fill={fill} />
        ) : (
          <path key={s.id} d={slicePath(c, c, r, s.start, s.end)} fill={fill} stroke="white" strokeWidth="1" />
        );
      })}
      <circle cx={c} cy={c} r={r} fill="none" stroke={`rgba(${colorRGB}, 0.45)`} strokeWidth="1" />
    </svg>
  );
}

/* ── Pie Classic: Harvey-ball wedge equal to the comp's weight % ──── */

/**
 * The pre-redesign pie, cleaned up: a light track circle with one solid
 * wedge from 12 o'clock sized by the comp's own weight % (not its share
 * of total), so 20% always draws a fifth of the circle.
 */
export function PieClassicGlyph({ pct, colorRGB }: { pct: number; colorRGB: string }) {
  const size = 18;
  const c = size / 2;
  const r = c - 0.5;
  const frac = Math.max(0, Math.min(100, pct)) / 100;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
      aria-hidden="true"
    >
      <circle cx={c} cy={c} r={r} fill={`rgba(${colorRGB}, 0.12)`} />
      {frac >= 0.9999 ? (
        <circle cx={c} cy={c} r={r} fill={`rgb(${colorRGB})`} />
      ) : frac > 0 ? (
        <path d={slicePath(c, c, r, 0, frac)} fill={`rgb(${colorRGB})`} />
      ) : null}
      <circle cx={c} cy={c} r={r} fill="none" stroke={`rgba(${colorRGB}, 0.45)`} strokeWidth="1" />
    </svg>
  );
}

