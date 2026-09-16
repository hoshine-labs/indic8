/**
 * Indic8 Unified Dynamic Theme System
 * 
 * Supports dynamic theme switching across curated dark presets and dynamic Neutral Tailwind Accent themes:
 * "slate" | "gray" | "zinc" | "stone" | "taupe" | "mauve" | "mist" | "olive" | "neutral" | `neutral-${TailwindAccentColor}`
 */

export type TailwindAccentColor =
  | "white"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose";

export type NeutralDarkThemePreset = `neutral-${TailwindAccentColor}` | "neutral";

export type DarkThemePreset =
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone"
  | "taupe"
  | "mauve"
  | "mist"
  | "olive"
  | NeutralDarkThemePreset
  | (string & {});

export type LightThemePreset = "default";

/**
 * 💡 MASTER DEFAULT DARK THEME CONFIGURATION
 * Change this ONE single constant to instantly switch the active dark theme style across the whole app:
 * Examples: "neutral", "neutral-orange", "neutral-red", "neutral-lime", "neutral-blue", "stone", "zinc", etc.
 */
export const ACTIVE_DARK_THEME_KEYWORD: DarkThemePreset = "neutral-lime";
export const ACTIVE_LIGHT_THEME_KEYWORD: LightThemePreset = "default";

export interface ThemePresetOption {
  id: DarkThemePreset;
  label: string;
  sublabel: string;
  swatch: string; // Color preview dot
  category?: "curated" | "neutral";
}

export interface TailwindAccentDef {
  name: TailwindAccentColor;
  label: string;
  sublabel: string;
  primary: string;     // 500
  secondary: string;   // 600
  bright: string;      // 400
  glowRgba: string;    // glow rgba
}

/**
 * Full Tailwind Color Accent Spectrum
 */
export const TAILWIND_ACCENTS: Record<TailwindAccentColor, TailwindAccentDef> = {
  white: {
    name: "white",
    label: "White",
    sublabel: "Titanium White",
    primary: "#ffffff",
    secondary: "#e5e5e5",
    bright: "#ffffff",
    glowRgba: "rgba(255, 255, 255, 0.18)",
  },
  red: {
    name: "red",
    label: "Red",
    sublabel: "Crimson Red",
    primary: "#ef4444",
    secondary: "#dc2626",
    bright: "#f87171",
    glowRgba: "rgba(239, 68, 68, 0.22)",
  },
  orange: {
    name: "orange",
    label: "Orange",
    sublabel: "Tangerine Orange",
    primary: "#f97316",
    secondary: "#ea580c",
    bright: "#fb923c",
    glowRgba: "rgba(249, 115, 22, 0.22)",
  },
  amber: {
    name: "amber",
    label: "Amber",
    sublabel: "Warm Amber",
    primary: "#f59e0b",
    secondary: "#d97706",
    bright: "#fbbf24",
    glowRgba: "rgba(245, 158, 11, 0.22)",
  },
  yellow: {
    name: "yellow",
    label: "Yellow",
    sublabel: "Canary Yellow",
    primary: "#eab308",
    secondary: "#ca8a04",
    bright: "#facc15",
    glowRgba: "rgba(234, 179, 8, 0.22)",
  },
  lime: {
    name: "lime",
    label: "Lime",
    sublabel: "Electric Lime",
    primary: "#84cc16",
    secondary: "#65a30d",
    bright: "#a3e635",
    glowRgba: "rgba(132, 204, 22, 0.22)",
  },
  green: {
    name: "green",
    label: "Green",
    sublabel: "Vibrant Green",
    primary: "#22c55e",
    secondary: "#16a34a",
    bright: "#4ade80",
    glowRgba: "rgba(34, 197, 94, 0.22)",
  },
  emerald: {
    name: "emerald",
    label: "Emerald",
    sublabel: "Pure Emerald",
    primary: "#10b981",
    secondary: "#059669",
    bright: "#34d399",
    glowRgba: "rgba(16, 185, 129, 0.22)",
  },
  teal: {
    name: "teal",
    label: "Teal",
    sublabel: "Deep Teal",
    primary: "#14b8a6",
    secondary: "#0d9488",
    bright: "#2dd4bf",
    glowRgba: "rgba(20, 184, 166, 0.22)",
  },
  cyan: {
    name: "cyan",
    label: "Cyan",
    sublabel: "Bright Cyan",
    primary: "#06b6d4",
    secondary: "#0891b2",
    bright: "#22d3ee",
    glowRgba: "rgba(6, 182, 212, 0.22)",
  },
  sky: {
    name: "sky",
    label: "Sky",
    sublabel: "Vivid Sky",
    primary: "#0ea5e9",
    secondary: "#0284c7",
    bright: "#38bdf8",
    glowRgba: "rgba(14, 165, 233, 0.22)",
  },
  blue: {
    name: "blue",
    label: "Blue",
    sublabel: "Cobalt Blue",
    primary: "#3b82f6",
    secondary: "#2563eb",
    bright: "#60a5fa",
    glowRgba: "rgba(59, 130, 246, 0.22)",
  },
  indigo: {
    name: "indigo",
    label: "Indigo",
    sublabel: "Deep Indigo",
    primary: "#6366f1",
    secondary: "#4f46e5",
    bright: "#818cf8",
    glowRgba: "rgba(99, 102, 241, 0.22)",
  },
  violet: {
    name: "violet",
    label: "Violet",
    sublabel: "Ultra Violet",
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    bright: "#a78bfa",
    glowRgba: "rgba(139, 92, 246, 0.22)",
  },
  purple: {
    name: "purple",
    label: "Purple",
    sublabel: "Royal Purple",
    primary: "#a855f7",
    secondary: "#9333ea",
    bright: "#c084fc",
    glowRgba: "rgba(168, 85, 247, 0.22)",
  },
  fuchsia: {
    name: "fuchsia",
    label: "Fuchsia",
    sublabel: "Neon Fuchsia",
    primary: "#d946ef",
    secondary: "#c026d3",
    bright: "#e879f9",
    glowRgba: "rgba(217, 70, 239, 0.22)",
  },
  pink: {
    name: "pink",
    label: "Pink",
    sublabel: "Hot Pink",
    primary: "#ec4899",
    secondary: "#db2777",
    bright: "#f472b6",
    glowRgba: "rgba(236, 72, 153, 0.22)",
  },
  rose: {
    name: "rose",
    label: "Rose",
    sublabel: "Ruby Rose",
    primary: "#f43f5e",
    secondary: "#e11d48",
    bright: "#fb7185",
    glowRgba: "rgba(244, 63, 94, 0.22)",
  },
};

