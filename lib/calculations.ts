import type { CompSale } from "./types";

/** Non-numeric weights (free-text labels like "Listing") contribute 0 to the calculation. */
export function numericWeight(comp: CompSale): number {
  return typeof comp.weight === "number" && isFinite(comp.weight) ? comp.weight : 0;
}

export function sumWeights(comps: CompSale[]): number {
  return comps.reduce((sum, c) => sum + numericWeight(c), 0);
}

export function contribution(comp: CompSale, totalWeight: number): number {
  if (totalWeight === 0) return 0;
  return comp.salePrice * (numericWeight(comp) / totalWeight);
}

export function weightedAverage(comps: CompSale[]): number {
  const total = sumWeights(comps);
  if (total === 0) return 0;
  return comps.reduce((sum, c) => sum + contribution(c, total), 0);
}
