"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { ParentSize } from "@visx/responsive";
import { pie as visxPie, arc as visxArc } from "@visx/shape";
import { useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import {
  VisxPieChartProps,
  VisxPieSliceProps,
  VisxLegendProps,
  VisxTooltipProps,
} from "../types";
import { getSeriesColor, cn } from "../utils";
import { VisxTooltip } from "../ui/VisxTooltip";
import { NumberFlowAmount } from "@/components/ui";

import { AnimatedNumber } from "../motion/AnimatedNumber";
import { useMotionValue } from "framer-motion";

// Declarative Subcomponent Slots
const Pie: React.FC<VisxPieSliceProps> = () => null;
Pie.displayName = "VisxPieChart.Pie";
(Pie as any).__isPie = true;

const Legend: React.FC<VisxLegendProps> = () => null;
Legend.displayName = "VisxPieChart.Legend";
(Legend as any).__isLegend = true;

const Tooltip: React.FC<VisxTooltipProps> = () => null;
Tooltip.displayName = "VisxPieChart.Tooltip";
(Tooltip as any).__isTooltip = true;

interface AnimatedPieArcProps {
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  padAngle: number;
  cornerRadius: number;
  color: string;
  stroke: string;
  strokeWidth?: number;
  isHovered: boolean;
  isDimmed: boolean;
  onPointerMove?: (e: React.PointerEvent<SVGPathElement>) => void;
  onPointerLeave?: () => void;
  onClick?: () => void;
}

const AnimatedPieArc: React.FC<AnimatedPieArcProps> = ({
  startAngle,
  endAngle,
  innerRadius,
  outerRadius,
  padAngle,
  cornerRadius,
  color,
  stroke,
  strokeWidth = 2,
  isHovered,
  isDimmed,
  onPointerMove,
  onPointerLeave,
  onClick,
}) => {
  // Framer-motion springs for ultra-smooth angle interpolation on data changes
  const springStart = useSpring(startAngle, { stiffness: 180, damping: 22, mass: 0.6 });
  const springEnd = useSpring(endAngle, { stiffness: 180, damping: 22, mass: 0.6 });

  useEffect(() => {
    springStart.set(startAngle);
    springEnd.set(endAngle);
  }, [startAngle, endAngle, springStart, springEnd]);

  // Arc path generator
  const arcGen = useMemo(() => {
    return visxArc<any>()
      .innerRadius(() => innerRadius)
      .outerRadius(() => outerRadius)
      .padAngle(() => padAngle)
      .cornerRadius(() => cornerRadius);
  }, [innerRadius, outerRadius, padAngle, cornerRadius]);

  // Reactive motion value for SVG path 'd'
  const pathD = useTransform([springStart, springEnd], ([s, e]) => {
    return (
      arcGen({
        startAngle: Number(s),
        endAngle: Number(e),
      }) || ""
    );
  });

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{
        opacity: isDimmed ? 0.35 : 1,
      }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.18,
      }}
    >
      <motion.path
        d={pathD}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className="cursor-pointer transition-opacity duration-150 focus:outline-none select-none"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
      />
    </motion.g>
  );
};

interface InnerPieChartProps {
  width: number;
  height: number;
  data: any[];
  dataKey: string;
  nameKey: string;
  config: any;
  pieProps: VisxPieSliceProps | null;
  legendProps: VisxLegendProps | null;
  tooltipProps: VisxTooltipProps | null;
  valueFormatter?: (val: number) => string;
  onSliceClick?: (item: any, index: number) => void;
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
}

