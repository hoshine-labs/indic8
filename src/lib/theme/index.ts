/**
 * Indic8 Unified Dynamic Theme System
 * 
 * Supports dynamic theme switching across 9 curated dark presets:
 * "slate" | "gray" | "zinc" | "neutral" | "stone" | "taupe" | "mauve" | "mist" | "olive"
 */

export type DarkThemePreset =
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone"
  | "taupe"
  | "mauve"
  | "mist"
  | "olive";

export type LightThemePreset = "default";

export interface ThemePresetOption {
  id: DarkThemePreset;
  label: string;
  sublabel: string;
  swatch: string; // Color preview dot
}

export const DARK_THEME_OPTIONS: ThemePresetOption[] = [
  { id: "zinc", label: "Zinc", sublabel: "Deep Obsidian", swatch: "#18181b" },
  { id: "slate", label: "Slate", sublabel: "Cool Blue-Gray", swatch: "#1e293b" },
  { id: "gray", label: "Gray", sublabel: "Classic Monochrome", swatch: "#1f2937" },
  { id: "neutral", label: "Neutral", sublabel: "Pure Pitch Dark", swatch: "#262626" },
  { id: "stone", label: "Stone", sublabel: "Warm Mineral", swatch: "#292524" },
  { id: "taupe", label: "Taupe", sublabel: "Beige Amber Glow", swatch: "#2c2825" },
  { id: "mauve", label: "Mauve", sublabel: "Velvet Violet", swatch: "#262230" },
  { id: "mist", label: "Mist", sublabel: "Oceanic Dusk", swatch: "#1d2833" },
  { id: "olive", label: "Olive", sublabel: "Forest Botanical", swatch: "#22281e" },
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
 * 9 DARK THEME PRESETS
 */
export const DARK_THEMES: Record<DarkThemePreset, ThemeTokens> = {
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
      primary: "#3b82f6",
      secondary: "#2563eb",
      bright: "#60a5fa",
      glow: "rgba(59, 130, 246, 0.2)",
      chartStroke: "#3b82f6",
      chartGradientStart: "rgba(59, 130, 246, 0.28)",
      chartGradientEnd: "rgba(59, 130, 246, 0.0)",
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
      primary: "#38bdf8",
      secondary: "#0284c7",
      bright: "#7dd3fc",
      glow: "rgba(56, 189, 248, 0.22)",
      chartStroke: "#38bdf8",
      chartGradientStart: "rgba(56, 189, 248, 0.28)",
      chartGradientEnd: "rgba(56, 189, 248, 0.0)",
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
      primary: "#2f81f7",
      secondary: "#1f6feb",
      bright: "#58a6ff",
      glow: "rgba(47, 129, 247, 0.2)",
      chartStroke: "#2f81f7",
      chartGradientStart: "rgba(47, 129, 247, 0.28)",
      chartGradientEnd: "rgba(47, 129, 247, 0.0)",
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

  // 4. NEUTRAL
  neutral: {
    background: "#0a0a0a",
    foreground: "#fafafa",
    brand: {
      primary: "#fafafa",
      secondary: "#a3a3a3",
      muted: "#737373",
      disabled: "#525252",
      dark: "#d4d4d4",
      darker: "#e5e5e5",
      darkest: "#ffffff",
    },
    surface: {
      canvas: "#0a0a0a",
      sidebar: "#111111",
      base: "#171717",
      subtle: "#1f1f1f",
      light: "#262626",
      gray: "#2e2e2e",
      ghost: "#212121",
      tabActive: "#1c1c1c",
      goldLight: "#261d12",
    },
    border: {
      default: "#262626",
      slate: "#2e2e2e",
      light: "#2a2a2a",
      hover: "#3d3d3d",
      muted: "#1a1a1a",
      highlight: "#383838",
      shadow: "#000000",
      orangeLight: "#401c0a",
    },
    accent: {
      primary: "#ffffff",
      secondary: "#e5e5e5",
      bright: "#ffffff",
      glow: "rgba(255, 255, 255, 0.18)",
      chartStroke: "#ffffff",
      chartGradientStart: "rgba(255, 255, 255, 0.25)",
      chartGradientEnd: "rgba(255, 255, 255, 0.0)",
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
  },

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
};

/**
 * 💡 MASTER DEFAULT THEME CONFIGURATION KEYWORD
 */
export const ACTIVE_DARK_THEME_KEYWORD: DarkThemePreset = "stone";
export const ACTIVE_LIGHT_THEME_KEYWORD: LightThemePreset = "default";

/**
 * Retrieve the active ThemeTokens object
 */
export function getThemeTokens(
  isDark: boolean,
  darkPreset: DarkThemePreset = ACTIVE_DARK_THEME_KEYWORD,
  lightPreset: LightThemePreset = ACTIVE_LIGHT_THEME_KEYWORD
): ThemeTokens {
  if (isDark) {
    return DARK_THEMES[darkPreset] || DARK_THEMES.zinc;
  }
  return LIGHT_THEMES[lightPreset] || LIGHT_THEMES.default;
}

/**
 * Generate CSS variable map to inject into :root or .dark DOM
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

    "--color-accent-primary": tokens.accent.primary,
    "--color-accent-bright": tokens.accent.bright,
    "--color-accent-glow": tokens.accent.glow,
    "--color-chart-stroke": tokens.accent.chartStroke,
    "--color-chart-gradient-start": tokens.accent.chartGradientStart,
    "--color-chart-gradient-end": tokens.accent.chartGradientEnd,
    "--color-chart-grid": tokens.accent.chartGrid,
    "--color-chart-axis": tokens.accent.chartAxis,
  };
}

/**
 * Apply the dynamic theme variables directly to the document root
 */
export function applyThemeToDocument(isDark: boolean, darkPreset?: DarkThemePreset) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const tokens = getThemeTokens(isDark, darkPreset);
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

