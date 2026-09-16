"use client";

import React, { useMemo, useState, useCallback, useDeferredValue, useEffect, useRef } from "react";
import { ParentSize } from "@visx/responsive";
import { area, line } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import { GridRows } from "@visx/grid";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import {
  VisxAreaChartProps,
  VisxGridProps,
  VisxXAxisProps,
  VisxYAxisProps,
  VisxTooltipProps,
  VisxBrushProps,
  VisxLegendProps,
  VisxAreaSeriesProps,
  VisxBrushRange,
  Margin,
} from "../types";
import { getCurve, getSeriesColor, createMonotoneSpline, cn } from "../utils";
import { ChartProvider, useChart } from "../context/ChartContext";
import { TooltipIndicator } from "../motion/TooltipIndicator";
import { TooltipDot } from "../motion/TooltipDot";
import { DateTicker } from "../motion/DateTicker";
import { TooltipBox } from "../motion/TooltipBox";
import { ChartBrushOverlay } from "../ui/ChartBrushOverlay";

// Declarative Marker Subcomponents
const Grid: React.FC<VisxGridProps> = () => null;
Grid.displayName = "AreaChart.Grid";
(Grid as any).__isGrid = true;

const XAxis: React.FC<VisxXAxisProps> = () => null;
XAxis.displayName = "AreaChart.XAxis";
(XAxis as any).__isXAxis = true;

const YAxis: React.FC<VisxYAxisProps> = () => null;
YAxis.displayName = "AreaChart.YAxis";
(YAxis as any).__isYAxis = true;

const Tooltip: React.FC<VisxTooltipProps> = (props) => <TooltipBox {...props} />;
Tooltip.displayName = "AreaChart.Tooltip";
(Tooltip as any).__isTooltip = true;

const Indicator: React.FC<{ strokeWidth?: number; className?: string; variant?: "solid" | "dashed" | "fade"; forceLight?: boolean }> = (props) => <TooltipIndicator {...props} />;
Indicator.displayName = "AreaChart.Indicator";
(Indicator as any).__isIndicator = true;

const Dot: React.FC<{ dataKey?: string; className?: string; forceLight?: boolean }> = (props) => <TooltipDot {...props} />;
Dot.displayName = "AreaChart.Dot";
(Dot as any).__isDot = true;

const DateTickerSlot: React.FC<{ className?: string; pillWidth?: number; forceLight?: boolean }> = (props) => <DateTicker {...props} />;
DateTickerSlot.displayName = "AreaChart.DateTicker";
(DateTickerSlot as any).__isDateTicker = true;

const Brush: React.FC<VisxBrushProps> = () => null;
Brush.displayName = "AreaChart.Brush";
(Brush as any).__isBrush = true;

const Legend: React.FC<VisxLegendProps> = () => null;
Legend.displayName = "AreaChart.Legend";
(Legend as any).__isLegend = true;

const Area: React.FC<VisxAreaSeriesProps> = () => null;
Area.displayName = "AreaChart.Area";
(Area as any).__isArea = true;

const NUM_UNIFORM_SAMPLES = 48;

function generateUniformPaths(
  data: any[],
  key: string,
  innerWidth: number,
  innerHeight: number,
  xScale: (i: number) => number,
  yScale: (v: number) => number,
  curve: any
) {
  if (data.length === 0 || innerWidth <= 0 || innerHeight <= 0) {
    return { areaPath: "", linePath: "" };
  }

  const rawPoints = data.map((d, i) => ({
    x: xScale(i),
    y: yScale(Number(d[key]) || 0),
  }));

  const spline = createMonotoneSpline(rawPoints);
  const sampledData: { x: number; y: number }[] = [];
  const step = innerWidth / (NUM_UNIFORM_SAMPLES - 1);

  for (let i = 0; i < NUM_UNIFORM_SAMPLES; i++) {
    const x = i === NUM_UNIFORM_SAMPLES - 1 ? innerWidth : i * step;
    const y = Math.max(0, Math.min(innerHeight, spline(x)));
    sampledData.push({ x, y });
  }

  const areaGen = area<{ x: number; y: number }>()
    .x((d) => d.x)
    .y0(innerHeight)
    .y1((d) => d.y)
    .curve(curve);

  const lineGen = line<{ x: number; y: number }>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(curve);

  return {
    areaPath: areaGen(sampledData) || "",
    linePath: lineGen(sampledData) || "",
  };
}

