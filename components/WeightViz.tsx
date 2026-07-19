"use client";

import type { CompSale, DecimalPrecision, WeightVizMode } from "@/lib/types";
import { numericWeight } from "@/lib/calculations";
import { formatPercent } from "@/lib/formatting";

/** Selector metadata for the Options drawer. */
export const WEIGHT_VIZ_OPTIONS: { id: WeightVizMode; label: string; title: string }[] = [
  { id: "shade", label: "Shade", title: "Shaded cells — fill deepens with weight" },
  { id: "meter", label: "Blocks", title: "Segmented meter — each block represents 10% weight" },
  { id: "scale", label: "Scale", title: "Marker on a 0–100% scale" },
  { id: "strip", label: "Strip", title: "Allocation strip — one band showing each comp's share of total weight" },
  { id: "rank", label: "Rank", title: "Rank badges — comps numbered by weight, heaviest emphasized" },
];

/**
 * Dense ranking of comps by numeric weight (ties share a rank, next distinct
 * weight gets the following rank). Zero and text weights are unranked.
 */
export function computeWeightRanks(comps: CompSale[]): Map<string, number> {
  const distinct = [...new Set(comps.map(numericWeight).filter((w) => w > 0))].sort((a, b) => b - a);
  const ranks = new Map<string, number>();
  for (const comp of comps) {
    const w = numericWeight(comp);
    if (w > 0) ranks.set(comp.id, distinct.indexOf(w) + 1);
  }
  return ranks;
}

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

/* ── Rank: ordinal badge in the weight cell ───────────────────────── */

export function RankChip({ rank, colorRGB }: { rank: number; colorRGB: string }) {
  const isTop = rank === 1;
  return (
    <span
      className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex h-4 min-w-4 items-center justify-center px-0.5 text-[9px] font-bold leading-none tabular-nums ${
        isTop ? "text-white" : "border border-neutral-300 bg-white text-slate-500"
      }`}
      style={isTop ? { backgroundColor: `rgb(${colorRGB})` } : undefined}
      aria-hidden="true"
    >
      {rank}
    </span>
  );
}

/* ── Strip: single 100% allocation band beneath the grid ──────────── */

export function AllocationStrip({
  comps,
  totalWeight,
  decimals,
  colorRGB,
  borderColor,
}: {
  comps: CompSale[];
  totalWeight: number;
  decimals: DecimalPrecision;
  colorRGB: string;
  borderColor: string;
}) {
  if (totalWeight <= 0) return null;
  const weighted = comps
    .map((comp, index) => ({ comp, index, share: (numericWeight(comp) / totalWeight) * 100 }))
    .filter((s) => s.share > 0);
  if (weighted.length === 0) return null;

  return (
    <div className="mt-1.5">
      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
        Weight Allocation
      </p>
      <div className={`flex h-5 w-full overflow-hidden border ${borderColor}`}>
        {weighted.map(({ comp, index, share }, i) => (
          <div
            key={comp.id}
            title={`${comp.label}: ${formatPercent(share, decimals)}`}
            className="relative flex items-center justify-center overflow-hidden border-r border-white/60 last:border-r-0 transition-all duration-300"
            style={{
              width: `${share}%`,
              backgroundColor: `rgba(${colorRGB}, ${i % 2 === 0 ? 0.8 : 0.55})`,
            }}
          >
            {share >= 12 ? (
              <span className="text-[9px] font-semibold text-white leading-none whitespace-nowrap">
                {index + 1} · {formatPercent(share, decimals)}
              </span>
            ) : share >= 5 ? (
              <span className="text-[9px] font-semibold text-white leading-none">{index + 1}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
