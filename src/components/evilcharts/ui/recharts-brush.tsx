"use client";

import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar } from "recharts";
import { ChartStyle, getColorsCount, type ChartConfig } from "@/components/evilcharts/ui/recharts-chart";
import { useCallback, useEffect, type ComponentProps, type FC } from "react";
import type { MotionValue } from "motion/react";
import { cn } from "./utils";
import * as React from "react";

type EvilBrushVariant = "line" | "area" | "bar";
type CurveType = ComponentProps<typeof Area>["type"];

export interface EvilBrushRange {
  startIndex: number;
  endIndex: number;
}

export interface BrushProps {
  height?: number;
  formatLabel?: (value: unknown, index: number) => string;
  onChange?: (range: EvilBrushRange) => void;
}

export const Brush: FC<BrushProps> = () => null;
Brush.displayName = "EvilAreaChart.Brush";
(Brush as any).__isBrush = true;

export interface EvilBrushProps {
  data: Record<string, unknown>[];
  chartConfig: ChartConfig;
  dataKeys?: string[];
  xDataKey?: string;
  variant?: EvilBrushVariant;
  height?: number;
  className?: string;
  stacked?: boolean;
  strokeVariant?: "solid" | "dashed" | "animated-dashed";
  connectNulls?: boolean;
  barRadius?: number;
  startIndex?: number;
  endIndex?: number;
  defaultStartIndex?: number;
  defaultEndIndex?: number;
  onChange?: (range: EvilBrushRange) => void;
  formatLabel?: (value: unknown, index: number) => string;
  curveType?: CurveType;
  minSpan?: number;
  showLabels?: boolean;
  skipStyle?: boolean;
}

const SPRING_CONFIG = { stiffness: 450, damping: 38, mass: 0.35 };

type DragType = "left" | "right" | "middle";

interface DragState {
  type: DragType;
  originX: number;
  originRange: EvilBrushRange;
}

function useBrushDrag({
  range,
  totalPoints,
  containerRef,
  commit,
}: {
  range: EvilBrushRange;
  totalPoints: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  commit: (next: EvilBrushRange, mode?: DragType) => void;
}) {
  const dragRef = React.useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const toIndexDelta = useCallback(
    (px: number) => {
      if (!containerRef.current || totalPoints <= 1) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return 0;
      return Math.round((px / rect.width) * (totalPoints - 1));
    },
    [totalPoints, containerRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent, type: DragType) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch { }
      dragRef.current = { type, originX: e.clientX, originRange: { ...range } };
      setIsDragging(true);
    },
    [range],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;

      const delta = toIndexDelta(e.clientX - d.originX);
      const { type, originRange: o } = d;

      if (type === "left") {
        commit({ startIndex: o.startIndex + delta, endIndex: o.endIndex }, "left");
      } else if (type === "right") {
        commit({ startIndex: o.startIndex, endIndex: o.endIndex + delta }, "right");
      } else {
        const span = o.endIndex - o.startIndex;
        let s = o.startIndex + delta;
        let e2 = s + span;
        if (s < 0) {
          s = 0;
          e2 = span;
        }
        if (e2 > totalPoints - 1) {
          e2 = totalPoints - 1;
          s = Math.max(0, e2 - span);
        }
        commit({ startIndex: s, endIndex: e2 }, "middle");
      }
    },
    [toIndexDelta, totalPoints, commit],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch { }
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const bind = useCallback(
    (type: DragType) => ({
      onPointerDown: (e: React.PointerEvent) => onPointerDown(e, type),
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    }),
    [onPointerDown, onPointerMove, onPointerUp],
  );

  return { isDragging, bind };
}

