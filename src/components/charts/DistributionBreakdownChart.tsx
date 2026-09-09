"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { formatCurrencyAmount, convertCurrency } from "@/lib/currency";
import { CurrencyCode, Transaction } from "@/lib/types";
import { UnifiedProduct } from "@/lib/types";
import { Dropdown, AnimatedTabs, DropdownOption, TabOption, NumberFlowAmount } from "@/components/ui";
import {
  Squares2X2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { EChartsPieChart, type ChartConfig as PieChartConfig } from "@/components/evilcharts/charts/echarts-pie-chart";
import { ChartCard, ChartSubItem } from "./ChartCard";

export type DistributionDimension = "product" | "country" | "provider" | "status";
export type DistributionMetric = "revenue" | "orders";
export type DistributionViewMode = "donut" | "bars";

export interface DistributionBreakdownChartProps {
  products: UnifiedProduct[];
  transactions: Transaction[];
  primaryCurrency?: CurrencyCode;
}

const PALETTE = [
  "#8b5cf6", // Electric Violet
  "#3b82f6", // Vivid Cobalt Blue
  "#06b6d4", // Bright Cyan
  "#10b981", // Emerald Green
  "#f59e0b", // Warm Amber
  "#f43f5e", // Rose Red
  "#64748b", // Slate (for Other)
];

function getCountryName(code: string): string {
  try {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export const DistributionBreakdownChart: React.FC<DistributionBreakdownChartProps> = ({
  products,
  transactions,
  primaryCurrency = "USD",
}) => {
  const { isDark } = useTheme();

  const [dimension, setDimension] = useState<DistributionDimension>("product");
  const [metric, setMetric] = useState<DistributionMetric>("revenue");
  const [viewMode, setViewMode] = useState<DistributionViewMode>("donut");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);

  // Dimension dropdown options
  const dimensionOptions: DropdownOption[] = [
    { id: "product", label: "Application" },
    { id: "country", label: "Country" },
    { id: "provider", label: "Provider" },
    { id: "status", label: "Status" },
  ];

  // Metric options for AnimatedTabs
  const metricTabs: TabOption[] = [
    { id: "revenue", label: "Revenue" },
    { id: "orders", label: "Orders" },
  ];

  // View mode options for AnimatedTabs
  const viewTabs: TabOption[] = [
    { id: "donut", label: "Donut" },
    { id: "bars", label: "Ranked" },
  ];

  // Compute aggregated distribution items
  const { chartData, allItems, totalOrdersCount, totalRevenueSum } = useMemo(() => {
    const aggMap = new Map<string, { label: string; subLabel?: string; revenue: number; orders: number; flagCode?: string }>();

    let totalOrdersCount = 0;
    let totalRevenueSum = 0;

    if (dimension === "product") {
      products.forEach((prod) => {
        const prodTxs = transactions.filter((t) => {
          const prodIdClean = prod.id.toLowerCase().replace(/[^a-z0-9]/g, "");
          const txProdIdClean = t.productId.toLowerCase().replace(/[^a-z0-9]/g, "");
          const txNameClean = t.productName.toLowerCase().replace(/[^a-z0-9]/g, "");
          const prodNameClean = prod.name.toLowerCase().replace(/[^a-z0-9]/g, "");

          return (
            t.productId === prod.id ||
            txProdIdClean.includes(prodIdClean) ||
            prodIdClean.includes(txProdIdClean) ||
            txNameClean.includes(prodNameClean) ||
            prodNameClean.includes(txNameClean)
          );
        });

        const succeeded = prodTxs.filter((t) => t.status === "succeeded");
        const rev = succeeded.reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, primaryCurrency), 0);
        const orderCount = succeeded.length || (prod.totalSales > 0 ? prod.totalSales : 0);
        const finalRev = Math.max(prod.totalRevenue, rev);

        totalOrdersCount += orderCount;
        totalRevenueSum += finalRev;

        aggMap.set(prod.id, {
          label: prod.name,
          subLabel: prod.id,
          revenue: finalRev,
          orders: orderCount,
        });
      });
    } else if (dimension === "provider") {
      transactions.forEach((t) => {
        if (t.status !== "succeeded") return;
        const provKey = t.provider || "google_play";
        const current = aggMap.get(provKey) || {
          label: provKey === "google_play" ? "Google Play" : provKey.toUpperCase(),
          subLabel: "Payment Gateway",
          revenue: 0,
          orders: 0,
        };
        const rev = convertCurrency(t.amount, t.currency, primaryCurrency);
        current.revenue += rev;
        current.orders += 1;
        totalOrdersCount += 1;
        totalRevenueSum += rev;
        aggMap.set(provKey, current);
      });
    } else if (dimension === "country") {
      transactions.forEach((t) => {
        if (t.status !== "succeeded") return;
        const countryCode = (t.customerCountry || "US").toUpperCase();
        const current = aggMap.get(countryCode) || {
          label: getCountryName(countryCode),
          subLabel: countryCode,
          flagCode: countryCode.toLowerCase(),
          revenue: 0,
          orders: 0,
        };
        const rev = convertCurrency(t.amount, t.currency, primaryCurrency);
        current.revenue += rev;
        current.orders += 1;
        totalOrdersCount += 1;
        totalRevenueSum += rev;
        aggMap.set(countryCode, current);
      });
    } else if (dimension === "status") {
      transactions.forEach((t) => {
        const isRefund = t.status === "refunded";
        const key = isRefund ? "refunded" : "succeeded";
        const current = aggMap.get(key) || {
          label: isRefund ? "Refunds & Disputes" : "Completed Purchases",
          subLabel: isRefund ? "Returned funds" : "Fulfilled checkouts",
          revenue: 0,
          orders: 0,
        };
        const rev = convertCurrency(t.amount, t.currency, primaryCurrency);
        current.revenue += rev;
        current.orders += 1;
        if (!isRefund) {
          totalOrdersCount += 1;
          totalRevenueSum += rev;
        }
        aggMap.set(key, current);
      });
    }

    const items = Array.from(aggMap.values())
      .filter((item) => (metric === "revenue" ? item.revenue > 0 : item.orders > 0))
      .sort((a, b) => (metric === "revenue" ? b.revenue - a.revenue : b.orders - a.orders));

    const totalValue = items.reduce((sum, item) => sum + (metric === "revenue" ? item.revenue : item.orders), 0);

    const allWithPercentage = items.map((item, index) => {
      const val = metric === "revenue" ? item.revenue : item.orders;
      const percentage = totalValue > 0 ? (val / totalValue) * 100 : 0;
      return {
        ...item,
        value: val,
        percentage,
        color: PALETTE[index % (PALETTE.length - 1)],
      };
    });

    // Smart grouping: Keep top 5 items, group remainder into "Other"
    let chartData: typeof allWithPercentage = [];
    if (allWithPercentage.length <= 6) {
      chartData = allWithPercentage;
    } else {
      const topItems = allWithPercentage.slice(0, 5);
      const otherItems = allWithPercentage.slice(5);
      const otherRev = otherItems.reduce((sum, item) => sum + item.revenue, 0);
      const otherOrders = otherItems.reduce((sum, item) => sum + item.orders, 0);
      const otherVal = metric === "revenue" ? otherRev : otherOrders;
      const otherPercentage = totalValue > 0 ? (otherVal / totalValue) * 100 : 0;

      chartData = [
        ...topItems,
        {
          label: `Other (${otherItems.length} ${dimension === "country" ? "countries" : "items"})`,
          subLabel: "Remaining items",
          revenue: otherRev,
          orders: otherOrders,
          value: otherVal,
          percentage: otherPercentage,
          color: PALETTE[PALETTE.length - 1], // Slate
        },
      ];
    }

    return {
      chartData,
      allItems: allWithPercentage,
      totalOrdersCount,
      totalRevenueSum,
    };
  }, [products, transactions, dimension, metric, primaryCurrency]);

  const activeDisplayList = showAllItems ? allItems : chartData;

  // Build EChartsPieChart data and config
  const { pieData, pieConfig } = useMemo(() => {
    const config: PieChartConfig = {};
    const data = chartData.map((item, idx) => {
      const key = `key_${idx}`;
      config[key] = {
        label: item.label,
        colors: {
          light: [item.color],
          dark: [item.color],
        },
      };
      return {
        itemKey: key,
        value: item.value,
        label: item.label,
      };
    });

    return { pieData: data, pieConfig: config };
  }, [chartData]);

  return (
    <ChartCard className="space-y-3">
      {/* Header with Unified Pill-Shaped Aligned Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3 border-b border-border-default/60">
        <div className="flex items-center gap-2">
          <Squares2X2Icon className="w-4 h-4 text-brand-secondary shrink-0" />
          <div>
            <h3 className="text-xs font-semibold text-brand-primary">
              Distribution &amp; Mix Breakdown
            </h3>
            <span className="text-[11px] text-brand-muted">
              {metric === "revenue" ? "Revenue distribution" : "Sales volume distribution"} by {dimension}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dimension Selector Dropdown */}
          <Dropdown
            label="Dimension"
            options={dimensionOptions}
            value={dimension}
            onChange={(id) => setDimension(id as DistributionDimension)}
            size="md"
            width="170px"
          />

          {/* Metric Selector using AnimatedTabs */}
          <AnimatedTabs
            options={metricTabs}
            activeId={metric}
            onChange={(id) => setMetric(id as DistributionMetric)}
            size="md"
            layoutId="dist-metric-pill"
          />

          {/* View Mode Toggle using AnimatedTabs */}
          <AnimatedTabs
            options={viewTabs}
            activeId={viewMode}
            onChange={(id) => setViewMode(id as DistributionViewMode)}
            size="md"
            layoutId="dist-view-pill"
          />
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-xs text-brand-muted font-sans">
          No checkout or order records found for this distribution dimension.
        </div>
      ) : viewMode === "donut" ? (
        /* Donut View using EChartsPieChart (with right toggleable legend) + Partition Divider + Grid Aligned Side Legend */
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8 pt-2">
          {/* Donut Chart Container with Vertical Interactive Toggle Legend */}
          <div className="relative w-full max-w-[420px] sm:max-w-[460px] h-[250px] shrink-0 flex items-center justify-center">
            <EChartsPieChart
              className="h-full w-full"
              data={pieData}
              dataKey="value"
              nameKey="itemKey"
              config={pieConfig}
              valueFormatter={(val) =>
                metric === "revenue"
                  ? formatCurrencyAmount(val, primaryCurrency)
                  : `${val.toLocaleString()} orders`
              }
            >
              <EChartsPieChart.Legend isClickable position="right" />
              <EChartsPieChart.Tooltip />
              <EChartsPieChart.Pie
                isClickable
                innerRadius={30}
                paddingAngle={4}
                cornerRadius={8}
              />
            </EChartsPieChart>
          </div>

          {/* Small Vertical Partition Line */}
          <div className="hidden lg:block w-px self-stretch bg-border-default/60 my-2 shrink-0" />

          {/* Grid Aligned Side Legend List */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center space-y-1 w-full">
            {chartData.map((item, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <ChartSubItem
                  key={`${item.label}-${idx}`}
                  isActive={isHovered}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-1.5 px-2.5"
                >
                  {/* Column 1: Dot + Flag + Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.flagCode && (
                      <img
                        src={`https://flagcdn.com/20x15/${item.flagCode}.png`}
                        alt={item.label}
                        className="w-4 h-3 object-cover rounded-xs shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="text-xs font-medium text-brand-primary truncate">
                      {item.label}
                    </span>
                  </div>

                  {/* Column 2: Order Count / Revenue */}
                  <div className="text-right whitespace-nowrap">
                    <span className="text-xs font-mono font-medium text-brand-primary">
                      {metric === "revenue" ? (
                        <NumberFlowAmount value={item.revenue} currency={primaryCurrency} />
                      ) : (
                        <NumberFlowAmount value={item.orders} suffix="orders" />
                      )}
                    </span>
                  </div>

                  {/* Column 3: Percentage with Consistent Width */}
                  <div className="w-12 text-right whitespace-nowrap">
                    <span className="text-xs font-mono text-brand-muted">
                      <NumberFlowAmount value={item.percentage} suffix="%" minimumFractionDigits={1} maximumFractionDigits={1} />
                    </span>
                  </div>
                </ChartSubItem>
              );
            })}

            {allItems.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllItems(!showAllItems)}
                className="flex items-center justify-center gap-1 w-full pt-2 text-[11px] font-mono text-brand-muted hover:text-brand-primary transition cursor-pointer"
              >
                <span>{showAllItems ? "Show Top 5" : `View all ${allItems.length} items`}</span>
                {showAllItems ? (
                  <ChevronUpIcon className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Ranked Bar Progress View */
        <div className="space-y-2.5 pt-1">
          {activeDisplayList.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={`${item.label}-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-2.5 rounded-xl border transition ${
                  isHovered
                    ? "border-border-hover bg-surface-subtle"
                    : "border-border-default/50 bg-surface-base"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.flagCode && (
                      <img
                        src={`https://flagcdn.com/20x15/${item.flagCode}.png`}
                        alt={item.label}
                        className="w-3.5 h-2.5 object-cover rounded-xs shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="font-medium text-brand-primary truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="font-semibold text-brand-primary">
                      {metric === "revenue" ? (
                        <NumberFlowAmount value={item.revenue} currency={primaryCurrency} />
                      ) : (
                        <NumberFlowAmount value={item.orders} suffix="orders" />
                      )}
                    </span>
                    <span className="text-brand-muted text-[11px] w-12 text-right">
                      <NumberFlowAmount value={item.percentage} suffix="%" minimumFractionDigits={1} maximumFractionDigits={1} />
                    </span>
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.max(item.percentage, 1)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}

          {allItems.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllItems(!showAllItems)}
              className="flex items-center justify-center gap-1 w-full pt-1 text-[11px] font-mono text-brand-muted hover:text-brand-primary transition cursor-pointer"
            >
              <span>{showAllItems ? "Show Top 5" : `View all ${allItems.length} items`}</span>
              {showAllItems ? (
                <ChevronUpIcon className="w-3.5 h-3.5" />
              ) : (
                <ChevronDownIcon className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      )}
    </ChartCard>
  );
};
