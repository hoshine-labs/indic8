"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UnifiedProduct, ProviderType, ProductProviderMapping } from "@/lib/types";
import { BrandIcon } from "@/lib/brandLogos";
import { formatCurrencyAmount } from "@/lib/currency";
import { CurrencyCode } from "@/lib/types";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/20/solid";

import { NumberFlowAmount } from "@/components/ui";

export interface ProductCardProps {
  product: UnifiedProduct;
  primaryCurrency: CurrencyCode;
  fallbackProvider?: ProviderType;
  onInspect: (product: UnifiedProduct) => void;
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
      x: { type: "tween" as const, duration: 0.22, ease: "easeOut" as const },
      opacity: { duration: 0.15 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    transition: {
      x: { type: "tween" as const, duration: 0.22, ease: "easeOut" as const },
      opacity: { duration: 0.15 },
    },
  }),
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  primaryCurrency,
  fallbackProvider = "polar",
  onInspect,
}) => {
  const [[activeMediaIdx, direction], setSlideState] = useState<[number, number]>([0, 0]);
  const [imgLoadFailed, setImgLoadFailed] = useState<Record<number, boolean>>({});

  const channels = product.channels || product.providers || [];
  const uniqueProviders: ProviderType[] = Array.from(
    new Set(channels.map((ch: ProductProviderMapping) => ch.provider))
  );

  const activeProvider = uniqueProviders[0] || fallbackProvider;
  const totalOrders = typeof product.totalSales === "number" ? product.totalSales : 0;
  const revenueVal = typeof product.totalRevenue === "number" ? product.totalRevenue : 0;

  // Collect all valid media URLs
  const mediaList: string[] = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(product.medias) && product.medias.length > 0) {
      product.medias.forEach((m) => {
        if (m && !list.includes(m)) list.push(m);
      });
    }
    if (product.imageUrl && !list.includes(product.imageUrl)) {
      list.unshift(product.imageUrl);
    }
    return list;
  }, [product.medias, product.imageUrl]);

  // Preload all images into browser cache for instant lag-free switching
  useEffect(() => {
    mediaList.forEach((url) => {
      if (url && typeof window !== "undefined") {
        const img = new Image();
        img.src = url;
      }
    });
  }, [mediaList]);

  const hasMultipleMedia = mediaList.length > 1;
  const currentMediaUrl = mediaList[activeMediaIdx] || "";

  // Generative color accent for fallback
  const nameHash = product.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-blue-600/20 via-indigo-600/10 to-transparent",
    "from-emerald-600/20 via-teal-600/10 to-transparent",
    "from-purple-600/20 via-pink-600/10 to-transparent",
    "from-amber-600/20 via-orange-600/10 to-transparent",
    "from-cyan-600/20 via-blue-600/10 to-transparent",
  ];
  const accentGradient = gradients[nameHash % gradients.length];

  const paginate = (newDirection: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextIdx = activeMediaIdx + newDirection;
    if (nextIdx < 0) nextIdx = mediaList.length - 1;
    if (nextIdx >= mediaList.length) nextIdx = 0;
    setSlideState([nextIdx, newDirection]);
  };

  return (
    <div
      onClick={() => onInspect(product)}
      className="group relative flex flex-col justify-between p-3.5 rounded-[22px] border border-border-default bg-surface-base hover:bg-surface-subtle/50 transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer select-none overflow-hidden space-y-3"
    >
      {/* 1. Image Container (16:9 Aspect Ratio with directional sliding animation) */}
      <div className="relative w-full aspect-[16/9] rounded-[14px] bg-surface-subtle border border-border-default/40 flex items-center justify-center overflow-hidden group/media">
        {currentMediaUrl && !imgLoadFailed[activeMediaIdx] ? (
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.img
              key={activeMediaIdx}
              src={currentMediaUrl}
              alt={`${product.name} media ${activeMediaIdx + 1}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onError={() => {
                setImgLoadFailed((prev) => ({ ...prev, [activeMediaIdx]: true }));
              }}
              className="absolute inset-0 w-full h-full object-cover rounded-[14px]"
            />
          </AnimatePresence>
        ) : currentMediaUrl && imgLoadFailed[activeMediaIdx] ? (
          <img
            src={`/api/image-proxy?url=${encodeURIComponent(currentMediaUrl)}&name=${encodeURIComponent(product.name)}&provider=${encodeURIComponent(activeProvider)}`}
            alt={`${product.name} media`}
            className="w-full h-full object-cover rounded-[14px]"
          />
        ) : (
          <img
            src={`/api/image-proxy?name=${encodeURIComponent(product.name)}&provider=${encodeURIComponent(activeProvider)}`}
            alt={`${product.name} cover`}
            className="w-full h-full object-cover rounded-[14px]"
          />
        )}

        {/* Direction-Aware Multi-Media Carousel Controls */}
        {hasMultipleMedia && (
          <>
            <button
              type="button"
              onClick={(e) => paginate(-1, e)}
              title="Previous Media"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs transition opacity-0 group-hover/media:opacity-100 cursor-pointer z-20 active:scale-90"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={(e) => paginate(1, e)}
              title="Next Media"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/70 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-xs transition opacity-0 group-hover/media:opacity-100 cursor-pointer z-20 active:scale-90"
            >
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </button>

            {/* Bottom Slide Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
              {mediaList.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newDir = dotIdx > activeMediaIdx ? 1 : -1;
                    setSlideState([dotIdx, newDir]);
                  }}
                  className={`rounded-full transition-all cursor-pointer ${
                    activeMediaIdx === dotIdx
                      ? "w-2.5 h-1 bg-white"
                      : "w-1 h-1 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. Details Container (Matching Sleek Dark Tone with Revenue & Order Icons) */}
      <div className="p-3 rounded-[14px] bg-surface-subtle border border-border-default/40 space-y-2">
        <h3 className="text-xs font-semibold text-brand-primary tracking-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
          {product.name}
        </h3>

        <div className="space-y-1.5 pt-1 border-t border-border-default/40">
          {/* Revenue Row with Currency Icon */}
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-brand-secondary">
              <CurrencyDollarIcon className="w-3.5 h-3.5" />
              <span>Revenue</span>
            </div>
            <span className="font-mono font-bold text-brand-primary text-xs">
              <NumberFlowAmount value={revenueVal} currency={primaryCurrency} />
            </span>
          </div>

          {/* Orders Row with Receipt Icon */}
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-brand-secondary">
              <ReceiptPercentIcon className="w-3.5 h-3.5" />
              <span>Orders</span>
            </div>
            <span className="font-mono font-bold text-brand-primary text-xs">
              <NumberFlowAmount value={totalOrders} />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Provider Logo Container + Details Button */}
      <div className="flex items-center gap-2 pt-0.5">
        {/* Provider Logo Container */}
        <div className="w-9 h-9 rounded-[10px] bg-surface-subtle border border-border-default/50 flex items-center justify-center shrink-0 shadow-xs">
          <BrandIcon provider={activeProvider} className="w-5.5 h-5.5" colored={true} />
        </div>

        {/* Details Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInspect(product);
          }}
          className="flex-1 h-9 rounded-[10px] bg-brand-primary hover:opacity-90 text-surface-canvas font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] shadow-xs"
        >
          <span>Details</span>
          <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
