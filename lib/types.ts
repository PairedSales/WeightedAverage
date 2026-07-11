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
/** How a comp's weight is visualized in the grid: cell shading or a pie icon next to the value. */
export type WeightIndicatorStyle = "shading" | "pie";

export interface AppState {
  comps: CompSale[];
  decimals: DecimalPrecision;
  layout: LayoutMode;
  title: string;
  showTitle: boolean;
  weightDisplayFormat: WeightDisplayFormat;
  theme: GridThemeId;
  weightIndicator: WeightIndicatorStyle;
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
