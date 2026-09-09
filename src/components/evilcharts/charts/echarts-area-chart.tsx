"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import * as echarts from "echarts";
import { useTheme } from "@/context/ThemeContext";
import { ChartConfig, ChartConfigItem } from "./types";

export type { ChartConfig, ChartConfigItem };

// Subcomponent descriptor props
export interface AreaGridProps {
  show?: boolean;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  containLabel?: boolean;
}

export interface AreaXAxisProps {
  dataKey?: string;
  tickFormatter?: (value: any) => string;
  show?: boolean;
  boundaryGap?: boolean;
  showSplitLine?: boolean;
}

export interface AreaYAxisProps {
  dataKey?: string;
  tickFormatter?: (value: any) => string;
  show?: boolean;
  showSplitLine?: boolean;
}

export interface AreaBrushProps {
  height?: number;
  formatLabel?: (value: string | number, index?: number) => string;
  onChange?: (range: { startIndex: number; endIndex: number }) => void;
  xDataKey?: string;
  show?: boolean;
  start?: number;
  end?: number;
}

export interface AreaLegendProps {
  isClickable?: boolean;
  position?: "top" | "bottom" | "left" | "right";
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  show?: boolean;
}

export interface AreaTooltipProps {
  show?: boolean;
  formatter?: (params: any) => string;
}

export interface AreaDotProps {
  variant?: "default" | "border" | "colored-border";
}

export interface AreaActiveDotProps {
  variant?: "default" | "border" | "colored-border";
}

export interface AreaSeriesProps {
  dataKey: string;
  variant?: "gradient" | "gradient-reverse" | "solid" | "dotted" | "lines" | "hatched";
  strokeVariant?: "solid" | "dashed" | "animated-dashed";
  strokeWidth?: number;
  isClickable?: boolean;
  name?: string;
  curveType?: "linear" | "smooth" | "bump" | "monotone" | "monotoneX" | "monotoneY" | "natural" | "step" | string;
  color?: string;
  children?: ReactNode;
}

// Marker components used for declarative composition
const Grid: React.FC<AreaGridProps> = () => null;
Grid.displayName = "EChartsAreaChart.Grid";

const XAxis: React.FC<AreaXAxisProps> = () => null;
XAxis.displayName = "EChartsAreaChart.XAxis";

const YAxis: React.FC<AreaYAxisProps> = () => null;
YAxis.displayName = "EChartsAreaChart.YAxis";

const Brush: React.FC<AreaBrushProps> = () => null;
Brush.displayName = "EChartsAreaChart.Brush";

const Legend: React.FC<AreaLegendProps> = () => null;
Legend.displayName = "EChartsAreaChart.Legend";

const Tooltip: React.FC<AreaTooltipProps> = () => null;
Tooltip.displayName = "EChartsAreaChart.Tooltip";

const Dot: React.FC<AreaDotProps> = () => null;
Dot.displayName = "EChartsAreaChart.Dot";

const ActiveDot: React.FC<AreaActiveDotProps> = () => null;
ActiveDot.displayName = "EChartsAreaChart.ActiveDot";

const Area: React.FC<AreaSeriesProps> = () => null;
Area.displayName = "EChartsAreaChart.Area";

export interface EChartsAreaChartProps {
  data: any[];
  config?: ChartConfig;
  className?: string;
  style?: React.CSSProperties;
  curveType?: "linear" | "smooth" | "bump" | "monotone" | "monotoneX" | "monotoneY" | "natural" | "step" | string;
  xDataKey?: string;
  stackType?: "default" | "stacked" | "expanded";
  height?: number | string;
  children?: React.ReactNode;
  valueFormatter?: (val: number) => string;
}

export interface EChartsSubcomponents {
  gridProps: AreaGridProps | null;
  xAxisProps: AreaXAxisProps | null;
  yAxisProps: AreaYAxisProps | null;
  brushProps: AreaBrushProps | null;
  legendProps: AreaLegendProps | null;
  tooltipProps: AreaTooltipProps | null;
  areaSeriesList: AreaSeriesProps[];
}

