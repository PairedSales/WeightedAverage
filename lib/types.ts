export interface CompSale {
  id: string;
  label: string;
  salePrice: number;
  /** Numeric weight (%) or a free-text label (e.g. "Listing") for comps that shouldn't factor into the calculation. */
  weight: number | string;
  gla: number;
}

export type DecimalPrecision = 0 | 1 | 2;
export type LayoutMode = "vertical" | "horizontal";
export type WeightDisplayFormat = "decimal" | "fraction";

export interface AppState {
  comps: CompSale[];
  decimals: DecimalPrecision;
  layout: LayoutMode;
  title: string;
  showTitle: boolean;
  subjectGla: number;
  weightDisplayFormat: WeightDisplayFormat;
}

export interface Template {
  id: string;
  name: string;
  state: AppState;
  createdAt: number;
}
