/**
 * Page skins restyle the app chrome (top bar, toolbar, options, history)
 * by swapping the `--ui-*` design tokens defined in app/globals.css. The
 * active skin is the `data-skin` attribute on <html>.
 *
 * Skins never touch the exported grid: the card around it pins its own
 * font and colors, and the grid's colors come from GridTheme (lib/themes.ts).
 *
 * The skin is a per-browser display preference, not document state, so it
 * lives in its own localStorage key instead of AppState (no undo, not saved
 * in templates or history).
 */
export const PAGE_SKINS = ["classic", "paper", "swiss", "soft", "midnight"] as const;
export type PageSkinId = (typeof PAGE_SKINS)[number];

export const SKIN_STORAGE_KEY = "wa-skin";

export interface PageSkin {
  id: PageSkinId;
  name: string;
  description: string;
  /** Raw colors for the picker's mini preview (inline styles, not Tailwind). */
  swatch: { page: string; bar: string; accent: string; line: string; radius: number };
}

export const PAGE_SKIN_LIST: PageSkin[] = [
  {
    id: "classic",
    name: "Classic",
    description: "The original black-and-white document look",
    swatch: { page: "#ffffff", bar: "#ffffff", accent: "#262626", line: "#d4d4d4", radius: 0 },
  },
  {
    id: "paper",
    name: "Paper",
    description: "Printed report: warm stock, serif small caps, hairline rules",
    swatch: { page: "#F3EFE6", bar: "#FBF8F1", accent: "#24324F", line: "#CFC5B2", radius: 0 },
  },
  {
    id: "swiss",
    name: "Swiss",
    description: "Bold grotesk, heavy black rules, one signal red",
    swatch: { page: "#F2F2F0", bar: "#ffffff", accent: "#E30613", line: "#0A0A0A", radius: 0 },
  },
  {
    id: "soft",
    name: "Soft",
    description: "Rounded cards, soft shadows, indigo accents",
    swatch: { page: "#EEF1F8", bar: "#ffffff", accent: "#4F46E5", line: "#E4E7EC", radius: 4 },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark desk with mono labels; the grid stays on white paper",
    swatch: { page: "#0B0F17", bar: "#121826", accent: "#F2B544", line: "#273145", radius: 3 },
  },
];

export function isPageSkin(value: unknown): value is PageSkinId {
  return typeof value === "string" && (PAGE_SKINS as readonly string[]).includes(value);
}

/**
 * Inline <head> script that applies the saved skin before first paint, so a
 * non-default skin doesn't flash the Classic background on load.
 */
export const SKIN_BOOT_SCRIPT = `try{var s=localStorage.getItem(${JSON.stringify(SKIN_STORAGE_KEY)});if(${JSON.stringify(PAGE_SKINS)}.indexOf(s)>-1)document.documentElement.setAttribute("data-skin",s)}catch(e){}`;