const InnerPieChart: React.FC<InnerPieChartProps> = ({
  width,
  height,
  data,
  dataKey,
  nameKey,
  config,
  pieProps,
  legendProps,
  tooltipProps,
  valueFormatter,
  onSliceClick,
  activeIndex,
  onActiveIndexChange,
}) => {
  const { isDark, tokens } = useTheme();
  const [internalHoveredIdx, setInternalHoveredIdx] = useState<number | null>(null);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const hoveredIdx = activeIndex !== undefined ? activeIndex : internalHoveredIdx;

  const setHovered = useCallback(
    (idx: number | null) => {
      setInternalHoveredIdx(idx);
      onActiveIndexChange?.(idx);
    },
    [onActiveIndexChange]
  );

  // Smooth floating spring-gliding tooltip
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, { stiffness: 220, damping: 24 });
  const springY = useSpring(targetY, { stiffness: 220, damping: 24 });
  const hoverOpacity = useSpring(0, { stiffness: 350, damping: 30 });

  const [hoveredData, setHoveredData] = useState<{
    item: any;
    percentage: number;
    color: string;
  } | null>(null);
  const [flipped, setFlipped] = useState(false);

  // Filter out disabled legend items
  const activeData = useMemo(() => {
    return data.filter((item) => !hiddenKeys.has(item[nameKey]));
  }, [data, nameKey, hiddenKeys]);

  const totalValue = useMemo(() => {
    return activeData.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);
  }, [activeData, dataKey]);

  // Layout geometry
  const hasRightLegend = legendProps !== null && (legendProps?.position === "right" || (!legendProps?.position && width > 340));
  const legendWidth = hasRightLegend ? 130 : 0;
  const chartAvailableWidth = width - legendWidth;

  useEffect(() => {
    const unsubscribe = springX.on("change", (x) => {
      setFlipped(x > chartAvailableWidth - 170);
    });
    return () => unsubscribe();
  }, [springX, chartAvailableWidth]);

  const radius = Math.min(chartAvailableWidth, height) / 2;
  const centerY = height / 2;
  const centerX = chartAvailableWidth / 2;

  // Sleek donut radius
  const rawInner = pieProps?.innerRadius ?? "64%";
  const innerRadiusPx = typeof rawInner === "number"
    ? rawInner
    : (parseFloat(String(rawInner)) / 100) * radius;

  const outerRadiusPx = Math.max(radius - 6, innerRadiusPx + 12);
  const padAngle = (pieProps?.paddingAngle ?? 3) * (Math.PI / 180);
  const cornerRadius = pieProps?.cornerRadius ?? 5;

  // Compute pie arcs using @visx/shape pie generator
  const pieArcs = useMemo(() => {
    if (activeData.length === 0 || totalValue <= 0) return [];
    const pieGen = visxPie<any>()
      .value((d) => Number(d[dataKey]) || 0)
      .sortValues(() => 0)
      .padAngle(padAngle);
    return pieGen(activeData);
  }, [activeData, dataKey, padAngle, totalValue]);

  const toggleLegendItem = useCallback((key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* SVG Canvas */}
      <svg width={chartAvailableWidth} height={height} className="overflow-visible select-none">
        <g transform={`translate(${centerX}, ${centerY})`}>
          <AnimatePresence mode="sync">
            {pieArcs.map((arc, index) => {
              const item = arc.data;
              const key = item[nameKey] ?? `slice-${index}`;
              const color = getSeriesColor(key, config, isDark, "#f97316");
              const isHovered = hoveredIdx === index;
              const val = Number(item[dataKey]) || 0;
              const percentage = totalValue > 0 ? (val / totalValue) * 100 : 0;

              return (
                <AnimatedPieArc
                  key={`arc-${key}`}
                  startAngle={arc.startAngle}
                  endAngle={arc.endAngle}
                  innerRadius={innerRadiusPx}
                  outerRadius={outerRadiusPx}
                  padAngle={padAngle}
                  cornerRadius={cornerRadius}
                  color={color}
                  stroke={isDark ? tokens.surface.base || "#141418" : "#ffffff"}
                  strokeWidth={2}
                  isHovered={isHovered}
                  isDimmed={hoveredIdx !== null && !isHovered}
                  onPointerMove={(e) => {
                    setHovered(index);
                    const point = localPoint(e);
                    if (point) {
                      if (hoverOpacity.get() === 0) {
                        targetX.jump(point.x);
                        targetY.jump(point.y);
                        springX.jump(point.x);
                        springY.jump(point.y);
                      } else {
                        targetX.set(point.x);
                        targetY.set(point.y);
                      }
                      hoverOpacity.set(1);
                      setHoveredData({ item, percentage, color });
                    }
                  }}
                  onPointerLeave={() => {
                    setHovered(null);
                    hoverOpacity.set(0);
                  }}
                  onClick={() => {
                    if (onSliceClick) onSliceClick(item, index);
                  }}
                />
              );
            })}
          </AnimatePresence>
        </g>
      </svg>

      {/* Interactive Center Donut Metric Overlay */}
      <div
        className="absolute pointer-events-none flex flex-col items-center justify-center text-center select-none"
        style={{
          left: centerX,
          top: centerY,
          transform: "translate(-50%, -50%)",
          width: Math.max(innerRadiusPx * 1.6, 60),
          maxWidth: Math.max(innerRadiusPx * 1.6, 60),
        }}
      >
        <motion.div
          key={`center-${hoveredIdx !== null && activeData[hoveredIdx] ? activeData[hoveredIdx][nameKey] || hoveredIdx : "total"}`}
          initial={{ opacity: 0.6, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex flex-col items-center justify-center w-full min-w-0"
        >
          <div className="font-mono font-bold text-xs sm:text-sm text-brand-primary truncate max-w-full px-1">
            {hoveredIdx !== null && activeData[hoveredIdx] ? (
              valueFormatter ? (
                valueFormatter(Number(activeData[hoveredIdx][dataKey]) || 0)
              ) : (
                <NumberFlowAmount value={Number(activeData[hoveredIdx][dataKey]) || 0} />
              )
            ) : valueFormatter ? (
              valueFormatter(totalValue)
            ) : (
              <NumberFlowAmount value={totalValue} />
            )}
          </div>
          <div className="text-[9px] uppercase font-mono tracking-wider text-brand-muted truncate max-w-full px-1">
            {hoveredIdx !== null && activeData[hoveredIdx]
              ? config[activeData[hoveredIdx][nameKey]]?.label || activeData[hoveredIdx].label || "Selected"
              : "Total"}
          </div>
        </motion.div>
      </div>

      {/* Optional Side Legend */}
      {hasRightLegend && legendProps && (
        <div className="flex flex-col gap-1.5 justify-center pl-2 pr-1 shrink-0 max-h-[90%] overflow-y-auto custom-scrollbar select-none">
          {data.map((item, idx) => {
            const key = item[nameKey];
            const color = getSeriesColor(key, config, isDark, "#f97316");
            const isHidden = hiddenKeys.has(key);
            const isHovered = hoveredIdx === idx;
            const label = config[key]?.label || item.label || key;

            return (
              <button
                key={`legend-${key}-${idx}`}
                type="button"
                onClick={() => legendProps.isClickable !== false && toggleLegendItem(key)}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  "flex items-center gap-2 text-left text-xs transition-opacity duration-150 cursor-pointer py-0.5 px-1.5 rounded-lg",
                  isHidden ? "opacity-35 line-through" : isHovered ? "bg-surface-subtle font-semibold" : "opacity-90 hover:opacity-100"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] text-brand-primary truncate max-w-[100px] leading-tight">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Floating Animated Spring Tooltip Card with Exact Design System */}
      <motion.div
        style={{
          x: springX,
          y: springY,
          opacity: hoverOpacity,
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 50,
          willChange: "transform, opacity",
        }}
      >
        <div
          style={{
            transformOrigin: flipped ? "right top" : "left top",
            transform: flipped ? "translateX(calc(-100% - 12px)) translateY(-50%)" : "translateX(12px) translateY(-50%)",
            transition: "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          className="rounded-2xl border border-border-default bg-surface-base shadow-2xl px-4 py-3 min-w-[150px] max-w-[270px] text-xs text-brand-primary select-none"
        >
          {hoveredData && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[12px] font-medium text-brand-primary leading-tight">
                {config[hoveredData.item[nameKey]]?.label || hoveredData.item.label || hoveredData.item[nameKey]}
              </div>

              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: hoveredData.color }}
                    />
                    <span className="text-brand-muted text-[11px] font-medium truncate">
                      Amount
                    </span>
                  </div>
                  <AnimatedNumber
                    value={Number(hoveredData.item[dataKey]) || 0}
                    format={valueFormatter ? (n) => valueFormatter(n) : undefined}
                    className="font-semibold text-brand-primary text-xs shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-brand-muted text-[11px] pl-4.5">Share</span>
                  <span className="font-semibold text-brand-secondary text-xs tabular-nums shrink-0">
                    {hoveredData.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const VisxPieChartRoot: React.FC<VisxPieChartProps> = ({
  data = [],
  dataKey,
  nameKey,
  config = {},
  className = "",
  style,
  height = "100%",
  children,
  valueFormatter,
  onSliceClick,
  activeIndex,
  onActiveIndexChange,
}) => {
  const { pieProps, legendProps, tooltipProps } = useMemo(() => {
    let pie: VisxPieSliceProps | null = null;
    let legend: VisxLegendProps | null = null;
    let tooltip: VisxTooltipProps | null = null;

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const type = child.type as any;
      const name = String(type?.displayName || type?.name || "");

      if (type === Pie || name.includes("Pie") || type?.__isPie) {
        pie = child.props as VisxPieSliceProps;
      } else if (type === Legend || name.includes("Legend") || type?.__isLegend) {
        legend = child.props as VisxLegendProps;
      } else if (type === Tooltip || name.includes("Tooltip") || type?.__isTooltip) {
        tooltip = child.props as VisxTooltipProps;
      }
    });

    return { pieProps: pie, legendProps: legend, tooltipProps: tooltip };
  }, [children]);

  return (
    <div
      className={cn("w-full h-full relative select-none flex items-center justify-center", className)}
      style={style}
    >
      <ParentSize>
        {({ width, height: pHeight }: { width: number; height: number }) => {
          if (width <= 0) return null;
          const chartH = typeof height === "number" ? height : (pHeight > 0 ? pHeight : 250);
          return (
            <InnerPieChart
              width={width}
              height={chartH}
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              config={config}
              pieProps={pieProps}
              legendProps={legendProps}
              tooltipProps={tooltipProps}
              valueFormatter={valueFormatter}
              onSliceClick={onSliceClick}
              activeIndex={activeIndex}
              onActiveIndexChange={onActiveIndexChange}
            />
          );
        }}
      </ParentSize>
    </div>
  );
};

export const VisxPieChart = Object.assign(VisxPieChartRoot, {
  Pie,
  Legend,
  Tooltip,
});

