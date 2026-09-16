"use client";

import React, { useState, useMemo } from "react";
import { useIndic8Store } from "@/lib/indic8Store";
import { ProviderId } from "@/lib/domain/types";
import { CurrencyCode, TimePeriod } from "@/lib/types";
import {
  RevenueChart,
  WorldSalesMap,
  Indic8Chart,
  DistributionBreakdownChart,
  ChartCard,
  ChartSubContainer,
  ChartSubItem,
} from "@/components/charts";
import { generateRevenueTimeSeries } from "@/lib/metrics/engine";
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency";
import { LocalPreferences } from "@/lib/storage/localPreferences";
import { CustomizeMetricsModal, DEFAULT_METRICS_ORDER } from "./CustomizeMetricsModal";
import { AnimatedTabs, LoadingSpinner, Dropdown, DropdownOption, TabOption, Button, NumberFlowAmount } from "@/components/ui";
import {
  PlusIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/20/solid";
import { BrandIcon } from "@/lib/brandLogos";

export const DashboardView: React.FC = () => {
  const {
    timePeriod,
    setTimePeriod,
    primaryCurrency,
    setPrimaryCurrency,
    providers,
    connections,
    products,
    transactions,
    activities,
    totalConsolidatedRevenue,
    totalConsolidatedSales,
    totalConsolidatedCustomers,
    totalConsolidatedMRR,
    totalConsolidatedRefunds,
    isSyncingAny,
    syncAllProviders,
    setIsOnboardingOpen,
    isDemoMode,
    isInitialLoading,
  } = useIndic8Store();

  const [selectedProvider] = useState<ProviderId | "ALL">("ALL");
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [selectedMapCountry, setSelectedMapCountry] = useState<string | null>(null);
  const [showRevenueBrush, setShowRevenueBrush] = useState<boolean>(true);
  const [showMrrBrush, setShowMrrBrush] = useState<boolean>(true);
  const [showSubsBrush, setShowSubsBrush] = useState<boolean>(true);
  const [showCumBrush, setShowCumBrush] = useState<boolean>(true);
  const [metricsOrder, setMetricsOrder] = useState<string[]>(() => {
    return LocalPreferences.get("dashboardMetricsOrder") || DEFAULT_METRICS_ORDER;
  });

  const hasConnectedProviders = connections.length > 0 || providers.length > 0 || isDemoMode;

  // Filter transactions strictly based on selected timePeriod & provider
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(0);

    if (timePeriod === "today" || timePeriod === "yesterday") {
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timePeriod === "7d") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timePeriod === "30d") {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timePeriod === "3m" || timePeriod === "this_month" || timePeriod === "last_month") {
      cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (timePeriod === "12m" || timePeriod === "this_year") {
      cutoff = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    }

    return transactions.filter((t) => {
      const matchProvider = selectedProvider === "ALL" || t.provider === selectedProvider;
      const txDate = new Date(t.timestamp);
      const matchTime = timePeriod === "all" || timePeriod === "lifetime" || (!isNaN(txDate.getTime()) && txDate >= cutoff);
      return matchProvider && matchTime;
    });
  }, [transactions, selectedProvider, timePeriod]);

  // Compute timeframe gross revenue
  const timeframeRevenue = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.status === "succeeded")
      .reduce((acc, t) => acc + convertCurrency(t.amount, t.currency, primaryCurrency), 0);
  }, [filteredTransactions, primaryCurrency]);

  // Compute timeframe total orders
  const timeframeOrders = useMemo(() => {
    return filteredTransactions.filter((t) => t.status === "succeeded").length;
  }, [filteredTransactions]);

  // Compute timeframe total refunds
  const timeframeRefunds = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.status === "refunded")
      .reduce((acc, t) => acc + convertCurrency(t.amount, t.currency, primaryCurrency), 0);
  }, [filteredTransactions, primaryCurrency]);

  const timeframeRefundOrders = useMemo(() => {
    return filteredTransactions.filter((t) => t.status === "refunded").length;
  }, [filteredTransactions]);

  // Compute timeframe MRR from active subscriptions
  const timeframeMRR = useMemo(() => {
    const sum = products.reduce((acc, p) => acc + (p.mrr || 0), 0);
    return convertCurrency(sum, "USD", primaryCurrency);
  }, [products, primaryCurrency]);

  // Compute timeframe active subscriptions count
  const timeframeSubscriptions = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.activeSubscriptions || 0), 0);
  }, [products]);

  // Compute timeframe unique customer accounts
  const timeframeCustomers = useMemo(() => {
    const unique = new Set(filteredTransactions.map((t) => t.customerEmail).filter(Boolean));
    return unique.size;
  }, [filteredTransactions]);

  // Generate continuous time series for the selected timeframe
  const revenueSeries = useMemo(() => {
    return generateRevenueTimeSeries(filteredTransactions, timePeriod, primaryCurrency, { products });
  }, [filteredTransactions, timePeriod, primaryCurrency, products]);

  // Generate flat line series for MRR across the time range
  const flatMRRSeries = useMemo(() => {
    return revenueSeries.map((pt) => ({
      date: pt.date,
      amount: timeframeMRR,
      currency: primaryCurrency,
      formattedAmount: formatCurrencyAmount(timeframeMRR, primaryCurrency),
    }));
  }, [revenueSeries, timeframeMRR, primaryCurrency]);

  // Generate flat line series for active subscriptions
  const flatSubsSeries = useMemo(() => {
    return revenueSeries.map((pt) => ({
      date: pt.date,
      amount: timeframeSubscriptions,
      currency: primaryCurrency,
      formattedAmount: `${timeframeSubscriptions} subs`,
    }));
  }, [revenueSeries, timeframeSubscriptions, primaryCurrency]);

  // Generate cumulative revenue series
  const cumulativeSeries = useMemo(() => {
    let running = 0;
    return revenueSeries.map((pt) => {
      running += pt.amount;
      return {
        date: pt.date,
        amount: running,
        currency: primaryCurrency,
        formattedAmount: formatCurrencyAmount(running, primaryCurrency),
      };
    });
  }, [revenueSeries, primaryCurrency]);

  // Aggregate Geographic Sales Data
  const geoData = useMemo(() => {
    const map: Record<string, { revenueNorm: number; ordersCount: number; products: Record<string, { count: number; revenueNorm: number }> }> = {};
    filteredTransactions.forEach((tx) => {
      if (tx.status !== "succeeded") return;
      const country = (tx.customerCountry || "US").toUpperCase();
      const normAmt = convertCurrency(tx.amount, tx.currency, primaryCurrency);

      if (!map[country]) {
        map[country] = { revenueNorm: 0, ordersCount: 0, products: {} };
      }
      map[country].ordersCount += 1;
      map[country].revenueNorm += normAmt;

      const pName = tx.productName || "Software Product";
      if (!map[country].products[pName]) {
        map[country].products[pName] = { count: 0, revenueNorm: 0 };
      }
      map[country].products[pName].count += 1;
      map[country].products[pName].revenueNorm += normAmt;
    });
    return map;
  }, [filteredTransactions, primaryCurrency]);

  // Show all regions with purchases
  const topCountries = useMemo(() => {
    return Object.entries(geoData)
      .map(([code, d]) => ({ code, ...d }))
      .sort((a, b) => b.revenueNorm - a.revenueNorm);
  }, [geoData]);

  // Dynamic date range string label (ALWAYS called at top level before early returns)
  const timeframeLabel = useMemo(() => {
    const now = new Date();
    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    if (timePeriod === "today" || timePeriod === "yesterday") {
      return formatDate(now);
    }
    if (timePeriod === "7d") {
      const past = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      return `${past.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${formatDate(now)}`;
    }
    if (timePeriod === "30d") {
      const past = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      return `${past.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${formatDate(now)}`;
    }
    if (timePeriod === "3m" || timePeriod === "this_month" || timePeriod === "last_month") {
      const past = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
      return `${past.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${formatDate(now)}`;
    }
    if (timePeriod === "12m" || timePeriod === "this_year") {
      const past = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return `${past.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${formatDate(now)}`;
    }

    // "all" / "lifetime" - Date range from earliest transaction
    const validTimes = filteredTransactions
      .map((t) => new Date(t.timestamp || 0).getTime())
      .filter((t) => !isNaN(t) && t > 0);

    const earliestMs = validTimes.length > 0 ? Math.min(...validTimes) : now.getTime() - 365 * 24 * 3600 * 1000;
    const firstDate = new Date(earliestMs);
    return `${firstDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${formatDate(now)}`;
  }, [timePeriod, filteredTransactions]);

  const handleSaveMetricsOrder = (newOrder: string[]) => {
    setMetricsOrder(newOrder);
    LocalPreferences.set("dashboardMetricsOrder", newOrder);
  };

  // Currency options for Dropdown
  const currencyOptions: DropdownOption[] = [
    { id: "USD", label: "USD ($)" },
    { id: "EUR", label: "EUR (€)" },
    { id: "GBP", label: "GBP (£)" },
    { id: "INR", label: "INR (₹)" },
    { id: "JPY", label: "JPY (¥)" },
  ];

  // Timeframe tabs
  const timeframeTabs: TabOption[] = [
    { id: "all", label: "All" },
    { id: "12m", label: "12m" },
    { id: "3m", label: "3m" },
    { id: "30d", label: "30d" },
    { id: "7d", label: "7d" },
    { id: "today", label: "Today" },
  ];

  // State 0: Simple Centered Loading State
  if (isInitialLoading) {
    return (
      <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // State A: Authentic First-Time User Experience (No Providers Connected)
  if (!hasConnectedProviders) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 select-none">
        <div className="py-14 px-6 md:px-12 rounded-3xl border border-border-default bg-surface-base text-center space-y-6 shadow-xs">
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-brand-primary tracking-tight">
              Your business, in one place.
            </h2>
            <p className="text-xs text-brand-secondary leading-relaxed">
              Connect a payment provider to start aggregating your real revenue, software products, customers, and subscriptions in indic8.
            </p>
          </div>

          <div>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="h-10 px-6 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Connect Provider</span>
            </button>
          </div>

          <div className="pt-6 border-t border-border-default max-w-xl mx-auto">
            <span className="text-[10px] uppercase font-mono text-brand-muted block mb-3.5 tracking-wider">
              Supported Read-Only Data Sources
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-brand-secondary">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle border border-border-default shadow-2xs font-medium">
                <BrandIcon provider="stripe" className="w-3.5 h-3.5" colored={true} />
                <span>Stripe</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle border border-border-default shadow-2xs font-medium">
                <BrandIcon provider="polar" className="w-3.5 h-3.5" colored={true} />
                <span>Polar.sh</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle border border-border-default shadow-2xs font-medium">
                <BrandIcon provider="revenuecat" className="w-3.5 h-3.5" colored={true} />
                <span>RevenueCat</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle border border-border-default shadow-2xs font-medium">
                <BrandIcon provider="app_store" className="w-3.5 h-3.5" colored={true} />
                <span>App Store</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle border border-border-default shadow-2xs font-medium">
                <BrandIcon provider="google_play" className="w-3.5 h-3.5" colored={true} />
                <span>Google Play</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle border border-border-default shadow-2xs font-medium">
                <BrandIcon provider="lemonsqueezy" className="w-3.5 h-3.5" colored={true} />
                <span>Lemon Squeezy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper renderers for dynamic metric cards
  const renderMetricCard = (metricId: string) => {
    switch (metricId) {
      case "revenue":
        return (
          <ChartCard key="revenue">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-normal text-brand-secondary">Gross Revenue</span>
                <div className="text-3xl sm:text-4xl font-normal tracking-tight text-brand-primary font-mono mt-1">
                  <NumberFlowAmount value={timeframeRevenue} currency={primaryCurrency} />
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-muted font-sans">
                  <span className="w-2 h-2 rounded-full border border-blue-500 bg-transparent" />
                  <span>{timeframeLabel}</span>
                </div>
              </div>

              {revenueSeries.length > 5 && (
                <Button
                  variant="subtle"
                  size="md"
                  onClick={() => setShowRevenueBrush((prev) => !prev)}
                  icon={<AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />}
                  title={showRevenueBrush ? "Hide Range Slider" : "Show Range Slider"}
                >
                  <span className="hidden sm:inline">{showRevenueBrush ? "Hide Range" : "Show Range"}</span>
                </Button>
              )}
            </div>

            <div className="pt-0.5 px-1">
              <Indic8Chart
                data={revenueSeries}
                currency={primaryCurrency}
                height={240}
                showBrush={showRevenueBrush}
              />
            </div>
          </ChartCard>
        );

      case "distribution_breakdown":
        return (
          <DistributionBreakdownChart
            key="distribution_breakdown"
            products={products}
            transactions={filteredTransactions}
            primaryCurrency={primaryCurrency}
          />
        );

      case "mrr":
        return (
          <ChartCard key="mrr">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-normal text-brand-secondary">Monthly Recurring Revenue (MRR)</span>
                <div className="text-3xl font-normal tracking-tight text-brand-primary font-mono mt-1">
                  <NumberFlowAmount value={timeframeMRR} currency={primaryCurrency} />
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-muted font-sans">
                  <span className="w-2 h-2 rounded-full border border-blue-500 bg-transparent" />
                  <span>{timeframeLabel}</span>
                </div>
              </div>

              {flatMRRSeries.length > 5 && (
                <Button
                  variant="subtle"
                  size="md"
                  onClick={() => setShowMrrBrush((prev) => !prev)}
                  icon={<AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />}
                  title={showMrrBrush ? "Hide Range Slider" : "Show Range Slider"}
                >
                  <span className="hidden sm:inline">{showMrrBrush ? "Hide Range" : "Show Range"}</span>
                </Button>
              )}
            </div>

            <div className="pt-0.5 px-1">
              <Indic8Chart
                data={flatMRRSeries}
                currency={primaryCurrency}
                height={240}
                showBrush={showMrrBrush}
              />
            </div>
          </ChartCard>
        );

      case "subscriptions":
        return (
          <ChartCard key="subscriptions">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-normal text-brand-secondary">Active Subscriptions</span>
                <div className="text-3xl font-normal tracking-tight text-brand-primary font-mono mt-1">
                  <NumberFlowAmount value={timeframeSubscriptions} />
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-muted font-sans">
                  <span className="w-2 h-2 rounded-full border border-blue-500 bg-transparent" />
                  <span>{timeframeLabel}</span>
                </div>
              </div>

              {flatSubsSeries.length > 5 && (
                <Button
                  variant="subtle"
                  size="md"
                  onClick={() => setShowSubsBrush((prev) => !prev)}
                  icon={<AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />}
                  title={showSubsBrush ? "Hide Range Slider" : "Show Range Slider"}
                >
                  <span className="hidden sm:inline">{showSubsBrush ? "Hide Range" : "Show Range"}</span>
                </Button>
              )}
            </div>

            <div className="pt-0.5 px-1">
              <Indic8Chart
                data={flatSubsSeries}
                currency={primaryCurrency}
                height={240}
                showBrush={showSubsBrush}
                valueFormatter={(val) => Math.round(val).toLocaleString()}
              />
            </div>
          </ChartCard>
        );

      case "net_revenue":
        return (
          <ChartCard key="net_revenue">
            <div>
              <span className="text-xs font-normal text-brand-secondary">Net Revenue (After Refunds)</span>
              <div className="text-3xl font-normal tracking-tight text-brand-primary font-mono mt-1">
                <NumberFlowAmount value={Math.max(0, timeframeRevenue - timeframeRefunds)} currency={primaryCurrency} />
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-muted font-sans">
                <span className="w-2 h-2 rounded-full border border-emerald-500 bg-transparent" />
                <span>Fulfilled earnings</span>
              </div>
            </div>
          </ChartCard>
        );

      case "cumulative_revenue":
        return (
          <ChartCard key="cumulative_revenue">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-normal text-brand-secondary">Cumulative Revenue</span>
                <div className="text-3xl font-normal tracking-tight text-brand-primary font-mono mt-1">
                  <NumberFlowAmount value={timeframeRevenue} currency={primaryCurrency} />
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-muted font-sans">
                  <span className="w-2 h-2 rounded-full border border-blue-500 bg-transparent" />
                  <span>{timeframeLabel}</span>
                </div>
              </div>

              {cumulativeSeries.length > 5 && (
                <Button
                  variant="subtle"
                  size="md"
                  onClick={() => setShowCumBrush((prev) => !prev)}
                  icon={<AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />}
                  title={showCumBrush ? "Hide Range Slider" : "Show Range Slider"}
                >
                  <span className="hidden sm:inline">{showCumBrush ? "Hide Range" : "Show Range"}</span>
                </Button>
              )}
            </div>

            <div className="pt-0.5 px-1">
              <Indic8Chart
                data={cumulativeSeries}
                currency={primaryCurrency}
                height={270}
                showBrush={showCumBrush}
              />
            </div>
          </ChartCard>
        );

      case "orders":
        return (
          <ChartCard key="orders">
            <div>
              <span className="text-xs font-normal text-brand-secondary">Paid Orders</span>
              <div className="text-3xl font-normal tracking-tight text-brand-primary font-mono mt-1">
                <NumberFlowAmount value={timeframeOrders} />
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-muted font-sans">
                <span className="w-2 h-2 rounded-full border border-purple-500 bg-transparent" />
                <span>{timeframeLabel}</span>
              </div>
            </div>
          </ChartCard>
        );

      case "customers":
        return (
          <ChartCard key="customers">
            <div>
              <span className="text-xs font-normal text-brand-secondary">Customer Accounts</span>
              <div className="text-3xl font-normal tracking-tight text-brand-primary font-mono mt-1">
                <NumberFlowAmount value={timeframeCustomers} />
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-muted font-sans">
                <span className="w-2 h-2 rounded-full border border-indigo-500 bg-transparent" />
                <span>Unique paying accounts</span>
              </div>
            </div>
          </ChartCard>
        );

      case "refunds":
        return (
          <ChartCard key="refunds">
            <div>
              <span className="text-xs font-normal text-brand-secondary">Refunds &amp; Chargebacks</span>
              <div className="text-3xl font-normal tracking-tight text-rose-400 font-mono mt-1">
                <NumberFlowAmount value={timeframeRefunds} currency={primaryCurrency} />
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-400/80 font-sans">
                <span>{timeframeRefundOrders} refunded checkout(s)</span>
              </div>
            </div>
          </ChartCard>
        );

      case "aov":
        const aov = timeframeOrders > 0 ? timeframeRevenue / timeframeOrders : 0;
        return (
          <ChartCard key="aov">
            <div>
              <span className="text-xs font-normal text-brand-secondary">Average Order Value (AOV)</span>
              <div className="text-3xl font-normal tracking-tight text-brand-primary font-mono mt-1">
                <NumberFlowAmount value={aov} currency={primaryCurrency} />
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-muted font-sans">
                <span className="w-2 h-2 rounded-full border border-amber-500 bg-transparent" />
                <span>Per checkout average</span>
              </div>
            </div>
          </ChartCard>
        );

      case "world_map":
        return (
          <ChartCard key="world_map">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="w-4 h-4 text-brand-secondary" />
                <h3 className="text-xs font-semibold text-brand-primary">
                  Global Sales Distribution
                </h3>
              </div>
              <span className="text-xs font-mono text-brand-muted">
                {topCountries.length} {topCountries.length === 1 ? "country" : "countries"} recorded
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
              <div className="lg:col-span-3">
                <WorldSalesMap
                  geoData={geoData}
                  targetCurrency={primaryCurrency}
                  height={340}
                  selectedCountry={selectedMapCountry}
                  onSelectCountry={setSelectedMapCountry}
                />
              </div>

              {/* Side Leaderboard: All Purchasing Regions using ChartSubContainer and ChartSubItem */}
              <ChartSubContainer className="h-full flex flex-col justify-start">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] uppercase font-mono text-brand-muted tracking-wider">
                      All Regions ({topCountries.length})
                    </span>
                    {selectedMapCountry && (
                      <button
                        type="button"
                        onClick={() => setSelectedMapCountry(null)}
                        className="text-[10px] font-mono text-brand-muted hover:text-brand-primary underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {topCountries.length > 0 ? (
                    <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1 custom-scrollbar">
                      {topCountries.map((c) => {
                        let countryName = c.code;
                        try {
                          countryName = new Intl.DisplayNames(["en"], { type: "region" }).of(c.code) || c.code;
                        } catch { }

                        const isSelected = selectedMapCountry === c.code;

                        return (
                          <ChartSubItem
                            key={c.code}
                            isActive={isSelected}
                            onClick={() => setSelectedMapCountry((prev) => (prev === c.code ? null : c.code))}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={`https://flagcdn.com/24x18/${c.code.toLowerCase()}.png`}
                                width={18}
                                height={13}
                                alt={c.code}
                                className="rounded-xs object-cover shadow-2xs shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-brand-primary truncate">{countryName}</div>
                                <div className="text-[10px] text-brand-muted font-mono">{c.ordersCount} {c.ordersCount === 1 ? "checkout" : "checkouts"}</div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-brand-primary text-xs shrink-0 pl-2">
                              <NumberFlowAmount value={c.revenueNorm} currency={primaryCurrency} />
                            </span>
                          </ChartSubItem>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-brand-muted py-6 text-center">
                      Geographic distribution will show here as orders are placed.
                    </div>
                  )}
                </div>
              </ChartSubContainer>
            </div>
          </ChartCard>
        );

      default:
        return null;
    }
  };

  // Group smaller metrics into 2-column grid pairs if needed
  const primaryCards = metricsOrder.filter((id) => id === "revenue" || id === "world_map" || id === "distribution_breakdown");
  const secondaryCards = metricsOrder.filter((id) => id !== "revenue" && id !== "world_map" && id !== "distribution_breakdown");

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-5 pb-20 select-none">
      {/* Top Header with Aligned Control Group */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-brand-primary tracking-tight">
            Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Currency Dropdown Selector */}
          <Dropdown
            label="Currency"
            options={currencyOptions}
            value={primaryCurrency}
            onChange={(val) => setPrimaryCurrency(val as CurrencyCode)}
            size="md"
            width="160px"
          />

          {/* Timeframe Universal AnimatedTabs */}
          <AnimatedTabs
            options={timeframeTabs}
            activeId={timePeriod === "lifetime" ? "all" : timePeriod}
            onChange={(id) => setTimePeriod(id as TimePeriod)}
            size="md"
            layoutId="dashboard-timeframe-pill"
          />

          {/* Global Refresh Button: Icon-Only button on the left of Customize */}
          <Button
            variant="subtle"
            size="md"
            onClick={() => syncAllProviders()}
            disabled={isSyncingAny}
            icon={<ArrowPathIcon className={`w-3.5 h-3.5 ${isSyncingAny ? "animate-spin text-brand-primary" : ""}`} />}
            title={isSyncingAny ? "Syncing connected providers..." : "Sync all connected payment providers"}
            aria-label="Sync all connected payment providers"
          />

          {/* Customize Dashboard Button */}
          <Button
            variant="subtle"
            size="md"
            onClick={() => setIsCustomizeOpen(true)}
            icon={<AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />}
            title="Customize Dashboard Cards"
          >
            <span className="hidden sm:inline">Customize</span>
          </Button>
        </div>
      </div>

      {/* Main Dynamic Dashboard Grid */}
      <div className="space-y-4">
        {metricsOrder.map((metricId) => {
          if (metricId === "revenue" || metricId === "world_map" || metricId === "distribution_breakdown") {
            return renderMetricCard(metricId);
          }
          return null;
        })}

        {/* Secondary metric cards rendered in 2-column grid */}
        {secondaryCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secondaryCards.map((metricId) => renderMetricCard(metricId))}
          </div>
        )}
      </div>

      {/* Customize Metrics Modal */}
      <CustomizeMetricsModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        selectedMetricIds={metricsOrder}
        onSave={handleSaveMetricsOrder}
      />
    </div>
  );
};