export const CURATED_DARK_THEME_OPTIONS: ThemePresetOption[] = [
  { id: "zinc", label: "Zinc", sublabel: "Electric Indigo", swatch: "#6366f1", category: "curated" },
  { id: "slate", label: "Slate", sublabel: "Sky Cobalt", swatch: "#0ea5e9", category: "curated" },
  { id: "gray", label: "Gray", sublabel: "Emerald Graphite", swatch: "#10b981", category: "curated" },
  { id: "stone", label: "Stone", sublabel: "Copper Orange", swatch: "#f97316", category: "curated" },
  { id: "taupe", label: "Taupe", sublabel: "Champagne Amber", swatch: "#e59b4c", category: "curated" },
  { id: "mauve", label: "Mauve", sublabel: "Velvet Orchid", swatch: "#a855f7", category: "curated" },
  { id: "mist", label: "Mist", sublabel: "Arctic Aqua", swatch: "#06b6d4", category: "curated" },
  { id: "olive", label: "Olive", sublabel: "Radiant Lime", swatch: "#84cc16", category: "curated" },
];

export const NEUTRAL_ACCENT_THEME_OPTIONS: ThemePresetOption[] = [
  { id: "neutral", label: "Neutral", sublabel: "Titanium White", swatch: "#ffffff", category: "neutral" },
  { id: "neutral-red", label: "Neutral Red", sublabel: "Crimson Red", swatch: "#ef4444", category: "neutral" },
  { id: "neutral-orange", label: "Neutral Orange", sublabel: "Tangerine Orange", swatch: "#f97316", category: "neutral" },
  { id: "neutral-amber", label: "Neutral Amber", sublabel: "Warm Amber", swatch: "#f59e0b", category: "neutral" },
  { id: "neutral-yellow", label: "Neutral Yellow", sublabel: "Canary Yellow", swatch: "#eab308", category: "neutral" },
  { id: "neutral-lime", label: "Neutral Lime", sublabel: "Electric Lime", swatch: "#84cc16", category: "neutral" },
  { id: "neutral-green", label: "Neutral Green", sublabel: "Vibrant Green", swatch: "#22c55e", category: "neutral" },
  { id: "neutral-emerald", label: "Neutral Emerald", sublabel: "Pure Emerald", swatch: "#10b981", category: "neutral" },
  { id: "neutral-teal", label: "Neutral Teal", sublabel: "Deep Teal", swatch: "#14b8a6", category: "neutral" },
  { id: "neutral-cyan", label: "Neutral Cyan", sublabel: "Bright Cyan", swatch: "#06b6d4", category: "neutral" },
  { id: "neutral-sky", label: "Neutral Sky", sublabel: "Vivid Sky", swatch: "#0ea5e9", category: "neutral" },
  { id: "neutral-blue", label: "Neutral Blue", sublabel: "Cobalt Blue", swatch: "#3b82f6", category: "neutral" },
  { id: "neutral-indigo", label: "Neutral Indigo", sublabel: "Deep Indigo", swatch: "#6366f1", category: "neutral" },
  { id: "neutral-violet", label: "Neutral Violet", sublabel: "Ultra Violet", swatch: "#8b5cf6", category: "neutral" },
  { id: "neutral-purple", label: "Neutral Purple", sublabel: "Royal Purple", swatch: "#a855f7", category: "neutral" },
  { id: "neutral-fuchsia", label: "Neutral Fuchsia", sublabel: "Neon Fuchsia", swatch: "#d946ef", category: "neutral" },
  { id: "neutral-pink", label: "Neutral Pink", sublabel: "Hot Pink", swatch: "#ec4899", category: "neutral" },
  { id: "neutral-rose", label: "Neutral Rose", sublabel: "Ruby Rose", swatch: "#f43f5e", category: "neutral" },
];

