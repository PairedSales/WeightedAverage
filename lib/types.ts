export interface CompSale {
  id: string;
  label: string;
  salePrice: number;
  weight: number;
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
