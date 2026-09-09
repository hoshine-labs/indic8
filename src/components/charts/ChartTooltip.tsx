"use client";

import React from "react";
import { formatCurrencyAmount } from "@/lib/currency";
import { useTheme } from "@/context/ThemeContext";

export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload?: Record<string, unknown> }>;
  label?: string;
  currency?: string;
  valueFormatter?: (val: number) => string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  currency = "USD",
  valueFormatter,
}) => {
  const { isDark } = useTheme();
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  const amount = data.value ?? 0;
  const formatted = valueFormatter
    ? valueFormatter(amount)
    : formatCurrencyAmount(amount, currency);

  return (
    <div
      className={`rounded-xl p-2.5 shadow-2xl backdrop-blur-md min-w-[130px] pointer-events-none select-none transition-colors ${
        isDark
          ? "bg-[#121317] border border-white/[0.08] text-white"
          : "bg-white border border-black/10 text-neutral-900"
      }`}
    >
      <div className={`text-[11px] font-medium mb-1 ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
        {label}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs font-mono font-semibold">
        <span className={`flex items-center gap-1.5 font-sans text-[11px] font-normal ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Current</span>
        </span>
        <span className="font-mono">{formatted}</span>
      </div>
    </div>
  );
};
