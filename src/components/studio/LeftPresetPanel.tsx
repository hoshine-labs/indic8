"use client";

import React, { useState, useRef } from "react";
import { StudioCanvasState } from "./CanvasStage";
import { FormatPreset } from "@/lib/platforms";
import { LayoutPreset } from "@/lib/constants";
import { FormatDialog } from "./FormatDialog";
import { FrameDialog, FrameDecoration } from "./FrameDialog";
import { BrandIcon } from "@/lib/brandLogos";
import {
  ViewColumnsIcon,
  ComputerDesktopIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";

export interface PlatformPresetItem {
  id: string;
  title: string;
  platform: string;
  numericValue: number;
  currencySymbol: string;
  currencyCode: string;
  prefix: string;
  suffix: string;
  metricLabel: string;
  subtext: string;
  growthDelta: string;
  verifiedSource: StudioCanvasState["verifiedSource"];
  chartStyle: StudioCanvasState["chartStyle"];
  accentColor?: string;
  aspectRatio: string;
  ratioStr: string;
}

export interface PlatformCategory {
  id: string;
  name: string;
  type: "revenue" | "social" | "dev" | "creator";
  iconName: string;
  presets: PlatformPresetItem[];
}

const PLATFORM_CATEGORIES: PlatformCategory[] = [
  {
    id: "instagram",
    name: "Instagram",
    type: "social",
    iconName: "instagram",
    presets: [
      {
        id: "ig-followers",
        title: "50k Followers",
        platform: "Instagram",
        numericValue: 50000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Followers",
        metricLabel: "Active Audience",
        subtext: "Grown organically across posts and stories",
        growthDelta: "+34% MoM",
        verifiedSource: "instagram",
        chartStyle: "wave",
        aspectRatio: "1:1",
        ratioStr: "1 / 1",
      },
      {
        id: "ig-reel-views",
        title: "1M Reel Views",
        platform: "Instagram",
        numericValue: 1000000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Plays",
        metricLabel: "Viral Reel Reach",
        subtext: "Top performing short-form video release",
        growthDelta: "+180% viral",
        verifiedSource: "instagram",
        chartStyle: "bars",
        aspectRatio: "9:16",
        ratioStr: "9 / 16",
      },
      {
        id: "ig-likes",
        title: "25k Post Likes",
        platform: "Instagram",
        numericValue: 25000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Likes",
        metricLabel: "Engagement Surge",
        subtext: "Community engagement on keynote announcement",
        growthDelta: "+48%",
        verifiedSource: "instagram",
        chartStyle: "bars",
        aspectRatio: "4:5",
        ratioStr: "4 / 5",
      },
      {
        id: "ig-reach",
        title: "150k Story Reach",
        platform: "Instagram",
        numericValue: 150000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Reach",
        metricLabel: "Weekly Reach",
        subtext: "Unique viewer accounts reached in 7 days",
        growthDelta: "+62%",
        verifiedSource: "instagram",
        chartStyle: "wave",
        aspectRatio: "9:16",
        ratioStr: "9 / 16",
      },
    ],
  },
  {
    id: "stripe",
    name: "Stripe",
    type: "revenue",
    iconName: "stripe",
    presets: [
      {
        id: "stripe-arr",
        title: "$100k ARR",
        platform: "Stripe",
        numericValue: 100000,
        currencySymbol: "$",
        currencyCode: "USD",
        prefix: "",
        suffix: " ARR",
        metricLabel: "Annual Recurring Revenue",
        subtext: "Verified through Stripe Connect live ledger",
        growthDelta: "+12.4% MoM",
        verifiedSource: "stripe",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "stripe-mrr",
        title: "$10k MRR",
        platform: "Stripe",
        numericValue: 10000,
        currencySymbol: "$",
        currencyCode: "USD",
        prefix: "",
        suffix: " MRR",
        metricLabel: "Monthly Recurring Revenue",
        subtext: "Profitable SaaS milestone reached",
        growthDelta: "+24.8% MoM",
        verifiedSource: "stripe",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "stripe-payouts",
        title: "$50k Volume",
        platform: "Stripe",
        numericValue: 50000,
        currencySymbol: "$",
        currencyCode: "USD",
        prefix: "",
        suffix: " Processed",
        metricLabel: "Gross Payment Volume",
        subtext: "Cumulative transaction processing milestone",
        growthDelta: "+88.4% YoY",
        verifiedSource: "stripe",
        chartStyle: "bars",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "stripe-1m-gmv",
        title: "$1M GMV Total",
        platform: "Stripe",
        numericValue: 1000000,
        currencySymbol: "$",
        currencyCode: "USD",
        prefix: "",
        suffix: " GMV",
        metricLabel: "Gross Merchandise Value",
        subtext: "Total lifetime volume milestone",
        growthDelta: "+210% YoY",
        verifiedSource: "stripe",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    type: "creator",
    iconName: "youtube",
    presets: [
      {
        id: "yt-subscribers",
        title: "100k Subs Award",
        platform: "YouTube",
        numericValue: 100000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Subscribers",
        metricLabel: "Silver Creator Award",
        subtext: "Official creator milestone verified by YouTube API",
        growthDelta: "+12.4k/mo",
        verifiedSource: "youtube",
        chartStyle: "bars",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "yt-views-milestone",
        title: "5M Total Views",
        platform: "YouTube",
        numericValue: 5000000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Channel Views",
        metricLabel: "Lifetime Video Views",
        subtext: "Cumulative viewership across all uploads",
        growthDelta: "+450k this mo",
        verifiedSource: "youtube",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "yt-shorts-viral",
        title: "2M Shorts Plays",
        platform: "YouTube",
        numericValue: 2000000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Shorts Plays",
        metricLabel: "Viral Shorts Campaign",
        subtext: "Highest performing short in channel history",
        growthDelta: "+320% spike",
        verifiedSource: "youtube",
        chartStyle: "bars",
        aspectRatio: "9:16",
        ratioStr: "9 / 16",
      },
      {
        id: "yt-10k-members",
        title: "10k Members",
        platform: "YouTube",
        numericValue: 10000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Members",
        metricLabel: "Channel Memberships",
        subtext: "Monthly recurring channel supporters",
        growthDelta: "+38% MoM",
        verifiedSource: "youtube",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
    ],
  },
  {
    id: "x",
    name: "X (Twitter)",
    type: "social",
    iconName: "x",
    presets: [
      {
        id: "x-followers",
        title: "25k Followers",
        platform: "X",
        numericValue: 25000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Followers",
        metricLabel: "Founder Audience",
        subtext: "Tech and builder network engagement",
        growthDelta: "+1.2k/wk",
        verifiedSource: "x",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "x-impressions",
        title: "2M Impressions",
        platform: "X",
        numericValue: 2000000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Impressions",
        metricLabel: "Viral Launch Thread",
        subtext: "Top trending announcement on #buildinpublic",
        growthDelta: "+840% reach",
        verifiedSource: "x",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "x-bookmarks",
        title: "10k Bookmarks",
        platform: "X",
        numericValue: 10000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Saves",
        metricLabel: "High Signal Saves",
        subtext: "Architectural breakdown post saved by engineers",
        growthDelta: "+2.4k saves",
        verifiedSource: "x",
        chartStyle: "bars",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "x-100k-followers",
        title: "100k Followers",
        platform: "X",
        numericValue: 100000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Followers",
        metricLabel: "6-Figure Audience",
        subtext: "Verified founder brand landmark achieved",
        growthDelta: "+18.2% MoM",
        verifiedSource: "x",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    type: "dev",
    iconName: "github",
    presets: [
      {
        id: "gh-stars",
        title: "10,000 Stars",
        platform: "GitHub",
        numericValue: 10000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Stars ★",
        metricLabel: "Open Source Milestone",
        subtext: "Trending #1 across developers worldwide",
        growthDelta: "+1.4k this week",
        verifiedSource: "github",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "gh-forks",
        title: "1,500 Forks",
        platform: "GitHub",
        numericValue: 1500,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Forks",
        metricLabel: "Developer Ecosystem",
        subtext: "Community extensions and integrations built",
        growthDelta: "+240 forks",
        verifiedSource: "github",
        chartStyle: "bars",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "gh-contributors",
        title: "100 Contributors",
        platform: "GitHub",
        numericValue: 100,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Contributors",
        metricLabel: "Core Contributors",
        subtext: "Global developer community merge milestone",
        growthDelta: "+18 new this mo",
        verifiedSource: "github",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
    ],
  },
  {
    id: "producthunt",
    name: "Product Hunt",
    type: "dev",
    iconName: "producthunt",
    presets: [
      {
        id: "ph-rank1",
        title: "#1 Product of Day",
        platform: "Product Hunt",
        numericValue: 1,
        currencySymbol: "#",
        currencyCode: "RAW",
        prefix: "#",
        suffix: " of the Day",
        metricLabel: "Launch Milestone",
        subtext: "Voted #1 on Product Hunt launch day",
        growthDelta: "Trending #1",
        verifiedSource: "producthunt",
        chartStyle: "none",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "ph-upvotes",
        title: "1,200+ Upvotes",
        platform: "Product Hunt",
        numericValue: 1200,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Upvotes ▲",
        metricLabel: "Community Support",
        subtext: "Featured in Golden Kitty Awards shortlist",
        growthDelta: "98% Positive",
        verifiedSource: "producthunt",
        chartStyle: "bars",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    type: "creator",
    iconName: "tiktok",
    presets: [
      {
        id: "tt-views",
        title: "10M Video Views",
        platform: "TikTok",
        numericValue: 10000000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Views",
        metricLabel: "Viral Video Reach",
        subtext: "Trending #1 on tech & design hashtags",
        growthDelta: "+3.2M viral surge",
        verifiedSource: "custom",
        chartStyle: "wave",
        aspectRatio: "9:16",
        ratioStr: "9 / 16",
      },
      {
        id: "tt-followers",
        title: "200k Followers",
        platform: "TikTok",
        numericValue: 200000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Followers",
        metricLabel: "Creator Growth",
        subtext: "Organic viral video audience conversion",
        growthDelta: "+45k this month",
        verifiedSource: "custom",
        chartStyle: "wave",
        aspectRatio: "9:16",
        ratioStr: "9 / 16",
      },
    ],
  },
  {
    id: "reddit",
    name: "Reddit",
    type: "social",
    iconName: "reddit",
    presets: [
      {
        id: "rd-upvotes",
        title: "15k Post Upvotes",
        platform: "Reddit",
        numericValue: 15000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Upvotes",
        metricLabel: "r/SideProject Top",
        subtext: "Ranked #1 post of the month across builder subs",
        growthDelta: "99% Upvoted",
        verifiedSource: "custom",
        chartStyle: "bars",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
      {
        id: "rd-comments",
        title: "1.2k Comments",
        platform: "Reddit",
        numericValue: 1200,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Discussions",
        metricLabel: "Viral Discussion",
        subtext: "Active technical debate and product feedback",
        growthDelta: "+450/hr",
        verifiedSource: "custom",
        chartStyle: "wave",
        aspectRatio: "16:9",
        ratioStr: "16 / 9",
      },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    type: "social",
    iconName: "linkedin",
    presets: [
      {
        id: "li-impressions",
        title: "500k Impressions",
        platform: "LinkedIn",
        numericValue: 500000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Impressions",
        metricLabel: "Executive Reach",
        subtext: "Founder story trending across engineering leaders",
        growthDelta: "+320% reach",
        verifiedSource: "custom",
        chartStyle: "wave",
        aspectRatio: "1.91:1",
        ratioStr: "1.91 / 1",
      },
      {
        id: "li-followers",
        title: "20k Followers",
        platform: "LinkedIn",
        numericValue: 20000,
        currencySymbol: "",
        currencyCode: "RAW",
        prefix: "",
        suffix: " Network",
        metricLabel: "Professional Network",
        subtext: "B2B SaaS audience and enterprise buyers",
        growthDelta: "+2.8k/mo",
        verifiedSource: "custom",
        chartStyle: "wave",
        aspectRatio: "1.91:1",
        ratioStr: "1.91 / 1",
      },
    ],
  },
];

interface LeftPresetPanelProps {
  state: StudioCanvasState;
  onApplyTemplate: (preset: PlatformPresetItem) => void;
  onSelectFormat: (format: FormatPreset) => void;
  onFrameTypeChange: (frameType: StudioCanvasState["frameType"]) => void;
  onLayoutChange?: (layout: LayoutPreset) => void;
  onApplyLayout?: (layout: LayoutPreset) => void;
}

export function LeftPresetPanel({
  state,
  onApplyTemplate,
  onSelectFormat,
  onFrameTypeChange,
}: LeftPresetPanelProps) {
  // Support multiple platforms expanded simultaneously!
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(
    new Set(["instagram"])
  );
  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const [isFrameOpen, setIsFrameOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());

  const formatButtonRef = useRef<HTMLButtonElement>(null);
  const frameButtonRef = useRef<HTMLButtonElement>(null);

  const togglePlatform = (id: string) => {
    setExpandedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleFilter = (type: string) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const filteredCategories = PLATFORM_CATEGORIES.filter((cat) => {
    if (selectedFilters.size === 0) return true;
    return selectedFilters.has(cat.type);
  });

  return (
    <aside className="relative sticky top-[56px] flex h-[calc(100vh-56px)] w-64 shrink-0 flex-col gap-2.5 p-2 select-none bg-surface-canvas transition-colors duration-200">
      {/* 1. Top Format & Frame Dual Controls */}
      <div className="bg-surface-base border border-border-default flex flex-col gap-1.5 rounded-[24px] p-1.5 shrink-0 relative">
        <button
          ref={formatButtonRef}
          type="button"
          data-state={isFormatOpen ? "open" : "closed"}
          onClick={() => {
            setIsFormatOpen((prev) => !prev);
            setIsFrameOpen(false);
          }}
          className={`grid h-11 grid-cols-[auto_1fr_auto] items-center gap-2.5 px-3.5 rounded-full text-sm font-medium transition-all active:scale-[0.98] ${
            isFormatOpen
              ? "bg-brand-primary text-surface-canvas"
              : "bg-surface-subtle text-brand-primary hover:bg-surface-subtle"
          }`}
          title="Choose Resolution & Aspect Ratio"
        >
          <ViewColumnsIcon className={`w-4 h-4 ${isFormatOpen ? "text-surface-canvas" : "text-brand-secondary"}`} />
          <span className="truncate text-left font-medium">{state.aspectRatio || "Auto"}</span>
          <ChevronRightIcon
            className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ease-out ${
              isFormatOpen ? "rotate-90 text-surface-canvas" : "text-brand-secondary"
            }`}
          />
        </button>

        <button
          ref={frameButtonRef}
          type="button"
          data-state={isFrameOpen ? "open" : "closed"}
          onClick={() => {
            setIsFrameOpen((prev) => !prev);
            setIsFormatOpen(false);
          }}
          className={`grid h-11 grid-cols-[auto_1fr_auto] items-center gap-2.5 px-3.5 rounded-full text-sm font-medium transition-all active:scale-[0.98] ${
            isFrameOpen
              ? "bg-brand-primary text-surface-canvas"
              : "bg-surface-subtle text-brand-primary hover:bg-surface-subtle"
          }`}
          title="Choose Frame Style"
        >
          <ComputerDesktopIcon className={`w-4 h-4 ${isFrameOpen ? "text-surface-canvas" : "text-brand-secondary"}`} />
          <span className="truncate text-left font-medium capitalize">
            {state.frameType === "none" ? "None Frame" : `${state.frameType} Frame`}
          </span>
          <ChevronRightIcon
            className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ease-out ${
              isFrameOpen ? "rotate-90 text-surface-canvas" : "text-brand-secondary"
            }`}
          />
        </button>
      </div>

      {/* Popovers */}
      <FormatDialog
        isOpen={isFormatOpen}
        onClose={() => setIsFormatOpen(false)}
        selectedFormatId={state.aspectRatio}
        onSelectFormat={onSelectFormat}
        triggerRef={formatButtonRef}
      />

      <FrameDialog
        isOpen={isFrameOpen}
        onClose={() => setIsFrameOpen(false)}
        selectedFrame={state.frameType as FrameDecoration}
        onSelectFrame={(frame) => {
          onFrameTypeChange(frame);
        }}
        scale={state.scale || 1}
        onScaleChange={() => {
          onFrameTypeChange(state.frameType);
        }}
        triggerRef={frameButtonRef}
      />

      {/* 2. Platform Milestone Categories Container (Clean Card Container with Equal Padding) */}
      <div className="bg-surface-base border border-border-default flex flex-col flex-1 min-h-0 overflow-hidden rounded-[24px] p-2 relative">
        {/* Fixed Header Bar */}
        <div className="flex items-center justify-between shrink-0 px-2 py-1.5 border-b border-border-default relative">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-brand-secondary uppercase tracking-wider">
              Platforms
            </span>
            <span className="text-[10px] font-mono font-medium text-brand-secondary px-2 py-0.5 bg-surface-subtle rounded-full border border-border-default">
              {filteredCategories.length}
            </span>
          </div>

          {/* Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium border transition-all active:scale-[0.97] ${
              isFilterOpen || selectedFilters.size > 0
                ? "bg-brand-primary text-surface-canvas border-brand-primary font-semibold"
                : "bg-surface-subtle border-border-default text-brand-secondary hover:text-brand-primary"
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
            <span>Filter</span>
            {selectedFilters.size > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-surface-canvas shrink-0" />
            )}
          </button>
        </div>

        {/* Filter Floating Flyout Popover */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-2 right-2 top-12 z-30 rounded-2xl bg-surface-base border border-border-default p-2 flex flex-col gap-1 text-brand-primary shadow-xl cupertino-glass shrink-0"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-border-default mb-1">
                <span className="text-[11px] font-semibold text-brand-primary">Filter Categories</span>
                {selectedFilters.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedFilters(new Set())}
                    className="text-[10px] text-brand-secondary hover:text-brand-primary flex items-center gap-1"
                  >
                    <ArrowPathIcon className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {[
                { id: "revenue", label: "Revenue & Fintech" },
                { id: "social", label: "Social Media" },
                { id: "dev", label: "Developer Tools" },
                { id: "creator", label: "Creator & Video" },
              ].map((f) => {
                const isChecked = selectedFilters.has(f.id);

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFilter(f.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-full text-[11px] font-medium flex items-center justify-between transition-colors ${
                      isChecked
                        ? "bg-surface-subtle text-brand-primary font-semibold"
                        : "text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle"
                    }`}
                  >
                    <span>{f.label}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                        isChecked
                          ? "bg-brand-primary border-brand-primary text-surface-canvas"
                          : "border-border-default"
                      }`}
                    >
                      {isChecked && <CheckIcon className="w-2.5 h-2.5" />}
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Platform List */}
        <div className="flex-1 min-h-0 overflow-y-auto pt-2 pb-16 flex flex-col gap-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain">
          {filteredCategories.map((cat) => {
            const isExpanded = expandedPlatforms.has(cat.id);

            return (
              <div
                key={cat.id}
                className="bg-surface-subtle border border-border-default rounded-[20px] overflow-hidden shrink-0"
              >
                {/* Platform Header Button */}
                <button
                  type="button"
                  onClick={() => togglePlatform(cat.id)}
                  className="flex h-10 w-full items-center justify-between px-3 text-left font-medium text-brand-primary tracking-tight"
                >
                  <div className="flex items-center gap-2.5">
                    <BrandIcon name={cat.iconName} className="w-4 h-4 shrink-0" colored={true} />
                    <span className="text-[13px] font-medium text-brand-primary">
                      {cat.name}
                    </span>
                  </div>

                  <ChevronRightIcon
                    className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ease-out ${
                      isExpanded ? "rotate-90 text-brand-primary" : "text-brand-secondary"
                    }`}
                  />
                </button>

                {/* Sub-Presets Accordion */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="px-2.5 pb-2.5 pt-0.5 flex flex-col gap-1">
                        {cat.presets.map((preset) => {
                          const isSelected =
                            state.metricLabel === preset.metricLabel;

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => onApplyTemplate(preset)}
                              className={`w-full h-8 flex items-center justify-between px-3 rounded-full text-left border transition-all active:scale-[0.98] ${
                                isSelected
                                  ? "bg-brand-primary text-surface-canvas border-transparent font-semibold shadow-sm"
                                  : "bg-surface-base border-transparent hover:border-border-default hover:bg-surface-subtle text-brand-secondary hover:text-brand-primary"
                              }`}
                            >
                              <span className="text-[11px] font-medium truncate">{preset.title}</span>
                              <span className={`text-[10px] font-mono shrink-0 ${isSelected ? "text-surface-canvas font-bold" : "text-brand-secondary font-medium"}`}>
                                {preset.growthDelta}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