const EChartsAreaChartRoot: React.FC<EChartsAreaChartProps> = ({
  data = [],
  config = {},
  className = "",
  style,
  curveType = "linear",
  xDataKey = "date",
  stackType = "default",
  height = "100%",
  children,
  valueFormatter,
}) => {
  const { isDark, tokens } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Direct DOM Refs for 60fps interaction
  const [rangePct, setRangePct] = useState<{ start: number; end: number }>({ start: 0, end: 100 });
  const rangePctRef = useRef<{ start: number; end: number }>({ start: 0, end: 100 });
  const rafIdRef = useRef<number | null>(null);

  const brushTrackRef = useRef<HTMLDivElement>(null);
  const leftMaskRef = useRef<HTMLDivElement>(null);
  const rightMaskRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const leftHandleRef = useRef<HTMLDivElement>(null);
  const rightHandleRef = useRef<HTMLDivElement>(null);
  const leftLabelRef = useRef<HTMLDivElement>(null);
  const rightLabelRef = useRef<HTMLDivElement>(null);

  // Extract declarative subcomponent props from children
  const subcomponents = useMemo<EChartsSubcomponents>(() => {
    let grid: AreaGridProps | null = null;
    let xAxis: AreaXAxisProps | null = null;
    let yAxis: AreaYAxisProps | null = null;
    let brush: AreaBrushProps | null = null;
    let legend: AreaLegendProps | null = null;
    let tooltip: AreaTooltipProps | null = null;
    const areas: AreaSeriesProps[] = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const type = child.type as any;
      if (type === Grid || type.displayName === "EChartsAreaChart.Grid") {
        grid = child.props as AreaGridProps;
      } else if (type === XAxis || type.displayName === "EChartsAreaChart.XAxis") {
        xAxis = child.props as AreaXAxisProps;
      } else if (type === YAxis || type.displayName === "EChartsAreaChart.YAxis") {
        yAxis = child.props as AreaYAxisProps;
      } else if (type === Brush || type.displayName === "EChartsAreaChart.Brush") {
        brush = child.props as AreaBrushProps;
      } else if (type === Legend || type.displayName === "EChartsAreaChart.Legend") {
        legend = child.props as AreaLegendProps;
      } else if (type === Tooltip || type.displayName === "EChartsAreaChart.Tooltip") {
        tooltip = child.props as AreaTooltipProps;
      } else if (type === Area || type.displayName === "EChartsAreaChart.Area") {
        areas.push(child.props as AreaSeriesProps);
      }
    });

    return {
      gridProps: grid,
      xAxisProps: xAxis,
      yAxisProps: yAxis,
      brushProps: brush,
      legendProps: legend,
      tooltipProps: tooltip,
      areaSeriesList: areas,
    };
  }, [children]);

  const gridProps = subcomponents.gridProps;
  const xAxisProps = subcomponents.xAxisProps;
  const yAxisProps = subcomponents.yAxisProps;
  const brushProps = subcomponents.brushProps;
  const legendProps = subcomponents.legendProps;
  const tooltipProps = subcomponents.tooltipProps;
  const areaSeriesList = subcomponents.areaSeriesList;

  const hasBrush = brushProps !== null && brushProps.show !== false && data.length > 3;
  const brushHeight = brushProps?.height ?? 56;

  const actualXKey = brushProps?.xDataKey || xAxisProps?.dataKey || xDataKey;
  const xValues = useMemo(() => data.map((d) => d[actualXKey] ?? ""), [data, actualXKey]);

  // Series to render
  const seriesToRender: AreaSeriesProps[] = useMemo(() => {
    return areaSeriesList.length > 0
      ? areaSeriesList
      : Object.keys(config).length > 0
        ? Object.keys(config).map((key) => ({ dataKey: key, variant: "gradient" as const }))
        : [{ dataKey: "amount", variant: "gradient" as const }];
  }, [areaSeriesList, config]);

  const defaultColors = useMemo(() => [
    "#10b981",
    "#f43f5e",
    tokens.accent.chartStroke || "#f97316",
    "#3b82f6",
    "#8b5cf6",
  ], [tokens]);

  const seriesColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    seriesToRender.forEach((area, idx) => {
      const cfg = config[area.dataKey];
      let col: string | undefined = area.color;
      if (!col && cfg) {
        if (isDark && cfg.colors?.dark?.[0]) col = cfg.colors.dark[0];
        else if (!isDark && cfg.colors?.light?.[0]) col = cfg.colors.light[0];
        else if (cfg.color) col = cfg.color;
      }
      map[area.dataKey] = col || defaultColors[idx % defaultColors.length];
    });
    return map;
  }, [seriesToRender, config, isDark, defaultColors]);

  const getFormattedLabel = useCallback((index: number) => {
    if (!data || data.length === 0) return "";
    const clampedIdx = Math.max(0, Math.min(data.length - 1, index));
    const raw = data[clampedIdx]?.[actualXKey] ?? "";
    return brushProps?.formatLabel ? brushProps.formatLabel(raw, clampedIdx) : String(raw);
  }, [data, actualXKey, brushProps]);

  const updateBrushDOM = useCallback((start: number, end: number) => {
    if (leftMaskRef.current) leftMaskRef.current.style.width = `${start}%`;
    if (rightMaskRef.current) rightMaskRef.current.style.width = `${100 - end}%`;
    if (windowRef.current) {
      windowRef.current.style.left = `${start}%`;
      windowRef.current.style.width = `${Math.max(0, end - start)}%`;
    }
    if (leftHandleRef.current) leftHandleRef.current.style.left = `${start}%`;
    if (rightHandleRef.current) rightHandleRef.current.style.left = `${end}%`;

    const totalLen = data.length;
    const startIdx = Math.max(0, Math.min(totalLen - 1, Math.round((start / 100) * (totalLen - 1))));
    const endIdx = Math.max(0, Math.min(totalLen - 1, Math.round((end / 100) * (totalLen - 1))));

    if (leftLabelRef.current) leftLabelRef.current.textContent = getFormattedLabel(startIdx);
    if (rightLabelRef.current) rightLabelRef.current.textContent = getFormattedLabel(endIdx);
  }, [data.length, getFormattedLabel]);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    if (!chartInstanceRef.current) {
      const dpr = typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 2, 2) : 2;
      chartInstanceRef.current = echarts.init(chartRef.current, undefined, {
        renderer: "canvas",
        devicePixelRatio: dpr,
      });
    }

    const chart = chartInstanceRef.current;

    const curGrid = gridProps as AreaGridProps | null;
    const curXAxis = xAxisProps as AreaXAxisProps | null;
    const curYAxis = yAxisProps as AreaYAxisProps | null;
    const curLegend = legendProps as AreaLegendProps | null;
    const curTooltip = tooltipProps as AreaTooltipProps | null;

    const series = seriesToRender.map((area) => {
      const cfg = config[area.dataKey];
      const seriesColor = seriesColorMap[area.dataKey];
      const seriesName = area.name || (cfg?.label ? String(cfg.label) : area.dataKey);
      const effectiveCurve = area.curveType || curveType;
      const isSmooth = effectiveCurve === "monotone" || effectiveCurve === "smooth";

      const yData = data.map((d) => d[area.dataKey] ?? 0);

      let hasDot = false;
      let dotVariant: string | undefined;
      let activeDotVariant: string | undefined;

      if (area.children) {
        React.Children.forEach(area.children, (child) => {
          if (!React.isValidElement(child)) return;
          const type = child.type as any;
          if (type === Dot || type.displayName === "EChartsAreaChart.Dot") {
            hasDot = true;
            dotVariant = (child.props as AreaDotProps).variant;
          } else if (type === ActiveDot || type.displayName === "EChartsAreaChart.ActiveDot") {
            activeDotVariant = (child.props as AreaActiveDotProps).variant;
          }
        });
      }

      const isDashed = area.strokeVariant === "dashed" || area.strokeVariant === "animated-dashed" || (!area.strokeVariant && area.children !== undefined);

      const seriesItem: any = {
        name: area.name || area.dataKey,
        type: "line",
        smooth: effectiveCurve === "monotone" || effectiveCurve === "natural" ? 0.35 : false,
        stack: stackType === "stacked" ? "total" : undefined,
        showSymbol: dotVariant !== undefined,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: {
          color: seriesColor,
          width: area.strokeWidth ?? 2,
          type: isDashed ? "dashed" : "solid",
        },
        itemStyle: {
          color: dotVariant === "colored-border" ? (isDark ? "#090a0d" : "#ffffff") : seriesColor,
          borderColor: dotVariant === "border" ? (isDark ? "#090a0d" : "#ffffff") : seriesColor,
          borderWidth: dotVariant === "border" ? 1.5 : 0,
        },
        emphasis: {
          scale: true,
          itemStyle: {
            color: seriesColor,
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        },
        data: yData,
        silent: area.isClickable === false,
      };

      if (area.variant === "gradient" || !area.variant) {
        seriesItem.areaStyle = {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: isDark ? `${seriesColor}35` : `${seriesColor}25`,
            },
            {
              offset: 1,
              color: `${seriesColor}00`,
            },
          ]),
        };
      } else if (area.variant === "solid") {
        seriesItem.areaStyle = {
          color: seriesColor,
          opacity: 0.2,
        };
      }

      return seriesItem;
    });

    const option: echarts.EChartsOption = {
      animation: true,
      animationDuration: 250,
      animationDurationUpdate: 0, // Synchronous instant 60fps tracking
      grid: {
        top: curGrid?.top ?? (curLegend ? 32 : 12),
        right: curGrid?.right ?? 12,
        left: curGrid?.left ?? 12,
        bottom: 22,
        containLabel: curGrid?.containLabel ?? false,
      },
      tooltip: curTooltip !== null ? {
        show: curTooltip.show !== false,
        trigger: "axis",
        confine: true,
        backgroundColor: isDark ? "#141518" : "#ffffff",
        borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        padding: [8, 12],
        extraCssText: "box-shadow: 0 10px 30px rgba(0,0,0,0.4); border-radius: 12px; backdrop-filter: blur(8px); z-index: 50;",
        textStyle: {
          color: isDark ? "#f3f4f6" : "#111827",
          fontFamily: "inherit",
          fontSize: 12,
        },
        axisPointer: {
          type: "line",
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.18)",
            width: 1,
            type: "dashed",
          },
        },
        formatter: curTooltip.formatter || ((params: any) => {
          if (!params || !params.length) return "";
          const header = `<div style="font-size:10px; color:#888; font-weight:500; margin-bottom:4px;">${params[0].name}</div>`;
          const rows = params.map((item: any) => {
            const valFormatted = valueFormatter
              ? valueFormatter(item.value)
              : typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value;

            return `
              <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:${item.color};"></span>
                <span style="font-size:12px; color:${isDark ? '#e4e4e7' : '#3f3f46'}; font-weight:500;">${item.seriesName}</span>
                <span style="font-size:13px; font-weight:700; color:${item.color}; font-family:monospace; margin-left:auto;">${valFormatted}</span>
              </div>
            `;
          }).join("");

          return `<div>${header}${rows}</div>`;
        }),
      } : { show: false },
      legend: curLegend !== null ? {
        show: curLegend.show !== false,
        top: 0,
        right: curLegend.align === "left" ? undefined : (curLegend.align === "center" ? "center" : 0),
        left: curLegend.align === "left" ? 0 : undefined,
        icon: "roundRect",
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 16,
        selectedMode: curLegend.isClickable !== false,
        textStyle: {
          color: isDark ? "#e4e4e7" : "#3f3f46",
          fontSize: 12,
          fontFamily: "inherit",
          fontWeight: 500,
        },
      } : { show: false },
      xAxis: {
        type: "category",
        data: xValues,
        boundaryGap: curXAxis?.boundaryGap ?? false,
        show: curXAxis?.show !== false,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          show: curXAxis?.showSplitLine ?? true,
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            type: "dashed",
          },
        },
        axisLabel: {
          color: isDark ? "#71717a" : "#a1a1aa",
          fontSize: 11,
          fontFamily: "inherit",
          margin: 10,
          hideOverlap: true,
          showMinLabel: true,
          showMaxLabel: true,
          interval: "auto",
          formatter: curXAxis?.tickFormatter || undefined,
        },
      },
      yAxis: {
        type: "value",
        show: curYAxis?.show ?? false,
        splitLine: {
          show: curYAxis?.showSplitLine ?? false,
          lineStyle: {
            color: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            type: "dashed",
          },
        },
        axisLabel: {
          color: isDark ? "#71717a" : "#a1a1aa",
          fontSize: 10,
          formatter: curYAxis?.tickFormatter || undefined,
        },
      },
      series,
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: [0],
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
          zoomLock: false,
          preventDefaultMouseMove: false,
        },
      ],
    };

    chart.setOption(option, true);

    const handleDataZoom = (params: any) => {
      const startPct = params.start ?? (params.batch && params.batch[0]?.start) ?? 0;
      const endPct = params.end ?? (params.batch && params.batch[0]?.end) ?? 100;
      rangePctRef.current = { start: startPct, end: endPct };
      updateBrushDOM(startPct, endPct);
    };
    chart.on("datazoom", handleDataZoom);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      chart.off("datazoom", handleDataZoom);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    data,
    config,
    curveType,
    xDataKey,
    stackType,
    isDark,
    tokens,
    gridProps,
    xAxisProps,
    yAxisProps,
    legendProps,
    tooltipProps,
    seriesToRender,
    seriesColorMap,
    xValues,
    valueFormatter,
    updateBrushDOM,
  ]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  const scheduleEChartsZoom = useCallback((start: number, end: number) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispatchAction({
          type: "dataZoom",
          start,
          end,
        });
      }
      rafIdRef.current = null;
    });
  }, []);

  const applyZoom = useCallback((start: number, end: number, isFinal = false) => {
    const clampedStart = Math.max(0, Math.min(end - 4, start));
    const clampedEnd = Math.min(100, Math.max(clampedStart + 4, end));
    rangePctRef.current = { start: clampedStart, end: clampedEnd };

    updateBrushDOM(clampedStart, clampedEnd);
    scheduleEChartsZoom(clampedStart, clampedEnd);

    if (isFinal) {
      setRangePct({ start: clampedStart, end: clampedEnd });
      if (brushProps?.onChange) {
        const totalLen = data.length;
        const startIndex = Math.max(0, Math.min(totalLen - 1, Math.round((clampedStart / 100) * (totalLen - 1))));
        const endIndex = Math.max(0, Math.min(totalLen - 1, Math.round((clampedEnd / 100) * (totalLen - 1))));
        brushProps.onChange({ startIndex, endIndex });
      }
    }
  }, [data.length, brushProps, updateBrushDOM, scheduleEChartsZoom]);

  const handleWindowDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!brushTrackRef.current) return;

    const track = brushTrackRef.current;
    const rect = track.getBoundingClientRect();
    const startX = e.clientX;
    const initialStart = rangePctRef.current.start;
    const initialEnd = rangePctRef.current.end;
    const windowSpan = initialEnd - initialStart;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaPct = (deltaPx / rect.width) * 100;
      let newStart = initialStart + deltaPct;
      let newEnd = initialEnd + deltaPct;

      if (newStart < 0) {
        newStart = 0;
        newEnd = windowSpan;
      }
      if (newEnd > 100) {
        newEnd = 100;
        newStart = 100 - windowSpan;
      }

      applyZoom(newStart, newEnd, false);
    };

    const onMouseUp = () => {
      applyZoom(rangePctRef.current.start, rangePctRef.current.end, true);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleLeftHandleDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!brushTrackRef.current) return;

    const track = brushTrackRef.current;
    const rect = track.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentPct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      applyZoom(currentPct, rangePctRef.current.end, false);
    };

    const onMouseUp = () => {
      applyZoom(rangePctRef.current.start, rangePctRef.current.end, true);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleRightHandleDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!brushTrackRef.current) return;

    const track = brushTrackRef.current;
    const rect = track.getBoundingClientRect();

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentPct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      applyZoom(rangePctRef.current.start, currentPct, false);
    };

    const onMouseUp = () => {
      applyZoom(rangePctRef.current.start, rangePctRef.current.end, true);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const miniSvgPaths = useMemo(() => {
    if (!data || data.length < 2) return [];
    const width = 600;
    const height = 56;
    const totalLen = data.length;

    let maxVal = 1;
    if (stackType === "stacked" || stackType === "expanded") {
      data.forEach((row) => {
        const sum = seriesToRender.reduce((acc, s) => acc + (Number(row[s.dataKey]) || 0), 0);
        if (sum > maxVal) maxVal = sum;
      });
    } else {
      data.forEach((row) => {
        seriesToRender.forEach((s) => {
          const v = Number(row[s.dataKey]) || 0;
          if (v > maxVal) maxVal = v;
        });
      });
    }

    let prevPoints: { x: number; y: number }[] = data.map((_, i) => ({
      x: (i / (totalLen - 1)) * width,
      y: height,
    }));

    return seriesToRender.map((series) => {
      const color = seriesColorMap[series.dataKey] || "#10b981";
      const currentPoints = data.map((row, i) => {
        const x = (i / (totalLen - 1)) * width;
        const val = Number(row[series.dataKey]) || 0;
        const stackHeight = stackType === "stacked" || stackType === "expanded"
          ? (height - prevPoints[i].y) + (val / maxVal) * (height - 6)
          : (val / maxVal) * (height - 6);
        const y = Math.max(3, height - stackHeight);
        return { x, y };
      });

      const lineD = currentPoints.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
      const areaD = `${lineD} L${width},${height} L0,${height} Z`;

      if (stackType === "stacked" || stackType === "expanded") {
        prevPoints = currentPoints;
      }

      return { key: series.dataKey, color, lineD, areaD };
    });
  }, [data, seriesToRender, seriesColorMap, stackType]);

  const startIdx = Math.max(0, Math.min(data.length - 1, Math.round((rangePct.start / 100) * (data.length - 1))));
  const endIdx = Math.max(0, Math.min(data.length - 1, Math.round((rangePct.end / 100) * (data.length - 1))));

  const startLabel = getFormattedLabel(startIdx);
  const endLabel = getFormattedLabel(endIdx);

  return (
    <div className={`relative flex flex-col w-full ${className}`} style={{ height, ...style }}>
      {/* Primary Canvas Chart Surface */}
      <div ref={chartRef} className="w-full flex-1 min-h-0" />

      {/* EvilCharts Native Brush Footer - Exact HTML DOM Layout */}
      {hasBrush && (
        <div
          ref={brushTrackRef}
          className="group relative select-none mt-1 mx-3 overflow-visible"
          style={{ height: brushHeight }}
        >
          {/* Background Miniature Preview Chart */}
          <div className="absolute inset-0 overflow-hidden rounded-md border border-border-default/40 bg-surface-subtle/30">
            <svg
              className="w-full h-full block"
              viewBox="0 0 600 56"
              preserveAspectRatio="none"
            >
              {miniSvgPaths.map((p) => (
                <g key={p.key}>
                  <path d={p.areaD} fill={p.color} fillOpacity={0.2} />
                  <path d={p.lineD} fill="none" stroke={p.color} strokeWidth={1} strokeOpacity={0.65} />
                </g>
              ))}
            </svg>
          </div>

          {/* Left Dimmed Blur Mask */}
          <div
            ref={leftMaskRef}
            className="bg-surface-base/70 pointer-events-none absolute inset-y-0 left-0 rounded-l-md backdrop-blur-[2px]"
            style={{ width: `${rangePct.start}%` }}
          />

          {/* Right Dimmed Blur Mask */}
          <div
            ref={rightMaskRef}
            className="bg-surface-base/70 pointer-events-none absolute inset-y-0 right-0 rounded-r-md backdrop-blur-[2px]"
            style={{ width: `${100 - rangePct.end}%` }}
          />

          {/* Center Draggable Selection Window */}
          <div
            ref={windowRef}
            onMouseDown={handleWindowDrag}
            className="absolute inset-y-0 cursor-grab touch-none rounded-sm border border-zinc-500/50 dark:border-white/30 active:cursor-grabbing"
            style={{
              left: `${rangePct.start}%`,
              width: `${Math.max(0, rangePct.end - rangePct.start)}%`,
            }}
          />

          {/* Left Handle + Range Label */}
          <div
            ref={leftHandleRef}
            className="absolute inset-y-0 z-20"
            style={{ left: `${rangePct.start}%` }}
          >
            <div
              onMouseDown={handleLeftHandleDrag}
              className="group/handle absolute inset-y-0 flex w-3 cursor-ew-resize touch-none items-center justify-center after:absolute after:inset-y-0 after:-left-4 after:w-11 after:content-['']"
            >
              <div className="relative flex h-4 w-1.5 items-center justify-center rounded-md bg-white shadow-sm border border-black/30 -left-[5.5px] z-30">
                <div className="flex flex-col gap-[2px]">
                  <div className="h-[2px] w-[2px] rounded-full bg-black" />
                  <div className="h-[2px] w-[2px] rounded-full bg-black" />
                  <div className="h-[2px] w-[2px] rounded-full bg-black" />
                </div>
              </div>
            </div>
            {/* Floating Left Badge */}
            <div
              ref={leftLabelRef}
              className="pointer-events-none absolute -bottom-3.5 -translate-y-1/2 rounded-[3px] bg-white px-1.5 py-0.5 text-[8.5px] font-semibold leading-tight text-black shadow-md border border-black/15 whitespace-nowrap opacity-100 left-1.5 z-40"
            >
              {startLabel}
            </div>
          </div>

          {/* Right Handle + Range Label */}
          <div
            ref={rightHandleRef}
            className="absolute inset-y-0 z-20"
            style={{ left: `${rangePct.end}%` }}
          >
            <div
              onMouseDown={handleRightHandleDrag}
              className="group/handle absolute inset-y-0 flex w-3 cursor-ew-resize touch-none items-center justify-center after:absolute after:inset-y-0 after:-left-4 after:w-11 after:content-[''] -translate-x-full"
            >
              <div className="relative flex h-4 w-1.5 items-center justify-center rounded-md bg-white shadow-sm border border-black/30 -right-[5.5px] z-30">
                <div className="flex flex-col gap-[2px]">
                  <div className="h-[2px] w-[2px] rounded-full bg-black" />
                  <div className="h-[2px] w-[2px] rounded-full bg-black" />
                  <div className="h-[2px] w-[2px] rounded-full bg-black" />
                </div>
              </div>
            </div>
            {/* Floating Right Badge */}
            <div
              ref={rightLabelRef}
              className="pointer-events-none absolute -bottom-3.5 -translate-y-1/2 rounded-[3px] bg-white px-1.5 py-0.5 text-[8.5px] font-semibold leading-tight text-black shadow-md border border-black/15 whitespace-nowrap opacity-100 right-1.5 z-40"
            >
              {endLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const EChartsAreaChart = Object.assign(EChartsAreaChartRoot, {
  Grid,
  XAxis,
  YAxis,
  Brush,
  Legend,
  Tooltip,
  Area,
  Dot,
  ActiveDot,
});

// Example export demonstrating usage
const exampleAreaData = [
  { month: "January", desktop: 342, mobile: 245 },
  { month: "February", desktop: 876, mobile: 654 },
  { month: "March", desktop: 512, mobile: 387 },
  { month: "April", desktop: 629, mobile: 521 },
  { month: "May", desktop: 458, mobile: 412 },
  { month: "June", desktop: 781, mobile: 598 },
  { month: "July", desktop: 394, mobile: 312 },
  { month: "August", desktop: 925, mobile: 743 },
  { month: "September", desktop: 647, mobile: 489 },
  { month: "October", desktop: 532, mobile: 476 },
  { month: "November", desktop: 803, mobile: 687 },
  { month: "December", desktop: 271, mobile: 198 },
];

const exampleAreaConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleAreaChart() {
  return (
    <EChartsAreaChart
      data={exampleAreaData}
      config={exampleAreaConfig}
      className="h-full w-full p-4"
      stackType="stacked"
      xDataKey="month"
    >
      <EChartsAreaChart.Grid />
      <EChartsAreaChart.XAxis dataKey="month" tickFormatter={(value) => String(value).substring(0, 3)} />
      <EChartsAreaChart.Brush formatLabel={(value) => String(value).substring(0, 3)} />
      <EChartsAreaChart.Legend isClickable />
      <EChartsAreaChart.Tooltip />
      <EChartsAreaChart.Area dataKey="desktop" variant="gradient" isClickable>
        <EChartsAreaChart.Dot variant="border" />
        <EChartsAreaChart.ActiveDot variant="colored-border" />
      </EChartsAreaChart.Area>
      <EChartsAreaChart.Area dataKey="mobile" variant="gradient" isClickable>
        <EChartsAreaChart.Dot variant="border" />
        <EChartsAreaChart.ActiveDot variant="colored-border" />
      </EChartsAreaChart.Area>
    </EChartsAreaChart>
  );
}