export const DARK_THEME_OPTIONS: ThemePresetOption[] = [
  ...NEUTRAL_ACCENT_THEME_OPTIONS,
  ...CURATED_DARK_THEME_OPTIONS,
];

export interface ThemeTokens {
  background: string;
  foreground: string;
  brand: {
    primary: string;
    secondary: string;
    muted: string;
    disabled: string;
    dark: string;
    darker: string;
    darkest: string;
  };
  surface: {
    canvas: string;
    sidebar: string;
    base: string;
    subtle: string;
    light: string;
    gray: string;
    ghost: string;
    tabActive: string;
    goldLight: string;
  };
  border: {
    default: string;
    slate: string;
    light: string;
    hover: string;
    muted: string;
    highlight: string;
    shadow: string;
    orangeLight: string;
  };
  accent: {
    primary: string;
    secondary: string;
    bright: string;
    glow: string;
    chartStroke: string;
    chartGradientStart: string;
    chartGradientEnd: string;
    chartGrid: string;
    chartAxis: string;
  };
  status: {
    success: string;
    successLight: string;
    danger: string;
    warning: string;
    premium: string;
    premiumLight: string;
    orangeDark: string;
    orangeLightBg: string;
    orangePrimary: string;
    bronze: string;
    dangerSubtle: string;
    dangerSubtler: string;
    blueLight: string;
  };
}

/**
 * LIGHT THEME PRESET (100% Preserved)
 */
export const LIGHT_THEMES: Record<LightThemePreset, ThemeTokens> = {
  default: {
    background: "#F8F8F8",
    foreground: "#111111",
    brand: {
      primary: "#111111",
      secondary: "#666666",
      muted: "#888888",
      disabled: "#CCCCCC",
      dark: "#444444",
      darker: "#333333",
      darkest: "#222222",
    },
    surface: {
      canvas: "#F8F8F8",
      sidebar: "#EDEDED",
      base: "#FFFFFF",
      subtle: "#FAFAFA",
      light: "#F5F5F5",
      gray: "#F3F4F6",
      ghost: "#F0F0F0",
      tabActive: "#EFEFEF",
      goldLight: "#FFF8E7",
    },
    border: {
      default: "#E5E5E5",
      slate: "#CBD5E1",
      light: "#E0E0E0",
      hover: "#C0C0C0",
      muted: "#D5D5D5",
      highlight: "#FFFFFF",
      shadow: "#E0E0E0",
      orangeLight: "#FFE0CC",
    },
    accent: {
      primary: "#4eb5c8ff",
      secondary: "#28a4b9ff",
      bright: "#0e5e6cff",
      glow: "rgba(37, 99, 235, 0.15)",
      chartStroke: "#4eb5c8ff",
      chartGradientStart: "rgba(37, 99, 235, 0.18)",
      chartGradientEnd: "rgba(37, 99, 235, 0.0)",
      chartGrid: "rgba(0, 0, 0, 0.06)",
      chartAxis: "#64748b",
    },
    status: {
      success: "#008A44",
      successLight: "#E5F6EE",
      danger: "#D92D20",
      warning: "#FF6B6B",
      premium: "#D4AF37",
      premiumLight: "#FFE4A0",
      orangeDark: "#B54708",
      orangeLightBg: "#FFF0E5",
      orangePrimary: "#FF8A3D",
      bronze: "#CD7F32",
      dangerSubtle: "#FEECEB",
      dangerSubtler: "#FEF3F2",
      blueLight: "#EFF6FF",
    },
  },
};

