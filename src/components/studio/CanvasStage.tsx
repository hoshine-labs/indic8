"use client";

import React, { useMemo } from "react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import {
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
} from "@heroicons/react/20/solid";
import { SparklineChart, ChartStyle } from "./SparklineChart";
import { BACKDROP_PRESETS } from "@/lib/constants";
import { BrandIcon } from "@/lib/brandLogos";

export interface StudioCanvasState {
  numericValue: number;
  currencySymbol: string;
  currencyCode: string;
  prefix: string;
  suffix: string;
  metricLabel: string;
  subtext: string;
  companyName: string;
  creatorHandle: string;
  avatarUrl: string;
  backdropId: string;
  customBackdropColor?: string;
  frameType: "keynote" | "browser" | "glass" | "bezel" | "none" | "macos" | "safari" | "card" | "stack" | "stack2" | "arc" | "windows";
  aspectRatio: string;
  ratioStr: string;
  chartStyle: ChartStyle;
  verifiedSource: string;
  templateStyle?: string;
  showGrain: boolean;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  scale: number;
  perspective: number;
  borderRadius: number;
  shadowIntensity: "none" | "spread" | "hug";
  growthDelta: string;
  zoomScale: number;
  accentColor?: string;
  backdropBlur?: number;
}

interface CanvasStageProps {
  state: StudioCanvasState;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  animationProgress?: number;
  onUpdateState?: (updates: Partial<StudioCanvasState>) => void;
}

