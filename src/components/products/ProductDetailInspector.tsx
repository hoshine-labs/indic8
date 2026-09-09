"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RevenueChart, ChartCard } from "@/components/charts";
import { generateRevenueTimeSeries } from "@/lib/metrics/engine";
import { useIndic8Store } from "@/lib/indic8Store";
import { BrandIcon } from "@/lib/brandLogos";
import { AnimatedTabs } from "@/components/ui";
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { UnifiedProduct, ProductProviderMapping } from "@/lib/types";
import { convertCurrency, formatCurrencyAmount } from "@/lib/currency";
import { NumberFlowAmount } from "@/components/ui";

export interface ProductDetailInspectorProps {
  product: UnifiedProduct | null;
  onClose: () => void;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "tween" as const, duration: 0.24, ease: "easeOut" as const },
      opacity: { duration: 0.15 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: {
      x: { type: "tween" as const, duration: 0.24, ease: "easeOut" as const },
      opacity: { duration: 0.15 },
    },
  }),
};

export const ProductDetailInspector: React.FC<ProductDetailInspectorProps> = ({
  product,
  onClose,
}) => {
  const { transactions, primaryCurrency } = useIndic8Store();
  const [activeTimeframe, setActiveTimeframe] = useState<string>("all");
  const [[activeMediaIdx, direction], setSlideState] = useState<[number, number]>([0, 0]);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const prodTxs = useMemo(() => {
    if (!product) return [];
    return transactions.filter(
      (t) => t.productId === product.id || t.productName === product.name
    );
  }, [product, transactions]);

  // Collect all media items (strictly excluding rating badges)
  const mediaList: string[] = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    const isBadUrl = (url: string) => {
      return (
        !url ||
        url.includes("/ratings/") ||
        url.includes("iarc") ||
        url.includes("badge") ||
        url.includes("favicon") ||
        url.includes("stars") ||
        url.includes("default-icon")
      );
    };

    if (Array.isArray(product.medias) && product.medias.length > 0) {
      product.medias.forEach((m: string) => {
        if (m && !isBadUrl(m) && !list.includes(m)) list.push(m);
      });
    }
    if (product.imageUrl && !isBadUrl(product.imageUrl) && !list.includes(product.imageUrl)) {
      list.unshift(product.imageUrl);
    }
    return list;
  }, [product]);

  // Preload all assets in browser memory
  useEffect(() => {
    mediaList.forEach((url) => {
      if (url && typeof window !== "undefined") {
        const img = new Image();
        img.src = url;
      }
    });
  }, [mediaList]);

  // Compute product revenue in selected timeframe
  const timeframeRevenue = useMemo(() => {
    const now = Date.now();
    const limits: Record<string, number> = {
      today: 24 * 3600 * 1000,
      "7d": 7 * 24 * 3600 * 1000,
      "30d": 30 * 24 * 3600 * 1000,
      "3m": 90 * 24 * 3600 * 1000,
      "12m": 365 * 24 * 3600 * 1000,
    };
    const maxAge = limits[activeTimeframe];
    const filtered = maxAge
      ? prodTxs.filter((t) => now - new Date(t.timestamp || 0).getTime() <= maxAge)
      : prodTxs;

    if (filtered.length > 0) {
      return filtered.reduce((sum, t) => {
        return sum + convertCurrency(t.amount, t.currency, primaryCurrency);
      }, 0);
    }

    return activeTimeframe === "all" ? (product?.totalRevenue || 0) : 0;
  }, [prodTxs, activeTimeframe, primaryCurrency, product]);

  const displayOrders = useMemo(() => {
    const now = Date.now();
    const limits: Record<string, number> = {
      today: 24 * 3600 * 1000,
      "7d": 7 * 24 * 3600 * 1000,
      "30d": 30 * 24 * 3600 * 1000,
      "3m": 90 * 24 * 3600 * 1000,
      "12m": 365 * 24 * 3600 * 1000,
    };
    const maxAge = limits[activeTimeframe];
    const filtered = maxAge
      ? prodTxs.filter((t) => now - new Date(t.timestamp || 0).getTime() <= maxAge)
      : prodTxs;

    if (filtered.length > 0) {
      return filtered.length;
    }

    return activeTimeframe === "all" ? (product?.totalSales || 0) : 0;
  }, [prodTxs, activeTimeframe, product]);

  const displayCustomers = useMemo(() => {
    const now = Date.now();
    const limits: Record<string, number> = {
      today: 24 * 3600 * 1000,
      "7d": 7 * 24 * 3600 * 1000,
      "30d": 30 * 24 * 3600 * 1000,
      "3m": 90 * 24 * 3600 * 1000,
      "12m": 365 * 24 * 3600 * 1000,
    };
    const maxAge = limits[activeTimeframe];
    const filtered = maxAge
      ? prodTxs.filter((t) => now - new Date(t.timestamp || 0).getTime() <= maxAge)
      : prodTxs;

    if (filtered.length > 0) {
      return new Set(filtered.map((t) => t.customerEmail)).size;
    }
    return activeTimeframe === "all" ? (product?.totalCustomers || (product?.totalSales ? product.totalSales : 0)) : 0;
  }, [prodTxs, activeTimeframe, product]);

  const series = useMemo(() => {
    if (!product) return [];
    return generateRevenueTimeSeries(prodTxs, activeTimeframe, primaryCurrency);
  }, [prodTxs, activeTimeframe, primaryCurrency, product]);

  if (!product) return null;

  const channels: ProductProviderMapping[] = product.channels || product.providers || [];
  const currentMediaUrl = mediaList[activeMediaIdx] || "";

  const paginate = (newDirection: number) => {
    let nextIdx = activeMediaIdx + newDirection;
    if (nextIdx < 0) nextIdx = mediaList.length - 1;
    if (nextIdx >= mediaList.length) nextIdx = 0;
    setSlideState([nextIdx, newDirection]);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end select-none">
        {/* Clickable Backdrop */}
        <div className="flex-1 cursor-pointer" onClick={onClose} />

        {/* Slide-In Modal Drawer matching dark aesthetic */}
        <motion.div
          initial={{ x: "100%", opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="w-full max-w-xl bg-surface-canvas border-l border-border-default h-full flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-border-default flex items-start justify-between gap-4 bg-surface-base">
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="text-base font-bold text-brand-primary truncate">{product.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-surface-subtle border border-border-default text-brand-primary font-semibold">
                  {product.category || "Software"}
                </span>
                <span className="text-[11px] text-brand-muted font-mono truncate">
                  ID: {product.id}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={`/products/${product.id}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle border border-border-default transition cursor-pointer shadow-xs"
                title="Open full page"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle border border-border-default transition cursor-pointer shadow-xs"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-surface-canvas">
            {/* Product Media Gallery / Banner Preview */}
            <div className="space-y-3">
              <div className="relative w-full aspect-[16/9] rounded-2xl bg-surface-base border border-border-default flex items-center justify-center overflow-hidden group shadow-xs">
                {currentMediaUrl && !failedImages[activeMediaIdx] ? (
                  <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/50">
                      {/* Soft Ambient Backdrop */}
                      <img
                        src={currentMediaUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110"
                      />
                      <motion.img
                        key={activeMediaIdx}
                        src={currentMediaUrl}
                        alt={`${product.name} preview`}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        onError={() => setFailedImages((prev) => ({ ...prev, [activeMediaIdx]: true }))}
                        className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md rounded-xl"
                      />
                    </div>
                  </AnimatePresence>
                ) : currentMediaUrl && failedImages[activeMediaIdx] ? (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/50">
                    <img
                      src={`/api/image-proxy?url=${encodeURIComponent(currentMediaUrl)}&name=${encodeURIComponent(product.name)}`}
                      alt={`${product.name} preview`}
                      className="max-h-full max-w-full object-contain drop-shadow-md rounded-xl"
                    />
                  </div>
                ) : (
                  <img
                    src={`/api/image-proxy?name=${encodeURIComponent(product.name)}&provider=${encodeURIComponent(product.providers?.[0]?.provider || "dodopayments")}`}
                    alt={`${product.name} cover`}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                )}

                  {mediaList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => paginate(-1)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer z-20"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => paginate(1)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer z-20"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery Strip */}
                {mediaList.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {mediaList.map((m, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const newDir = idx > activeMediaIdx ? 1 : -1;
                          setSlideState([idx, newDir]);
                        }}
                        className={`relative w-24 h-15 rounded-xl overflow-hidden border transition cursor-pointer shrink-0 bg-surface-base ${
                          activeMediaIdx === idx
                            ? "border-brand-primary ring-2 ring-brand-primary"
                            : "border-border-default opacity-50 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={m}
                          alt={`thumb ${idx + 1}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `/api/image-proxy?url=${encodeURIComponent(m)}&name=${encodeURIComponent(product.name)}`;
                          }}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

            {/* Timeframe Controls with Universal AnimatedTabs */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-primary">Performance</span>
              <AnimatedTabs
                options={[
                  { id: "all", label: "All Time" },
                  { id: "12m", label: "12m" },
                  { id: "3m", label: "3m" },
                  { id: "30d", label: "30d" },
                  { id: "today", label: "Today" },
                ]}
                activeId={activeTimeframe}
                onChange={(id) => setActiveTimeframe(id)}
                size="md"
                layoutId="inspector-timeframe-pill"
              />
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-surface-base rounded-2xl border border-border-default shadow-xs">
                <div className="flex items-center gap-1 text-[11px] text-brand-secondary uppercase font-medium">
                  <CurrencyDollarIcon className="w-3.5 h-3.5" />
                  <span>Revenue</span>
                </div>
                <div className="text-base font-bold text-brand-primary font-mono mt-1">
                  <NumberFlowAmount value={timeframeRevenue} currency={primaryCurrency} />
                </div>
              </div>
              <div className="p-3.5 bg-surface-base rounded-2xl border border-border-default shadow-xs">
                <div className="flex items-center gap-1 text-[11px] text-brand-secondary uppercase font-medium">
                  <ReceiptPercentIcon className="w-3.5 h-3.5" />
                  <span>Orders</span>
                </div>
                <div className="text-base font-bold text-brand-primary font-mono mt-1">
                  <NumberFlowAmount value={displayOrders} />
                </div>
              </div>
              <div className="p-3.5 bg-surface-base rounded-2xl border border-border-default shadow-xs">
                <div className="flex items-center gap-1 text-[11px] text-brand-secondary uppercase font-medium">
                  <UserGroupIcon className="w-3.5 h-3.5" />
                  <span>Customers</span>
                </div>
                <div className="text-base font-bold text-brand-primary font-mono mt-1">
                  <NumberFlowAmount value={displayCustomers} />
                </div>
              </div>
            </div>

            {/* Revenue Over Time Chart */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-brand-primary">Revenue Trajectory</h4>
              <ChartCard>
                <RevenueChart data={series} range={activeTimeframe} currency={primaryCurrency} height={160} />
              </ChartCard>
            </div>

            {/* Connected Gateways */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-brand-primary">Connected Gateways</h4>
              <div className="space-y-2">
                {channels.length > 0 ? (
                  channels.map((ch: ProductProviderMapping) => (
                    <div
                      key={`${ch.provider}-${ch.externalProductId}`}
                      className="p-3.5 bg-surface-base rounded-2xl border border-border-default flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <BrandIcon provider={ch.provider} className="w-4 h-4" colored={true} />
                        <div>
                          <div className="text-xs font-semibold text-brand-primary">
                            {ch.externalProductName || product.name}
                          </div>
                          <div className="text-[10px] font-mono text-brand-secondary">
                            {ch.provider.toUpperCase()} · ID: {ch.externalProductId}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-brand-primary">
                          <NumberFlowAmount value={Number(ch.revenue || 0)} currency={primaryCurrency} />
                        </div>
                        <div className="text-[10px] text-brand-secondary">
                          <NumberFlowAmount value={ch.salesCount || 0} suffix="checkouts" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-surface-base rounded-2xl border border-border-default text-xs text-brand-secondary shadow-xs">
                    Product synchronized via direct API integration.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-brand-primary">Recent Transactions ({prodTxs.length})</h4>
              {prodTxs.length > 0 ? (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {prodTxs.slice(0, 10).map((tx, idx) => (
                    <div
                      key={`${tx.id || "tx"}-${idx}`}
                      className="p-2.5 bg-surface-base rounded-xl border border-border-default flex items-center justify-between text-xs font-mono shadow-2xs"
                    >
                      <div>
                        <div className="text-brand-primary font-sans text-[11px] truncate max-w-[200px]">
                          {tx.customerEmail}
                        </div>
                        <div className="text-[10px] text-brand-secondary font-sans">
                          {new Date(tx.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-brand-primary font-semibold">
                          {formatCurrencyAmount(convertCurrency(tx.amount, tx.currency, primaryCurrency), primaryCurrency)}
                        </div>
                        <div className="text-[10px] text-brand-secondary">
                          {formatCurrencyAmount(tx.amount, tx.currency)} {tx.currency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-surface-base rounded-2xl border border-border-default text-xs text-brand-secondary text-center shadow-xs">
                  No orders recorded for this product yet.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