/**
 * Dynamic Factory for Neutral Base + Any Tailwind Accent
 */
export function createNeutralTheme(accentInput: TailwindAccentDef | TailwindAccentColor | string): ThemeTokens {
  let accent: TailwindAccentDef;

  if (typeof accentInput === "object" && accentInput !== null) {
    accent = accentInput;
  } else {
    const key = String(accentInput).replace(/^neutral-/, "") as TailwindAccentColor;
    accent = TAILWIND_ACCENTS[key] || TAILWIND_ACCENTS.white;
  }

  const hexToRgb = (hex: string) => {
    const clean = hex.replace("#", "");
    if (clean.length === 6) {
      const num = parseInt(clean, 16);
      return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
    }
    return "255, 255, 255";
  };

  const rgb = hexToRgb(accent.primary);

  return {
    background: "#070707",
    foreground: "#fafafa",
    brand: {
      primary: "#fafafa",
      secondary: "#a1a1a1",
      muted: "#6b6b6b",
      disabled: "#424242",
      dark: "#d4d4d4",
      darker: "#e5e5e5",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#070707",
      sidebar: "#0c0c0c",
      base: "#121212",
      subtle: "#171717",
      light: "#1e1e1e",
      gray: "#242424",
      ghost: "#151515",
      tabActive: "#141414",
      goldLight: "#20180e",
    },
    border: {
      default: "#1d1d1d",
      slate: "#242424",
      light: "#222222",
      hover: "#333333",
      muted: "#141414",
      highlight: "#2d2d2d",
      shadow: "#000000",
      orangeLight: "#351508",
    },
    accent: {
      primary: accent.primary,
      secondary: accent.secondary,
      bright: accent.bright,
      glow: accent.glowRgba,
      chartStroke: accent.primary,
      chartGradientStart: `rgba(${rgb}, 0.28)`,
      chartGradientEnd: `rgba(${rgb}, 0.0)`,
      chartGrid: "rgba(255, 255, 255, 0.06)",
      chartAxis: "#737373",
    },
    status: {
      success: "#22c55e",
      successLight: "#052e16",
      danger: "#ef4444",
      warning: "#f59e0b",
      premium: "#eab308",
      premiumLight: "#3f2e06",
      orangeDark: "#ea580c",
      orangeLightBg: "#3c1508",
      orangePrimary: "#f97316",
      bronze: "#d97706",
      dangerSubtle: "#450a0a",
      dangerSubtler: "#260606",
      blueLight: "#172554",
    },
  };
}

/**
 * 9 BASE CURATED DARK THEME PRESETS + DYNAMIC PRESETS
 */
