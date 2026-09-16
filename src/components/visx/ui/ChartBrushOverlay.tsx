"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionValueEvent } from "framer-motion";
import { AreaClosed, LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import { useTheme } from "@/context/ThemeContext";
import { VisxBrushRange, ChartConfig } from "../types";
import { getCurve, getSeriesColor, cn } from "../utils";
import { DateTickerPill } from "../motion/DateTicker";

export interface ChartBrushOverlayProps {
  data: Record<string, any>[];
  dataKeys?: string[];
  xDataKey?: string;
  chartConfig?: ChartConfig;
  height?: number;
  minSpan?: number;
  range?: VisxBrushRange;
  defaultStartIndex?: number;
  defaultEndIndex?: number;
  onChange?: (range: VisxBrushRange) => void;
  formatLabel?: (value: unknown, index: number) => string;
  className?: string;
  showLabels?: boolean;
}

const SPRING_CONFIG = { stiffness: 600, damping: 50, mass: 0.1 };

type DragType = "left" | "right" | "middle";

interface DragState {
  type: DragType;
  originX: number;
  originRange: VisxBrushRange;
}

export const ChartBrushOverlay: React.FC<ChartBrushOverlayProps> = ({
  data = [],
  dataKeys: explicitDataKeys,
  xDataKey = "date",
  chartConfig,
  height = 54,
  minSpan = 2,
  range: controlledRange,
  defaultStartIndex = 0,
  defaultEndIndex,
  onChange,
  formatLabel,
  className = "",
  showLabels = true,
}) => {
  const { isDark, tokens } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const chartId = useId().replace(/:/g, "");

  const totalPoints = data.length;
  const isControlled = controlledRange !== undefined;

  const dataKeys = useMemo(() => {
    if (explicitDataKeys && explicitDataKeys.length > 0) return explicitDataKeys;
    if (chartConfig) return Object.keys(chartConfig);
    return ["amount"];
  }, [explicitDataKeys, chartConfig]);

  const primaryKey = dataKeys[0] || "amount";
  const strokeColor = getSeriesColor(
    primaryKey,
    chartConfig,
    isDark,
    tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D")
  );

  const [internalRange, setInternalRange] = useState<VisxBrushRange>(() => ({
    startIndex: Math.max(0, Math.min(defaultStartIndex, totalPoints - 1)),
    endIndex: Math.max(0, Math.min(defaultEndIndex ?? totalPoints - 1, totalPoints - 1)),
  }));

  const lastCommittedRef = useRef<VisxBrushRange>(internalRange);
  const prevControlledRangeRef = useRef(controlledRange);
  const prevPointsRef = useRef(totalPoints);

  if (isControlled && controlledRange && prevControlledRangeRef.current !== controlledRange) {
    prevControlledRangeRef.current = controlledRange;
    setInternalRange(controlledRange);
    lastCommittedRef.current = controlledRange;
  } else if (!isControlled && prevPointsRef.current !== totalPoints) {
    prevPointsRef.current = totalPoints;
    const adjusted = {
      startIndex: 0,
      endIndex: Math.max(0, totalPoints - 1),
    };
    setInternalRange(adjusted);
    lastCommittedRef.current = adjusted;
  }

  const clampRange = useCallback(
    (r: VisxBrushRange, mode?: DragType): VisxBrushRange => {
      let { startIndex, endIndex } = r;
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
    [totalPoints, minSpan]
  );

  const commit = useCallback(
    (next: VisxBrushRange, mode?: DragType) => {
      const clamped = clampRange(next, mode);
      const last = lastCommittedRef.current;

      if (last.startIndex === clamped.startIndex && last.endIndex === clamped.endIndex) {
        return;
      }

      lastCommittedRef.current = clamped;
      setInternalRange(clamped);
      onChange?.(clamped);
    },
    [clampRange, onChange]
  );

  const toIndexDelta = useCallback(
    (px: number) => {
      if (!trackRef.current || totalPoints <= 1) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return 0;
      return Math.round((px / rect.width) * (totalPoints - 1));
    },
    [totalPoints]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent, type: DragType) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
      dragRef.current = { type, originX: e.clientX, originRange: { ...internalRange } };
    },
    [internalRange]
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
    [toIndexDelta, totalPoints, commit]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragRef.current = null;
  }, []);

  const bind = useCallback(
    (type: DragType) => ({
      onPointerDown: (e: React.PointerEvent) => onPointerDown(e, type),
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    }),
    [onPointerDown, onPointerMove, onPointerUp]
  );

  const range = internalRange;
  const leftPct = totalPoints > 1 ? (range.startIndex / (totalPoints - 1)) * 100 : 0;
  const rightPct = totalPoints > 1 ? (range.endIndex / (totalPoints - 1)) * 100 : 100;

  const leftTarget = useMotionValue(leftPct);
  const rightTarget = useMotionValue(rightPct);

  const leftSpring = useSpring(leftTarget, SPRING_CONFIG);
  const rightSpring = useSpring(rightTarget, SPRING_CONFIG);

  // When not dragging (e.g. tab change or range reset), jump immediately with zero spring flight
  useEffect(() => {
    if (!dragRef.current) {
      leftTarget.jump(leftPct);
      rightTarget.jump(rightPct);
      leftSpring.jump(leftPct);
      rightSpring.jump(rightPct);
    } else {
      leftTarget.set(leftPct);
      rightTarget.set(rightPct);
    }
  }, [leftPct, rightPct, totalPoints, leftTarget, rightTarget, leftSpring, rightSpring]);

  const leftPosition = useTransform(leftSpring, (v: number) => `${Math.max(0, Math.min(100, v))}%`);
  const rightPosition = useTransform(rightSpring, (v: number) => `${Math.max(0, Math.min(100, v))}%`);
  const leftOverlayWidth = useTransform(leftSpring, (v: number) => `${Math.max(0, Math.min(100, v))}%`);
  const rightOverlayWidth = useTransform(rightSpring, (v: number) => `${Math.max(0, Math.min(100, 100 - v))}%`);
  const selectedWidth = useMotionValue(`${Math.max(0, Math.min(100, rightPct - leftPct))}%`);

  const updateSelectedWidth = useCallback(() => {
    const l = Math.max(0, Math.min(100, leftSpring.get()));
    const r = Math.max(0, Math.min(100, rightSpring.get()));
    selectedWidth.set(`${Math.max(0, r - l)}%`);
  }, [leftSpring, rightSpring, selectedWidth]);

  useMotionValueEvent(leftSpring, "change", updateSelectedWidth);
  useMotionValueEvent(rightSpring, "change", updateSelectedWidth);

  const getLabel = useCallback(
    (idx: number) => {
      if (!xDataKey) return String(idx);
      const v = data[idx]?.[xDataKey];
      return formatLabel ? formatLabel(v, idx) : String(v ?? idx);
    },
    [data, xDataKey, formatLabel]
  );

  // Measure track dimensions
  const [trackWidth, setTrackWidth] = useState<number>(300);

  useEffect(() => {
    if (!trackRef.current) return;
    const updateW = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.offsetWidth || 300);
      }
    };
    updateW();
    const ro = new ResizeObserver(updateW);
    ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, []);

  const innerW = Math.max(trackWidth, 100);
  const innerH = Math.max(height - 8, 20);

  const xScale = useMemo(() => {
    return scaleLinear({
      domain: [0, Math.max(totalPoints - 1, 1)],
      range: [0, innerW],
    });
  }, [totalPoints, innerW]);

  const yMax = useMemo(() => {
    let max = 0;
    data.forEach((d) => {
      dataKeys.forEach((key) => {
        const val = Number(d[key]) || 0;
        if (val > max) max = val;
      });
    });
    return max > 0 ? max * 1.15 : 100;
  }, [data, dataKeys]);

  const yScale = useMemo(() => {
    return scaleLinear({
      domain: [0, yMax],
      range: [innerH, 4],
    });
  }, [yMax, innerH]);

  if (totalPoints === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn("group relative w-full select-none rounded-[8px] overflow-visible pb-3.5 pt-1 px-3 sm:px-3.5", className)}
    >
      {/* Interactive Brush Track Area */}
      <div
        ref={trackRef}
        className="relative w-full rounded-[8px] overflow-visible select-none"
        style={{ height }}
      >
        {/* 1. Mini chart preview SVG */}
        <div className="absolute inset-0 overflow-hidden rounded-[8px] pointer-events-none select-none border border-border-default/60 bg-surface-subtle/40">
          <svg width="100%" height={height} className="absolute inset-0">
            <defs>
              <linearGradient id={`${chartId}-brush-gradient`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <g transform="translate(0, 4)">
              {dataKeys.map((key) => (
                <React.Fragment key={key}>
                  <AreaClosed
                    data={data}
                    x={(_, i) => xScale(i)}
                    y={(d) => yScale(Number(d[key]) || 0)}
                    yScale={yScale}
                    curve={getCurve("monotone")}
                    fill={`url(#${chartId}-brush-gradient)`}
                  />
                  <LinePath
                    data={data}
                    x={(_, i) => xScale(i)}
                    y={(d) => yScale(Number(d[key]) || 0)}
                    curve={getCurve("monotone")}
                    stroke={strokeColor}
                    strokeWidth={1.25}
                    strokeOpacity={0.7}
                  />
                </React.Fragment>
              ))}
            </g>
          </svg>
        </div>

        {/* 2. Dim overlay left with subtle backdrop blur */}
        <motion.div
          className="bg-background/70 backdrop-blur-[2px] pointer-events-none select-none absolute inset-y-0 left-0 rounded-l-[8px] z-10"
          style={{ width: leftOverlayWidth }}
        />

        {/* 3. Dim overlay right with subtle backdrop blur */}
        <motion.div
          className="bg-background/70 backdrop-blur-[2px] pointer-events-none select-none absolute inset-y-0 right-0 rounded-r-[8px] z-10"
          style={{ width: rightOverlayWidth }}
        />

        {/* 4. Selected draggable region */}
        <motion.div
          className="absolute inset-y-0 z-10 cursor-grab touch-none select-none rounded-[6px] border border-border-hover/80 active:cursor-grabbing"
          style={{ left: leftPosition, width: selectedWidth }}
          {...bind("middle")}
        />

        {/* 5. Left Handle with internal side indicator */}
        <motion.div
          className="absolute inset-y-0 z-30 pointer-events-none transform-gpu will-change-transform flex items-center justify-center -translate-x-1/2"
          style={{ left: leftPosition }}
        >
          <div
            className="group/handle pointer-events-auto h-full flex w-5 cursor-ew-resize touch-none select-none items-center justify-center"
            {...bind("left")}
          >
            <div
              className="bg-surface-base shadow-md relative flex h-7 w-2.5 items-center justify-center rounded-[5px] border transform-gpu [backface-visibility:hidden]"
              style={{ borderColor: strokeColor }}
            >
              <div className="flex flex-col gap-[2.5px] pointer-events-none select-none">
                <div className="h-[2px] w-[2px] rounded-full shrink-0" style={{ backgroundColor: strokeColor }} />
                <div className="h-[2px] w-[2px] rounded-full shrink-0" style={{ backgroundColor: strokeColor }} />
                <div className="h-[2px] w-[2px] rounded-full shrink-0" style={{ backgroundColor: strokeColor }} />
              </div>
            </div>
          </div>

          {/* Left Handle Animated Month Pill centered on bottom border line */}
          {showLabels && (
            <div className="absolute bottom-0 translate-y-1/2 left-4 z-40">
              <DateTickerPill
                index={range.startIndex}
                data={data}
                xDataKey={xDataKey}
                monthOnly={true}
              />
            </div>
          )}
        </motion.div>

        {/* 6. Right Handle with internal side indicator */}
        <motion.div
          className="absolute inset-y-0 z-30 pointer-events-none transform-gpu will-change-transform flex items-center justify-center -translate-x-1/2"
          style={{ left: rightPosition }}
        >
          <div
            className="group/handle pointer-events-auto h-full flex w-5 cursor-ew-resize touch-none select-none items-center justify-center"
            {...bind("right")}
          >
            <div
              className="bg-surface-base shadow-md relative flex h-7 w-2.5 items-center justify-center rounded-[5px] border transform-gpu [backface-visibility:hidden]"
              style={{ borderColor: strokeColor }}
            >
              <div className="flex flex-col gap-[2.5px] pointer-events-none select-none">
                <div className="h-[2px] w-[2px] rounded-full shrink-0" style={{ backgroundColor: strokeColor }} />
                <div className="h-[2px] w-[2px] rounded-full shrink-0" style={{ backgroundColor: strokeColor }} />
                <div className="h-[2px] w-[2px] rounded-full shrink-0" style={{ backgroundColor: strokeColor }} />
              </div>
            </div>
          </div>

          {/* Right Handle Animated Month Pill centered on bottom border line */}
          {showLabels && (
            <div className="absolute bottom-0 translate-y-1/2 right-4 z-40">
              <DateTickerPill
                index={range.endIndex}
                data={data}
                xDataKey={xDataKey}
                monthOnly={true}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export const VisxBrush = ChartBrushOverlay;
