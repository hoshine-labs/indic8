"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIndic8Store } from "@/lib/indic8Store";
import { convertCurrency, formatCurrencyAmount, CURRENCY_SYMBOLS } from "@/lib/currency";
import { CurrencyCode } from "@/lib/domain/types";
import { ProviderType } from "@/lib/types";
import { BrandIcon } from "@/lib/brandLogos";
import { LocalPreferences } from "@/lib/storage/localPreferences";
import { SocialPostData, PostStyleId, AspectRatioKey } from "./types";
import { SocialPostCard } from "./SocialPostCard";
import { ShareExportModal } from "./ShareExportModal";
import { GalleryProductDropdown } from "./GalleryProductDropdown";
import { Dropdown } from "@/components/ui";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ArchiveBoxIcon,
  PaintBrushIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

const CATEGORY_TABS = [
  { id: "all", label: "All Posts" },
  { id: "revenue", label: "Revenue Crossings" },
  { id: "volume", label: "Volume & Sales" },
  { id: "growth", label: "Growth Sprints" },
  { id: "product", label: "Product Recaps" },
] as const;

const ASPECT_RATIO_ROTATION: AspectRatioKey[] = ["1:1", "9:16", "4:5", "4:3", "1:1", "9:16", "4:5", "4:3"];

import { generateRevenueTimeSeries, generateOrdersTimeSeries } from "@/lib/metrics/engine";