export const DARK_THEMES: Record<string, ThemeTokens> = {
  // 1. ZINC
  zinc: {
    background: "#09090b",
    foreground: "#ededed",
    brand: {
      primary: "#ededed",
      secondary: "#a1a1aa",
      muted: "#71717a",
      disabled: "#52525b",
      dark: "#d4d4d8",
      darker: "#e4e4e7",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#09090b",
      sidebar: "#0f0f13",
      base: "#141418",
      subtle: "#18181f",
      light: "#202029",
      gray: "#272733",
      ghost: "#1c1c24",
      tabActive: "#1a1a22",
      goldLight: "#261f14",
    },
    border: {
      default: "#22222c",
      slate: "#27273a",
      light: "#292938",
      hover: "#39394d",
      muted: "#16161e",
      highlight: "#2e2e3f",
      shadow: "#000000",
      orangeLight: "#431d0a",
    },
    accent: {
      primary: "#6366f1",
      secondary: "#4f46e5",
      bright: "#818cf8",
      glow: "rgba(99, 102, 241, 0.22)",
      chartStroke: "#6366f1",
      chartGradientStart: "rgba(99, 102, 241, 0.28)",
      chartGradientEnd: "rgba(99, 102, 241, 0.0)",
      chartGrid: "rgba(255, 255, 255, 0.05)",
      chartAxis: "#71717a",
    },
    status: {
      success: "#34D399",
      successLight: "#064E3B",
      danger: "#EF4444",
      warning: "#FBBF24",
      premium: "#FBBF24",
      premiumLight: "#45330B",
      orangeDark: "#F97316",
      orangeLightBg: "#431D0A",
      orangePrimary: "#FB923C",
      bronze: "#F59E0B",
      dangerSubtle: "#451A1A",
      dangerSubtler: "#2A0F0F",
      blueLight: "#1E3A8A",
    },
  },

  // 2. SLATE
  slate: {
    background: "#0b1120",
    foreground: "#e2e8f0",
    brand: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
      muted: "#64748b",
      disabled: "#475569",
      dark: "#cbd5e1",
      darker: "#e2e8f0",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#0b1120",
      sidebar: "#0f172a",
      base: "#141e33",
      subtle: "#18243d",
      light: "#1e2c4a",
      gray: "#243559",
      ghost: "#1a2742",
      tabActive: "#19253f",
      goldLight: "#262215",
    },
    border: {
      default: "#1f2e4d",
      slate: "#283a61",
      light: "#25375c",
      hover: "#384f80",
      muted: "#16223b",
      highlight: "#2c416e",
      shadow: "#050811",
      orangeLight: "#43220f",
    },
    accent: {
      primary: "#0ea5e9",
      secondary: "#0284c7",
      bright: "#38bdf8",
      glow: "rgba(14, 165, 233, 0.22)",
      chartStroke: "#0ea5e9",
      chartGradientStart: "rgba(14, 165, 233, 0.28)",
      chartGradientEnd: "rgba(14, 165, 233, 0.0)",
      chartGrid: "rgba(255, 255, 255, 0.05)",
      chartAxis: "#64748b",
    },
    status: {
      success: "#34D399",
      successLight: "#064E3B",
      danger: "#EF4444",
      warning: "#FBBF24",
      premium: "#FBBF24",
      premiumLight: "#45330B",
      orangeDark: "#F97316",
      orangeLightBg: "#431D0A",
      orangePrimary: "#FB923C",
      bronze: "#F59E0B",
      dangerSubtle: "#451A1A",
      dangerSubtler: "#2A0F0F",
      blueLight: "#1E3A8A",
    },
  },

  // 3. GRAY
  gray: {
    background: "#0d1117",
    foreground: "#e6edf3",
    brand: {
      primary: "#f0f6fc",
      secondary: "#8b949e",
      muted: "#6e7681",
      disabled: "#484f58",
      dark: "#c9d1d9",
      darker: "#e6edf3",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#0d1117",
      sidebar: "#131720",
      base: "#161b22",
      subtle: "#1c2128",
      light: "#22272e",
      gray: "#2d333b",
      ghost: "#1f242c",
      tabActive: "#1b2027",
      goldLight: "#282216",
    },
    border: {
      default: "#262c36",
      slate: "#30363d",
      light: "#2d343e",
      hover: "#404854",
      muted: "#1a1f26",
      highlight: "#373e4a",
      shadow: "#080b0f",
      orangeLight: "#43210d",
    },
    accent: {
      primary: "#10b981",
      secondary: "#059669",
      bright: "#34d399",
      glow: "rgba(16, 185, 129, 0.22)",
      chartStroke: "#10b981",
      chartGradientStart: "rgba(16, 185, 129, 0.28)",
      chartGradientEnd: "rgba(16, 185, 129, 0.0)",
      chartGrid: "rgba(255, 255, 255, 0.05)",
      chartAxis: "#8b949e",
    },
    status: {
      success: "#3fb950",
      successLight: "#0d3b1b",
      danger: "#f85149",
      warning: "#d29922",
      premium: "#e3b341",
      premiumLight: "#3d2e07",
      orangeDark: "#db6d28",
      orangeLightBg: "#3b1a06",
      orangePrimary: "#f0883e",
      bronze: "#d29922",
      dangerSubtle: "#3b1219",
      dangerSubtler: "#260b10",
      blueLight: "#122647",
    },
  },

  // 4. NEUTRAL (Default Titanium White)
  neutral: createNeutralTheme("white"),

  // 5. STONE
  stone: {
    background: "#0c0a09",
    foreground: "#f5f5f4",
    brand: {
      primary: "#f5f5f4",
      secondary: "#a8a29e",
      muted: "#78716c",
      disabled: "#57534e",
      dark: "#d6d3d1",
      darker: "#e7e5e4",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#0c0a09",
      sidebar: "#141210",
      base: "#1c1917",
      subtle: "#24211e",
      light: "#292524",
      gray: "#332e2c",
      ghost: "#272320",
      tabActive: "#211d1b",
      goldLight: "#2d2315",
    },
    border: {
      default: "#292524",
      slate: "#342f2c",
      light: "#302b28",
      hover: "#44403c",
      muted: "#1a1715",
      highlight: "#3e3834",
      shadow: "#050404",
      orangeLight: "#451f0b",
    },
    accent: {
      primary: "#f97316",
      secondary: "#ea580c",
      bright: "#fb923c",
      glow: "rgba(249, 115, 22, 0.22)",
      chartStroke: "#f97316",
      chartGradientStart: "rgba(249, 115, 22, 0.28)",
      chartGradientEnd: "rgba(249, 115, 22, 0.0)",
      chartGrid: "rgba(255, 255, 255, 0.05)",
      chartAxis: "#78716c",
    },
    status: {
      success: "#34D399",
      successLight: "#064E3B",
      danger: "#EF4444",
      warning: "#FBBF24",
      premium: "#FBBF24",
      premiumLight: "#45330B",
      orangeDark: "#F97316",
      orangeLightBg: "#431D0A",
      orangePrimary: "#FB923C",
      bronze: "#F59E0B",
      dangerSubtle: "#451A1A",
      dangerSubtler: "#2A0F0F",
      blueLight: "#1E3A8A",
    },
  },

  // 6. TAUPE
  taupe: {
    background: "#0f0e0d",
    foreground: "#ede8e3",
    brand: {
      primary: "#ede8e3",
      secondary: "#a89f97",
      muted: "#786e66",
      disabled: "#4a443e",
      dark: "#d4cbc3",
      darker: "#ede8e3",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#0f0e0d",
      sidebar: "#151312",
      base: "#1b1917",
      subtle: "#23201d",
      light: "#2b2724",
      gray: "#332f2b",
      ghost: "#272421",
      tabActive: "#24201c",
      goldLight: "#2e2417",
    },
    border: {
      default: "#2c2825",
      slate: "#36312d",
      light: "#332f2b",
      hover: "#47403a",
      muted: "#211e1c",
      highlight: "#3a342f",
      shadow: "#0a0909",
      orangeLight: "#4a2810",
    },
    accent: {
      primary: "#e59b4c",
      secondary: "#d97706",
      bright: "#f59e0b",
      glow: "rgba(229, 155, 76, 0.22)",
      chartStroke: "#e59b4c",
      chartGradientStart: "rgba(229, 155, 76, 0.28)",
      chartGradientEnd: "rgba(229, 155, 76, 0.0)",
      chartGrid: "rgba(255, 255, 255, 0.05)",
      chartAxis: "#8c827a",
    },
    status: {
      success: "#34D399",
      successLight: "#064E3B",
      danger: "#EF4444",
      warning: "#FBBF24",
      premium: "#FBBF24",
      premiumLight: "#45330B",
      orangeDark: "#F97316",
      orangeLightBg: "#431D0A",
      orangePrimary: "#FB923C",
      bronze: "#F59E0B",
      dangerSubtle: "#451A1A",
      dangerSubtler: "#2A0F0F",
      blueLight: "#1E3A8A",
    },
  },

  // 7. MAUVE
  mauve: {
    background: "#0e0c12",
    foreground: "#eee8f5",
    brand: {
      primary: "#f3edfa",
      secondary: "#a79bb5",
      muted: "#786d87",
      disabled: "#51475e",
      dark: "#d0c5df",
      darker: "#eee8f5",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#0e0c12",
      sidebar: "#14111a",
      base: "#1a1622",
      subtle: "#211d2c",
      light: "#282336",
      gray: "#322c42",
      ghost: "#252030",
      tabActive: "#221d2d",
      goldLight: "#2c211a",
    },
    border: {
      default: "#282336",
      slate: "#332c45",
      light: "#2f2940",
      hover: "#433b5c",
      muted: "#1c1826",
      highlight: "#3b344f",
      shadow: "#07050a",
      orangeLight: "#431f1a",
    },
    accent: {
      primary: "#a855f7",
      secondary: "#9333ea",
      bright: "#c084fc",
      glow: "rgba(168, 85, 247, 0.22)",
      chartStroke: "#a855f7",
      chartGradientStart: "rgba(168, 85, 247, 0.28)",
      chartGradientEnd: "rgba(168, 85, 247, 0.0)",
      chartGrid: "rgba(255, 255, 255, 0.05)",
      chartAxis: "#8a7d9c",
    },
    status: {
      success: "#34D399",
      successLight: "#064E3B",
      danger: "#EF4444",
      warning: "#FBBF24",
      premium: "#FBBF24",
      premiumLight: "#45330B",
      orangeDark: "#F97316",
      orangeLightBg: "#431D0A",
      orangePrimary: "#FB923C",
      bronze: "#F59E0B",
      dangerSubtle: "#451A1A",
      dangerSubtler: "#2A0F0F",
      blueLight: "#1E3A8A",
    },
  },

  // 8. MIST
  mist: {
    background: "#0a1017",
    foreground: "#e2ecf5",
    brand: {
      primary: "#eef6fc",
      secondary: "#8fa3b5",
      muted: "#60768a",
      disabled: "#415363",
      dark: "#c2d4e3",
      darker: "#e2ecf5",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#0a1017",
      sidebar: "#0f1620",
      base: "#141d2a",
      subtle: "#192433",
      light: "#1f2c3d",
      gray: "#27364a",
      ghost: "#1c2838",
      tabActive: "#182332",
      goldLight: "#262016",
    },
    border: {
      default: "#1f2d3e",
      slate: "#28394f",
      light: "#253549",
      hover: "#374c69",
      muted: "#15202c",
      highlight: "#2e4057",
      shadow: "#04070a",
      orangeLight: "#402013",
    },
    accent: {
      primary: "#06b6d4",
      secondary: "#0891b2",
      bright: "#22d3ee",
      glow: "rgba(6, 182, 212, 0.22)",
      chartStroke: "#06b6d4",
      chartGradientStart: "rgba(6, 182, 212, 0.28)",
      chartGradientEnd: "rgba(6, 182, 212, 0.0)",
      chartGrid: "rgba(255, 255, 255, 0.05)",
      chartAxis: "#60768a",
    },
    status: {
      success: "#34D399",
      successLight: "#064E3B",
      danger: "#EF4444",
      warning: "#FBBF24",
      premium: "#FBBF24",
      premiumLight: "#45330B",
      orangeDark: "#F97316",
      orangeLightBg: "#431D0A",
      orangePrimary: "#FB923C",
      bronze: "#F59E0B",
      dangerSubtle: "#451A1A",
      dangerSubtler: "#2A0F0F",
      blueLight: "#1E3A8A",
    },
  },

  // 9. OLIVE
  olive: {
    background: "#0c0f0a",
    foreground: "#e8ede6",
    brand: {
      primary: "#eff5ed",
      secondary: "#98a694",
      muted: "#697864",
      disabled: "#485444",
      dark: "#cad6c5",
      darker: "#e8ede6",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#0c0f0a",
      sidebar: "#11160e",
      base: "#161c13",
      subtle: "#1c2419",
      light: "#232c1f",
      gray: "#2b3626",
      ghost: "#20281c",
      tabActive: "#1b2217",
      goldLight: "#262314",
    },
    border: {
      default: "#242d20",
      slate: "#2d3828",
      light: "#293324",
      hover: "#3c4b36",
      muted: "#181f15",
      highlight: "#354230",
      shadow: "#050704",
      orangeLight: "#40220f",
    },
    accent: {
      primary: "#84cc16",
      secondary: "#65a30d",
      bright: "#a3e635",
      glow: "rgba(132, 204, 22, 0.22)",
      chartStroke: "#84cc16",
      chartGradientStart: "rgba(132, 204, 22, 0.28)",
      chartGradientEnd: "rgba(132, 204, 22, 0.0)",
      chartGrid: "rgba(255, 255, 255, 0.05)",
      chartAxis: "#697864",
    },
    status: {
      success: "#34D399",
      successLight: "#064E3B",
      danger: "#EF4444",
      warning: "#FBBF24",
      premium: "#FBBF24",
      premiumLight: "#45330B",
      orangeDark: "#F97316",
      orangeLightBg: "#431D0A",
      orangePrimary: "#FB923C",
      bronze: "#F59E0B",
      dangerSubtle: "#451A1A",
      dangerSubtler: "#2A0F0F",
      blueLight: "#1E3A8A",
    },
  },

  // Dynamic Neutral Tailwind Accents
  "neutral-white": createNeutralTheme("white"),
  "neutral-red": createNeutralTheme("red"),
  "neutral-orange": createNeutralTheme("orange"),
  "neutral-amber": createNeutralTheme("amber"),
  "neutral-yellow": createNeutralTheme("yellow"),
  "neutral-lime": createNeutralTheme("lime"),
  "neutral-green": createNeutralTheme("green"),
  "neutral-emerald": createNeutralTheme("emerald"),
  "neutral-teal": createNeutralTheme("teal"),
  "neutral-cyan": createNeutralTheme("cyan"),
  "neutral-sky": createNeutralTheme("sky"),
  "neutral-blue": createNeutralTheme("blue"),
  "neutral-indigo": createNeutralTheme("indigo"),
  "neutral-violet": createNeutralTheme("violet"),
  "neutral-purple": createNeutralTheme("purple"),
  "neutral-fuchsia": createNeutralTheme("fuchsia"),
  "neutral-pink": createNeutralTheme("pink"),
  "neutral-rose": createNeutralTheme("rose"),
};