export function CanvasStage({
  state,
  canvasRef,
  animationProgress = 1,
}: CanvasStageProps) {
  const selectedBackdrop =
    BACKDROP_PRESETS.find((b) => b.id === state.backdropId) ||
    BACKDROP_PRESETS[0];

  const currentNumber = Math.round(
    state.numericValue * Math.min(1, Math.max(0, animationProgress))
  );

  // Compute numeric aspect ratio
  const numericRatio = useMemo(() => {
    try {
      const parts = (state.ratioStr || "16 / 9").split("/").map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] !== 0) {
        return parts[0] / parts[1];
      }
      return 16 / 9;
    } catch {
      return 16 / 9;
    }
  }, [state.ratioStr]);

  const isPortrait = numericRatio < 0.9; // 9:16, 4:5, 2:3, 10:21
  const isUltraWide = numericRatio > 2.0; // 21:9, 3:1, 4:1
  const isSquare = numericRatio >= 0.9 && numericRatio <= 1.15; // 1:1

  const isLightBackdrop =
    state.backdropId === "frosted-pearl" ||
    state.backdropId === "soft-slate-light" ||
    (state.customBackdropColor &&
      (state.customBackdropColor.includes("#FFF") ||
        state.customBackdropColor.includes("#F") ||
        state.customBackdropColor.includes("#E")));

  const textPrimary = isLightBackdrop ? "text-[#1C1E23]" : "text-white";
  const textSecondary = isLightBackdrop ? "text-[#606573]" : "text-[#9DA3B4]";
  const borderSubtle = isLightBackdrop ? "border-black/[0.08]" : "border-white/10";
  const badgeBg = isLightBackdrop ? "bg-black/[0.04] border-black/[0.08] text-[#1C1E23]" : "bg-white/[0.06] border-white/10 text-white/90";

  const bgValue = state.customBackdropColor || selectedBackdrop.background;
  const isImageUrl = bgValue.startsWith("url(");

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
      {/* 3D Spatial Canvas Wrapper */}
      <div
        style={{
          width: "100%",
          maxWidth: isPortrait
            ? "min(400px, 100%)"
            : isUltraWide
              ? "min(960px, 100%)"
              : isSquare
                ? "min(560px, 100%)"
                : "min(880px, 100%)",
          maxHeight: "calc(100vh - 160px)",
          transform: `scale(${state.zoomScale})`,
          transformOrigin: "center center",
          transition: "max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="flex items-center justify-center relative w-full"
      >
        {/* Main Single-Surface Graphic Canvas */}
        <div
          ref={canvasRef}
          style={{
            aspectRatio: state.ratioStr || "16 / 9",
            maxHeight: "calc(100vh - 165px)",
            maxWidth: "100%",
            width: "100%",
            perspective: `${state.perspective}px`,
            borderRadius: state.frameType === "arc" ? "40px" : `${state.borderRadius || 28}px`,
            transition: "aspect-ratio 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.2s ease",
          }}
          className={`relative overflow-hidden flex flex-col justify-between select-none shadow-2xl ${state.frameType === "glass"
              ? isLightBackdrop ? "bg-white/80 cupertino-glass border border-black/10" : "bg-[#111216]/80 cupertino-glass border border-white/15"
              : state.frameType === "arc"
                ? isLightBackdrop ? "border-2 border-black/15" : "border-2 border-white/20"
                : isLightBackdrop ? "border border-black/[0.08]" : "border border-white/[0.08]"
            } ${isUltraWide
              ? "p-3 sm:p-4"
              : isPortrait
                ? "p-5 sm:p-7"
                : isSquare
                  ? "p-5 sm:p-7"
                  : "p-4 sm:p-6 md:p-7"
            }`}
        >
          {/* Isolated Background Layer (seamless blur without scaling jumps) */}
          <div
            className="absolute -inset-6 pointer-events-none z-0"
            style={{
              ...(isImageUrl
                ? {
                  backgroundImage: bgValue,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }
                : {
                  background: bgValue,
                }),
              filter: state.backdropBlur && state.backdropBlur > 0 ? `blur(${state.backdropBlur}px)` : undefined,
            }}
          />

          {/* Subtle Noise / Editorial Grain Overlay */}
          {state.showGrain && (
            <div className="pointer-events-none absolute inset-0 grain-overlay opacity-35 z-0" />
          )}

          {/* MacOS Window Top Header */}
          {state.frameType === "macos" && (
            <div className={`w-full pb-2 border-b flex items-center justify-between shrink-0 relative z-10 ${borderSubtle}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
              </div>
              <div className={`font-mono text-[10px] tracking-tight ${textSecondary}`}>
                {state.companyName || "indic8"}
              </div>
              <div className="w-8" />
            </div>
          )}

          {/* Safari Browser Chrome Header */}
          {(state.frameType === "safari" || state.frameType === "browser") && (
            <div className={`w-full pb-2 border-b flex items-center justify-between shrink-0 relative z-10 ${borderSubtle}`}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
              </div>
              <div className={`px-3 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1.5 border ${isLightBackdrop ? "bg-black/[0.04] border-black/10 text-[#1C1E23]" : "bg-white/[0.06] border-white/10 text-white"
                }`}>
                <GlobeAltIcon className="w-2.5 h-2.5 opacity-70" />
                <span>indic8.live/{state.companyName?.toLowerCase() || "milestone"}</span>
              </div>
              <div className="w-8" />
            </div>
          )}

          {/* Top Brand & Profile Bar */}
          <div className="flex items-center justify-between w-full relative z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              {state.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={state.avatarUrl}
                  alt={state.companyName}
                  className="w-8 h-8 rounded-full object-cover border border-black/10 dark:border-white/15"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] tracking-tight shrink-0 border ${isLightBackdrop
                      ? "bg-black/[0.05] text-[#111215] border-black/10"
                      : "bg-white/[0.08] text-white border-white/15"
                    }`}
                >
                  {state.verifiedSource !== "none" && state.verifiedSource !== "custom" ? (
                    <BrandIcon name={state.verifiedSource} className="w-4 h-4" isDark={!isLightBackdrop} colored={true} />
                  ) : (
                    <span>{state.companyName.charAt(0) || "8"}</span>
                  )}
                </div>
              )}

              <div className="flex flex-col">
                <div className={`font-semibold text-[12.5px] tracking-tight leading-snug flex items-center gap-1.5 ${textPrimary}`}>
                  <span>{state.companyName || "indic8"}</span>
                  {state.verifiedSource !== "none" && (
                    <CheckCircleIcon className={`w-3 h-3 ${isLightBackdrop ? "text-black/60" : "text-white/80"}`} />
                  )}
                </div>
                <span className={`text-[10px] font-mono tracking-tight ${textSecondary}`}>
                  {state.creatorHandle || "@founder"}
                </span>
              </div>
            </div>

            {/* Clean Platform Indicator */}
            {state.verifiedSource !== "none" ? (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${badgeBg}`}>
                {state.verifiedSource !== "custom" && (
                  <BrandIcon name={state.verifiedSource} className="w-3 h-3" colored={true} />
                )}
                <span className="capitalize">{state.verifiedSource === "custom" ? "Verified" : state.verifiedSource}</span>
              </div>
            ) : (
              <div className={`text-[10px] font-mono opacity-60 ${textSecondary}`}>
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>

          {/* Center Focal Point: Dynamic Number & Clean Editorial Hierarchy */}
          <div className={`flex flex-col items-center text-center justify-center my-auto relative z-10 w-full ${isUltraWide
              ? "py-1 gap-0.5"
              : isPortrait
                ? "py-3 sm:py-5 gap-1.5"
                : isSquare
                  ? "py-3 sm:py-4 gap-1"
                  : "py-1.5 sm:py-2.5 gap-0.5 sm:gap-1"
            }`}>
            {/* Optional Growth Delta / Platform Special Badge */}
            {state.growthDelta && (
              <div className="flex items-center gap-2 mb-1">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono border font-semibold ${badgeBg}`}>
                  <ArrowTrendingUpIcon className="w-3 h-3 opacity-80" />
                  <span>{state.growthDelta}</span>
                </div>
                {state.verifiedSource === "producthunt" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#DA552F]/15 border border-[#DA552F]/30 text-[#DA552F]">
                    <span>▲ #1 OF THE DAY</span>
                  </div>
                )}
              </div>
            )}

            {/* NumberFlow Dynamic Counter with NumberFlowGroup coordination */}
            <NumberFlowGroup>
              <div
                className={`font-semibold tracking-tighter leading-none font-mono flex items-baseline justify-center tabular-nums ${textPrimary} ${isUltraWide
                    ? "text-[26px] sm:text-[32px]"
                    : isPortrait
                      ? "text-[34px] sm:text-[44px]"
                      : isSquare
                        ? "text-[38px] sm:text-[48px] md:text-[54px]"
                        : "text-[34px] sm:text-[44px] md:text-[50px]"
                  }`}
              >
                {state.currencyCode !== "RAW" && state.currencySymbol && (
                  <span className="mr-1 opacity-80 select-none shrink-0 text-[0.78em] font-sans font-semibold">
                    {state.currencySymbol}
                  </span>
                )}
                {state.prefix && state.prefix !== state.currencySymbol && (
                  <span className="mr-1 opacity-80 select-none shrink-0 text-[0.78em] font-sans font-semibold">
                    {state.prefix}
                  </span>
                )}
                <NumberFlow
                  value={currentNumber}
                  locales="en-US"
                  className="font-bold tabular-nums"
                  transformTiming={{ duration: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                  spinTiming={{ duration: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                  opacityTiming={{ duration: 250, easing: "ease-out" }}
                />
                {state.suffix && (
                  <span className={`ml-1.5 text-[0.42em] font-sans font-medium tracking-normal shrink-0 ${textSecondary}`}>
                    {state.suffix}
                  </span>
                )}
              </div>
            </NumberFlowGroup>

            {/* Metric Label */}
            <div className={`text-[13px] sm:text-[15px] font-semibold tracking-tight mt-0.5 ${textPrimary}`}>
              {state.metricLabel}
            </div>

            {/* Subtext */}
            {state.subtext && (
              <div className={`text-[10.5px] sm:text-[11.5px] max-w-sm font-normal leading-relaxed opacity-75 ${textSecondary}`}>
                {state.subtext}
              </div>
            )}

            {/* Minimal Sparkline Visualizer */}
            {state.chartStyle !== "none" && (
              <div className={`w-full shrink-0 ${isUltraWide
                  ? "max-w-[170px] mt-1 h-6"
                  : isPortrait
                    ? "max-w-[220px] mt-3 h-8 sm:h-10"
                    : isSquare
                      ? "max-w-[240px] mt-2.5 h-8 sm:h-9"
                      : "max-w-[220px] sm:max-w-[250px] mt-1.5 sm:mt-2 h-7 sm:h-8"
                }`}>
                <SparklineChart
                  style={state.chartStyle}
                  theme={isLightBackdrop ? "light" : "obsidian"}
                  progress={animationProgress}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
