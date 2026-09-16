"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { localPoint } from "@visx/event";
import { useTheme } from "@/context/ThemeContext";
import { VisxTooltipProps, ChartConfig, Margin } from "../types";
import { getSeriesColor, bisectIndex, cn } from "../utils";

export interface ChartTooltipOverlayProps {
  width: number;
  height: number;
  data: Record<string, any>[];
  dataKeys: string[];
  xDataKey: string;
  config?: ChartConfig;
  margin: Margin;
  xScale: (index: number) => number;
  yScale: (val: number) => number;
  tooltipProps?: VisxTooltipProps | null;
  className?: string;
}

export const ChartTooltipOverlay: React.FC<ChartTooltipOverlayProps> = ({
  width,
  height,
  data,
  dataKeys,
  xDataKey,
  config,
  margin,
  xScale,
  yScale,
  tooltipProps,
  className = "",
}) => {
  const { isDark, tokens } = useTheme();

  const crosshairRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const tooltipCardRef = useRef<HTMLDivElement>(null);

  const rAFRef = useRef<number | null>(null);
  const lastIndexRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(false);

  const [activeItem, setActiveItem] = useState<{ item: Record<string, any>; index: number } | null>(null);

  const mTop = margin.top ?? 8;
  const mRight = margin.right ?? 12;
  const mBottom = margin.bottom ?? 26;
  const mLeft = margin.left ?? 48;

  const innerWidth = Math.max(0, width - mLeft - mRight);
  const innerHeight = Math.max(0, height - mTop - mBottom);
  const totalPoints = data.length;

  const primaryKey = dataKeys[0] || "amount";
  const strokeColor = getSeriesColor(
    primaryKey,
    config,
    isDark,
    tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D")
  );

  const hideOverlay = useCallback(() => {
    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    isVisibleRef.current = false;
    lastIndexRef.current = null;
    setActiveItem(null);

    if (crosshairRef.current) crosshairRef.current.style.opacity = "0";
    if (dotRef.current) dotRef.current.style.opacity = "0";
    if (tooltipCardRef.current) tooltipCardRef.current.style.opacity = "0";
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (totalPoints <= 0 || innerWidth <= 0 || innerHeight <= 0) return;

      const point = localPoint(event);
      if (!point) return;

      const relX = point.x - mLeft;
      if (relX < 0 || relX > innerWidth || point.y < mTop || point.y > mTop + innerHeight) {
        hideOverlay();
        return;
      }

      const index = bisectIndex(relX, xScale, totalPoints);
      const item = data[index];
      if (!item) return;

      const val = Number(item[primaryKey]) || 0;

      // Integer pixel snapping
      const snapX = Math.round(xScale(index) + mLeft);
      const snapY = Math.round(yScale(val) + mTop);

      const isFirstEntry = !isVisibleRef.current;
      isVisibleRef.current = true;

      // Smooth direct DOM update inside rAF frame
      if (rAFRef.current !== null) {
        cancelAnimationFrame(rAFRef.current);
      }

      rAFRef.current = requestAnimationFrame(() => {
        // 1. Crosshair Guideline (Smooth easing)
        if (crosshairRef.current) {
          crosshairRef.current.style.transition = isFirstEntry
            ? "opacity 150ms ease-out"
            : "transform 80ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease-out";
          crosshairRef.current.style.transform = `translate3d(${snapX}px, 0, 0)`;
          crosshairRef.current.style.opacity = "1";
        }

        // 2. Active Curve Dot (Silky-smooth glide along the curve)
        if (dotRef.current) {
          dotRef.current.style.transition = isFirstEntry
            ? "opacity 150ms ease-out"
            : "transform 90ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease-out";
          dotRef.current.style.transform = `translate3d(${snapX}px, ${snapY}px, 0)`;
          dotRef.current.style.opacity = "1";
        }

        // 3. Tooltip Positioning with Boundary Flip & Smooth Glide
        if (tooltipCardRef.current) {
          const cardWidth = tooltipCardRef.current.offsetWidth || 150;
          const cardHeight = tooltipCardRef.current.offsetHeight || 56;

          const shouldFlipLeft = snapX + cardWidth + 16 > width;
          const tooltipLeft = shouldFlipLeft
            ? Math.round(snapX - cardWidth - 12)
            : Math.round(snapX + 12);

          const targetY = snapY - Math.round(cardHeight / 2);
          const tooltipTop = Math.max(mTop + 4, Math.min(height - mBottom - cardHeight - 4, targetY));

          tooltipCardRef.current.style.transition = isFirstEntry
            ? "opacity 150ms ease-out"
            : "transform 90ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease-out";
          tooltipCardRef.current.style.transform = `translate3d(${tooltipLeft}px, ${tooltipTop}px, 0)`;
          tooltipCardRef.current.style.opacity = "1";
        }
      });

      // Update React state ONLY when hovered data index actually changes
      if (lastIndexRef.current !== index) {
        lastIndexRef.current = index;
        setActiveItem({ item, index });
      }
    },
    [totalPoints, innerWidth, innerHeight, mLeft, mTop, mBottom, width, height, xScale, data, primaryKey, yScale, hideOverlay]
  );

  useEffect(() => {
    return () => {
      if (rAFRef.current !== null) {
        cancelAnimationFrame(rAFRef.current);
      }
    };
  }, []);

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={hideOverlay}
      className={cn("absolute inset-0 select-none cursor-crosshair touch-none pointer-events-auto", className)}
    >
      {/* 1. Standard 1px Vertical Dashed Guideline */}
      <div
        ref={crosshairRef}
        className="absolute top-0 bottom-0 pointer-events-none opacity-0"
        style={{
          width: "1px",
          top: `${mTop}px`,
          bottom: `${mBottom}px`,
          left: 0,
          borderLeft: isDark ? "1px dashed rgba(255, 255, 255, 0.25)" : "1px dashed rgba(0, 0, 0, 0.22)",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      />

      {/* 2. Standard Active Curve Dot with Smooth Glide */}
      <div
        ref={dotRef}
        className="absolute pointer-events-none opacity-0 -ml-1.5 -mt-1.5 size-3 flex items-center justify-center"
        style={{
          left: 0,
          top: 0,
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      >
        <span
          className="size-2.5 rounded-full border-2 border-white dark:border-[#121317] shadow-xs"
          style={{ backgroundColor: strokeColor }}
        />
      </div>

      {/* 3. Standard Clean Tooltip Card */}
      <div
        ref={tooltipCardRef}
        className="absolute left-0 top-0 pointer-events-none opacity-0 z-50 rounded-lg border border-border-default bg-surface-base shadow-md px-2.5 py-2 min-w-[130px] max-w-[240px] text-xs text-brand-primary"
        style={{
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {activeItem && (
          <>
            {tooltipProps?.formatter ? (
              tooltipProps.formatter(
                activeItem.item[primaryKey],
                primaryKey,
                activeItem.item,
                activeItem.index,
                activeItem.item
              )
            ) : (
              <div className="space-y-1 select-none">
                <div className="text-[11px] font-medium text-brand-muted truncate">
                  {String(activeItem.item[xDataKey] || "")}
                </div>
                {dataKeys.map((key) => {
                  const color = getSeriesColor(
                    key,
                    config,
                    isDark,
                    tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D")
                  );
                  const label = config?.[key]?.label || key;
                  const val = Number(activeItem.item[key]) || 0;

                  return (
                    <div key={key} className="flex items-center justify-between gap-3 text-xs pt-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="size-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-brand-secondary truncate text-[11px]">{label}</span>
                      </div>
                      <span className="font-mono font-semibold tabular-nums text-brand-primary shrink-0">
                        {val.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
