"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/evilcharts/ui/recharts-chart";
import {
  EvilBrush,
  Brush,
  type BrushProps,
  type EvilBrushRange,
} from "@/components/evilcharts/ui/recharts-brush";
import { cn } from "../utils";

export interface AreaGridProps {
  show?: boolean;
  strokeDasharray?: string;
  vertical?: boolean;
  horizontal?: boolean;
  className?: string;
}

export interface AreaXAxisProps {
  dataKey?: string;
  tickLine?: boolean;
  axisLine?: boolean;
  tickMargin?: number;
  minTickGap?: number;
  interval?: "preserveStartEnd" | "preserveStart" | "preserveEnd" | "equidistantPreserveStart" | number | "auto";
  tickFormatter?: (value: unknown) => string;
  className?: string;
}

export interface AreaYAxisProps {
  dataKey?: string;
  tickLine?: boolean;
  axisLine?: boolean;
  tickMargin?: number;
  tickFormatter?: (value: unknown) => string;
  className?: string;
  hide?: boolean;
}

export interface AreaLegendProps {
  isClickable?: boolean;
  verticalAlign?: "top" | "bottom";
  className?: string;
}

export interface AreaTooltipProps {
  cursor?: boolean | object;
  content?: React.ReactElement;
  indicator?: "dot" | "line" | "dashed";
  formatter?: (value: any, name: any, item: any, index: number, payload: any) => React.ReactNode;
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
  curveType?: "linear" | "monotone" | "step" | "natural" | "basis" | "bump";
  color?: string;
  isAnimationActive?: boolean;
  animationDuration?: number;
  animationEasing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  children?: React.ReactNode;
}

const Grid: React.FC<AreaGridProps> = () => null;
Grid.displayName = "EvilAreaChart.Grid";
(Grid as any).__isGrid = true;

const XAxis: React.FC<AreaXAxisProps> = () => null;
XAxis.displayName = "EvilAreaChart.XAxis";
(XAxis as any).__isXAxis = true;

const YAxis: React.FC<AreaYAxisProps> = () => null;
YAxis.displayName = "EvilAreaChart.YAxis";
(YAxis as any).__isYAxis = true;

const Legend: React.FC<AreaLegendProps> = () => null;
Legend.displayName = "EvilAreaChart.Legend";
(Legend as any).__isLegend = true;

const Tooltip: React.FC<AreaTooltipProps> = () => null;
Tooltip.displayName = "EvilAreaChart.Tooltip";
(Tooltip as any).__isTooltip = true;

const Dot: React.FC<AreaDotProps> = () => null;
Dot.displayName = "EvilAreaChart.Dot";
(Dot as any).__isDot = true;

const ActiveDot: React.FC<AreaActiveDotProps> = () => null;
ActiveDot.displayName = "EvilAreaChart.ActiveDot";
(ActiveDot as any).__isActiveDot = true;

const AreaSeries: React.FC<AreaSeriesProps> = () => null;
AreaSeries.displayName = "EvilAreaChart.Area";
(AreaSeries as any).__isArea = true;

