"use client";

import React from "react";
import { TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "../utils";

export interface VisxTooltipProps {
  left: number;
  top: number;
  children: React.ReactNode;
  className?: string;
}

export const VisxTooltip: React.FC<VisxTooltipProps> = ({
  left,
  top,
  children,
  className = "",
}) => {
  const { isDark, tokens } = useTheme();

  return (
    <TooltipWithBounds
      key={Math.random()}
      top={top}
      left={left}
      style={{
        ...defaultStyles,
        backgroundColor: tokens.surface.base,
        color: tokens.brand.primary,
        border: `1px solid ${tokens.border.default}`,
        boxShadow: isDark
          ? "0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 2px 6px -1px rgba(0, 0, 0, 0.4)"
          : "0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.06)",
        borderRadius: "10px",
        padding: "8px 12px",
        pointerEvents: "none",
        zIndex: 9999,
        opacity: 1,
      }}
      className={cn("text-xs select-none min-w-[130px]", className)}
    >
      {children}
    </TooltipWithBounds>
  );
};
