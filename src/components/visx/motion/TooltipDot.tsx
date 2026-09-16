"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useChart } from "../context/ChartContext";
import { getSeriesColor } from "../utils";

export interface TooltipDotProps {
  dataKey?: string;
  className?: string;
  forceLight?: boolean;
}

export const TooltipDot: React.FC<TooltipDotProps> = ({
  dataKey,
  className = "",
  forceLight,
}) => {
  const { isDark, tokens } = useTheme();
  const { springX, springY, hoverOpacity, config, dataKeys, innerHeight, forceLight: contextForceLight } = useChart();

  const isLight = forceLight ?? contextForceLight ?? !isDark;
  const primaryKey = dataKey || dataKeys[0] || "amount";
  const strokeColor = getSeriesColor(
    primaryKey,
    config,
    isDark,
    tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D")
  );

  // Exact background surface color of the chart container
  const bgStroke = isLight ? "#ffffff" : tokens.surface.base || tokens.surface.canvas || tokens.background || (isDark ? "#0c0a09" : "#ffffff");
  const axisDotColor = isLight ? "#94a3b8" : tokens.border.hover || tokens.brand.muted || (isDark ? "#4b5563" : "#9ca3af");

  return (
    <motion.g
      style={{
        opacity: hoverOpacity,
      }}
      pointerEvents="none"
      className={className}
    >
      {/* Primary Value Line Dot on Curve */}
      <motion.circle
        style={{
          cx: springX,
          cy: springY,
        }}
        r={isLight ? 7.5 : 5}
        fill={isLight ? "#ffffff" : strokeColor}
        stroke={isLight ? strokeColor : bgStroke}
        strokeWidth={isLight ? 3.5 : 2}
      />
    </motion.g>
  );
};

TooltipDot.displayName = "AreaChart.Dot";
