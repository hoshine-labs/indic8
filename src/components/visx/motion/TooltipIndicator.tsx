"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useChart } from "../context/ChartContext";

export interface TooltipIndicatorProps {
  strokeWidth?: number;
  className?: string;
  variant?: "solid" | "dashed" | "fade";
  forceLight?: boolean;
}

export const TooltipIndicator: React.FC<TooltipIndicatorProps> = ({
  strokeWidth = 1.5,
  className = "",
  variant = "fade",
  forceLight,
}) => {
  const { isDark } = useTheme();
  const { springX, springY, hoverOpacity, innerHeight, chartId, forceLight: contextForceLight } = useChart();

  const isLight = forceLight ?? contextForceLight ?? !isDark;
  const lineColor = isLight ? "rgba(0, 0, 0, 0.22)" : isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.35)";

  if (variant === "dashed") {
    return (
      <g className={className}>
        <motion.line
          x1={springX}
          x2={springX}
          y1={springY}
          y2={innerHeight}
          style={{
            opacity: hoverOpacity,
          }}
          stroke={lineColor}
          strokeWidth={strokeWidth}
          strokeDasharray="3 3"
          strokeLinecap="round"
          pointerEvents="none"
        />
      </g>
    );
  }

  return (
    <g className={className}>
      <defs>
        <linearGradient id={`visx-crosshair-fade-${chartId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0} />
          <stop offset="10%" stopColor={lineColor} stopOpacity={1} />
          <stop offset="50%" stopColor={lineColor} stopOpacity={1} />
          <stop offset="90%" stopColor={lineColor} stopOpacity={1} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      <motion.rect
        x={springX}
        y={0}
        width={strokeWidth}
        height={innerHeight}
        fill={`url(#visx-crosshair-fade-${chartId})`}
        style={{
          opacity: hoverOpacity,
        }}
        pointerEvents="none"
        shapeRendering="crispEdges"
      />
    </g>
  );
};

TooltipIndicator.displayName = "AreaChart.Indicator";
