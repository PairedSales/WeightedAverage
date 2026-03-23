export interface CompSale {
  id: string;
  label: string;
  salePrice: number;
  weight: number;
}

export type DecimalPrecision = 0 | 1 | 2;
export type LayoutMode = "vertical" | "horizontal";

export interface AppState {
  comps: CompSale[];
  decimals: DecimalPrecision;
  layout: LayoutMode;
  title: string;
}

export interface Template {
  id: string;
  name: string;
  state: AppState;
  createdAt: number;
}
