"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useChart } from "../context/ChartContext";
import { getSeriesColor, cn } from "../utils";

import { AnimatedNumber } from "./AnimatedNumber";

export interface TooltipBoxProps {
  title?: string;
  formatter?: (value: any, name?: string, item?: any, index?: number, payload?: any) => React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  forceLight?: boolean;
}

export const TooltipBox: React.FC<TooltipBoxProps> = ({
  title,
  formatter,
  className = "",
  children,
  forceLight,
}) => {
  const { isDark, tokens } = useTheme();
  const {
    springTooltipX,
    hoverOpacity,
    activeItem,
    dataKeys,
    xDataKey,
    config,
    containerRef,
    width,
    forceLight: contextForceLight,
  } = useChart();

  const isLightMode = forceLight ?? contextForceLight ?? !isDark;
  const [flipped, setFlipped] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = springTooltipX.on("change", (cx) => {
      const isRight = cx > width - 180;
      setFlipped(isRight);
    });
    return () => unsubscribe();
  }, [springTooltipX, width]);

  if (!containerRef.current) return null;

  const primaryKey = dataKeys[0] || "amount";
  const defaultTitle = title || (config?.[primaryKey]?.label ? config[primaryKey].label : "Payments Count");

  const content = (
    <motion.div
      style={{
        x: springTooltipX,
        opacity: hoverOpacity,
        position: "absolute",
        top: 12,
        left: 0,
        pointerEvents: "none",
        zIndex: 50,
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          transformOrigin: flipped ? "right top" : "left top",
          transform: flipped ? "translateX(calc(-100% - 12px)) scale(1)" : "translateX(12px) scale(1)",
          transition: "transform 0.38s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={cn(
          "rounded-2xl border select-none",
          isLightMode
            ? "bg-white border-[#E2E8F0] shadow-[0_16px_36px_-6px_rgba(0,0,0,0.14),0_6px_16px_-4px_rgba(0,0,0,0.08)] text-slate-900 px-5 py-3.5 min-w-[220px] max-w-[350px]"
            : "border-border-default bg-surface-base shadow-2xl text-brand-primary px-4 py-3 min-w-[150px] max-w-[270px] text-xs",
          className
        )}
      >
        {children ? (
          children
        ) : activeItem ? (
          <div className="flex flex-col gap-2">
            {/* Header Title */}
            <div className={cn(
              "leading-tight font-bold",
              isLightMode ? "text-sm sm:text-base text-slate-900" : "text-xs text-brand-primary font-semibold"
            )}>
              {defaultTitle}
            </div>

            {formatter ? (
              formatter(
                activeItem.item[primaryKey],
                primaryKey,
                activeItem.item,
                activeItem.index,
                activeItem.item
              )
            ) : (
              <div className="space-y-1 pt-0.5">
                {dataKeys.map((key) => {
                  const color = getSeriesColor(
                    key,
                    config,
                    isDark,
                    tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D")
                  );
                  const dateLabel = String(activeItem.item[xDataKey] || "");
                  const val = Number(activeItem.item[key]) || 0;

                  return (
                    <div key={key} className="flex items-center justify-between gap-4 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className={cn(
                          "text-xs sm:text-[13px] font-medium truncate",
                          isLightMode ? "text-slate-600" : "text-brand-muted"
                        )}>
                          {dateLabel}
                        </span>
                      </div>
                      <AnimatedNumber
                        value={val}
                        className={cn(
                          "text-sm sm:text-base font-bold tabular-nums shrink-0",
                          isLightMode ? "text-slate-900" : "text-brand-primary"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  );

  return createPortal(content, containerRef.current);
};

TooltipBox.displayName = "AreaChart.Tooltip";