/**
 * Retrieve the active ThemeTokens object dynamically
 */
export function getThemeTokens(
  isDark: boolean,
  darkPreset: DarkThemePreset = ACTIVE_DARK_THEME_KEYWORD,
  lightPreset: LightThemePreset = ACTIVE_LIGHT_THEME_KEYWORD
): ThemeTokens {
  if (isDark) {
    if (darkPreset in DARK_THEMES) {
      return DARK_THEMES[darkPreset];
    }
    // Dynamic matching for any neutral-${color} syntax
    if (typeof darkPreset === "string" && darkPreset.startsWith("neutral-")) {
      const accentKey = darkPreset.replace("neutral-", "") as TailwindAccentColor;
      if (accentKey in TAILWIND_ACCENTS) {
        return createNeutralTheme(accentKey);
      }
    }
    return DARK_THEMES[ACTIVE_DARK_THEME_KEYWORD] || DARK_THEMES.neutral || DARK_THEMES.stone;
  }
  return LIGHT_THEMES[lightPreset] || LIGHT_THEMES.default;
}

/**
 * Generate complete CSS variable map to inject into :root or .dark DOM
 */
export function generateCssVariables(tokens: ThemeTokens): Record<string, string> {
  return {
    "--background": tokens.background,
    "--foreground": tokens.foreground,

    "--color-brand-primary": tokens.brand.primary,
    "--color-brand-secondary": tokens.brand.secondary,
    "--color-brand-muted": tokens.brand.muted,
    "--color-brand-disabled": tokens.brand.disabled,
    "--color-brand-dark": tokens.brand.dark,
    "--color-brand-darker": tokens.brand.darker,
    "--color-brand-darkest": tokens.brand.darkest,

    "--color-surface-canvas": tokens.surface.canvas,
    "--color-surface-sidebar": tokens.surface.sidebar,
    "--color-surface-base": tokens.surface.base,
    "--color-surface-subtle": tokens.surface.subtle,
    "--color-surface-light": tokens.surface.light,
    "--color-surface-gray": tokens.surface.gray,
    "--color-surface-ghost": tokens.surface.ghost,
    "--color-surface-tab-active": tokens.surface.tabActive,
    "--color-surface-gold-light": tokens.surface.goldLight,

    "--color-border-default": tokens.border.default,
    "--color-border-slate": tokens.border.slate,
    "--color-border-light": tokens.border.light,
    "--color-border-hover": tokens.border.hover,
    "--color-border-muted": tokens.border.muted,
    "--color-border-highlight": tokens.border.highlight,
    "--color-border-shadow": tokens.border.shadow,
    "--color-border-orange-light": tokens.border.orangeLight,

    "--color-canvas-dots": tokens.border.slate,
    "--color-canvas-stroke": tokens.border.light,

    "--color-accent-primary": tokens.accent.primary,
    "--color-accent-bright": tokens.accent.bright,
    "--color-accent-glow": tokens.accent.glow,
    "--color-chart-stroke": tokens.accent.chartStroke,
    "--color-chart-gradient-start": tokens.accent.chartGradientStart,
    "--color-chart-gradient-end": tokens.accent.chartGradientEnd,
    "--color-chart-grid": tokens.accent.chartGrid,
    "--color-chart-axis": tokens.accent.chartAxis,

    "--color-status-success": tokens.status.success,
    "--color-status-success-light": tokens.status.successLight,
    "--color-status-danger": tokens.status.danger,
    "--color-status-warning": tokens.status.warning,
    "--color-status-premium": tokens.status.premium,
    "--color-status-premium-light": tokens.status.premiumLight,
    "--color-status-orange-dark": tokens.status.orangeDark,
    "--color-status-orange-light-bg": tokens.status.orangeLightBg,
    "--color-status-orange-primary": tokens.status.orangePrimary,
    "--color-status-bronze": tokens.status.bronze,
    "--color-status-danger-subtle": tokens.status.dangerSubtle,
    "--color-status-danger-subtler": tokens.status.dangerSubtler,
    "--color-status-blue-light": tokens.status.blueLight,

    "--color-folder-bg": tokens.surface.base,
    "--color-folder-hover": tokens.surface.subtle,
    "--color-folder-border-hover": tokens.border.hover,
  };
}

/**
 * Apply the dynamic theme variables directly to the document root
 */
export function applyThemeToDocument(isDark: boolean, darkPreset?: DarkThemePreset) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const preset = darkPreset || ACTIVE_DARK_THEME_KEYWORD;
  const tokens = getThemeTokens(isDark, preset);
  const vars = generateCssVariables(tokens);

  if (isDark) {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }

  for (const [key, val] of Object.entries(vars)) {
    root.style.setProperty(key, val);
  }
}
