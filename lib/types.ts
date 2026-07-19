export interface CompSale {
  id: string;
  label: string;
  salePrice: number;
  /** Numeric weight (%) or a free-text label (e.g. "Listing") for comps that shouldn't factor into the calculation. */
  weight: number | string;
}

export type DecimalPrecision = 0 | 1 | 2;
export type LayoutMode = "vertical" | "horizontal";
export type WeightDisplayFormat = "decimal" | "fraction";
export type GridThemeId = "classic" | "navy" | "evergreen" | "heritage";

/** How individual weights are visualized in the grid (see components/WeightViz.tsx). */
export const WEIGHT_VIZ_MODES = ["shade", "meter", "scale", "pie", "pie-classic", "pie-large", "bar", "bar-fill"] as const;
export type WeightVizMode = (typeof WEIGHT_VIZ_MODES)[number];

/** Which row "bar-fill" paints its segments across. */
export const WEIGHT_VIZ_ROWS = ["weight", "contribution"] as const;
export type WeightVizRow = (typeof WEIGHT_VIZ_ROWS)[number];

export interface AppState {
  comps: CompSale[];
  decimals: DecimalPrecision;
  layout: LayoutMode;
  title: string;
  showTitle: boolean;
  weightDisplayFormat: WeightDisplayFormat;
  theme: GridThemeId;
  weightViz: WeightVizMode;
  /** Also render the active weight viz in the result/total cells. */
  showResultViz: boolean;
  /** Row "bar-fill" renders its segments in (weight or contribution). */
  barFillRow: WeightVizRow;
}

export interface Template {
  id: string;
  name: string;
  state: AppState;
  createdAt: number;
}

/** A snapshot of app state taken automatically whenever the user copies the grid. */
export interface HistorySnapshot {
  id: string;
  state: AppState;
  /** Data URL (WebP, PNG fallback) of the exact grid image that was copied. */
  image: string;
  createdAt: number;
}