export function EvilBrush({
  data,
  chartConfig,
  dataKeys,
  xDataKey,
  variant = "area",
  height = 56,
  className,
  stacked = false,
  strokeVariant = "solid",
  connectNulls = false,
  barRadius,
  startIndex: controlledStart,
  endIndex: controlledEnd,
  defaultStartIndex = 0,
  defaultEndIndex,
  onChange,
  formatLabel,
  curveType = "monotone",
  minSpan = 2,
  showLabels = true,
  skipStyle = false,
}: EvilBrushProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const keys = React.useMemo(() => dataKeys ?? Object.keys(chartConfig), [dataKeys, chartConfig]);
  const totalPoints = data.length;
  const chartId = React.useId().replace(/:/g, "");

  const isControlled = controlledStart !== undefined && controlledEnd !== undefined;

  const [internalRange, setInternalRange] = React.useState<EvilBrushRange>(() => ({
    startIndex: Math.max(0, Math.min(defaultStartIndex, totalPoints - 1)),
    endIndex: Math.max(0, Math.min(defaultEndIndex ?? totalPoints - 1, totalPoints - 1)),
  }));

  const lastCommittedRef = React.useRef<EvilBrushRange>(internalRange);

  useEffect(() => {
    if (!isControlled) {
      setInternalRange((prev) => {
        const adjusted = {
          startIndex: Math.min(prev.startIndex, Math.max(0, totalPoints - 1)),
          endIndex: Math.min(prev.endIndex, Math.max(0, totalPoints - 1)),
        };
        lastCommittedRef.current = adjusted;
        return adjusted;
      });
    }
  }, [totalPoints, isControlled]);

  const clampRange = useCallback(
    (range: EvilBrushRange, mode?: DragType): EvilBrushRange => {
      let { startIndex, endIndex } = range;
      const maxIndex = Math.max(0, totalPoints - 1);

      startIndex = Math.max(0, Math.min(startIndex, maxIndex));
      endIndex = Math.max(0, Math.min(endIndex, maxIndex));

      if (mode === "left") {
        const maxStart = Math.max(0, endIndex - minSpan);
        startIndex = Math.min(startIndex, maxStart);
        return { startIndex, endIndex };
      }

      if (mode === "right") {
        const minEnd = Math.min(maxIndex, startIndex + minSpan);
        endIndex = Math.max(endIndex, minEnd);
        return { startIndex, endIndex };
      }

      if (endIndex - startIndex < minSpan) {
        endIndex = Math.min(startIndex + minSpan, maxIndex);
        if (endIndex - startIndex < minSpan) {
          startIndex = Math.max(0, endIndex - minSpan);
        }
      }
      return { startIndex, endIndex };
    },
    [totalPoints, minSpan],
  );

  const commit = useCallback(
    (next: EvilBrushRange, mode?: DragType) => {
      const clamped = clampRange(next, mode);
      const last = lastCommittedRef.current;

      if (last.startIndex === clamped.startIndex && last.endIndex === clamped.endIndex) {
        return;
      }

      lastCommittedRef.current = clamped;
      setInternalRange(clamped);
      React.startTransition(() => {
        onChange?.(clamped);
      });
    },
    [clampRange, onChange],
  );

  const { isDragging, bind } = useBrushDrag({
    range: internalRange,
    totalPoints,
    containerRef,
    commit,
  });

  const range = internalRange;

  useEffect(() => {
    if (isControlled && !isDragging) {
      const syncedRange = { startIndex: controlledStart, endIndex: controlledEnd };
      setInternalRange(syncedRange);
      lastCommittedRef.current = syncedRange;
    }
  }, [isControlled, controlledStart, controlledEnd, isDragging]);

  const leftPct = totalPoints > 1 ? (range.startIndex / (totalPoints - 1)) * 100 : 0;
  const rightPct = totalPoints > 1 ? (range.endIndex / (totalPoints - 1)) * 100 : 100;

  const leftTarget = useMotionValue(leftPct);
  const rightTarget = useMotionValue(rightPct);
  if (leftTarget.get() !== leftPct) leftTarget.set(leftPct);
  if (rightTarget.get() !== rightPct) rightTarget.set(rightPct);

  const leftSpring = useSpring(leftTarget, SPRING_CONFIG);
  const rightSpring = useSpring(rightTarget, SPRING_CONFIG);
  const leftPosition = useTransform(leftSpring, (v: number) => `${v}%`);
  const rightPosition = useTransform(rightSpring, (v: number) => `${v}%`);
  const leftOverlayWidth = useTransform(leftSpring, (v: number) => `${v}%`);
  const rightOverlayWidth = useTransform(rightSpring, (v: number) => `${Math.max(0, 100 - v)}%`);
  const selectedWidth = useMotionValue(`${Math.max(0, rightPct - leftPct)}%`);

  const updateSelectedWidth = useCallback(() => {
    selectedWidth.set(`${Math.max(0, rightSpring.get() - leftSpring.get())}%`);
  }, [leftSpring, rightSpring, selectedWidth]);

  useMotionValueEvent(leftSpring, "change", updateSelectedWidth);
  useMotionValueEvent(rightSpring, "change", updateSelectedWidth);

  const getLabel = useCallback(
    (idx: number) => {
      if (!xDataKey) return String(idx);
      const v = data[idx]?.[xDataKey];
      return formatLabel ? formatLabel(v, idx) : String(v ?? idx);
    },
    [data, xDataKey, formatLabel],
  );

  if (totalPoints === 0) return null;

  return (
    <div
      ref={containerRef}
      data-chart={skipStyle ? undefined : chartId}
      className={cn("group relative select-none rounded-[8px]", className)}
      style={{ height }}
    >
      {!skipStyle && <ChartStyle id={chartId} config={chartConfig} />}

      {/* Mini chart preview - only this inner preview gets overflow-hidden */}
      <div className="absolute inset-0 overflow-hidden rounded-[8px] pointer-events-none select-none border border-border-default/60 bg-surface-subtle/40">
        <MiniChart
          data={data}
          keys={keys}
          chartConfig={chartConfig}
          variant={variant}
          curveType={curveType}
          chartId={chartId}
          stacked={stacked}
          strokeVariant={strokeVariant === "animated-dashed" ? "dashed" : strokeVariant}
          connectNulls={connectNulls}
          barRadius={barRadius}
        />
      </div>

      {/* Dim overlay left */}
      <motion.div
        className="bg-background/70 pointer-events-none select-none absolute inset-y-0 left-0 rounded-l-[8px] backdrop-blur-[2px]"
        style={{ width: leftOverlayWidth }}
      />
      {/* Dim overlay right */}
      <motion.div
        className="bg-background/70 pointer-events-none select-none absolute inset-y-0 right-0 rounded-r-[8px] backdrop-blur-[2px]"
        style={{ width: rightOverlayWidth }}
      />

      {/* Selected region */}
      <motion.div
        className="absolute inset-y-0 z-10 cursor-grab touch-none select-none rounded-[6px] border border-border-hover/80 active:cursor-grabbing"
        style={{ left: leftPosition, width: selectedWidth }}
        {...bind("middle")}
      />

      {/* Left handle: centered with transform without negative clipping */}
      <motion.div
        className="absolute inset-y-0 z-30 pointer-events-none transform-gpu will-change-transform flex items-center justify-center -translate-x-1/2"
        style={{ left: leftPosition }}
      >
        <div
          className="group/handle pointer-events-auto h-full flex w-5 cursor-ew-resize touch-none select-none items-center justify-center"
          {...bind("left")}
        >
          <div className="bg-surface-base text-brand-primary shadow-md relative flex h-7 w-2.5 items-center justify-center rounded-[5px] border border-accent-primary transform-gpu [backface-visibility:hidden]">
            <div className="flex flex-col gap-[2.5px] pointer-events-none select-none">
              <div className="bg-accent-primary h-[2px] w-[2px] rounded-full shrink-0" />
              <div className="bg-accent-primary h-[2px] w-[2px] rounded-full shrink-0" />
              <div className="bg-accent-primary h-[2px] w-[2px] rounded-full shrink-0" />
            </div>
          </div>
        </div>
        {showLabels && (
          <div className="bg-surface-base/95 text-brand-primary shadow-md border border-border-default pointer-events-none select-none absolute -bottom-2 rounded-full px-2 py-0.5 text-[10px] leading-tight font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 left-6 z-40 backdrop-blur-xs">
            {getLabel(range.startIndex)}
          </div>
        )}
      </motion.div>

      {/* Right handle: centered with transform without negative clipping */}
      <motion.div
        className="absolute inset-y-0 z-30 pointer-events-none transform-gpu will-change-transform flex items-center justify-center -translate-x-1/2"
        style={{ left: rightPosition }}
      >
        <div
          className="group/handle pointer-events-auto h-full flex w-5 cursor-ew-resize touch-none select-none items-center justify-center"
          {...bind("right")}
        >
          <div className="bg-surface-base text-brand-primary shadow-md relative flex h-7 w-2.5 items-center justify-center rounded-[5px] border border-accent-primary transform-gpu [backface-visibility:hidden]">
            <div className="flex flex-col gap-[2.5px] pointer-events-none select-none">
              <div className="bg-accent-primary h-[2px] w-[2px] rounded-full shrink-0" />
              <div className="bg-accent-primary h-[2px] w-[2px] rounded-full shrink-0" />
              <div className="bg-accent-primary h-[2px] w-[2px] rounded-full shrink-0" />
            </div>
          </div>
        </div>
        {showLabels && (
          <div className="bg-surface-base/95 text-brand-primary shadow-md border border-border-default pointer-events-none select-none absolute -bottom-2 rounded-full px-2 py-0.5 text-[10px] leading-tight font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 right-6 z-40 backdrop-blur-xs">
            {getLabel(range.endIndex)}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function MiniChart({
  data,
  keys,
  chartConfig,
  variant,
  curveType,
  chartId,
  stacked,
  strokeVariant = "solid",
  connectNulls = false,
  barRadius,
}: {
  data: Record<string, unknown>[];
  keys: string[];
  chartConfig: ChartConfig;
  variant: EvilBrushVariant;
  curveType: CurveType;
  chartId: string;
  stacked: boolean;
  strokeVariant?: "solid" | "dashed" | "animated-dashed";
  connectNulls?: boolean;
  barRadius?: number;
}) {
  const dashArray =
    strokeVariant === "dashed" || strokeVariant === "animated-dashed" ? "4 4" : undefined;

  const defsContent = (
    <>
      <linearGradient id={`${chartId}-zm-vertical-fade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0.15} />
        <stop offset="100%" stopColor="white" stopOpacity={0} />
      </linearGradient>

      {keys.map((dk) => (
        <React.Fragment key={dk}>
          <linearGradient id={`${chartId}-zm-${dk}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`var(--color-${dk}-0, #FF8A3D)`} />
            <stop offset="100%" stopColor={`var(--color-${dk}-0, #FF8A3D)`} />
          </linearGradient>
          <mask id={`${chartId}-zm-fill-mask-${dk}`}>
            <rect width="100%" height="100%" fill={`url(#${chartId}-zm-vertical-fade)`} />
          </mask>
          <pattern id={`${chartId}-zm-fill-${dk}`} patternUnits="userSpaceOnUse" width="100%" height="100%">
            <rect width="100%" height="100%" fill={`url(#${chartId}-zm-${dk})`} mask={`url(#${chartId}-zm-fill-mask-${dk})`} />
          </pattern>
        </React.Fragment>
      ))}
    </>
  );

  const chartMargin = { top: 4, right: 4, bottom: 4, left: 4 };

  if (variant === "line") {
    return (
      <ResponsiveContainer width="100%" height={56} debounce={0}>
        <LineChart data={data} margin={chartMargin}>
          <defs>{defsContent}</defs>
          {keys.map((dk) => (
            <Line
              key={dk}
              type={curveType}
              dataKey={dk}
              stroke={`url(#${chartId}-zm-${dk})`}
              strokeWidth={1}
              strokeOpacity={0.5}
              strokeDasharray={dashArray}
              connectNulls={connectNulls}
              dot={false}
              activeDot={false}
              isAnimationActive={true}
              animationDuration={280}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (variant === "bar") {
    const r = barRadius ?? 3;
    return (
      <ResponsiveContainer width="100%" height={56} debounce={0}>
        <BarChart
          data={data}
          margin={chartMargin}
          barGap={2}
          barSize={14}
        >
          <defs>{defsContent}</defs>
          {keys.map((dk) => (
            <Bar
              key={dk}
              dataKey={dk}
              fill={`url(#${chartId}-zm-fill-${dk})`}
              fillOpacity={1}
              stackId={stacked ? "zm-stack" : undefined}
              isAnimationActive={true}
              animationDuration={280}
              animationEasing="ease-out"
              radius={[r, r, r, r]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={56} debounce={0}>
      <AreaChart data={data} margin={chartMargin}>
        <defs>{defsContent}</defs>
        {keys.map((dk) => (
          <Area
            key={dk}
            type={curveType}
            dataKey={dk}
            stroke={`url(#${chartId}-zm-${dk})`}
            strokeWidth={1}
            strokeOpacity={0.5}
            fill={`url(#${chartId}-zm-fill-${dk})`}
            fillOpacity={1}
            stackId={stacked ? "zm-stack" : undefined}
            dot={false}
            activeDot={false}
            isAnimationActive={true}
            animationDuration={280}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function useEvilBrush<TData extends Record<string, unknown>>({
  data,
  defaultStartIndex = 0,
  defaultEndIndex,
}: {
  data: TData[];
  defaultStartIndex?: number;
  defaultEndIndex?: number;
}) {
  const [range, setRange] = React.useState<EvilBrushRange>({
    startIndex: defaultStartIndex,
    endIndex: defaultEndIndex ?? Math.max(0, data.length - 1),
  });

  const deferredRange = React.useDeferredValue(range);

  useEffect(() => {
    setRange({
      startIndex: 0,
      endIndex: Math.max(0, data.length - 1),
    });
  }, [data.length]);

  const visibleData = React.useMemo(
    () => data.slice(deferredRange.startIndex, deferredRange.endIndex + 1),
    [data, deferredRange.startIndex, deferredRange.endIndex],
  );

  return {
    range,
    visibleData,
    brushProps: {
      startIndex: range.startIndex,
      endIndex: range.endIndex,
      onChange: setRange,
    } satisfies Pick<EvilBrushProps, "startIndex" | "endIndex" | "onChange">,
  };
}