// Layer 2: Memoized Canvas (Pure, Smooth Monotone Spline Curve & Animated Transitions)
const MemoizedAreaCanvas: React.FC<{
  gridProps: VisxGridProps | null;
  xAxisProps: VisxXAxisProps | null;
  yAxisProps: VisxYAxisProps | null;
  seriesProps: VisxAreaSeriesProps[];
  hasIndicator: boolean;
  hasDot: boolean;
  indicatorProps?: any;
  dotProps?: any;
}> = React.memo(({
  gridProps,
  xAxisProps,
  yAxisProps,
  seriesProps,
  hasIndicator,
  hasDot,
  indicatorProps,
  dotProps,
}) => {
  const { isDark, tokens } = useTheme();
  const {
    data,
    dataKeys,
    xDataKey,
    config,
    curveType,
    margin,
    width,
    height,
    innerWidth,
    innerHeight,
    xScale,
    yScale,
    chartId,
    forceLight,
  } = useChart();

  const totalPoints = data.length;
  const curve = getCurve(curveType);

  // X Axis Ticks - Strictly ONLY start and end
  const xTicks = useMemo(() => {
    if (xAxisProps === null || totalPoints === 0) return [];

    if (totalPoints === 1) {
      const raw = data[0]?.[xAxisProps.dataKey || xDataKey];
      const label = xAxisProps.tickFormatter ? xAxisProps.tickFormatter(raw, 0) : String(raw ?? "");
      return [{ index: 0, label, x: 0, anchor: "start" as const }];
    }

    const firstItem = data[0];
    const lastItem = data[totalPoints - 1];

    const firstRaw = firstItem ? firstItem[xAxisProps.dataKey || xDataKey] : "";
    const lastRaw = lastItem ? lastItem[xAxisProps.dataKey || xDataKey] : "";

    const firstLabel = xAxisProps.tickFormatter
      ? xAxisProps.tickFormatter(firstRaw, 0)
      : String(firstRaw ?? "");

    const lastLabel = xAxisProps.tickFormatter
      ? xAxisProps.tickFormatter(lastRaw, totalPoints - 1)
      : String(lastRaw ?? "");

    return [
      { index: 0, label: firstLabel, x: 0, anchor: "start" as const },
      { index: totalPoints - 1, label: lastLabel, x: innerWidth, anchor: "end" as const },
    ];
  }, [xAxisProps, totalPoints, innerWidth, data, xDataKey]);

  // Y Axis Ticks
  const yTicks = useMemo(() => {
    if (yAxisProps === null || yAxisProps.hide || innerHeight <= 0) return [];
    const numTicks = yAxisProps.numTicks ?? 4;
    return (yScale.ticks(numTicks) as number[]).map((val: number) => ({
      value: val,
      y: yScale(val),
      label: yAxisProps.tickFormatter ? yAxisProps.tickFormatter(val) : String(val),
    }));
  }, [yAxisProps, innerHeight, yScale]);

  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasRevealed(true);
    }, 1550);
    return () => clearTimeout(timer);
  }, []);

  const gridStroke = tokens.accent.chartGrid || (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)");

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible select-none pointer-events-none"
    >
      <defs>
        {/* On-load only Line Reveal Clip Path (Left to Right wipe on initial mount) */}
        <clipPath id={`visx-line-reveal-clip-${chartId}`}>
          {!hasRevealed ? (
            <motion.rect
              key="initial-mount-reveal"
              x={-4}
              y={-10}
              height={innerHeight + 40}
              initial={{ width: 0 }}
              animate={{ width: innerWidth + 20 }}
              transition={{
                duration: 1.5,
                ease: [0.85, 0, 0.15, 1],
              }}
            />
          ) : (
            <rect
              x={-4}
              y={-10}
              height={innerHeight + 40}
              width={innerWidth + 20}
            />
          )}
        </clipPath>

        {dataKeys.map((key) => {
          const color = getSeriesColor(
            key,
            config,
            isDark,
            tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D")
          );
          return (
            <linearGradient
              key={key}
              id={`visx-area-gradient-${chartId}-${key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.24} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          );
        })}
      </defs>

      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Horizontal Gridlines */}
        {gridProps !== null && gridProps.horizontal !== false && (
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke={gridStroke}
            strokeDasharray={gridProps.strokeDasharray ?? "3 3"}
            shapeRendering="crispEdges"
          />
        )}

        {/* Pure, Smooth, Authentic Monotone Curve & Area Paths with Flawless 60fps Morphing */}
        <g clipPath={`url(#visx-line-reveal-clip-${chartId})`}>
          {dataKeys.map((key) => {
            const color = getSeriesColor(
              key,
              config,
              isDark,
              tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D")
            );
            const series = seriesProps.find((s) => s.dataKey === key);
            const strokeDasharray = series?.strokeVariant === "dashed" ? "4 4" : undefined;
            const strokeWidth = series?.strokeWidth ?? 1.85;

            const { areaPath, linePath } = generateUniformPaths(
              data,
              key,
              innerWidth,
              innerHeight,
              xScale,
              yScale,
              curve
            );

            return (
              <React.Fragment key={key}>
                <motion.path
                  d={areaPath}
                  fill={`url(#visx-area-gradient-${chartId}-${key})`}
                  initial={false}
                  animate={{ d: areaPath }}
                  transition={{
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
                <motion.path
                  d={linePath}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={false}
                  animate={{ d: linePath }}
                  transition={{
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              </React.Fragment>
            );
          })}
        </g>

        {/* Layer 3: Hardware-Accelerated Indicator Crosshair with 5-stop Gradient */}
        {hasIndicator && <TooltipIndicator {...indicatorProps} />}

        {/* Layer 3: Hardware-Accelerated Snapping Data Anchor Dot */}
        {hasDot && <TooltipDot {...dotProps} />}

        {/* Y Axis Labels - Smooth Position Gliding */}
        {yTicks.map(({ y, label, value }, i) => (
          <motion.text
            key={`ytick-slot-${i}`}
            initial={false}
            animate={{ y: y + 4.5 }}
            transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
            x={-10}
            textAnchor="end"
            fontSize={forceLight ? 18 : 13}
            className={cn(
              "font-mono select-none pointer-events-none font-semibold",
              forceLight ? "fill-slate-600" : "fill-brand-muted"
            )}
          >
            {label}
          </motion.text>
        ))}

        {/* X Axis Date Labels - Strictly ONLY Start and End */}
        {xAxisProps !== null &&
          xTicks.map(({ label, x, anchor }, i) => (
            <motion.text
              key={`xtick-slot-${i}`}
              initial={false}
              animate={{ x }}
              transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
              y={innerHeight + (xAxisProps?.tickMargin ?? 20)}
              textAnchor={anchor}
              fontSize={forceLight ? 18 : 13}
              className={cn(
                "font-mono select-none pointer-events-none font-semibold",
                forceLight ? "fill-slate-600" : "fill-brand-muted"
              )}
            >
              {label}
            </motion.text>
          ))}
      </g>
    </svg>
  );
});
MemoizedAreaCanvas.displayName = "MemoizedAreaCanvas";

// Interactive Chart Surface
const ChartInteractiveCanvas: React.FC<{
  gridProps: VisxGridProps | null;
  xAxisProps: VisxXAxisProps | null;
  yAxisProps: VisxYAxisProps | null;
  tooltipProps: VisxTooltipProps | null;
  seriesProps: VisxAreaSeriesProps[];
  hasIndicator: boolean;
  hasDot: boolean;
  hasDateTicker: boolean;
  indicatorProps?: any;
  dotProps?: any;
}> = ({
  gridProps,
  xAxisProps,
  yAxisProps,
  tooltipProps,
  seriesProps,
  hasIndicator,
  hasDot,
  hasDateTicker,
  indicatorProps,
  dotProps,
}) => {
  const {
    containerRef,
    handlePointerMove,
    handlePointerLeave,
    interactive,
    forceLight,
  } = useChart();

  return (
    <div
      ref={containerRef}
      onPointerMove={interactive !== false ? handlePointerMove : undefined}
      onPointerLeave={interactive !== false ? handlePointerLeave : undefined}
      className={cn(
        "relative w-full h-full select-none overflow-visible",
        interactive !== false ? "cursor-crosshair touch-none" : "cursor-default pointer-events-none"
      )}
    >
      {/* Memoized Static SVG Curve */}
      <MemoizedAreaCanvas
        gridProps={gridProps}
        xAxisProps={xAxisProps}
        yAxisProps={yAxisProps}
        seriesProps={seriesProps}
        hasIndicator={hasIndicator}
        hasDot={hasDot}
        indicatorProps={indicatorProps}
        dotProps={dotProps}
      />

      {/* Floating Animated Date Pill Indicator below the line */}
      {hasDateTicker && <DateTicker forceLight={forceLight} />}

      {/* Layer 4: Portal-Rendered Floating Tooltip */}
      {tooltipProps !== null && <TooltipBox {...tooltipProps} />}
    </div>
  );
};

export const AreaChartRoot: React.FC<VisxAreaChartProps> = ({
  data = [],
  config,
  className = "",
  curveType = "monotone",
  xDataKey = "date",
  height = 270,
  children,
  margin = { top: 12, right: 12, left: 12, bottom: 28 },
  interactive = true,
  staticIndex,
  id,
  forceLight = false,
}) => {
  // Extract subcomponents declaratively from children
  const {
    gridProps,
    xAxisProps,
    yAxisProps,
    brushProps,
    tooltipProps,
    seriesProps,
    hasIndicator,
    hasDot,
    hasDateTicker,
    indicatorProps,
    dotProps,
  } = useMemo(() => {
    let grid: VisxGridProps | null = null;
    let xAxis: VisxXAxisProps | null = null;
    let yAxis: VisxYAxisProps | null = null;
    let brush: VisxBrushProps | null = null;
    let tooltip: VisxTooltipProps | null = null;
    let indicatorFound = false;
    let dotFound = false;
    let dateTickerFound = false;
    let indicatorChildProps: any = null;
    let dotChildProps: any = null;
    const series: VisxAreaSeriesProps[] = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const type = child.type as any;
      const name = String(type?.displayName || type?.name || "");

      if (type === Grid || name.includes("Grid") || type?.__isGrid) {
        grid = child.props as VisxGridProps;
      } else if (type === XAxis || name.includes("XAxis") || type?.__isXAxis) {
        xAxis = child.props as VisxXAxisProps;
      } else if (type === YAxis || name.includes("YAxis") || type?.__isYAxis) {
        yAxis = child.props as VisxYAxisProps;
      } else if (type === Brush || name.includes("Brush") || type?.__isBrush) {
        brush = child.props as VisxBrushProps;
      } else if (type === Tooltip || name.includes("Tooltip") || type?.__isTooltip) {
        tooltip = child.props as VisxTooltipProps;
      } else if (type === Indicator || name.includes("Indicator") || type?.__isIndicator) {
        indicatorFound = true;
        indicatorChildProps = child.props;
      } else if (type === Dot || name.includes("Dot") || type?.__isDot) {
        dotFound = true;
        dotChildProps = child.props;
      } else if (type === DateTickerSlot || name.includes("DateTicker") || type?.__isDateTicker) {
        dateTickerFound = true;
      } else if (type === Area || name.includes("Area") || type?.__isArea) {
        series.push(child.props as VisxAreaSeriesProps);
      }
    });

    const finalHasIndicator = indicatorFound || tooltip !== null;
    const finalHasDot = dotFound || tooltip !== null;

    return {
      gridProps: grid,
      xAxisProps: xAxis,
      yAxisProps: yAxis,
      brushProps: brush as VisxBrushProps | null,
      tooltipProps: tooltip,
      seriesProps: series,
      hasIndicator: finalHasIndicator,
      hasDot: finalHasDot,
      hasDateTicker: dateTickerFound,
      indicatorProps: indicatorChildProps,
      dotProps: dotChildProps,
    };
  }, [children]);

  // Compute effective margins ensuring XAxis labels are never clipped
  const effectiveMargin = useMemo(() => {
    const hasYAxis = Boolean(yAxisProps && !(yAxisProps as VisxYAxisProps).hide);
    return {
      top: margin?.top ?? 12,
      right: margin?.right ?? 12,
      left: margin?.left ?? (hasYAxis ? 36 : 12),
      bottom: margin?.bottom ?? (xAxisProps !== null ? 28 : 10),
    };
  }, [margin, xAxisProps, yAxisProps]);

  // Synchronously calculate effective range whenever the data reference changes on tab switch
  const prevDataRef = useRef(data);
  const [range, setRange] = useState<VisxBrushRange>(() => ({
    startIndex: 0,
    endIndex: Math.max(0, data.length - 1),
  }));

  const isDataChanged = prevDataRef.current !== data;
  if (isDataChanged) {
    prevDataRef.current = data;
    setRange({
      startIndex: 0,
      endIndex: Math.max(0, data.length - 1),
    });
  }

  const effectiveRange = isDataChanged
    ? { startIndex: 0, endIndex: Math.max(0, data.length - 1) }
    : range;

  const handleBrushCommit = useCallback(
    (newRange: VisxBrushRange) => {
      setRange(newRange);
      if (brushProps && typeof brushProps.onChange === "function") {
        brushProps.onChange(newRange);
      }
    },
    [brushProps]
  );

  const hasBrush = Boolean(brushProps && data.length > 3);

  const visibleData = useMemo(() => {
    if (!hasBrush || data.length === 0) return data;
    const maxIdx = Math.max(0, data.length - 1);
    const start = Math.max(0, Math.min(effectiveRange.startIndex, maxIdx));
    const end = Math.max(start, Math.min(effectiveRange.endIndex, maxIdx));
    return data.slice(start, end + 1);
  }, [data, hasBrush, effectiveRange.startIndex, effectiveRange.endIndex]);

  const dataKeys = useMemo(() => {
    if (seriesProps.length > 0) {
      return seriesProps.map((s) => s.dataKey);
    }
    return Object.keys(config);
  }, [seriesProps, config]);

  const chartHeightPx = typeof height === "number" ? height : 270;

  return (
    <div className={cn("w-full select-none flex flex-col justify-start overflow-visible", className)}>
      {/* 1. Main Upper Area Chart */}
      <div className="w-full relative shrink-0" style={{ height: chartHeightPx }}>
        <ParentSize>
          {({ width, height: parentHeight }: { width: number; height: number }) => {
            if (width <= 0) return null;
            return (
              <ChartProvider
                data={visibleData}
                dataKeys={dataKeys}
                xDataKey={xDataKey}
                config={config}
                curveType={curveType}
                margin={effectiveMargin}
                width={width}
                height={parentHeight || chartHeightPx}
                id={id}
                interactive={interactive}
                staticIndex={staticIndex}
                forceLight={forceLight}
              >
                <ChartInteractiveCanvas
                  gridProps={gridProps}
                  xAxisProps={xAxisProps}
                  yAxisProps={yAxisProps}
                  tooltipProps={tooltipProps}
                  seriesProps={seriesProps}
                  hasIndicator={hasIndicator}
                  hasDot={hasDot}
                  hasDateTicker={hasDateTicker}
                  indicatorProps={indicatorProps}
                  dotProps={dotProps}
                />
              </ChartProvider>
            );
          }}
        </ParentSize>
      </div>

      {/* 2. Decoupled 60fps Brush Layer with Smooth Framer Motion Height Transition */}
      <AnimatePresence initial={false}>
        {hasBrush && (
          <motion.div
            key="brush-wrapper"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full overflow-visible"
          >
            <div className="pt-2 pb-2 px-1">
              <ChartBrushOverlay
                data={data}
                dataKeys={dataKeys}
                xDataKey={xDataKey}
                chartConfig={config}
                height={brushProps?.height ?? 52}
                minSpan={brushProps?.minSpan ?? 2}
                range={effectiveRange}
                onChange={handleBrushCommit}
                formatLabel={brushProps?.formatLabel}
                className={brushProps?.className}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AreaChart = Object.assign(AreaChartRoot, {
  Grid,
  XAxis,
  YAxis,
  Tooltip,
  Indicator,
  Dot,
  DateTicker: DateTickerSlot,
  Brush,
  Legend,
  Area,
});

export const VisxAreaChart = AreaChart;