export interface EvilAreaChartProps {
  data: Record<string, unknown>[];
  config: ChartConfig;
  className?: string;
  curveType?: "linear" | "monotone" | "step" | "natural" | "basis" | "bump";
  xDataKey?: string;
  stackType?: "default" | "stacked" | "expanded";
  height?: number | string;
  isAnimationActive?: boolean;
  animationDuration?: number;
  animationEasing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  children?: React.ReactNode;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

export interface ExtractedSubcomponents {
  gridProps: AreaGridProps | null;
  xAxisProps: AreaXAxisProps | null;
  yAxisProps: AreaYAxisProps | null;
  brushProps: BrushProps | null;
  legendProps: AreaLegendProps | null;
  tooltipProps: AreaTooltipProps | null;
  areas: AreaSeriesProps[];
}

const EvilAreaChartRoot: React.FC<EvilAreaChartProps> = ({
  data = [],
  config,
  className = "",
  curveType = "monotone",
  xDataKey = "date",
  stackType = "default",
  height = 270,
  isAnimationActive = true,
  animationDuration = 250,
  animationEasing = "ease-out",
  children,
  margin = { top: 4, right: 0, left: 0, bottom: 0 },
}) => {
  const subcomponents = React.useMemo<ExtractedSubcomponents>(() => {
    let grid: AreaGridProps | null = null;
    let xAxis: AreaXAxisProps | null = null;
    let yAxis: AreaYAxisProps | null = null;
    let brush: BrushProps | null = null;
    let legend: AreaLegendProps | null = null;
    let tooltip: AreaTooltipProps | null = null;
    const areaList: AreaSeriesProps[] = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const type = child.type as any;
      const name = String(type?.displayName || type?.name || "");
      if (type === Grid || name.includes("Grid") || type?.__isGrid || (child.props as any)?.__isGrid) {
        grid = child.props as AreaGridProps;
      } else if (type === XAxis || name.includes("XAxis") || type?.__isXAxis || (child.props as any)?.__isXAxis) {
        xAxis = child.props as AreaXAxisProps;
      } else if (type === YAxis || name.includes("YAxis") || type?.__isYAxis || (child.props as any)?.__isYAxis) {
        yAxis = child.props as AreaYAxisProps;
      } else if (type === Brush || name.includes("Brush") || type?.__isBrush || (child.props as any)?.__isBrush || (child.props as any)?.formatLabel !== undefined) {
        brush = child.props as BrushProps;
      } else if (type === Legend || name.includes("Legend") || type?.__isLegend || (child.props as any)?.__isLegend) {
        legend = child.props as AreaLegendProps;
      } else if (type === Tooltip || name.includes("Tooltip") || type?.__isTooltip || (child.props as any)?.__isTooltip) {
        tooltip = child.props as AreaTooltipProps;
      } else if (type === AreaSeries || name.includes("Area") || type?.__isArea || (child.props as any)?.__isArea || (child.props as any)?.dataKey) {
        areaList.push(child.props as AreaSeriesProps);
      }
    });

    return {
      gridProps: grid,
      xAxisProps: xAxis,
      yAxisProps: yAxis,
      brushProps: brush,
      legendProps: legend,
      tooltipProps: tooltip,
      areas: areaList,
    };
  }, [children]);

  const gridProps = subcomponents.gridProps;
  const xAxisProps = subcomponents.xAxisProps;
  const yAxisProps = subcomponents.yAxisProps;
  const brushProps = subcomponents.brushProps;
  const legendProps = subcomponents.legendProps;
  const tooltipProps = subcomponents.tooltipProps;
  const areas = subcomponents.areas;

  const [range, setRange] = React.useState<EvilBrushRange>(() => ({
    startIndex: 0,
    endIndex: Math.max(0, data.length - 1),
  }));

  const deferredRange = React.useDeferredValue(range);

  React.useEffect(() => {
    setRange({
      startIndex: 0,
      endIndex: Math.max(0, data.length - 1),
    });
  }, [data.length]);

  const handleBrushChange = React.useCallback(
    (newRange: EvilBrushRange) => {
      setRange(newRange);
      if (brushProps && typeof brushProps.onChange === "function") {
        brushProps.onChange(newRange);
      }
    },
    [brushProps]
  );

  const hasBrush = Boolean(brushProps && data.length > 2);

  const visibleData = React.useMemo(() => {
    if (!hasBrush || data.length === 0) return data;
    const start = Math.max(0, Math.min(deferredRange.startIndex, data.length - 1));
    const end = Math.max(start, Math.min(deferredRange.endIndex, data.length - 1));
    return data.slice(start, end + 1);
  }, [data, hasBrush, deferredRange.startIndex, deferredRange.endIndex]);

  const seriesToRender: AreaSeriesProps[] = areas.length > 0
    ? areas
    : Object.keys(config).map((key) => ({ dataKey: key, variant: "gradient" as const }));

  const dataKeys = seriesToRender.map((s) => s.dataKey);

  const chartHeightPx = typeof height === "number" ? height : 270;

  return (
    <div className={cn("w-full select-none relative flex flex-col justify-start overflow-hidden", className)}>
      {/* 1. Upper Main Area Chart: Constant Height = Zero Coordinate Lag */}
      <div
        className="w-full relative shrink-0"
        style={{ height: chartHeightPx }}
      >
        <ChartContainer
          config={config}
          className="w-full h-full"
        >
          <RechartsPrimitive.AreaChart
            accessibilityLayer
            data={visibleData}
            margin={margin}
          >
            <defs>
              {seriesToRender.map((series) => (
                <linearGradient
                  key={series.dataKey}
                  id={`fill-${series.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${series.dataKey}-0)`}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${series.dataKey}-0)`}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              ))}
            </defs>

            {gridProps !== null && (
              <RechartsPrimitive.CartesianGrid
                vertical={gridProps.vertical ?? false}
                horizontal={gridProps.horizontal ?? true}
                strokeDasharray={gridProps.strokeDasharray ?? "3 3"}
                className={cn("stroke-border-default/40", gridProps.className)}
              />
            )}

            {xAxisProps !== null && (
              <RechartsPrimitive.XAxis
                dataKey={xAxisProps.dataKey || xDataKey}
                tickLine={xAxisProps.tickLine ?? false}
                axisLine={xAxisProps.axisLine ?? false}
                tickMargin={xAxisProps.tickMargin ?? 6}
                minTickGap={xAxisProps.minTickGap ?? 14}
                interval={xAxisProps.interval === "auto" ? undefined : (xAxisProps.interval ?? "preserveStartEnd")}
                tickFormatter={xAxisProps.tickFormatter}
                className={cn("text-[11px] font-sans text-brand-muted", xAxisProps.className)}
              />
            )}

            {yAxisProps !== null && !yAxisProps.hide && (
              <RechartsPrimitive.YAxis
                dataKey={yAxisProps.dataKey}
                tickLine={yAxisProps.tickLine ?? false}
                axisLine={yAxisProps.axisLine ?? false}
                tickMargin={yAxisProps.tickMargin ?? 6}
                tickFormatter={yAxisProps.tickFormatter}
                className={cn("text-[10px] font-mono text-brand-muted", yAxisProps.className)}
              />
            )}

            {legendProps !== null && (
              <ChartLegend
                verticalAlign={legendProps.verticalAlign ?? "top"}
                content={<ChartLegendContent className={legendProps.className} />}
              />
            )}

            {tooltipProps !== null && (
              <ChartTooltip
                cursor={tooltipProps.cursor ?? { stroke: "var(--color-border-default)", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={
                  tooltipProps.content || (
                    <ChartTooltipContent
                      indicator={tooltipProps.indicator ?? "dot"}
                      formatter={tooltipProps.formatter}
                    />
                  )
                }
              />
            )}

            {seriesToRender.map((series) => {
              const isDashed = series.strokeVariant === "dashed" || series.strokeVariant === "animated-dashed";
              const effectiveCurve = series.curveType || curveType;
              const stackId = stackType === "stacked" || stackType === "expanded" ? "stack" : undefined;

              return (
                <RechartsPrimitive.Area
                  key={series.dataKey}
                  dataKey={series.dataKey}
                  name={series.name}
                  type={effectiveCurve}
                  fill={`url(#fill-${series.dataKey})`}
                  fillOpacity={1}
                  stroke={`var(--color-${series.dataKey}-0)`}
                  strokeWidth={series.strokeWidth ?? 2}
                  strokeDasharray={isDashed ? "4 4" : undefined}
                  stackId={stackId}
                  isAnimationActive={series.isAnimationActive ?? isAnimationActive}
                  animationDuration={series.animationDuration ?? animationDuration}
                  animationEasing={series.animationEasing ?? animationEasing}
                />
              );
            })}
          </RechartsPrimitive.AreaChart>
        </ChartContainer>
      </div>

      {/* 2. Bottom Brush Drawer: Smooth Accordion Expand/Collapse */}
      <div
        className={cn(
          "w-full overflow-hidden transition-[height,opacity,margin-top] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
          hasBrush
            ? "h-[68px] opacity-100 mt-2 pointer-events-auto"
            : "h-0 opacity-0 mt-0 pointer-events-none"
        )}
      >
        <div className="w-full h-[60px] min-h-[60px] px-2 pt-1 pb-1">
          <EvilBrush
            data={data}
            chartConfig={config}
            dataKeys={dataKeys}
            xDataKey={xDataKey}
            height={56}
            formatLabel={brushProps?.formatLabel}
            startIndex={range.startIndex}
            endIndex={range.endIndex}
            onChange={handleBrushChange}
            curveType={curveType}
            stacked={stackType === "stacked" || stackType === "expanded"}
            className="w-full h-[56px] !mt-0"
          />
        </div>
      </div>
    </div>
  );
};

export const EvilAreaChart = Object.assign(EvilAreaChartRoot, {
  Grid,
  XAxis,
  YAxis,
  Brush,
  Legend,
  Tooltip,
  Area: AreaSeries,
  Dot,
  ActiveDot,
});