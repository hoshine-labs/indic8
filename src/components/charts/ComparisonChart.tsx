"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
import { CHART_TOKENS } from "./chartTokens";
import { CurrencyCode } from "@/lib/domain/types";
import { formatMoney, createMoney } from "@/lib/domain/money";

export interface ComparisonChartItem {
  product: { name: string };
  revenue: { amount: number; currency?: CurrencyCode };
}

export interface ComparisonChartProps {
  products: ComparisonChartItem[];
  currency?: CurrencyCode;
  height?: number;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  products,
  currency = "USD",
  height = 220,
}) => {
  const { isDark, tokens: themeTokens } = useTheme();
  const tokens = isDark ? CHART_TOKENS.dark : CHART_TOKENS.light;

  const data = products.map((p) => ({
    name: p.product.name,
    amount: p.revenue.amount,
    formatted: formatMoney(createMoney(p.revenue.amount, p.revenue.currency || currency)),
  }));

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  const getBarColor = (amount: number) => {
    const baseFill = themeTokens?.surface?.subtle || (isDark ? "#18181f" : "#f1f5f9");
    if (amount <= 0) return baseFill;

    const accent = themeTokens?.accent?.primary || (isDark ? "#6366f1" : "#4f46e5");
    const bright = themeTokens?.accent?.bright || accent;
    if (maxAmount <= 1) return isDark ? bright : accent;

    const ratio = amount / maxAmount;
    if (ratio <= 0.25) {
      return `color-mix(in srgb, ${accent} 30%, ${baseFill})`;
    }
    if (ratio <= 0.5) {
      return `color-mix(in srgb, ${accent} 55%, ${baseFill})`;
    }
    if (ratio <= 0.75) {
      return `color-mix(in srgb, ${accent} 78%, ${baseFill})`;
    }
    return isDark ? bright : accent;
  };

  return (
    <div className="w-full select-none" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 24, bottom: 0 }}
        >
          <CartesianGrid
            stroke={tokens.gridColor}
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tokens.axisTextColor, fontSize: 10 }}
            tickFormatter={(val) => formatMoney(createMoney(val, currency), { compact: true })}
          />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tokens.tooltipText, fontSize: 11, fontWeight: 500 }}
            width={120}
          />
          <Tooltip
            cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-surface-base border border-border-default rounded-xl p-2.5 shadow-xl">
                  <div className="text-[11px] font-medium text-brand-muted">{d.name}</div>
                  <div className="text-sm font-bold text-brand-primary font-mono mt-0.5">
                    {d.formatted}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.amount)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
