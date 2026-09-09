"use client";

import React, {
  createContext,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import * as echarts from "echarts";
import { useTheme } from "@/context/ThemeContext";
import { ChartConfig, ChartConfigItem } from "./types";

export type { ChartConfig, ChartConfigItem };

interface PieChartContextValue {
  data: any[];
  dataKey: string;
  nameKey: string;
  config?: ChartConfig;
  isDark: boolean;
}

const PieChartContext = createContext<PieChartContextValue | null>(null);

// Subcomponent descriptor props
export interface PieLegendProps {
  isClickable?: boolean;
  position?: "top" | "bottom" | "left" | "right";
  show?: boolean;
}

export interface PieTooltipProps {
  show?: boolean;
  formatter?: (params: any) => string;
}

export interface PieProps {
  isClickable?: boolean;
  innerRadius?: number | string;
  outerRadius?: number | string;
  paddingAngle?: number;
  cornerRadius?: number;
  showLabels?: boolean;
  roseType?: boolean | "radius" | "area";
}

// Marker components used for declarative composition
const Legend: React.FC<PieLegendProps> = () => null;
Legend.displayName = "EChartsPieChart.Legend";

const Tooltip: React.FC<PieTooltipProps> = () => null;
Tooltip.displayName = "EChartsPieChart.Tooltip";

const Pie: React.FC<PieProps> = () => null;
Pie.displayName = "EChartsPieChart.Pie";

export interface EChartsPieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  config?: ChartConfig;
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
  children?: ReactNode;
  valueFormatter?: (val: number) => string;
}

