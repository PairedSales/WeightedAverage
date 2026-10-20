import type { CSSProperties } from "react";
import type { GridThemeId } from "./types";

/**
 * Color palette for the spreadsheet grid. The grid reads these as `--t-*`
 * CSS variables (see `gridThemeStyle`); the active page skin decides how the
 * grid's cells use them (`.g-*` classes in app/globals.css), so every theme
 * works with every skin.
 */
export interface GridTheme {
  id: GridThemeId;
  name: string;
  /** Header cells (comp labels / column titles). */
  head: string;
  /** The "Result" header cell in the horizontal layout — one step lighter. */
  headAccent: string;
  /** Cell borders. */
  line: string;
  /** Row-label cells; also the base of the result column's tint. */
  label: string;
  /** Hover tint on editable cells / rows. */
  hover: string;
  /** Weighted-average total cells. */
  totalBg: string;
  totalInk: string;
  /** Emphasized border on the final result cell in the horizontal layout. */
  emph: string;
  /** RGB triple (e.g. "0, 0, 0") used by the weight visualizations' rgba() shading. */
  weightBarRGB: string;
  /** Raw hex colors for the theme-picker swatch. */
  swatch: { header: string; body: string };
}

export const GRID_THEMES: Record<GridThemeId, GridTheme> = {
  /** The original black-and-white document theme. */
  classic: {
    id: "classic",
    name: "Classic",
    head: "#262626",
    headAccent: "#404040",
    line: "#d4d4d4",
    label: "#f8fafc",
    hover: "#f8fafc",
    totalBg: "#f1f5f9",
    totalInk: "#0f172a",
    emph: "#a3a3a3",
    weightBarRGB: "0, 0, 0",
    swatch: { header: "#262626", body: "#f1f5f9" },
  },
  navy: {
    id: "navy",
    name: "Executive Navy",
    head: "#1F3A5F",
    headAccent: "#2E4F7A",
    line: "#C2CCD9",
    label: "#EEF2F7",
    hover: "#F4F7FB",
    totalBg: "#DEE7F0",
    totalInk: "#16283F",
    emph: "#8FA3BC",
    weightBarRGB: "31, 58, 95",
    swatch: { header: "#1F3A5F", body: "#DEE7F0" },
  },
  evergreen: {
    id: "evergreen",
    name: "Evergreen",
    head: "#1E4636",
    headAccent: "#2C5C48",
    line: "#C5D0C9",
    label: "#EFF4F0",
    hover: "#F4F8F5",
    totalBg: "#E0EAE3",
    totalInk: "#132E23",
    emph: "#93AA9C",
    weightBarRGB: "30, 70, 54",
    swatch: { header: "#1E4636", body: "#E0EAE3" },
  },
  heritage: {
    id: "heritage",
    name: "Heritage",
    head: "#5C2333",
    headAccent: "#733142",
    line: "#D5C9C2",
    label: "#F6F1EE",
    hover: "#FAF6F4",
    totalBg: "#ECE1DB",
    totalInk: "#401A26",
    emph: "#B39A93",
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

/** Inline style that hands a theme's palette to the grid as `--t-*` variables. */
export function gridThemeStyle(theme: GridTheme): CSSProperties {
  return {
    "--t-head": theme.head,
    "--t-head-accent": theme.headAccent,
    "--t-line": theme.line,
    "--t-label": theme.label,
    "--t-hover": theme.hover,
    "--t-total-bg": theme.totalBg,
    "--t-total-ink": theme.totalInk,
    "--t-emph": theme.emph,
  } as CSSProperties;
}
