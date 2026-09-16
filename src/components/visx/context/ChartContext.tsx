"use client";

import React, { createContext, useContext, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { scaleLinear } from "@visx/scale";
import { localPoint } from "@visx/event";
import { useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { ChartConfig, Margin } from "../types";
import { bisectIndex, createMonotoneSpline } from "../utils";

export interface ChartContextValue {
  data: Record<string, any>[];
  xDataKey: string;
  dataKeys: string[];
  config?: ChartConfig;
  margin: { top: number; right: number; bottom: number; left: number };
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  xScale: any;
  yScale: any;
  yMax: number;
  curveType: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;

  // Scoped Chart Instance ID for unique gradients and clip paths
  chartId: string;
  interactive?: boolean;
  staticIndex?: number;
  forceLight?: boolean;

  // Motion Values & Springs (Decoupled from React Rerenders)
  targetX: MotionValue<number>;
  targetY: MotionValue<number>;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  targetTooltipX: MotionValue<number>;
  targetTooltipY: MotionValue<number>;
  springTooltipX: MotionValue<number>;
  springTooltipY: MotionValue<number>;
  isHovered: MotionValue<number>;
  hoverOpacity: MotionValue<number>;
  activeIndex: MotionValue<number>;

  // Discrete Active Item state (only updates when index changes)
  activeItem: { item: Record<string, any>; index: number } | null;

  // Event Handlers
  handlePointerMove: (event: React.PointerEvent<SVGElement | HTMLDivElement>) => void;
  handlePointerLeave: () => void;
}

const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart(): ChartContextValue {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a ChartProvider or AreaChart component");
  }
  return context;
}

export interface ChartProviderProps {
  data: Record<string, any>[];
  xDataKey?: string;
  dataKeys?: string[];
  config?: ChartConfig;
  margin?: Margin;
  width: number;
  height: number;
  curveType?: string;
  children: React.ReactNode;
  id?: string;
  interactive?: boolean;
  staticIndex?: number;
  forceLight?: boolean;
}

export const ChartProvider: React.FC<ChartProviderProps> = ({
  data = [],
  xDataKey = "date",
  dataKeys: explicitDataKeys,
  config,
  margin: customMargin,
  width,
  height,
  curveType = "monotone",
  children,
  id,
  interactive = true,
  staticIndex,
  forceLight = false,
}) => {
  const reactId = React.useId();
  const chartId = useMemo(() => (id || reactId).replace(/[^a-zA-Z0-9_-]/g, ""), [id, reactId]);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastIndexRef = useRef<number | null>(null);
  const [activeItem, setActiveItem] = useState<{ item: Record<string, any>; index: number } | null>(null);

  const margin = useMemo(() => ({
    top: customMargin?.top ?? 8,
    right: customMargin?.right ?? 12,
    bottom: customMargin?.bottom ?? 28,
    left: customMargin?.left ?? 48,
  }), [customMargin]);

  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);
  const totalPoints = data.length;

  const dataKeys = useMemo(() => {
    if (explicitDataKeys && explicitDataKeys.length > 0) return explicitDataKeys;
    if (config) return Object.keys(config);
    return ["amount"];
  }, [explicitDataKeys, config]);

  const primaryKey = dataKeys[0] || "amount";

  // Scales
  const xScale = useMemo(() => {
    return scaleLinear({
      domain: [0, Math.max(totalPoints - 1, 1)],
      range: [0, innerWidth],
    });
  }, [totalPoints, innerWidth]);

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
      range: [innerHeight, 0],
      nice: true,
    });
  }, [yMax, innerHeight]);
  const rawPoints = useMemo(() => {
    return data.map((d, i) => ({
      x: xScale(i),
      y: yScale(Number(d[primaryKey]) || 0),
    }));
  }, [data, xScale, yScale, primaryKey]);

  const splineFn = useMemo(() => {
    return createMonotoneSpline(rawPoints);
  }, [rawPoints]);

  const splineRef = useRef(splineFn);
  splineRef.current = splineFn;

  // Motion Values (Hardware-accelerated tracking matching reference)
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, { stiffness: 300, damping: 30 });
  // Dynamic Y position follows the exact continuous curve trajectory of springX
  const springY = useTransform(springX, (x) => splineRef.current(x));

  const targetTooltipX = useMotionValue(0);
  const targetTooltipY = useMotionValue(0);
  // Reference tooltip horizontal glide — stiffness 100, damping 20
  const springTooltipX = useSpring(targetTooltipX, { stiffness: 100, damping: 20 });
  const springTooltipY = useSpring(targetTooltipY, { stiffness: 100, damping: 20 });

  const isHovered = useMotionValue(0);
  const hoverOpacity = useSpring(isHovered, { stiffness: 350, damping: 30 });
  const activeIndex = useMotionValue(0);

  // Automatically initialize / lock static index if specified
  useEffect(() => {
    if (staticIndex !== undefined && totalPoints > 0 && innerWidth > 0 && innerHeight > 0) {
      const idx = Math.max(0, Math.min(totalPoints - 1, staticIndex));
      const item = data[idx];
      if (item) {
        const val = Number(item[primaryKey]) || 0;
        const snapX = Math.round(xScale(idx));
        const snapY = Math.round(yScale(val));
        const cx = snapX + margin.left;

        targetX.jump(snapX);
        targetY.jump(snapY);
        springX.jump(snapX);
        springY.jump(snapY);
        targetTooltipX.jump(cx);
        springTooltipX.jump(cx);
        isHovered.jump(1);
        hoverOpacity.jump(1);
        activeIndex.jump(idx);
        setActiveItem({ item, index: idx });
        lastIndexRef.current = idx;
      }
    }
  }, [staticIndex, totalPoints, innerWidth, innerHeight, xScale, yScale, primaryKey, margin.left, targetX, targetY, springX, springY, targetTooltipX, springTooltipX, isHovered, hoverOpacity, activeIndex, data]);

  const handlePointerLeave = useCallback(() => {
    if (interactive === false || staticIndex !== undefined) return;
    isHovered.set(0);
    lastIndexRef.current = null;
    setActiveItem(null);
  }, [interactive, staticIndex, isHovered]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGElement | HTMLDivElement>) => {
      if (interactive === false || staticIndex !== undefined) return;
      if (totalPoints <= 0 || innerWidth <= 0 || innerHeight <= 0) return;

      const point = localPoint(event);
      if (!point) return;

      const relX = point.x - margin.left;
      if (relX < 0 || relX > innerWidth || point.y < margin.top || point.y > margin.top + innerHeight) {
        handlePointerLeave();
        return;
      }

      const index = bisectIndex(relX, xScale, totalPoints);
      const item = data[index];
      if (!item) return;

      const val = Number(item[primaryKey]) || 0;

      // Integer-snapped coordinates
      const snapX = Math.round(xScale(index));
      const snapY = Math.round(yScale(val));
      const cx = snapX + margin.left;

      const wasNotHovered = isHovered.get() === 0;

      if (wasNotHovered) {
        // First entry / re-entry: immediately jump motion values & springs so it never remembers or glides from old position
        targetX.jump(snapX);
        targetY.jump(snapY);
        springX.jump(snapX);
        springY.jump(snapY);
        targetTooltipX.jump(cx);
        springTooltipX.jump(cx);
      } else {
        targetX.set(snapX);
        targetY.set(snapY);
        targetTooltipX.set(cx);
      }

      isHovered.set(1);
      activeIndex.set(index);

      // Only update React state if index actually changed
      if (lastIndexRef.current !== index) {
        lastIndexRef.current = index;
        setActiveItem({ item, index });
      }
    },
    [interactive, staticIndex, totalPoints, innerWidth, innerHeight, margin, xScale, data, primaryKey, yScale, width, height, targetX, targetY, isHovered, activeIndex, targetTooltipX, targetTooltipY, springX, springY, springTooltipX, springTooltipY, handlePointerLeave]
  );

  const value: ChartContextValue = {
    data,
    xDataKey,
    dataKeys,
    config,
    margin,
    width,
    height,
    innerWidth,
    innerHeight,
    xScale,
    yScale,
    yMax,
    curveType,
    containerRef,
    svgRef,
    chartId,
    interactive,
    staticIndex,
    forceLight,
    targetX,
    targetY,
    springX,
    springY,
    targetTooltipX,
    targetTooltipY,
    springTooltipX,
    springTooltipY,
    isHovered,
    hoverOpacity,
    activeIndex,
    activeItem,
    handlePointerMove,
    handlePointerLeave,
  };

  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
};
