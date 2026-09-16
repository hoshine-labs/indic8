"use client";

import React, { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { ChartEmptyState } from "./ChartEmptyState";
import { RevenuePoint } from "@/lib/domain/types";
import { formatCurrencyAmount } from "@/lib/currency";
import { CurrencyCode } from "@/lib/types";
import { VisxAreaChart, AnimatedNumber, type ChartConfig, cn } from "@/components/visx";

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
  color?: string;
  label?: string;
  minTickGap?: number;
  interactive?: boolean;
  staticIndex?: number;
  forceLight?: boolean;
  indicatorVariant?: "solid" | "dashed" | "fade";
  id?: string;
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
  color,
  label = "Gross Revenue",
  minTickGap = 85,
  interactive = true,
  staticIndex,
  forceLight = false,
  indicatorVariant = "fade",
  id,
}) => {
  const { isDark, tokens } = useTheme();

  const chartConfig = useMemo(() => {
    const strokeColor = color || tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D");
    return {
      amount: {
        label,
        colors: {
          light: [strokeColor],
          dark: [strokeColor],
        },
      },
    } satisfies ChartConfig;
  }, [isDark, tokens, color, label]);

  if (!data || data.length === 0) {
    return <ChartEmptyState className={typeof height === "number" ? `h-[${height}px]` : "h-48"} />;
  }

  const formatter = valueFormatter || ((val: number) => formatCurrencyAmount(val, currency as CurrencyCode));

  return (
    <div className={`w-full select-none ${className}`}>
      <VisxAreaChart
        data={data as unknown as Record<string, unknown>[]}
        config={chartConfig}
        className="w-full"
        curveType="monotone"
        xDataKey="date"
        height={height}
        interactive={interactive}
        staticIndex={staticIndex}
        forceLight={forceLight}
        id={id}
      >
        {showGrid && <VisxAreaChart.Grid vertical={false} strokeDasharray="3 3" />}
        <VisxAreaChart.XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={14}
          minTickGap={minTickGap}
          tickFormatter={(value) => {
            if (!value) return "";
            const parts = String(value).split(" ");
            return parts.length > 1 ? parts.slice(0, 2).join(" ") : String(value);
          }}
        />
        {showYAxis && <VisxAreaChart.YAxis hide={false} tickFormatter={formatter as any} />}
        {showBrush && data.length > 3 && (
          <VisxAreaChart.Brush
            height={56}
            formatLabel={(value) => {
              if (!value) return "";
              const str = String(value).trim();
              const parts = str.split(" ");
              return parts[0] || str;
            }}
          />
        )}
        {showLegend && <VisxAreaChart.Legend isClickable />}
        <VisxAreaChart.Indicator variant={indicatorVariant} forceLight={forceLight} />
        <VisxAreaChart.Dot forceLight={forceLight} />
        <VisxAreaChart.DateTicker forceLight={forceLight} />
        <VisxAreaChart.Tooltip
          forceLight={forceLight}
          formatter={(val: any, _name, item) => {
            const strokeColor = color || tokens.accent.chartStroke || (isDark ? "#f97316" : "#FF8A3D");
            const dateStr = item?.date || "";
            return (
              <div className="flex items-center justify-between w-full gap-5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "rounded-full shrink-0",
                      forceLight ? "w-3.5 h-3.5" : "w-2.5 h-2.5"
                    )}
                    style={{ backgroundColor: strokeColor }}
                  />
                  <span className={cn("font-semibold truncate", forceLight ? "text-sm sm:text-base text-slate-600" : "text-xs sm:text-[13px] text-brand-muted")}>
                    {dateStr}
                  </span>
                </div>
                <AnimatedNumber
                  value={Number(val)}
                  format={(n) => formatter(n)}
                  className={cn("font-extrabold tabular-nums shrink-0", forceLight ? "text-base sm:text-xl text-slate-900" : "text-sm sm:text-base text-brand-primary")}
                />
              </div>
            );
          }}
        />
        <VisxAreaChart.Area dataKey="amount" variant="gradient" strokeVariant="solid" />
      </VisxAreaChart>
    </div>
  );
};
