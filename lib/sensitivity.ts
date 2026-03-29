import type { CompSale } from "./types";

export function adjustedSalePrice(
  salePrice: number,
  subjectGla: number,
  compGla: number,
  ratePerSf: number
): number {
  return salePrice + (subjectGla - compGla) * ratePerSf;
}

/** Comps used for range: positive sale price, positive comp GLA, positive subject GLA. */
export function participatingCompIds(comps: CompSale[], subjectGla: number): string[] {
  if (subjectGla <= 0) return [];
  return comps.filter((c) => c.salePrice > 0 && c.gla > 0).map((c) => c.id);
}

export function rangeForRate(
  comps: CompSale[],
  subjectGla: number,
  ratePerSf: number
): { range: number; pricesById: Record<string, number>; participatingIds: string[] } {
  const participatingIds = participatingCompIds(comps, subjectGla);
  const pricesById: Record<string, number> = {};
  const adjusted: number[] = [];
  for (const c of comps) {
    if (!participatingIds.includes(c.id)) continue;
    const p = adjustedSalePrice(c.salePrice, subjectGla, c.gla, ratePerSf);
    pricesById[c.id] = p;
    adjusted.push(p);
  }
  if (adjusted.length < 2) {
    return { range: 0, pricesById, participatingIds };
  }
  const lo = Math.min(...adjusted);
  const hi = Math.max(...adjusted);
  return { range: hi - lo, pricesById, participatingIds };
}

export interface GlaSensitivitySweepOptions {
  min: number;
  max: number;
  step: number;
}

export interface GlaSensitivityResult {
  bestRate: number | null;
  minRange: number | null;
  adjustedById: Record<string, number>;
}

/**
 * Finds trial $/SF rate that minimizes max(adjusted) − min(adjusted) over participating comps.
 * Ties: prefer smallest |rate|, then smallest rate.
 */
export function findBestGlaRatePerSf(
  comps: CompSale[],
  subjectGla: number,
  opts: GlaSensitivitySweepOptions
): GlaSensitivityResult {
  const { min, max, step } = opts;
  if (step <= 0 || !isFinite(min) || !isFinite(max) || max < min) {
    return { bestRate: null, minRange: null, adjustedById: {} };
  }
  if (participatingCompIds(comps, subjectGla).length < 2) {
    return { bestRate: null, minRange: null, adjustedById: {} };
  }

  let bestRate: number | null = null;
  let bestRange = Infinity;
  let bestAdjusted: Record<string, number> = {};

  for (let i = 0; ; i++) {
    const r = min + i * step;
    if (r > max + 1e-9) break;
    const { range, pricesById } = rangeForRate(comps, subjectGla, r);
    if (bestRate === null || range < bestRange - 1e-9) {
      bestRange = range;
      bestRate = r;
      bestAdjusted = { ...pricesById };
      continue;
    }
    if (Math.abs(range - bestRange) <= 1e-9) {
      const absR = Math.abs(r);
      const absBest = Math.abs(bestRate);
      if (absR < absBest - 1e-9 || (Math.abs(absR - absBest) <= 1e-9 && r < bestRate)) {
        bestRate = r;
        bestAdjusted = { ...pricesById };
      }
    }
  }

  return {
    bestRate,
    minRange: bestRate === null ? null : bestRange,
    adjustedById: bestAdjusted,
  };
}
