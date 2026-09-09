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
  const { isDark } = useTheme();
  const tokens = isDark ? CHART_TOKENS.dark : CHART_TOKENS.light;

  const data = products.map((p) => ({
    name: p.product.name,
    amount: p.revenue.amount,
    formatted: formatMoney(createMoney(p.revenue.amount, p.revenue.currency || currency)),
  }));

  const barColors = [
    tokens.primaryStroke,
    isDark ? "#A3A3A3" : "#525252",
    isDark ? "#737373" : "#737373",
    isDark ? "#525252" : "#A3A3A3",
  ];

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
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
