import type { GridThemeId } from "./types";

/**
 * Visual theme for the spreadsheet grid. Every field is a complete, literal
 * Tailwind class string (never composed at runtime) so the v4 scanner can
 * pick the arbitrary-value classes up from this file.
 *
 * Only chrome colors (header band, borders, tint fills) vary by theme —
 * data text stays dark-on-white in every theme so exported grids remain
 * highly readable when pasted into appraisal reports.
 */
export interface GridTheme {
  id: GridThemeId;
  name: string;
  /** Header cells (comp labels / column titles). Text is always white. */
  headerBg: string;
  /** The "Result" header cell in the horizontal layout — one step lighter. */
  headerAccentBg: string;
  /** Border color for every bordered cell. */
  borderColor: string;
  /** Row-label cells in the horizontal layout (Sale Price / Weight / Contribution). */
  labelBg: string;
  /** Hover tint on editable cells / rows. */
  hoverBg: string;
  /** The result column's non-total cells in the horizontal layout. */
  resultColBg: string;
  /** Weighted-average total cells. */
  footerBg: string;
  footerText: string;
  /** Emphasized border on the final result cell in the horizontal layout. */
  resultBorder: string;
  /** RGB triple (e.g. "0, 0, 0") used by WeightBar's rgba() shading. */
  weightBarRGB: string;
  /** Raw hex colors for the theme-picker swatch (inline styles, not Tailwind). */
  swatch: { header: string; body: string };
}

export const GRID_THEMES: Record<GridThemeId, GridTheme> = {
  /** The original black-and-white document theme — must match the pre-theme styling exactly. */
  classic: {
    id: "classic",
    name: "Classic",
    headerBg: "bg-neutral-800",
    headerAccentBg: "bg-neutral-700",
    borderColor: "border-neutral-300",
    labelBg: "bg-slate-50",
    hoverBg: "hover:bg-slate-50",
    resultColBg: "bg-slate-50/60",
    footerBg: "bg-slate-100",
    footerText: "text-slate-900",
    resultBorder: "border-2 border-neutral-400",
    weightBarRGB: "0, 0, 0",
    swatch: { header: "#262626", body: "#f1f5f9" },
  },
  navy: {
    id: "navy",
    name: "Executive Navy",
    headerBg: "bg-[#1F3A5F]",
    headerAccentBg: "bg-[#2E4F7A]",
    borderColor: "border-[#C2CCD9]",
    labelBg: "bg-[#EEF2F7]",
    hoverBg: "hover:bg-[#F4F7FB]",
    resultColBg: "bg-[#EEF2F7]/60",
    footerBg: "bg-[#DEE7F0]",
    footerText: "text-[#16283F]",
    resultBorder: "border-2 border-[#8FA3BC]",
    weightBarRGB: "31, 58, 95",
    swatch: { header: "#1F3A5F", body: "#DEE7F0" },
  },
  evergreen: {
    id: "evergreen",
    name: "Evergreen",
    headerBg: "bg-[#1E4636]",
    headerAccentBg: "bg-[#2C5C48]",
    borderColor: "border-[#C5D0C9]",
    labelBg: "bg-[#EFF4F0]",
    hoverBg: "hover:bg-[#F4F8F5]",
    resultColBg: "bg-[#EFF4F0]/60",
    footerBg: "bg-[#E0EAE3]",
    footerText: "text-[#132E23]",
    resultBorder: "border-2 border-[#93AA9C]",
    weightBarRGB: "30, 70, 54",
    swatch: { header: "#1E4636", body: "#E0EAE3" },
  },
  heritage: {
    id: "heritage",
    name: "Heritage",
    headerBg: "bg-[#5C2333]",
    headerAccentBg: "bg-[#733142]",
    borderColor: "border-[#D5C9C2]",
    labelBg: "bg-[#F6F1EE]",
    hoverBg: "hover:bg-[#FAF6F4]",
    resultColBg: "bg-[#F6F1EE]/60",
    footerBg: "bg-[#ECE1DB]",
    footerText: "text-[#401A26]",
    resultBorder: "border-2 border-[#B39A93]",
    weightBarRGB: "92, 35, 51",
    swatch: { header: "#5C2333", body: "#ECE1DB" },
  },
};

export const GRID_THEME_LIST: GridTheme[] = [
  GRID_THEMES.classic,
  GRID_THEMES.navy,
  GRID_THEMES.evergreen,
  GRID_THEMES.heritage,
];

export function getGridTheme(id: GridThemeId | undefined): GridTheme {
  return (id && GRID_THEMES[id]) || GRID_THEMES.classic;
}
