import React, { memo } from "react";
import { SocialPostData, PostStyleId } from "./types";
import { GalleryCanvasGraphic } from "./GalleryCanvasGraphic";
import { useIndic8Store } from "@/lib/indic8Store";
import {
  ShareIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";

interface SocialPostCardProps {
  post: SocialPostData;
  currentStyleId?: PostStyleId;
  onStyleChange?: (postId: string, styleId: PostStyleId) => void;
  onShare: (post: SocialPostData, styleId: PostStyleId) => void;
}

export const SocialPostCard: React.FC<SocialPostCardProps> = memo(({
  post,
  currentStyleId,
  onShare,
}) => {
  const effectiveStyleId = currentStyleId || post.defaultStyleId || 1;
  const { loadMilestoneIntoStudio } = useIndic8Store();

  const handleCustomize = (e: React.MouseEvent) => {
    e.stopPropagation();
    loadMilestoneIntoStudio({
      numericValue: post.metricValue,
      metricLabel: post.formattedMetric,
      currencyCode: post.currency,
      currencySymbol: post.currencySymbol,
      subtext: post.subtitle,
      verifiedSource: post.provider,
      growthDelta: post.growthDelta,
      accentColor: effectiveStyleId === 1 ? "#3754F6" : effectiveStyleId === 2 ? "#F59E0B" : effectiveStyleId === 4 ? "#10B981" : "#8B5CF6",
    });
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(post, effectiveStyleId);
  };

  return (
    <div className="break-inside-avoid mb-5 inline-block w-full select-none">
      {/* 1. Visual Post Graphic with Sleek Seamless Corner Radius & Design System Hover Overlay */}
      <div className="group relative rounded-[14px] overflow-hidden shadow-2xs hover:shadow-md border border-border-default/80 transition-shadow duration-200 bg-surface-base">
        {/* Graphic Surface */}
        <GalleryCanvasGraphic
          post={post}
          styleId={effectiveStyleId}
          aspectRatio={post.aspectRatio}
          isUnrounded={true}
        />

        {/* Design System Hover Overlay with Full-Rounded Tactile Action Pills */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex items-end justify-between pointer-events-none group-hover:pointer-events-auto rounded-[14px]">
          {/* Left Action: Share (Secondary Pill Button) */}
          <button
            type="button"
            onClick={handleShareClick}
            className="h-8 px-3 rounded-full bg-surface-canvas/90 hover:bg-surface-canvas text-brand-primary border border-border-default shadow-xs flex items-center justify-center gap-1.5 transition text-xs font-semibold cursor-pointer active:scale-[0.98]"
          >
            <ShareIcon className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Right Action: Studio / Customize (Primary Pill Button) */}
          <button
            type="button"
            onClick={handleCustomize}
            className="h-8 px-3 rounded-full bg-brand-primary text-surface-canvas hover:opacity-90 font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98]"
          >
            <PencilSquareIcon className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
        </div>
      </div>

      {/* 2. Under-Card Metadata */}
      <div className="pt-2 px-0.5 flex items-center justify-between text-xs">
        <div className="truncate pr-2">
          <span className="font-bold text-brand-primary text-xs truncate block leading-snug">
            {post.productName}
          </span>
          <span className="text-[11px] text-brand-secondary truncate block font-mono">
            {post.title}
          </span>
        </div>

        <span className="text-[11px] font-mono font-bold text-brand-primary shrink-0">
          {post.formattedMetric}
        </span>
      </div>
    </div>
  );
});

SocialPostCard.displayName = "SocialPostCard";
