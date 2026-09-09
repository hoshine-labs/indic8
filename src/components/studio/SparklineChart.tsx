"use client";

import React from "react";
import { motion } from "framer-motion";

export type ChartStyle = "wave" | "bars" | "pulse" | "stepped" | "none";

interface SparklineChartProps {
  style: ChartStyle;
  theme?: string;
  progress?: number; // 0 to 1
}

export function SparklineChart({
  style,
  theme = "obsidian",
  progress = 1,
}: SparklineChartProps) {
  if (style === "none") return null;

  const isLight = theme === "pearl" || theme === "light";

  // Data points for smooth curve
  const points = [
    [0, 48],
    [20, 45],
    [40, 42],
    [60, 36],
    [80, 39],
    [100, 30],
    [120, 32],
    [140, 24],
    [160, 20],
    [180, 22],
    [200, 14],
    [220, 16],
    [240, 8],
    [260, 10],
    [280, 4],
  ];

  const svgPath = points.reduce((acc, point, i) => {
    return i === 0
      ? `M ${point[0]} ${point[1]}`
      : `${acc} L ${point[0]} ${point[1]}`;
  }, "");

  const areaPath = `${svgPath} L 280 55 L 0 55 Z`;

  if (style === "bars") {
    const barHeights = [25, 32, 28, 44, 40, 58, 52, 68, 64, 82, 75, 95];
    return (
      <div className="w-full h-full flex items-end justify-between gap-1.5 px-1 py-0.5">
        {barHeights.map((h, i) => {
          const isLatest = i === barHeights.length - 1;
          return (
            <motion.div
              key={i}
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: `${h * progress}%`,
                opacity: 1,
              }}
              transition={{
                delay: i * 0.03,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`flex-1 rounded-sm transition-colors ${
                isLatest
                  ? isLight
                    ? "bg-[#1C1E23]"
                    : "bg-[#EDEDED]"
                  : isLight
                  ? "bg-[#1C1E23]/25"
                  : "bg-[#EDEDED]/20"
              }`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 280 55"
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={isLight ? "#1C1E23" : "#EDEDED"}
              stopOpacity={isLight ? 0.22 : 0.2}
            />
            <stop
              offset="100%"
              stopColor={isLight ? "#1C1E23" : "#EDEDED"}
              stopOpacity={0.0}
            />
          </linearGradient>
        </defs>

        {/* Shaded Area Fill */}
        <motion.path
          d={areaPath}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: progress }}
          transition={{ duration: 0.6 }}
        />

        {/* Glowing Trajectory Line */}
        <motion.path
          d={svgPath}
          fill="none"
          stroke={isLight ? "#1C1E23" : "#EDEDED"}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Pulse Beacon at Tip */}
        <motion.circle
          cx={280}
          cy={4}
          r={3.5}
          fill={isLight ? "#1C1E23" : "#EDEDED"}
          initial={{ scale: 0 }}
          animate={{ scale: progress > 0.9 ? [1, 1.3, 1] : 0 }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </svg>
    </div>
  );
}
