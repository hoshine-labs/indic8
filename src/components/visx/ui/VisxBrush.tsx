"use client";

import React, { useCallback, useRef, useState, useMemo } from "react";
import { AreaClosed, LinePath } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import { LinearGradient } from "@visx/gradient";
import { useTheme } from "@/context/ThemeContext";
import { VisxBrushRange, ChartConfig } from "../types";
import { getCurve, getSeriesColor, cn } from "../utils";

export interface VisxBrushProps {
  data: Record<string, any>[];
  dataKeys: string[];
  xDataKey?: string;
  chartConfig?: ChartConfig;
  height?: number;
  minSpan?: number;
  range: VisxBrushRange;
  onChange: (range: VisxBrushRange) => void;
  formatLabel?: (value: unknown, index: number) => string;
  className?: string;
}

type DragHandleType = "left" | "right" | "middle";

interface DragState {
  type: DragHandleType;
  startX: number;
  initialRange: VisxBrushRange;
}

export const VisxBrush: React.FC<VisxBrushProps> = ({
  data,
  dataKeys,
  xDataKey = "date",
  chartConfig,
  height = 54,
  minSpan = 2,
  range,
  onChange,
  formatLabel,
  className = "",
}) => {
  const { isDark, tokens } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Measure container width
  const setRef = useCallback((node: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (node) {
      setContainerWidth(node.getBoundingClientRect().width);
      const ro = new ResizeObserver((entries) => {
        if (entries[0]) {
          setContainerWidth(entries[0].contentRect.width);
        }
      });
      ro.observe(node);
    }
  }, []);

  const totalPoints = data.length;
  const primaryKey = dataKeys[0] || "amount";
  const strokeColor = getSeriesColor(primaryKey, chartConfig, isDark, tokens.accent.chartStroke || "#f97316");

  // Mini Chart Scales
  const width = Math.max(containerWidth, 100);
  const innerHeight = Math.max(height - 16, 20);

  const xScale = useMemo(() => {
    return scaleLinear({
      domain: [0, Math.max(totalPoints - 1, 1)],
      range: [0, width],
    });
  }, [totalPoints, width]);

  const yMax = useMemo(() => {
    let max = 0;
    data.forEach((d) => {
      dataKeys.forEach((key) => {
        const val = Number(d[key]) || 0;
        if (val > max) max = val;
      });
    });
    return max > 0 ? max * 1.1 : 100;
  }, [data, dataKeys]);

  const yScale = useMemo(() => {
    return scaleLinear({
      domain: [0, yMax],
      range: [innerHeight, 4],
    });
  }, [yMax, innerHeight]);

  // Pointer drag handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: DragHandleType) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      setDragState({
        type,
        startX: e.clientX,
        initialRange: { ...range },
      });
    },
    [range]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState || !containerRef.current || totalPoints <= 1) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const deltaPx = e.clientX - dragState.startX;
      const indexDelta = Math.round((deltaPx / rect.width) * (totalPoints - 1));
      const { type, initialRange: init } = dragState;

      if (type === "left") {
        const newStart = Math.max(0, Math.min(init.startIndex + indexDelta, init.endIndex - minSpan));
        onChange({ startIndex: newStart, endIndex: init.endIndex });
      } else if (type === "right") {
        const newEnd = Math.min(totalPoints - 1, Math.max(init.endIndex + indexDelta, init.startIndex + minSpan));
        onChange({ startIndex: init.startIndex, endIndex: newEnd });
      } else if (type === "middle") {
        const span = init.endIndex - init.startIndex;
        let s = init.startIndex + indexDelta;
        let end = s + span;

        if (s < 0) {
          s = 0;
          end = span;
        } else if (end > totalPoints - 1) {
          end = totalPoints - 1;
          s = Math.max(0, end - span);
        }

        onChange({ startIndex: s, endIndex: end });
      }
    },
    [dragState, totalPoints, minSpan, onChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setDragState(null);
  }, []);

  // Compute pixel bounds for selection
  const leftPx = Math.max(0, xScale(range.startIndex));
  const rightPx = Math.min(width, xScale(range.endIndex));
  const selectionWidth = Math.max(rightPx - leftPx, 10);

  const startLabel = useMemo(() => {
    const d = data[range.startIndex];
    if (!d) return "";
    const raw = d[xDataKey];
    return formatLabel ? formatLabel(raw, range.startIndex) : String(raw || "");
  }, [data, range.startIndex, xDataKey, formatLabel]);

  const endLabel = useMemo(() => {
    const d = data[range.endIndex];
    if (!d) return "";
    const raw = d[xDataKey];
    return formatLabel ? formatLabel(raw, range.endIndex) : String(raw || "");
  }, [data, range.endIndex, xDataKey, formatLabel]);

  if (totalPoints <= 2) return null;

  return (
    <div className={cn("w-full flex flex-col select-none pt-2 pb-1", className)}>
      <div
        ref={setRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full rounded-xl bg-surface-base/60 border border-border-default/70 overflow-hidden"
        style={{ height }}
      >
        {/* SVG Mini Preview Background */}
        <svg width="100%" height={height} className="absolute inset-0 pointer-events-none">
          <LinearGradient
            id="visx-brush-gradient"
            from={strokeColor}
            to={strokeColor}
            fromOpacity={0.25}
            toOpacity={0.02}
          />
          <g transform="translate(0, 4)">
            {dataKeys.map((key) => (
              <React.Fragment key={key}>
                <AreaClosed
                  data={data}
                  x={(_, i) => xScale(i)}
                  y={(d) => yScale(Number(d[key]) || 0)}
                  yScale={yScale}
                  curve={getCurve("monotone")}
                  fill="url(#visx-brush-gradient)"
                />
                <LinePath
                  data={data}
                  x={(_, i) => xScale(i)}
                  y={(d) => yScale(Number(d[key]) || 0)}
                  curve={getCurve("monotone")}
                  stroke={strokeColor}
                  strokeWidth={1.2}
                  strokeOpacity={0.65}
                />
              </React.Fragment>
            ))}
          </g>
        </svg>

        {/* Dimmed Outside Regions */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-surface-canvas/50 pointer-events-none transition-all duration-75"
          style={{ width: `${leftPx}px` }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 bg-surface-canvas/50 pointer-events-none transition-all duration-75"
          style={{ width: `${Math.max(0, width - rightPx)}px` }}
        />

        {/* Active Selection Box Window */}
        <div
          onPointerDown={(e) => handlePointerDown(e, "middle")}
          className="absolute top-0 bottom-0 cursor-grab active:cursor-grabbing border-y border-brand-primary/40 bg-brand-primary/10 transition-all duration-75 flex items-center justify-between"
          style={{
            left: `${leftPx}px`,
            width: `${selectionWidth}px`,
          }}
        >
          {/* Left Handle */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "left")}
            className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center group z-10"
          >
            <div className="w-1.5 h-6 rounded-full bg-brand-primary border border-surface-canvas shadow-md transition-transform group-hover:scale-110 flex items-center justify-center gap-0.5">
              <div className="w-px h-2.5 bg-surface-canvas/60 rounded-full" />
            </div>
          </div>

          {/* Right Handle */}
          <div
            onPointerDown={(e) => handlePointerDown(e, "right")}
            className="absolute -right-1.5 top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center group z-10"
          >
            <div className="w-1.5 h-6 rounded-full bg-brand-primary border border-surface-canvas shadow-md transition-transform group-hover:scale-110 flex items-center justify-center gap-0.5">
              <div className="w-px h-2.5 bg-surface-canvas/60 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp labels below brush */}
      <div className="flex items-center justify-between px-1 pt-1 text-[10px] font-mono text-brand-muted">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
};