const EChartsPieChartRoot: React.FC<EChartsPieChartProps> = ({
  data = [],
  dataKey,
  nameKey,
  config = {},
  className = "",
  style,
  height = "100%",
  children,
  valueFormatter,
}) => {
  const { isDark } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Extract declarative subcomponent props from children
  const { legendProps, tooltipProps, pieProps } = useMemo(() => {
    let leg: PieLegendProps | null = null;
    let tip: PieTooltipProps | null = null;
    let p: PieProps | null = null;

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const type = child.type as any;
      if (type === Legend || type.displayName === "EChartsPieChart.Legend") {
        leg = child.props as PieLegendProps;
      } else if (type === Tooltip || type.displayName === "EChartsPieChart.Tooltip") {
        tip = child.props as PieTooltipProps;
      } else if (type === Pie || type.displayName === "EChartsPieChart.Pie") {
        p = child.props as PieProps;
      }
    });

    return { legendProps: leg, tooltipProps: tip, pieProps: p };
  }, [children]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: "svg",
      });
    }

    const chart = chartInstanceRef.current;

    const curPie = pieProps as PieProps | null;
    const curLegend = legendProps as PieLegendProps | null;
    const curTooltip = tooltipProps as PieTooltipProps | null;

    // Convert radii (support percentage or numeric radius)
    const innerRadius = curPie?.innerRadius !== undefined
      ? typeof curPie.innerRadius === "number" ? `${curPie.innerRadius}%` : curPie.innerRadius
      : "30%";
    const outerRadius = curPie?.outerRadius !== undefined
      ? typeof curPie.outerRadius === "number" ? `${curPie.outerRadius}%` : curPie.outerRadius
      : "85%";

    const padAngle = curPie?.paddingAngle ?? 4;
    const cornerRadius = curPie?.cornerRadius ?? 8;

    // Build series data with colors from config
    const seriesData = data.map((item, idx) => {
      const key = item[nameKey];
      const val = item[dataKey];
      const cfg = config[key];

      let sliceColor: string | undefined;
      if (cfg) {
        if (isDark && cfg.colors?.dark?.[0]) {
          sliceColor = cfg.colors.dark[0];
        } else if (!isDark && cfg.colors?.light?.[0]) {
          sliceColor = cfg.colors.light[0];
        } else if (cfg.color) {
          sliceColor = cfg.color;
        }
      }

      if (!sliceColor) {
        const defaultPalette = [
          "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#64748b"
        ];
        sliceColor = defaultPalette[idx % defaultPalette.length];
      }

      const label = cfg?.label ? String(cfg.label) : String(key);

      return {
        name: label,
        value: val,
        rawKey: key,
        itemStyle: {
          color: sliceColor,
          borderRadius: cornerRadius,
        },
      };
    });

    const isRightLegend = curLegend && (curLegend.position === "right" || curLegend.position === undefined);
    const isLeftLegend = curLegend && curLegend.position === "left";
    const isBottomLegend = curLegend && curLegend.position === "bottom";

    const center = isRightLegend
      ? ["28%", "50%"]
      : isLeftLegend
        ? ["72%", "50%"]
        : isBottomLegend
          ? ["50%", "44%"]
          : ["50%", "50%"];

    const outerRadiusVal = isRightLegend || isLeftLegend ? "78%" : outerRadius;

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 400,
      tooltip: curTooltip !== null ? {
        show: curTooltip.show !== false,
        trigger: "item",
        confine: true, // Keep tooltip strictly inside canvas to avoid cutoffs
        backgroundColor: isDark ? "#141518" : "#ffffff",
        borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        padding: [8, 12],
        extraCssText: "box-shadow: 0 10px 30px rgba(0,0,0,0.35); border-radius: 10px; backdrop-filter: blur(8px); z-index: 50;",
        textStyle: {
          color: isDark ? "#f3f4f6" : "#111827",
          fontFamily: "inherit",
          fontSize: 12,
        },
        formatter: curTooltip.formatter || ((params: any) => {
          const val = params.value;
          const formattedVal = valueFormatter ? valueFormatter(val) : val?.toLocaleString?.() ?? val;
          return `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${params.color};"></span>
              <span style="font-weight:600; color:${isDark ? '#fff' : '#111'};">${params.name}</span>
              <span style="margin-left:auto; font-family:monospace; font-weight:700;">${formattedVal} (${params.percent}%)</span>
            </div>
          `;
        }),
      } : { show: false },
      legend: curLegend !== null ? {
        show: curLegend.show !== false,
        orient: isRightLegend || isLeftLegend ? "vertical" : "horizontal",
        top: isRightLegend || isLeftLegend ? "middle" : (curLegend.position === "top" ? 0 : undefined),
        bottom: isBottomLegend ? 0 : undefined,
        left: isRightLegend ? "56%" : (isLeftLegend ? 0 : "center"),
        right: isRightLegend ? 0 : undefined,
        selectedMode: curLegend.isClickable !== false,
        textStyle: {
          color: isDark ? "#a1a1aa" : "#71717a",
          fontSize: 11,
          fontFamily: "inherit",
        },
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 10,
      } : { show: false },
      series: [
        {
          type: "pie",
          radius: [innerRadius, outerRadiusVal],
          center: center as any,
          padAngle: padAngle,
          minAngle: 5, // Ensures all small slices are rendered with proper visible slice colors
          avoidLabelOverlap: true,
          roseType: curPie?.roseType ? (curPie.roseType === true ? "radius" : curPie.roseType) : undefined,
          silent: curPie?.isClickable === false,
          label: {
            show: curPie?.showLabels || false,
            color: isDark ? "#d4d4d8" : "#3f3f46",
            fontSize: 11,
            formatter: "{b}: {d}%",
          },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
          data: seriesData,
        },
      ],
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, dataKey, nameKey, config, isDark, legendProps, tooltipProps, pieProps, valueFormatter]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <PieChartContext.Provider value={{ data, dataKey, nameKey, config, isDark }}>
      <div className={`relative w-full ${className}`} style={{ height, ...style }}>
        <div ref={chartRef} className="w-full h-full" />
      </div>
    </PieChartContext.Provider>
  );
};

export const EChartsPieChart = Object.assign(EChartsPieChartRoot, {
  Legend,
  Tooltip,
  Pie,
});

// Example export demonstrating usage
const examplePieData = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

const examplePieConfig = {
  chrome: {
    label: "Chrome",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  safari: {
    label: "Safari",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  firefox: {
    label: "Firefox",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  edge: {
    label: "Edge",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  other: {
    label: "Other",
    colors: {
      light: ["#6b7280"],
      dark: ["#9ca3af"],
    },
  },
} satisfies ChartConfig;

export function EChartsExamplePieChart() {
  return (
    <EChartsPieChart
      className="h-full w-full p-4"
      data={examplePieData}
      dataKey="visitors"
      nameKey="browser"
      config={examplePieConfig}
    >
      <EChartsPieChart.Legend isClickable position="right" />
      <EChartsPieChart.Tooltip />
      <EChartsPieChart.Pie
        isClickable
        innerRadius={30}
        paddingAngle={4}
        cornerRadius={8}
      />
    </EChartsPieChart>
  );
}
