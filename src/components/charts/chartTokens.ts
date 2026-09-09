export interface ChartThemeTokens {
  primaryStroke: string;
  primaryGradientStart: string;
  primaryGradientEnd: string;
  secondaryStroke: string;
  gridColor: string;
  axisTextColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  crosshairColor: string;
}

export const CHART_TOKENS: { light: ChartThemeTokens; dark: ChartThemeTokens } = {
  light: {
    primaryStroke: "#111111",
    primaryGradientStart: "rgba(17, 17, 17, 0.08)",
    primaryGradientEnd: "rgba(17, 17, 17, 0.00)",
    secondaryStroke: "#888888",
    gridColor: "#EBEBEB",
    axisTextColor: "#888888",
    tooltipBg: "#FFFFFF",
    tooltipBorder: "#E5E5E5",
    tooltipText: "#111111",
    crosshairColor: "rgba(0, 0, 0, 0.15)",
  },
  dark: {
    primaryStroke: "#EDEDED",
    primaryGradientStart: "rgba(237, 237, 237, 0.10)",
    primaryGradientEnd: "rgba(237, 237, 237, 0.00)",
    secondaryStroke: "#737373",
    gridColor: "#1E1E1E",
    axisTextColor: "#737373",
    tooltipBg: "#161616",
    tooltipBorder: "#1E1E1E",
    tooltipText: "#EDEDED",
    crosshairColor: "rgba(255, 255, 255, 0.15)",
  },
};
