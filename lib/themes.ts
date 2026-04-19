export interface ThemePreset {
  id: string;
  name: string;
  swatch: string;
  colors: Record<string, string>;
}

export const themePresets: ThemePreset[] = [
  {
    id: "blue",
    name: "Blue",
    swatch: "#3B82F6",
    colors: {
      "50": "#EFF6FF", "100": "#DBEAFE", "200": "#BFDBFE", "300": "#93C5FD",
      "400": "#60A5FA", "500": "#3B82F6", "600": "#2563EB", "700": "#1D4ED8",
      "800": "#1E40AF", "900": "#1E3A8A",
    },
  },
  {
    id: "indigo",
    name: "Indigo",
    swatch: "#6366F1",
    colors: {
      "50": "#EEF2FF", "100": "#E0E7FF", "200": "#C7D2FE", "300": "#A5B4FC",
      "400": "#818CF8", "500": "#6366F1", "600": "#4F46E5", "700": "#4338CA",
      "800": "#3730A3", "900": "#312E81",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    swatch: "#10B981",
    colors: {
      "50": "#ECFDF5", "100": "#D1FAE5", "200": "#A7F3D0", "300": "#6EE7B7",
      "400": "#34D399", "500": "#10B981", "600": "#059669", "700": "#047857",
      "800": "#065F46", "900": "#064E3B",
    },
  },
  {
    id: "rose",
    name: "Rose",
    swatch: "#F43F5E",
    colors: {
      "50": "#FFF1F2", "100": "#FFE4E6", "200": "#FECDD3", "300": "#FDA4AF",
      "400": "#FB7185", "500": "#F43F5E", "600": "#E11D48", "700": "#BE123C",
      "800": "#9F1239", "900": "#881337",
    },
  },
];

export interface ThemeState {
  mode: "light" | "dark" | "dracula";
  preset: string;
  customColor: string;
}

const THEME_KEY = "wa_theme";

const REMOVED_PRESET_ALIASES: Record<string, string> = {
  amber: "blue",
  violet: "indigo",
};

export function loadThemeState(): ThemeState {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.preset === "string") {
        const migrated =
          REMOVED_PRESET_ALIASES[parsed.preset] ?? parsed.preset;
        return {
          mode:
            parsed.mode === "dark" || parsed.mode === "dracula"
              ? parsed.mode
              : "light",
          preset: migrated,
          customColor:
            typeof parsed.customColor === "string"
              ? parsed.customColor
              : "#8B5CF6",
        };
      }
    }
  } catch { /* ignore */ }
  return { mode: "light", preset: "blue", customColor: "#8B5CF6" };
}

export function saveThemeState(state: ThemeState): void {
  localStorage.setItem(THEME_KEY, JSON.stringify(state));
}

export function applyThemeColors(colors: Record<string, string>): void {
  const root = document.documentElement;
  for (const [shade, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-accent-${shade}`, value);
  }
}

export function applyThemeMode(mode: ThemeState["mode"]): void {
  document.documentElement.setAttribute("data-theme-mode", mode);
}

export function getThemeColors(state: ThemeState): Record<string, string> {
  if (state.preset === "custom") {
    return generatePaletteFromHex(state.customColor);
  }
  const preset = themePresets.find((p) => p.id === state.preset);
  return preset?.colors ?? themePresets[0].colors;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generatePaletteFromHex(hex: string): Record<string, string> {
  const [h, s] = hexToHsl(hex);
  const shades: [string, number, number][] = [
    ["50",  Math.min(s * 0.6,  100), 97],
    ["100", Math.min(s * 0.7,  100), 93],
    ["200", Math.min(s * 0.8,  100), 86],
    ["300", Math.min(s * 0.9,  100), 76],
    ["400", Math.min(s * 0.95, 100), 64],
    ["500", Math.min(s,        100), 50],
    ["600", Math.min(s,        100), 43],
    ["700", Math.min(s * 0.95, 100), 35],
    ["800", Math.min(s * 0.9,  100), 27],
    ["900", Math.min(s * 0.85, 100), 20],
  ];

  const colors: Record<string, string> = {};
  for (const [shade, sat, light] of shades) {
    colors[shade] = hslToHex(h, sat, light);
  }
  return colors;
}
