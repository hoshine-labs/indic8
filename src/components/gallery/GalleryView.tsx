"use client";

import React, { useState, useMemo } from "react";
import { useIndic8Store } from "@/lib/indic8Store";
import { SocialPostData, PostStyleId, AspectRatioKey } from "./types";
import { SocialPostCard } from "./SocialPostCard";
import { ShareExportModal } from "./ShareExportModal";
import { Dropdown } from "@/components/ui";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  ArchiveBoxIcon,
  PaintBrushIcon,
  CubeIcon,
  ChevronDownIcon,
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

export const GalleryView: React.FC = () => {
  const {
    products,
    galleryPresets,
    loadMilestoneIntoStudio,
    setIsBatchExportOpen,
    primaryCurrency,
  } = useIndic8Store();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string>("all");
  const [isProductFilterOpen, setIsProductFilterOpen] = useState(false);
  const [isStyleFilterOpen, setIsStyleFilterOpen] = useState(false);

  // Share / Export Modal State
  const [sharingPost, setSharingPost] = useState<SocialPostData | null>(null);
  const [sharingStyleId, setSharingStyleId] = useState<PostStyleId>(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Per-Post Style Overrides: Map of [postId -> PostStyleId]
  const [postStyleOverrides, setPostStyleOverrides] = useState<Record<string, PostStyleId>>({});

  const handleStyleChange = (postId: string, newStyleId: PostStyleId) => {
    setPostStyleOverrides((prev) => ({
      ...prev,
      [postId]: newStyleId,
    }));
  };

  const handleOpenShare = (post: SocialPostData, styleId: PostStyleId) => {
    setSharingPost(post);
    setSharingStyleId(styleId);
    setIsShareModalOpen(true);
  };

  // Generate Realistic Social Media Posts from Workspace Products
  const generatedSocialPosts: SocialPostData[] = useMemo(() => {
    const posts: SocialPostData[] = [];
    let counter = 0;

    const getNextStyle = (): PostStyleId => {
      const st = ((counter % 5) + 1) as PostStyleId;
      return st;
    };

    const getNextRatio = (): AspectRatioKey => {
      return ASPECT_RATIO_ROTATION[counter % ASPECT_RATIO_ROTATION.length];
    };

    // 1. Generate Authentic Posts from Real Products in Workspace
    products.forEach((prod) => {
      const prov = prod.providers[0]?.provider || prod.channels[0]?.provider || "stripe";
      const rev = prod.totalRevenue || 0;
      const sales = prod.totalSales || 0;
      const mrr = prod.mrr || 0;
      const symbol = prod.primaryCurrency === "EUR" ? "€" : prod.primaryCurrency === "GBP" ? "£" : "$";

      // Post A: Real Net Revenue Milestone Post (Only if revenue > 0)
      if (rev > 0) {
        const formattedRev = rev % 1 !== 0 ? `${symbol}${rev.toFixed(2)}` : `${symbol}${rev.toLocaleString()}`;
        posts.push({
          id: `post-rev-${prod.id}`,
          title: "Revenue",
          subtitle: `Verified revenue checkouts on ${prod.name}`,
          productName: prod.name,
          productId: prod.id,
          category: "revenue",
          provider: prov,
          metricValue: rev,
          formattedMetric: formattedRev,
          currency: prod.primaryCurrency,
          currencySymbol: symbol,
          growthDelta: prod.growthYoY || "+15%",
          peakLabel: "Highest Run",
          peakValue: rev % 1 !== 0 ? `${symbol}${(rev * 0.48).toFixed(2)}` : `${symbol}${Math.round(rev * 0.48).toLocaleString()}`,
          founderHandle: "@founder",
          timestamp: new Date().toISOString(),
          aspectRatio: "4:5",
          defaultStyleId: 3,
          timeSeriesData: [
            { label: "Sun", value: rev * 0.20 },
            { label: "Mon", value: rev * 0.35 },
            { label: "Tue", value: rev * 0.30 },
            { label: "Wed", value: rev * 0.65 },
            { label: "Thu", value: rev * 0.50 },
            { label: "Fri", value: rev * 0.80 },
            { label: "Sat", value: rev },
          ],
          socialCopy: {
            minimal: `Just reached ${formattedRev} in revenue on ${prod.name}! 🚀`,
            story: `Building ${prod.name} has been an incredible journey. Today we officially reached ${formattedRev}. Thank you to everyone supporting us!`,
            founder: `Milestone unlocked: ${formattedRev} for ${prod.name}. The momentum is compounding. 📈`,
          },
        });
      }

      // Post B: Real Orders Milestone Post (Only if sales > 0)
      if (sales > 0) {
        posts.push({
          id: `post-vol-${prod.id}`,
          title: "Total Orders",
          subtitle: `Verified customer orders on ${prod.name}`,
          productName: prod.name,
          productId: prod.id,
          category: "volume",
          provider: prov,
          metricValue: sales,
          formattedMetric: `${sales.toLocaleString()} ${sales === 1 ? "Order" : "Orders"}`,
          currency: prod.primaryCurrency,
          currencySymbol: "",
          growthDelta: `+${sales} completed`,
          peakLabel: "Peak Rate",
          peakValue: `${Math.max(1, Math.round(sales * 0.4))} orders`,
          founderHandle: "@founder",
          timestamp: new Date().toISOString(),
          aspectRatio: "4:5",
          defaultStyleId: 3,
          timeSeriesData: [
            { label: "Sun", value: Math.max(0, Math.round(sales * 0.15)) },
            { label: "Mon", value: Math.max(0, Math.round(sales * 0.30)) },
            { label: "Tue", value: Math.max(0, Math.round(sales * 0.25)) },
            { label: "Wed", value: Math.max(1, Math.round(sales * 0.60)) },
            { label: "Thu", value: Math.max(0, Math.round(sales * 0.45)) },
            { label: "Fri", value: Math.max(1, Math.round(sales * 0.80)) },
            { label: "Sat", value: sales },
          ],
          socialCopy: {
            minimal: `Milestone: ${sales.toLocaleString()} customer orders on ${prod.name}! 🎉`,
            story: `${sales.toLocaleString()} orders completed on ${prod.name}. Grateful for every customer using our software daily.`,
            founder: `Milestone reached for ${prod.name}: ${sales.toLocaleString()} verified orders. ⚡`,
          },
        });
      }

      // Post C: Real Monthly Run-Rate (MRR) Post (Only if product has subscription MRR)
      if (mrr > 0) {
        const formattedMrr = `${symbol}${mrr.toLocaleString()}/mo`;
        posts.push({
          id: `post-growth-${prod.id}`,
          title: "Monthly Run-Rate",
          subtitle: `Active recurring subscriptions & retention on ${prod.name}`,
          productName: prod.name,
          productId: prod.id,
          category: "growth",
          provider: prov,
          metricValue: mrr,
          formattedMetric: formattedMrr,
          currency: prod.primaryCurrency,
          currencySymbol: symbol,
          growthDelta: "+34% MRR Velocity",
          peakLabel: "ARR Target",
          peakValue: `${symbol}${(mrr * 12).toLocaleString()}`,
          founderHandle: "@founder",
          timestamp: new Date().toISOString(),
          aspectRatio: "4:5",
          defaultStyleId: 3,
          timeSeriesData: [
            { label: "Sun", value: Math.round(mrr * 0.20) },
            { label: "Mon", value: Math.round(mrr * 0.35) },
            { label: "Tue", value: Math.round(mrr * 0.30) },
            { label: "Wed", value: Math.round(mrr * 0.65) },
            { label: "Thu", value: Math.round(mrr * 0.50) },
            { label: "Fri", value: Math.round(mrr * 0.80) },
            { label: "Sat", value: mrr },
          ],
          socialCopy: {
            minimal: `${prod.name} is now at ${formattedMrr}! 📈`,
            story: `Compounding growth is kicking in: ${prod.name} reached ${formattedMrr} recurring revenue.`,
            founder: `${formattedMrr} MRR milestone reached for ${prod.name}. 🚀`,
          },
        });
      }
    });

    return posts;
  }, [products]);

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return generatedSocialPosts.filter((post) => {
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

      // 3. Product Dropdown Filter
      if (selectedProductId !== "all" && post.productId !== selectedProductId) {
        return false;
      }

      // 4. Style Filter
      const effectiveStyle = postStyleOverrides[post.id] || post.defaultStyleId;
      if (selectedStyleFilter !== "all" && effectiveStyle.toString() !== selectedStyleFilter) {
        return false;
      }

      return true;
    });
  }, [generatedSocialPosts, searchQuery, activeCategory, selectedProductId, selectedStyleFilter, postStyleOverrides]);

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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Product Filter Dropdown */}
          <Dropdown
            options={[
              { id: "all", label: "All Products" },
              ...products.map((p) => ({
                id: p.id,
                label: p.name,
                sublabel: p.channels?.[0]?.provider || p.providers?.[0]?.provider,
              })),
            ]}
            value={selectedProductId}
            onChange={(id) => setSelectedProductId(id)}
            icon={CubeIcon}
            searchable={products.length > 5}
            searchPlaceholder="Search products..."
            size="md"
            width="220px"
          />

          {/* Visual Style Filter Dropdown */}
          <Dropdown
            options={[
              { id: "all", label: "All 5 Styles" },
              { id: "1", label: "Style 1: Neon Cyber Glow", sublabel: "Cyber Blue" },
              { id: "2", label: "Style 2: 3D Achievement", sublabel: "Gold / Amber" },
              { id: "3", label: "Style 3: Claymorphism", sublabel: "Purple Float" },
              { id: "4", label: "Style 4: Bento Breakdown", sublabel: "Emerald Grid" },
              { id: "5", label: "Style 5: Vibrant Gradient", sublabel: "Sunset Aurora" },
            ]}
            value={selectedStyleFilter}
            onChange={(id) => setSelectedStyleFilter(id)}
            icon={SparklesIcon}
            size="md"
            width="240px"
          />
        </div>

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

      {/* Social Media Posts Gallery: Pinterest Masonry Feed */}
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
              setSelectedProductId("all");
              setSelectedStyleFilter("all");
            }}
            className="mt-2 h-8 px-4 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 items-start">
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
      <ShareExportModal
        post={sharingPost}
        styleId={sharingStyleId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onStyleChange={handleStyleChange}
      />
    </div>
  );
};
