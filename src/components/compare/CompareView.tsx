"use client";

import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useIndic8Store } from "@/lib/indic8Store";
import { Card, CircleFlag } from "@/components/ui";
import { ComparisonChart } from "@/components/charts";
import { createMoney } from "@/lib/domain/money";
import { BrandIcon } from "@/lib/brandLogos";
import {
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  FunnelIcon,
  CubeIcon,
} from "@heroicons/react/20/solid";
import { UnifiedProduct, Transaction } from "@/lib/types";

interface CountryShare {
  code: string;
  name: string;
  pct: number;
  count: number;
}

interface ProductDetailAnalytics {
  topCountry: CountryShare | null;
  allCountries: CountryShare[];
  aov: number;
  pricingModel: string;
  refundCount: number;
  refundRatePct: string;
  growthYoY: string;
}

const UNIFIED_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function formatCompactRevenue(amount: number): string {
  if (!amount || amount === 0) return "$0";
  if (Math.abs(amount) >= 1_000_000) {
    const formatted = (amount / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `$${formatted}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    const formatted = (amount / 1_000).toFixed(1).replace(/\.0$/, "");
    return `$${formatted}K`;
  }
  return `$${Math.round(amount)}`;
}

export const CompareView: React.FC = () => {
  const {
    products,
    transactions,
    selectedProductIdsForCompare,
    toggleProductForCompare,
    setCompareProductIds,
    clearCompareSelection,
    formatCurrency,
    setIsOnboardingOpen,
  } = useIndic8Store();

  const [showMoreMetrics, setShowMoreMetrics] = useState(false);
  const [isCountryExpanded, setIsCountryExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownUniqueId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const hoverLayoutId = `compare-dropdown-hover-${dropdownUniqueId}`;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opening dropdown
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setHoveredOptionId(null);
    }
  }, [isDropdownOpen]);

  // Robust filtering: Only active products are shown (archived products are excluded)
  const activeProducts = useMemo(() => {
    return products.filter((p) => !p.isArchived);
  }, [products]);

  // By default keep top 2 (max 2 by default if present) products by revenue for compare page (strictly real data, no dummy)
  useEffect(() => {
    if (selectedProductIdsForCompare.length === 0 && activeProducts.length > 0) {
      const top2 = [...activeProducts]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 2)
        .map((p) => p.id);
      if (top2.length > 0) {
        setCompareProductIds(top2);
      }
    }
  }, [activeProducts, selectedProductIdsForCompare.length, setCompareProductIds]);

  const comparedProducts = useMemo(() => {
    return activeProducts.filter((p) => selectedProductIdsForCompare.includes(p.id));
  }, [activeProducts, selectedProductIdsForCompare]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return activeProducts;
    const q = searchQuery.toLowerCase().trim();
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
    );
  }, [activeProducts, searchQuery]);

  const chartData = useMemo(() => {
    return comparedProducts.map((p) => ({
      product: { name: p.name },
      revenue: createMoney(p.totalRevenue, "USD"),
    }));
  }, [comparedProducts]);

  const highestRevenueProd = useMemo(() => {
    if (comparedProducts.length === 0) return null;
    return [...comparedProducts].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  }, [comparedProducts]);

  const mostCustomersProd = useMemo(() => {
    if (comparedProducts.length === 0) return null;
    return [...comparedProducts].sort((a, b) => b.totalCustomers - a.totalCustomers)[0];
  }, [comparedProducts]);

  // Derive ONLY authentic metrics from actual products and transactions (Zero dummy/fake data)
  const productAnalytics = useMemo(() => {
    const map: Record<string, ProductDetailAnalytics> = {};

    const getCountryName = (code: string): string => {
      try {
        const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
        return regionNames.of(code.toUpperCase()) || code.toUpperCase();
      } catch {
        return code.toUpperCase();
      }
    };

    comparedProducts.forEach((p) => {
      const prodTxs = transactions.filter(
        (t) => t.productId === p.id || t.productName === p.name
      );

      // Extract real country occurrences from actual transactions
      const countryCounts: Record<string, number> = {};
      prodTxs.forEach((t) => {
        if (t.customerCountry && t.customerCountry.trim()) {
          const c = t.customerCountry.trim().toUpperCase();
          if (c) {
            countryCounts[c] = (countryCounts[c] || 0) + 1;
          }
        }
      });

      const totalCountryTxs = Object.values(countryCounts).reduce(
        (sum, count) => sum + count,
        0
      );

      const allCountries: CountryShare[] = Object.entries(countryCounts)
        .map(([code, count]) => ({
          code: code.toLowerCase(),
          name: getCountryName(code),
          pct: totalCountryTxs > 0 ? Math.round((count / totalCountryTxs) * 100) : 0,
          count,
        }))
        .sort((a, b) => {
          if (b.pct !== a.pct) {
            return b.pct - a.pct;
          }
          return a.name.localeCompare(b.name);
        });

      const topCountry = allCountries.length > 0 ? allCountries[0] : null;
      const aov =
        p.avgOrderValue > 0
          ? p.avgOrderValue
          : p.totalSales > 0
          ? p.totalRevenue / p.totalSales
          : 0;

      const pricingModel =
        p.activeSubscriptions > 0 || p.mrr > 0 ? "Subscription" : "One-Time Payment";

      const refundCount =
        p.totalRefunds ??
        prodTxs.filter((t) => t.status === "refunded" || t.type === "refund").length;
      const totalCount = p.totalSales || prodTxs.length;
      const refundRatePct =
        totalCount > 0 ? `${((refundCount / totalCount) * 100).toFixed(1)}%` : "0.0%";

      // Calculate authentic Growth YoY from product or transactions
      let growthYoY = "—";
      if (p.growthYoY && p.growthYoY.trim()) {
        growthYoY = p.growthYoY.trim();
      } else if (prodTxs.length > 0) {
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

        const currentRev = prodTxs
          .filter((t) => {
            const tDate = new Date(t.timestamp).getTime();
            return tDate >= oneYearAgo.getTime() && (t.status === "succeeded" || !t.status);
          })
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const priorRev = prodTxs
          .filter((t) => {
            const tDate = new Date(t.timestamp).getTime();
            return tDate >= twoYearsAgo.getTime() && tDate < oneYearAgo.getTime() && (t.status === "succeeded" || !t.status);
          })
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        if (priorRev > 0) {
          const rate = ((currentRev - priorRev) / priorRev) * 100;
          growthYoY = `${rate >= 0 ? "+" : ""}${rate.toFixed(1)}%`;
        } else if (currentRev > 0) {
          growthYoY = "+100%";
        }
      }

      map[p.id] = {
        topCountry,
        allCountries,
        aov,
        pricingModel,
        refundCount,
        refundRatePct,
        growthYoY,
      };
    });

    return map;
  }, [comparedProducts, transactions]);

  // Check if any product has real country breakdown data
  const hasAnyCountryData = useMemo(() => {
    return comparedProducts.some(
      (p) => (productAnalytics[p.id]?.allCountries?.length || 0) > 0
    );
  }, [comparedProducts, productAnalytics]);

  // CSS Grid template for seamless side-by-side alignment without table rendering artifacts
  const gridColStyle = useMemo(() => {
    return {
      gridTemplateColumns: `220px repeat(${comparedProducts.length}, minmax(180px, 1fr))`,
    };
  }, [comparedProducts.length]);

  if (activeProducts.length < 2) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 select-none">
        <Card className="p-12 border border-dashed border-border-default rounded-2xl text-center flex flex-col items-center justify-center bg-surface-subtle/20 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-base border border-border-default flex items-center justify-center text-brand-muted">
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-brand-primary">
              Comparison requires at least 2 active products
            </h3>
            <p className="text-xs text-brand-secondary">
              Connect payment providers and import products to compare revenue, orders, customers, and markets side-by-side.
            </p>
          </div>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="mt-2 h-9 px-4 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Connect Provider</span>
          </button>
        </Card>
      </div>
    );
  }

  return (
    <LayoutGroup>
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24 select-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-primary tracking-tight">
              Product Comparison
            </h2>
            <p className="text-xs text-brand-secondary mt-0.5">
              Side-by-side performance matrix for up to 4 active products.
            </p>
          </div>

          {selectedProductIdsForCompare.length > 0 && (
            <button
              onClick={clearCompareSelection}
              className="self-start md:self-auto h-8 px-3.5 rounded-full text-xs font-medium text-brand-secondary hover:text-brand-primary border border-border-default hover:bg-surface-subtle transition cursor-pointer shadow-xs active:scale-95"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Standard Dropdown Menu with Search & Circle Checkboxes (Active Products Only) */}
        <div className="flex flex-wrap items-center gap-3 relative z-30">
          {/* Dropdown Container */}
          <div ref={dropdownRef} className="relative inline-block shrink-0">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`rounded-full bg-surface-base hover:bg-surface-subtle border text-brand-primary font-medium flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-[0.98] h-9 px-3.5 text-xs gap-2 ${
                isDropdownOpen
                  ? "border-brand-primary/40 ring-1 ring-brand-primary/20"
                  : "border-border-default"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FunnelIcon className="w-3.5 h-3.5 text-brand-muted" />
                <span className="font-normal text-brand-primary">
                  {selectedProductIdsForCompare.length === 0
                    ? "Select Products to Compare"
                    : `Comparing (${selectedProductIdsForCompare.length}/4)`}
                </span>
              </div>

              <ChevronDownIcon
                className={`w-3.5 h-3.5 text-brand-muted shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Standard Dropdown Popover */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ type: "spring", bounce: 0.12, duration: 0.2 }}
                  className="absolute top-full left-0 mt-1.5 w-88 sm:w-96 rounded-[24px] border border-border-default bg-surface-base shadow-2xl p-2 space-y-1.5 z-50 overscroll-contain"
                >
                  {/* Search Bar */}
                  <div className="p-1 pb-1.5 border-b border-border-default/60">
                    <div className="relative flex items-center">
                      <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 text-brand-muted pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search active products..."
                        className="w-full h-7 pl-7 pr-6 rounded-full bg-surface-subtle border border-border-default/80 text-[11px] text-brand-primary placeholder:text-brand-muted focus:outline-none focus:border-brand-primary transition font-normal"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 text-brand-muted hover:text-brand-primary cursor-pointer"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subtitle / Limit Notice */}
                  <div className="flex items-center justify-between px-3 py-0.5 text-[10px] text-brand-muted font-mono">
                    <span>Select up to 4 active products</span>
                    <span>{selectedProductIdsForCompare.length} / 4 chosen</span>
                  </div>

                  {/* Scrollable Circle Checkbox Options List with Tabular Alignment & Larger Checkbox */}
                  <div
                    className="max-h-64 overflow-y-auto custom-scrollbar space-y-0.5 overscroll-contain p-0.5"
                    onMouseLeave={() => setHoveredOptionId(null)}
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="py-4 text-center text-xs text-brand-muted font-normal">
                        No matching active products
                      </div>
                    ) : (
                      filteredProducts.map((p) => {
                        const isSelected = selectedProductIdsForCompare.includes(p.id);
                        const isMaxReached =
                          selectedProductIdsForCompare.length >= 4 && !isSelected;
                        const isHovered = hoveredOptionId === p.id;
                        const provider =
                          p.channels?.[0]?.provider || p.providers?.[0]?.provider;

                        return (
                          <div
                            key={p.id}
                            onMouseEnter={() => setHoveredOptionId(p.id)}
                            onClick={() => {
                              if (!isMaxReached) {
                                toggleProductForCompare(p.id);
                              }
                            }}
                            className={`relative w-full min-h-[40px] px-3.5 py-2.5 rounded-full text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                              isMaxReached
                                ? "opacity-40 cursor-not-allowed text-brand-muted"
                                : "text-brand-primary"
                            }`}
                          >
                            {/* Animated Hover Pill Indicator */}
                            {isHovered && !isMaxReached && (
                              <motion.div
                                layoutId={hoverLayoutId}
                                className="absolute inset-0 bg-surface-subtle rounded-full z-0"
                                transition={{ type: "spring", bounce: 0.15, duration: 0.2 }}
                              />
                            )}

                            {/* Left: Bigger Checkbox & Product Name */}
                            <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                              {/* Circle Checkbox (Size 20px with crisp check icon) */}
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-brand-primary border-brand-primary text-surface-canvas shadow-xs"
                                    : "border-border-default/80 bg-surface-canvas"
                                }`}
                              >
                                {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />}
                              </div>

                              {/* Product Title (Non-bold clean text) */}
                              <span className="truncate text-xs font-normal text-brand-primary">
                                {p.name}
                              </span>
                            </div>

                            {/* Right: Tabular Provider Icon + Right-Aligned Compact Revenue */}
                            <div className="relative z-10 flex items-center gap-2 shrink-0">
                              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                {provider ? (
                                  <BrandIcon provider={provider} className="w-3.5 h-3.5" colored={true} />
                                ) : (
                                  <div className="w-3.5 h-3.5 opacity-0" />
                                )}
                              </div>
                              <div className="w-12 text-right font-mono text-[11px] font-normal text-brand-muted tabular-nums">
                                {formatCompactRevenue(p.totalRevenue)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Selected Product Pill Chips with Clean Smooth Fade Motion (No scaling) */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <AnimatePresence mode="popLayout" initial={false}>
              {comparedProducts.map((p) => (
                <motion.div
                  layout="position"
                  key={p.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: UNIFIED_EASE }}
                  className="h-8 pl-3 pr-1.5 rounded-full bg-surface-base border border-border-default text-brand-primary text-xs font-medium inline-flex items-center gap-2 shadow-2xs group hover:border-border-hover transition"
                >
                  <span className="truncate max-w-[140px] font-medium text-brand-primary">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleProductForCompare(p.id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-primary hover:bg-surface-subtle transition cursor-pointer"
                    title={`Remove ${p.name}`}
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Main Content Area */}
        {comparedProducts.length === 0 ? (
          <Card className="p-12 border border-dashed border-border-default rounded-2xl text-center flex flex-col items-center justify-center bg-surface-subtle/20 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-surface-base border border-border-default flex items-center justify-center text-brand-muted mb-3">
              <ArrowsRightLeftIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-brand-primary">No Products Selected</h3>
            <p className="text-xs text-brand-secondary mt-1 max-w-sm">
              Use the dropdown selector above to choose up to 4 active products and analyze their performance side-by-side.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Comparative Horizontal Bar Chart with Dynamic Color Intensity & Standard 2xl Container */}
            <div className="w-full rounded-2xl border border-border-default bg-surface-base p-4 shadow-xs">
              <h3 className="text-xs font-semibold text-brand-primary mb-3">
                Comparative Gross Revenue
              </h3>
              <ComparisonChart products={chartData} height={200} />
            </div>

            {/* Metric Comparison Matrix with Smooth Synchronized Column Adjustments */}
            <div className="w-full rounded-2xl border border-border-default bg-surface-base shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <div
                  className="w-full text-left text-xs"
                  style={{ minWidth: 220 + comparedProducts.length * 180 }}
                >
                  {/* Table Header */}
                  <div
                    className="grid items-center sticky top-0 z-20 bg-surface-subtle border-b border-border-default shadow-2xs text-[11px] font-mono uppercase text-brand-secondary"
                    style={gridColStyle}
                  >
                    <motion.div
                      layout="position"
                      transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                      className="py-3.5 px-4 font-semibold"
                    >
                      Metric
                    </motion.div>
                    {comparedProducts.map((p) => {
                      const provider =
                        p.channels?.[0]?.provider || p.providers?.[0]?.provider;
                      const thumb = p.medias?.[0] || p.imageUrl;

                      return (
                        <motion.div
                          layout="position"
                          key={p.id}
                          transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                          className="py-3.5 px-4 font-semibold text-brand-primary"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-[8px] bg-surface-base border border-border-default/70 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <CubeIcon className="w-4 h-4 text-brand-muted" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-xs text-brand-primary">
                                {p.name}
                              </div>
                              <div className="text-[10px] font-mono text-brand-muted flex items-center gap-1.5 mt-0.5 font-normal">
                                {provider && (
                                  <BrandIcon provider={provider} className="w-3 h-3 shrink-0" colored={true} />
                                )}
                                <span className="truncate">{p.category || "General"}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Core Primary Metrics (Smooth Row Cell Layout Animations) */}
                  <div className="divide-y divide-border-default/50 font-mono">
                    {/* Gross Revenue */}
                    <div
                      className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                      style={gridColStyle}
                    >
                      <motion.div
                        layout="position"
                        transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                        className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                      >
                        Gross Revenue
                      </motion.div>
                      {comparedProducts.map((p) => (
                        <motion.div
                          layout="position"
                          key={p.id}
                          transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                          className="py-3.5 px-4 font-bold text-brand-primary text-xs flex items-center"
                        >
                          <span>{formatCurrency(p.totalRevenue)}</span>
                          {p.id === highestRevenueProd?.id && comparedProducts.length > 1 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-sans bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                              Leader
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Orders / Volume */}
                    <div
                      className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                      style={gridColStyle}
                    >
                      <motion.div
                        layout="position"
                        transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                        className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                      >
                        Orders / Units
                      </motion.div>
                      {comparedProducts.map((p) => (
                        <motion.div
                          layout="position"
                          key={p.id}
                          transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                          className="py-3.5 px-4 text-brand-primary font-semibold"
                        >
                          {p.totalSales.toLocaleString()}
                        </motion.div>
                      ))}
                    </div>

                    {/* Customers */}
                    <div
                      className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                      style={gridColStyle}
                    >
                      <motion.div
                        layout="position"
                        transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                        className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                      >
                        Customers
                      </motion.div>
                      {comparedProducts.map((p) => (
                        <motion.div
                          layout="position"
                          key={p.id}
                          transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                          className="py-3.5 px-4 text-brand-primary font-semibold flex items-center"
                        >
                          <span>{p.totalCustomers.toLocaleString()}</span>
                          {p.id === mostCustomersProd?.id && comparedProducts.length > 1 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-sans bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                              Largest Base
                            </span>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Monthly Recurring (MRR) */}
                    <div
                      className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                      style={gridColStyle}
                    >
                      <motion.div
                        layout="position"
                        transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                        className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                      >
                        Monthly Recurring (MRR)
                      </motion.div>
                      {comparedProducts.map((p) => (
                        <motion.div
                          layout="position"
                          key={p.id}
                          transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                          className="py-3.5 px-4 text-brand-primary"
                        >
                          {p.mrr > 0 ? formatCurrency(p.mrr) : "—"}
                        </motion.div>
                      ))}
                    </div>

                    {/* Active Subscriptions */}
                    <div
                      className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                      style={gridColStyle}
                    >
                      <motion.div
                        layout="position"
                        transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                        className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                      >
                        Active Subscriptions
                      </motion.div>
                      {comparedProducts.map((p) => (
                        <motion.div
                          layout="position"
                          key={p.id}
                          transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                          className="py-3.5 px-4 text-brand-primary font-mono text-xs"
                        >
                          {p.activeSubscriptions > 0 ? p.activeSubscriptions.toLocaleString() : "—"}
                        </motion.div>
                      ))}
                    </div>

                    {/* Growth (YoY) - Authentic calculated growth or neutral indicator */}
                    <div
                      className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                      style={gridColStyle}
                    >
                      <motion.div
                        layout="position"
                        transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                        className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                      >
                        Growth (YoY)
                      </motion.div>
                      {comparedProducts.map((p) => {
                        const analytics = productAnalytics[p.id];
                        const yoy = analytics?.growthYoY || "—";
                        const isPositive = yoy.startsWith("+");
                        const isNegative = yoy.startsWith("-");

                        return (
                          <motion.div
                            layout="position"
                            key={p.id}
                            transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                            className={`py-3.5 px-4 font-sans font-medium text-xs ${
                              isPositive
                                ? "text-emerald-400"
                                : isNegative
                                ? "text-rose-400"
                                : "text-brand-muted"
                            }`}
                          >
                            {yoy}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expandable Secondary Metrics Section (Real Data Only) */}
                  <AnimatePresence initial={false}>
                    {showMoreMetrics && (
                      <motion.div
                        key="more-metrics-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                        className="overflow-hidden divide-y divide-border-default/50 font-mono bg-surface-subtle/15"
                      >
                        {/* Top Geographic Market with Clean Single-Column List (Zero Horizontal Scrollbars) */}
                        <div
                          onClick={() => hasAnyCountryData && setIsCountryExpanded(!isCountryExpanded)}
                          className={`grid items-start hover:bg-surface-subtle/40 transition-colors ${
                            hasAnyCountryData ? "cursor-pointer group" : ""
                          }`}
                          style={gridColStyle}
                        >
                          <motion.div
                            layout="position"
                            transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                            className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs flex items-center justify-between gap-2"
                          >
                            <span className={hasAnyCountryData ? "group-hover:text-brand-primary transition-colors" : ""}>
                              Top Markets / Countries
                            </span>
                            {hasAnyCountryData && (
                              <span className="p-1 rounded-full bg-surface-base border border-border-default/60 text-brand-muted group-hover:text-brand-primary transition shrink-0">
                                {isCountryExpanded ? (
                                  <ChevronUpIcon className="w-3 h-3" />
                                ) : (
                                  <ChevronDownIcon className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </motion.div>

                          {comparedProducts.map((p) => {
                            const analytics = productAnalytics[p.id];
                            const top = analytics?.topCountry;
                            const countries = analytics?.allCountries || [];
                            const remainingCountries = countries.slice(1);

                            return (
                              <motion.div
                                layout="position"
                                key={p.id}
                                transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                                className="py-3.5 px-4 text-brand-primary font-sans font-medium text-left"
                              >
                                {top && top.code ? (
                                  <div className="flex flex-col items-start w-[172px] max-w-full space-y-1.5 overflow-hidden">
                                    {/* 1. Primary Top Country Pill (Exact 4px equal padding on top, bottom, and left without fixed height distortion) */}
                                    <div className="p-1 pr-2.5 rounded-full bg-surface-base border border-border-default/80 shadow-2xs flex items-center justify-between gap-2 w-full shrink-0 text-left">
                                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <CircleFlag
                                          countryCode={top.code}
                                          size={16}
                                          className="shrink-0"
                                        />
                                        <span className="text-xs text-brand-primary font-normal truncate leading-none">
                                          {top.name}
                                        </span>
                                      </div>
                                      <span className="font-mono text-[10px] text-brand-muted font-normal shrink-0 leading-none">
                                        ({top.pct}%)
                                      </span>
                                    </div>

                                    {/* 2. Remaining Countries (Clean Single Column, No horizontal scroll) */}
                                    <AnimatePresence initial={false}>
                                      {isCountryExpanded && remainingCountries.length > 0 && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                                          className="overflow-hidden w-full"
                                        >
                                          <div className="flex flex-col items-start space-y-1.5 pt-1.5 max-h-[260px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 w-full">
                                            {remainingCountries.map((c) => (
                                              <div
                                                key={c.code}
                                                className="p-1 pr-2.5 rounded-full bg-surface-base border border-border-default/80 shadow-2xs flex items-center justify-between gap-2 w-full shrink-0 text-left"
                                              >
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                  <CircleFlag
                                                    countryCode={c.code}
                                                    size={16}
                                                    className="shrink-0"
                                                  />
                                                  <span className="text-xs text-brand-primary font-normal truncate leading-none">
                                                    {c.name}
                                                  </span>
                                                </div>
                                                <span className="font-mono text-[10px] text-brand-muted font-normal shrink-0 leading-none">
                                                  ({c.pct}%)
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ) : (
                                  <span className="text-xs text-brand-muted font-normal">No country data</span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Average Order Value (AOV) */}
                        <div
                          className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                          style={gridColStyle}
                        >
                          <motion.div
                            layout="position"
                            transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                            className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                          >
                            Average Order Value (AOV)
                          </motion.div>
                          {comparedProducts.map((p) => {
                            const analytics = productAnalytics[p.id];
                            return (
                              <motion.div
                                layout="position"
                                key={p.id}
                                transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                                className="py-3.5 px-4 text-brand-primary font-bold"
                              >
                                {analytics?.aov ? formatCurrency(analytics.aov) : "—"}
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Total Refunds */}
                        <div
                          className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                          style={gridColStyle}
                        >
                          <motion.div
                            layout="position"
                            transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                            className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                          >
                            Refunds & Return Rate
                          </motion.div>
                          {comparedProducts.map((p) => {
                            const analytics = productAnalytics[p.id];
                            return (
                              <motion.div
                                layout="position"
                                key={p.id}
                                transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                                className="py-3.5 px-4 text-brand-primary font-mono text-xs"
                              >
                                {analytics?.refundCount && analytics.refundCount > 0
                                  ? `${analytics.refundCount} (${analytics.refundRatePct})`
                                  : "0 (0.0%)"}
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Primary Payment Gateway */}
                        <div
                          className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                          style={gridColStyle}
                        >
                          <motion.div
                            layout="position"
                            transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                            className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                          >
                            Payment Gateway
                          </motion.div>
                          {comparedProducts.map((p) => {
                            const provider =
                              p.channels?.[0]?.provider || p.providers?.[0]?.provider;
                            return (
                              <motion.div
                                layout="position"
                                key={p.id}
                                transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                                className="py-3.5 px-4 text-brand-primary text-left"
                              >
                                {provider ? (
                                  <div className="p-1 pr-2.5 rounded-full bg-surface-base border border-border-default/80 shadow-2xs inline-flex items-center gap-1.5 text-left">
                                    <BrandIcon provider={provider} className="w-4 h-4 shrink-0" colored={true} />
                                    <span className="font-mono text-[11px] font-medium uppercase text-brand-primary leading-none">
                                      {provider}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-brand-muted font-normal">Direct</span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Billing Model */}
                        <div
                          className="grid items-center hover:bg-surface-subtle/40 transition-colors"
                          style={gridColStyle}
                        >
                          <motion.div
                            layout="position"
                            transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                            className="py-3.5 px-4 font-sans font-medium text-brand-secondary text-xs"
                          >
                            Billing Model
                          </motion.div>
                          {comparedProducts.map((p) => {
                            const analytics = productAnalytics[p.id];
                            return (
                              <motion.div
                                layout="position"
                                key={p.id}
                                transition={{ duration: 0.28, ease: UNIFIED_EASE }}
                                className="py-3.5 px-4 text-brand-primary font-sans text-xs"
                              >
                                <span className="px-3 py-1 rounded-full text-[11px] bg-surface-base border border-border-default text-brand-secondary font-medium font-mono">
                                  {analytics?.pricingModel}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Expand / Collapse Button with Smooth Toggle */}
              <div className="p-3 bg-surface-subtle border-t border-border-default text-center">
                <button
                  type="button"
                  onClick={() => setShowMoreMetrics(!showMoreMetrics)}
                  className="h-8 px-4 rounded-full inline-flex items-center gap-1.5 text-xs font-medium text-brand-secondary hover:text-brand-primary border border-border-default hover:bg-surface-base transition cursor-pointer shadow-xs active:scale-95"
                >
                  <span>{showMoreMetrics ? "Show Fewer Metrics" : "Show More Metrics"}</span>
                  {showMoreMetrics ? (
                    <ChevronUpIcon className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutGroup>
  );
};
