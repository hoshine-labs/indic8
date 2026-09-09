"use client";

import React, { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { ChartEmptyState } from "./ChartEmptyState";
import { RevenuePoint } from "@/lib/domain/types";
import { formatCurrencyAmount } from "@/lib/currency";
import { CurrencyCode } from "@/lib/types";
import { EvilAreaChart, type ChartConfig } from "@/components/evilcharts";

export interface Indic8ChartProps {
  data: RevenuePoint[];
  currency?: string;
  height?: number | string;
  showGrid?: boolean;
  showYAxis?: boolean;
  showBrush?: boolean;
  showLegend?: boolean;
  className?: string;
  valueFormatter?: (val: number) => string;
}

export const Indic8Chart: React.FC<Indic8ChartProps> = ({
  data,
  currency = "USD",
  height = 270,
  showGrid = true,
  showYAxis = false,
  showBrush = true,
  showLegend = false,
  className = "",
  valueFormatter,
}) => {
  const { isDark, tokens } = useTheme();

  const chartConfig = useMemo(() => {
    const strokeColor = tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D");
    return {
      amount: {
        label: "Gross Revenue",
        colors: {
          light: [strokeColor],
          dark: [strokeColor],
        },
      },
    } satisfies ChartConfig;
  }, [isDark, tokens]);

  if (!data || data.length === 0) {
    return <ChartEmptyState className={typeof height === "number" ? `h-[${height}px]` : "h-48"} />;
  }

  const formatter = valueFormatter || ((val: number) => formatCurrencyAmount(val, currency as CurrencyCode));

  return (
    <div className={`w-full select-none ${className}`}>
      <EvilAreaChart
        data={data as unknown as Record<string, unknown>[]}
        config={chartConfig}
        className="w-full"
        curveType="monotone"
        xDataKey="date"
        height={height}
      >
        {showGrid && <EvilAreaChart.Grid vertical={false} strokeDasharray="3 3" />}
        <EvilAreaChart.XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          minTickGap={14}
          interval="preserveStartEnd"
          tickFormatter={(value) => {
            if (!value) return "";
            const parts = String(value).split(" ");
            return parts.length > 1 ? parts.slice(0, 2).join(" ") : String(value);
          }}
        />
        {showYAxis && <EvilAreaChart.YAxis hide={false} tickFormatter={formatter as any} />}
        {showBrush && data.length > 3 && (
          <EvilAreaChart.Brush
            height={56}
            formatLabel={(value) => {
              if (!value) return "";
              const str = String(value).trim();
              const parts = str.split(" ");
              return parts[0] || str;
            }}
          />
        )}
        {showLegend && <EvilAreaChart.Legend isClickable />}
        <EvilAreaChart.Tooltip
          formatter={(val: any) => (
            <div className="flex items-center justify-between w-full gap-4">
              <span className="text-xs text-brand-secondary">Amount</span>
              <span className="font-mono text-xs font-semibold text-brand-primary">
                {formatter(Number(val))}
              </span>
            </div>
          )}
        />
        <EvilAreaChart.Area dataKey="amount" variant="gradient" strokeVariant="solid" isClickable />
      </EvilAreaChart>
    </div>
  );
};