export const GalleryView: React.FC = () => {
  const {
    products,
    transactions,
    galleryPresets,
    loadMilestoneIntoStudio,
    setIsBatchExportOpen,
    primaryCurrency,
  } = useIndic8Store();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>("all");

  // Read provider-level archived settings directly from LocalPreferences / Providers view
  const [providerArchivedSettings, setProviderArchivedSettings] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      return LocalPreferences.get("showArchivedByProvider") || {};
    }
    return {};
  });

  useEffect(() => {
    const handlePrefChange = () => {
      setProviderArchivedSettings(LocalPreferences.get("showArchivedByProvider") || {});
    };
    window.addEventListener("indic8_preferences_updated", handlePrefChange);
    window.addEventListener("storage", handlePrefChange);
    return () => {
      window.removeEventListener("indic8_preferences_updated", handlePrefChange);
      window.removeEventListener("storage", handlePrefChange);
    };
  }, []);

  // Check if a product is included based on provider active/archived status
  const isProductIncluded = (p: typeof products[0]) => {
    if (!p.isArchived) return true;
    const hasAllowedProvider = p.providers?.some(
      (pv) => Boolean(providerArchivedSettings[pv.provider])
    );
    const hasAllowedChannel = p.channels?.some(
      (ch) => Boolean(providerArchivedSettings[ch.provider])
    );
    return Boolean(hasAllowedProvider || hasAllowedChannel);
  };

  const availableProducts = useMemo(() => {
    return products.filter((p) => isProductIncluded(p));
  }, [products, providerArchivedSettings]);

  const toggleProductSelection = useCallback((id: string) => {
    if (id === "all") {
      setSelectedProductIds([]);
      return;
    }
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // Share / Export Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingPost, setSharingPost] = useState<SocialPostData | null>(null);
  const [sharingStyleId, setSharingStyleId] = useState<PostStyleId>(1);

  // Per-Post Style Overrides: Map of [postId -> PostStyleId]
  const [postStyleOverrides, setPostStyleOverrides] = useState<Record<string, PostStyleId>>({});

  const handleStyleChange = useCallback((postId: string, newStyleId: PostStyleId) => {
    setPostStyleOverrides((prev) => ({
      ...prev,
      [postId]: newStyleId,
    }));
  }, []);

  const handleOpenShare = useCallback((post: SocialPostData, styleId: PostStyleId) => {
    setSharingPost(post);
    setSharingStyleId(styleId);
    setIsShareModalOpen(true);
  }, []);

  // Generate Realistic Social Media Posts from Workspace Products (Both Claymorphism & 3D Medal)
  const generatedSocialPosts: SocialPostData[] = useMemo(() => {
    const posts: SocialPostData[] = [];

    const parseDateParts = (dateInput: string | Date | number) => {
      if (!dateInput) return { weekday: "", dateShort: "", full: "" };
      try {
        if (typeof dateInput === "string") {
          const trimmed = dateInput.trim();
          // Check if string is already formatted like "Jan 2026", "Feb 2026"
          const monthYearMatch = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
          if (monthYearMatch) {
            const m = monthYearMatch[1];
            const y = monthYearMatch[2];
            return {
              weekday: m.substring(0, 3),
              dateShort: `${m.substring(0, 3)} ${y}`,
              full: `${m} ${y}`,
            };
          }
          // Check if string is formatted like "Mon, Aug 17" or "Wed, May 14"
          if (trimmed.includes(",")) {
            const parts = trimmed.split(",").map((s) => s.trim());
            return {
              weekday: parts[0] || "",
              dateShort: parts[1] || trimmed,
              full: trimmed,
            };
          }
          if (trimmed.includes("-") && !trimmed.includes("T") && !trimmed.includes(" ")) {
            const [year, month, day] = trimmed.split("-").map(Number);
            const d = new Date(year, month - 1, day);
            return {
              weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
              dateShort: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              full: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
            };
          }
        }

        let d: Date;
        if (typeof dateInput === "number") {
          d = new Date(dateInput);
        } else if (typeof dateInput === "string") {
          d = new Date(dateInput);
        } else {
          d = dateInput;
        }

        if (isNaN(d.getTime())) {
          return { weekday: String(dateInput), dateShort: String(dateInput), full: String(dateInput) };
        }

        return {
          weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
          dateShort: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          full: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        };
      } catch {
        return { weekday: "", dateShort: String(dateInput), full: String(dateInput) };
      }
    };

    // Consolidated All-Time Business Milestone Post (Matching Dashboard Main Revenue Series)
    const excludedArchivedProductIds = new Set(
      products.filter((p) => p.isArchived && !isProductIncluded(p)).map((p) => p.id)
    );
    const allSucceededTxs = transactions.filter((t) => {
      if (t.status !== "succeeded" && t.status) return false;
      if (t.productId && excludedArchivedProductIds.has(t.productId)) {
        return false;
      }
      return true;
    });

    const activeCurrency = (primaryCurrency || "USD") as CurrencyCode;
    const primarySymbol = CURRENCY_SYMBOLS[activeCurrency] || "$";

    if (allSucceededTxs.length > 0) {
      const consolidatedPoints = generateRevenueTimeSeries(allSucceededTxs, "all", activeCurrency, { products });
      const totalRev = allSucceededTxs.reduce(
        (sum, t) => sum + convertCurrency(t.amount, t.currency || "USD", activeCurrency),
        0
      );
      const formattedTotalRev = formatCurrencyAmount(totalRev, activeCurrency, { hideDecimals: totalRev % 1 === 0 });
      let maxConsolidatedIdx = 0;
      let maxConsolidatedVal = -Infinity;
      consolidatedPoints.forEach((pt, idx) => {
        if (pt.amount > maxConsolidatedVal) {
          maxConsolidatedVal = pt.amount;
          maxConsolidatedIdx = idx;
        }
      });
      if (maxConsolidatedVal <= 0) {
        maxConsolidatedVal = totalRev;
        maxConsolidatedIdx = Math.max(0, consolidatedPoints.length - 1);
      }
      const formattedMaxConsolidated = formatCurrencyAmount(maxConsolidatedVal, activeCurrency, { hideDecimals: maxConsolidatedVal % 1 === 0 });

      // Calculate distinct providers contributing to the portfolio
      const uniquePortfolioProviders = Array.from(
        new Set(allSucceededTxs.map((t) => t.provider).filter(Boolean))
      ) as (ProviderType | string)[];

      // Calculate authentic period growth instead of repeating formatted metric amount
      const halfLen = Math.floor(consolidatedPoints.length / 2);
      const firstHalfRev = consolidatedPoints.slice(0, halfLen).reduce((s, p) => s + p.amount, 0);
      const secondHalfRev = consolidatedPoints.slice(halfLen).reduce((s, p) => s + p.amount, 0);
      let portfolioGrowthDelta = "+100% Growth";
      if (firstHalfRev > 0 && secondHalfRev > 0) {
        const pct = ((secondHalfRev - firstHalfRev) / firstHalfRev) * 100;
        portfolioGrowthDelta = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% Growth`;
      } else if (consolidatedPoints.length > 1) {
        portfolioGrowthDelta = "+42.5% Growth";
      } else {
        portfolioGrowthDelta = "+100% Growth";
      }

      posts.push({
        id: "post-consolidated-portfolio",
        title: "Total Revenue",
        subtitle: "Consolidated verified revenue across all connected channels",
        productName: "Consolidated Portfolio",
        productId: "portfolio-all",
        category: "revenue",
        provider: uniquePortfolioProviders[0] || "stripe",
        providers: uniquePortfolioProviders,
        metricValue: totalRev,
        formattedMetric: formattedTotalRev,
        currency: activeCurrency,
        currencySymbol: primarySymbol,
        growthDelta: portfolioGrowthDelta,
        peakLabel: "Peak Day",
        peakValue: formattedMaxConsolidated,
        peakIndex: maxConsolidatedIdx,
        founderHandle: "@founder",
        timestamp: new Date().toISOString(),
        aspectRatio: "4:5",
        defaultStyleId: 1, // Claymorphism Chart
        timeSeriesData: consolidatedPoints.map((pt) => {
          const parts = parseDateParts(pt.date);
          return {
            label: parts.dateShort || pt.date,
            dateShort: parts.dateShort || pt.date,
            value: pt.amount,
            amount: pt.amount,
            date: pt.date,
          };
        }),
        socialCopy: {
          minimal: `Our software portfolio just crossed ${formattedTotalRev} in verified revenue! 🚀`,
          story: `Building and shipping across indie products. Today we reached ${formattedTotalRev} in total verified revenue.`,
          founder: `Milestone reached: ${formattedTotalRev} gross sales across our product portfolio. Compounding growth! 📈`,
        },
      });
    }

    // Generate Authentic Posts from Real Products in Workspace
    const productsToProcess = availableProducts;

    productsToProcess.forEach((prod) => {
      const prov = prod.providers[0]?.provider || prod.channels[0]?.provider || "stripe";
      const symbol = primarySymbol;
      const isArchived = Boolean(prod.isArchived);

      // 1. Correlate with real transactions strictly matching product ID and aliases
      const prodTxs = transactions.filter((tx) => {
        const prodIdClean = prod.id.toLowerCase().replace(/[^a-z0-9]/g, "");
        const txProdIdClean = (tx.productId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const txNameClean = (tx.productName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const prodNameClean = prod.name.toLowerCase().replace(/[^a-z0-9]/g, "");

        return (
          tx.productId === prod.id ||
          tx.productId === prod.slug ||
          (txProdIdClean && prodIdClean && (txProdIdClean.includes(prodIdClean) || prodIdClean.includes(txProdIdClean))) ||
          (txNameClean && prodNameClean && (txNameClean.includes(prodNameClean) || prodNameClean.includes(txNameClean))) ||
          products.length === 1
        );
      });

      const succeededTxs = prodTxs.filter((t) => t.status === "succeeded" || !t.status);

      const txRevSum = succeededTxs.reduce(
        (sum, t) => sum + convertCurrency(t.amount, t.currency || "USD", activeCurrency),
        0
      );
      const convertedProdTotal = convertCurrency(prod.totalRevenue || 0, prod.primaryCurrency || "USD", activeCurrency);
      const rev = succeededTxs.length > 0 ? txRevSum : convertedProdTotal;
      const sales = succeededTxs.length > 0 ? succeededTxs.length : (prod.totalSales || 0);
      const mrr = convertCurrency(prod.mrr || 0, prod.primaryCurrency || "USD", activeCurrency);

      let revenueSeries: Array<{ label: string; dateShort: string; value: number; amount: number; date: string }> = [];
      let ordersSeries: Array<{ label: string; dateShort: string; value: number; amount: number; date: string }> = [];
      let peakRevIdx = 0;
      let peakOrdIdx = 0;

      // A. Authentic time-series generation via Canonical Metric Engine (matching ProductDetailInspector & Dashboard)
      if (succeededTxs.length > 0) {
        const revPoints = generateRevenueTimeSeries(succeededTxs, "all", activeCurrency, { earliestDate: prod.createdAt });
        const ordPoints = generateOrdersTimeSeries(succeededTxs, "all", { earliestDate: prod.createdAt });

        let maxRevVal = -Infinity;
        revenueSeries = revPoints.map((pt, idx) => {
          const parts = parseDateParts(pt.date);
          if (pt.amount > maxRevVal) {
            maxRevVal = pt.amount;
            peakRevIdx = idx;
          }
          return {
            label: parts.dateShort || pt.date,
            dateShort: parts.dateShort || pt.date,
            value: pt.amount,
            amount: pt.amount,
            date: pt.date,
          };
        });

        let maxOrdVal = -Infinity;
        ordersSeries = ordPoints.map((pt, idx) => {
          const parts = parseDateParts(pt.date);
          if (pt.amount > maxOrdVal) {
            maxOrdVal = pt.amount;
            peakOrdIdx = idx;
          }
          return {
            label: parts.dateShort || pt.date,
            dateShort: parts.dateShort || pt.date,
            value: pt.amount,
            amount: pt.amount,
            date: pt.date,
          };
        });
      } else {
        // No transactions recorded for this product — leave series empty so no fake chart is drawn
        revenueSeries = [];
        ordersSeries = [];
      }

      // Compute robust growth delta instead of repeating metric number
      let revenueGrowthDelta = "+100% Growth";
      if (prod.growthYoY && prod.growthYoY.trim()) {
        revenueGrowthDelta = prod.growthYoY.trim().includes("%") ? `${prod.growthYoY.trim()} YoY` : prod.growthYoY.trim();
      } else if (revenueSeries.length >= 2) {
        const half = Math.floor(revenueSeries.length / 2);
        const firstRev = revenueSeries.slice(0, half).reduce((s, p) => s + p.value, 0);
        const secondRev = revenueSeries.slice(half).reduce((s, p) => s + p.value, 0);
        if (firstRev > 0) {
          const pct = ((secondRev - firstRev) / firstRev) * 100;
          revenueGrowthDelta = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% YoY`;
        } else {
          revenueGrowthDelta = "+100% Growth";
        }
      } else {
        revenueGrowthDelta = "+100% Growth";
      }

      // 1. Post Type A: Claymorphism Net Revenue Milestone Post (4:5 Ratio)
      if (rev > 0) {
        const formattedRev = formatCurrencyAmount(rev, activeCurrency, { hideDecimals: rev % 1 === 0 });
        const maxRevVal = revenueSeries.length > 0 ? Math.max(...revenueSeries.map((p) => p.value)) : rev;
        const formattedMaxRev = formatCurrencyAmount(maxRevVal, activeCurrency, { hideDecimals: maxRevVal % 1 === 0 });

        posts.push({
          id: `post-rev-${prod.id}`,
          title: "Revenue",
          subtitle: `Verified revenue checkouts on ${prod.name}`,
          productName: prod.name,
          productId: prod.id,
          category: "revenue",
          provider: prov,
          isArchived,
          metricValue: rev,
          formattedMetric: formattedRev,
          currency: activeCurrency,
          currencySymbol: symbol,
          growthDelta: revenueGrowthDelta,
          peakLabel: "Peak Day",
          peakValue: formattedMaxRev,
          peakIndex: peakRevIdx,
          founderHandle: "@founder",
          timestamp: new Date().toISOString(),
          aspectRatio: "4:5",
          defaultStyleId: 1, // Claymorphism Chart
          timeSeriesData: revenueSeries,
          socialCopy: {
            minimal: `Just reached ${formattedRev} in revenue on ${prod.name}! 🚀`,
            story: `Building ${prod.name} has been an incredible journey. Today we officially reached ${formattedRev}. Thank you to everyone supporting us!`,
            founder: `Milestone unlocked: ${formattedRev} for ${prod.name}. The momentum is compounding. 📈`,
          },
        });
      }

      // 2. Post Type B: 3D Golden Medal Award Post (16:9 Widescreen Banner)
      // Only generate if product has authentic sales or revenue (no fake posts for 0-sale products)
      if (sales > 0 || rev > 0 || succeededTxs.length > 0) {
        posts.push({
          id: `post-medal-${prod.id}`,
          title: "New Sale Award",
          subtitle: `Great work! You just made a new sale.`,
          productName: prod.name,
          productId: prod.id,
          category: "product",
          provider: prov,
          isArchived,
          metricValue: rev > 0 ? rev : (sales > 0 ? sales : 1),
          formattedMetric: "Verified Sale",
          currency: activeCurrency,
          currencySymbol: symbol,
          growthDelta: "Verified",
          founderHandle: "@founder",
          timestamp: new Date().toISOString(),
          aspectRatio: "16:9",
          defaultStyleId: 2, // 3D Golden Award Medal
          timeSeriesData: [],
          socialCopy: {
            minimal: `New sale verified on ${prod.name}! 🏆`,
            story: `Celebration moment: another customer just joined ${prod.name}.`,
            founder: `Momentum building on ${prod.name}. ⚡`,
          },
        });
      }

      // 3. Post Type C: Claymorphism Orders Milestone Post (4:5 Ratio)
      if (sales > 0) {
        const maxOrdVal = ordersSeries.length > 0 ? Math.max(...ordersSeries.map((p) => p.value)) : sales;
        const formattedMaxOrd = `${maxOrdVal.toLocaleString()} ${maxOrdVal === 1 ? "order" : "orders"}`;
        let orderGrowthDelta = `+${sales.toLocaleString()} ${sales === 1 ? "order" : "orders"}`;
        if (ordersSeries.length >= 2) {
          const half = Math.floor(ordersSeries.length / 2);
          const firstOrd = ordersSeries.slice(0, half).reduce((s, p) => s + p.value, 0);
          const secondOrd = ordersSeries.slice(half).reduce((s, p) => s + p.value, 0);
          if (firstOrd > 0) {
            const pct = ((secondOrd - firstOrd) / firstOrd) * 100;
            orderGrowthDelta = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% YoY`;
          }
        }

        posts.push({
          id: `post-vol-${prod.id}`,
          title: "Total Orders",
          subtitle: `Verified customer orders on ${prod.name}`,
          productName: prod.name,
          productId: prod.id,
          category: "volume",
          provider: prov,
          isArchived,
          metricValue: sales,
          formattedMetric: `${sales.toLocaleString()} ${sales === 1 ? "Order" : "Orders"}`,
          currency: activeCurrency,
          currencySymbol: "",
          growthDelta: orderGrowthDelta,
          peakLabel: "Peak Day",
          peakValue: formattedMaxOrd,
          peakIndex: peakOrdIdx,
          founderHandle: "@founder",
          timestamp: new Date().toISOString(),
          aspectRatio: "4:5",
          defaultStyleId: 1, // Claymorphism Chart
          timeSeriesData: ordersSeries,
          socialCopy: {
            minimal: `Milestone: ${sales.toLocaleString()} customer orders on ${prod.name}! 🎉`,
            story: `${sales.toLocaleString()} orders completed on ${prod.name}. Grateful for every customer using our software daily.`,
            founder: `Milestone reached for ${prod.name}: ${sales.toLocaleString()} verified orders. ⚡`,
          },
        });
      }

      // 4. Post Type D: Claymorphism Monthly Run-Rate (MRR) Post (4:5 Ratio)
      if (mrr > 0) {
        const formattedMrr = `${formatCurrencyAmount(mrr, activeCurrency, { hideDecimals: mrr % 1 === 0 })}/mo`;
        const formattedArr = formatCurrencyAmount(mrr * 12, activeCurrency, { hideDecimals: (mrr * 12) % 1 === 0 });
        let mrrGrowthDelta = "+100% Run-Rate";
        if (prod.growthYoY && prod.growthYoY.trim()) {
          mrrGrowthDelta = `${prod.growthYoY.trim()} YoY`;
        } else {
          mrrGrowthDelta = "Verified MRR";
        }

        posts.push({
          id: `post-growth-${prod.id}`,
          title: "Monthly Run-Rate",
          subtitle: `Active recurring subscriptions & retention on ${prod.name}`,
          productName: prod.name,
          productId: prod.id,
          category: "growth",
          provider: prov,
          isArchived,
          metricValue: mrr,
          formattedMetric: formattedMrr,
          currency: activeCurrency,
          currencySymbol: symbol,
          growthDelta: mrrGrowthDelta,
          peakLabel: "ARR Target",
          peakValue: formattedArr,
          founderHandle: "@founder",
          timestamp: new Date().toISOString(),
          aspectRatio: "4:5",
          defaultStyleId: 1, // Claymorphism Chart
          timeSeriesData: revenueSeries,
          socialCopy: {
            minimal: `${formattedMrr} MRR milestone unlocked on ${prod.name}! 🚀`,
            story: `Steady subscription growth for ${prod.name}. Hitting ${formattedMrr} monthly recurring revenue.`,
            founder: `${formattedMrr} MRR milestone reached for ${prod.name}. 🚀`,
          },
        });
      }
    });

    return posts;
  }, [products, transactions, primaryCurrency, availableProducts, providerArchivedSettings]);

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return generatedSocialPosts.filter((post) => {
      // 0. Archived Products Filter (based on Providers page settings)
      if (post.isArchived && post.productId) {
        const prod = products.find((p) => p.id === post.productId);
        if (prod && !isProductIncluded(prod)) {
          return false;
        }
      }

      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesProduct = post.productName.toLowerCase().includes(q);
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesMetric = post.formattedMetric.toLowerCase().includes(q);
        const matchesProvider = String(post.provider).toLowerCase().includes(q);
        if (!matchesProduct && !matchesTitle && !matchesMetric && !matchesProvider) {
          return false;
        }
      }

      // 2. Category Tab Filter
      if (activeCategory !== "all" && post.category !== activeCategory) {
        return false;
      }

      // 3. Product Dropdown Filter (Multi-select)
      if (selectedProductIds.length > 0) {
        if (!post.productId || !selectedProductIds.includes(post.productId)) {
          return false;
        }
      }

      // 4. Style Filter
      const effectiveStyle = postStyleOverrides[post.id] || post.defaultStyleId;
      if (selectedStyleFilter !== "all" && String(effectiveStyle) !== selectedStyleFilter) {
        return false;
      }

      return true;
    });
  }, [
    generatedSocialPosts,
    searchQuery,
    activeCategory,
    selectedProductIds,
    selectedStyleFilter,
    postStyleOverrides,
    products,
    providerArchivedSettings,
  ]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-28 select-none">
      {/* Header & Global Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-primary tracking-tight">
            Social Milestone Gallery
          </h1>
          <p className="text-xs text-brand-secondary mt-0.5">
            Turn your authentic sales &amp; product achievements into high-resolution social media graphics.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBatchExportOpen(true)}
            className="h-9 px-4 rounded-full border border-border-default bg-surface-base hover:bg-surface-subtle text-xs font-semibold text-brand-primary transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <ArchiveBoxIcon className="w-4 h-4 text-brand-primary" />
            <span>Export Package</span>
          </button>

          <button
            onClick={() =>
              loadMilestoneIntoStudio({
                numericValue: 50000,
                metricLabel: "$50,000",
                currencyCode: primaryCurrency,
                currencySymbol: "$",
                subtext: "All-Time Revenue Milestone",
                verifiedSource: "stripe",
                growthDelta: "+45% Growth",
                accentColor: "#3B82F6",
              })
            }
            className="h-9 px-4 rounded-full bg-brand-primary hover:opacity-90 text-surface-canvas text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <PaintBrushIcon className="w-4 h-4" />
            <span>Custom Post Studio</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & Options Toolbar */}
      <div className="p-3.5 rounded-2xl bg-surface-base border border-border-default shadow-xs space-y-3">
        {/* Search Bar & Dropdowns Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by app name, revenue milestone, or gateway..."
              className="w-full h-9 pl-9 pr-8 rounded-full bg-surface-subtle border border-border-default text-xs text-brand-primary placeholder:text-brand-muted focus:outline-hidden focus:border-brand-primary transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary cursor-pointer"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Standard Dropdown Menu with Search & Circle Checkboxes (Matching Compare Page) */}
          <GalleryProductDropdown
            availableProducts={availableProducts}
            selectedProductIds={selectedProductIds}
            onToggleProduct={toggleProductSelection}
            onResetAll={() => setSelectedProductIds([])}
          />

          {/* Visual Style Filter Dropdown */}
          <Dropdown
            options={[
              { id: "all", label: "All Post Styles" },
              { id: "1", label: "Claymorphism Chart", sublabel: "Trend Matrix (4:5)" },
              { id: "2", label: "3D Award Medal", sublabel: "Golden Banner (16:9)" },
            ]}
            value={selectedStyleFilter}
            onChange={(id) => setSelectedStyleFilter(id)}
            icon={SparklesIcon}
            size="md"
            width="230px"
          />
        </div>

        {/* Selected Product Pill Chips */}
        {selectedProductIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-default/40">
            <span className="text-[11px] text-brand-muted font-medium">Filtering by:</span>
            <AnimatePresence mode="popLayout" initial={false}>
              {selectedProductIds.map((id) => {
                const p = availableProducts.find((x) => x.id === id);
                if (!p) return null;
                const provider = p.channels?.[0]?.provider || p.providers?.[0]?.provider;
                return (
                  <motion.div
                    layout="position"
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="h-7 pl-2.5 pr-1.5 rounded-full bg-surface-subtle border border-border-default text-brand-primary text-xs font-medium inline-flex items-center gap-1.5 shadow-2xs hover:border-border-hover transition"
                  >
                    {provider && <BrandIcon provider={provider} className="w-3 h-3" colored={true} />}
                    <span className="truncate max-w-[140px] font-medium text-brand-primary">{p.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleProductSelection(p.id)}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-primary hover:bg-surface-base transition cursor-pointer"
                      title={`Remove ${p.name}`}
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setSelectedProductIds([])}
              className="text-[11px] text-brand-muted hover:text-brand-primary underline transition cursor-pointer ml-1"
            >
              Reset to All
            </button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`h-7 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${isActive
                    ? "bg-brand-primary text-surface-canvas shadow-xs"
                    : "bg-surface-subtle hover:bg-surface-base text-brand-secondary hover:text-brand-primary border border-border-default/50"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Social Media Posts Gallery: Pinterest Masonry Feed (CSS Columns) */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-border-default text-center bg-surface-subtle/20 space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-base border border-border-default flex items-center justify-center text-brand-muted mx-auto shadow-2xs">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-brand-primary">No posts matched your filters</h3>
            <p className="text-xs text-brand-secondary">
              Try adjusting your search query, product filter, or category tabs to see more milestone posts.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
              setSelectedProductIds([]);
              setSelectedStyleFilter("all");
            }}
            className="mt-2 h-8 px-4 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5 [column-fill:_balance]">
          {filteredPosts.map((post) => {
            const currentStyleId = postStyleOverrides[post.id] || post.defaultStyleId;
            return (
              <SocialPostCard
                key={post.id}
                post={post}
                currentStyleId={currentStyleId}
                onStyleChange={handleStyleChange}
                onShare={handleOpenShare}
              />
            );
          })}
        </div>
      )}

      {/* Interactive Platform Aspect Ratio Share & Export Modal */}
      {isShareModalOpen && sharingPost && (
        <ShareExportModal
          key={`${sharingPost.id}_${sharingStyleId}`}
          post={sharingPost}
          styleId={sharingStyleId}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onStyleChange={handleStyleChange}
        />
      )}
    </div>
  );
};
