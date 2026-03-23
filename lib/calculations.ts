import type { CompSale } from "./types";

export function sumWeights(comps: CompSale[]): number {
  return comps.reduce((sum, c) => sum + c.weight, 0);
}

export function contribution(comp: CompSale, totalWeight: number): number {
  if (totalWeight === 0) return 0;
  return comp.salePrice * (comp.weight / totalWeight);
}

export function weightedAverage(comps: CompSale[]): number {
  const total = sumWeights(comps);
  if (total === 0) return 0;
  return comps.reduce((sum, c) => sum + contribution(c, total), 0);
}
