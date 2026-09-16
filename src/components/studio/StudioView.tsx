"use client";

import React, { useState, useRef, useEffect } from "react";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { LeftPresetPanel, PlatformPresetItem } from "@/components/studio/LeftPresetPanel";
import { RightPropertyPanel } from "@/components/studio/RightPropertyPanel";
import {
  CanvasStage,
  StudioCanvasState,
} from "@/components/studio/CanvasStage";
import { FloatingControlDock } from "@/components/studio/FloatingControlDock";
import { LayoutPreset } from "@/lib/constants";
import { MilestoneTemplate, FormatPreset } from "@/lib/platforms";
import { useIndic8Store } from "@/lib/indic8Store";
import { LocalPreferences } from "@/lib/storage/localPreferences";
import { toPng } from "html-to-image";
import confetti from "canvas-confetti";

export const StudioView: React.FC = () => {
  const { studioLoadedMilestone } = useIndic8Store();

  const [projectTitle, setProjectTitle] = useState(() =>
    studioLoadedMilestone ? studioLoadedMilestone.metricLabel : "Milestone Announcement"
  );
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Core Studio State with initial milestone hydration
  const [canvasState, setCanvasState] = useState<StudioCanvasState>(() => {
    const customAvatar = typeof window !== "undefined" ? LocalPreferences.get("customAvatarUrl") : "";
    const customName = typeof window !== "undefined" ? LocalPreferences.get("customDisplayName") : "";
    return {
      numericValue: studioLoadedMilestone?.numericValue ?? 100000,
      currencySymbol: studioLoadedMilestone?.currencySymbol ?? "$",
      currencyCode: studioLoadedMilestone?.currencyCode ?? "USD",
      prefix: studioLoadedMilestone?.prefix ?? "",
      suffix: studioLoadedMilestone?.suffix ?? " ARR",
      metricLabel: studioLoadedMilestone?.metricLabel ?? "Annual Recurring Revenue",
      subtext: studioLoadedMilestone?.subtext ?? "First 6-figure milestone unlocked",
      companyName: customName || "indic8",
      creatorHandle: customName ? `@${customName.toLowerCase().replace(/\s+/g, "")}` : "@founder",
      avatarUrl: customAvatar || "",
      backdropId: studioLoadedMilestone?.backdropId ?? "midnight-obsidian",
      frameType: "keynote",
      aspectRatio: "16:9",
      ratioStr: "16 / 9",
      chartStyle: "wave",
      verifiedSource: studioLoadedMilestone?.verifiedSource ?? "stripe",
      templateStyle: "stripe-card",
      showGrain: true,
      tiltX: 0,
      tiltY: 0,
      tiltZ: 0,
      scale: 1,
      perspective: 1000,
      borderRadius: 24,
      shadowIntensity: "spread",
      growthDelta: studioLoadedMilestone?.growthDelta ?? "+124% YoY",
      zoomScale: 1.0,
      accentColor: studioLoadedMilestone?.accentColor ?? "#635BFF",
      backdropBlur: 0,
    };
  });

  useEffect(() => {
    const handleProfileUpdate = () => {
      const customAvatar = LocalPreferences.get("customAvatarUrl");
      const customName = LocalPreferences.get("customDisplayName");
      if (customAvatar) {
        setCanvasState((prev) => ({
          ...prev,
          avatarUrl: customAvatar,
          ...(customName ? { companyName: customName, creatorHandle: `@${customName.toLowerCase().replace(/\s+/g, "")}` } : {}),
        }));
      }
    };
    window.addEventListener("indic8_profile_updated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);
    return () => {
      window.removeEventListener("indic8_profile_updated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, []);

  // Timeline / Motion Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(3.0);
  const [speed, setSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [is3DActive, setIs3DActive] = useState(false);
  const duration = 3.0;

  const canvasRef = useRef<HTMLDivElement>(null);

  // Playback loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp: number | null = null;

    const tick = (timestamp: number) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      setCurrentTime((prev) => {
        const nextTime = prev + delta * speed;
        if (nextTime >= duration) {
          if (isLooping) {
            return 0;
          } else {
            setIsPlaying(false);
            return duration;
          }
        }
        return nextTime;
      });

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, speed, isLooping, duration]);

  const handleUpdateCanvasState = (updates: Partial<StudioCanvasState>) => {
    setCanvasState((prev) => ({ ...prev, ...updates }));
  };

  const handleApplyLayout = (layout: LayoutPreset) => {
    setCanvasState((prev) => ({
      ...prev,
      tiltX: layout.tiltX,
      tiltY: layout.tiltY,
      tiltZ: layout.tiltZ,
      scale: layout.scale,
      perspective: layout.perspective,
      frameType: layout.frameType,
    }));
    setIs3DActive(layout.tiltX !== 0 || layout.tiltY !== 0);
  };

  const handleApplyTemplate = (template: MilestoneTemplate | PlatformPresetItem) => {
    setCanvasState((prev) => ({
      ...prev,
      numericValue: template.numericValue,
      currencySymbol: template.currencySymbol,
      currencyCode: template.currencyCode,
      prefix: template.prefix,
      suffix: template.suffix,
      metricLabel: template.metricLabel,
      subtext: template.subtext,
      growthDelta: template.growthDelta,
      verifiedSource: template.verifiedSource,
      chartStyle: template.chartStyle,
      ...(("templateStyle" in template) && template.templateStyle ? { templateStyle: template.templateStyle } : {}),
      ...(("backdropId" in template) && template.backdropId ? { backdropId: template.backdropId } : {}),
      ...(("frameType" in template) && template.frameType ? { frameType: template.frameType } : {}),
      ...(("accentColor" in template) && template.accentColor ? { accentColor: template.accentColor } : {}),
      ...(("companyName" in template) && template.companyName ? { companyName: template.companyName } : {}),
      ...(("creatorHandle" in template) && template.creatorHandle ? { creatorHandle: template.creatorHandle } : {}),
    }));

    setCurrentTime(duration);
    setIsPlaying(false);
  };

  const handleSelectFormat = (format: FormatPreset) => {
    setCanvasState((prev) => ({
      ...prev,
      aspectRatio: format.aspectRatio,
      ratioStr: format.ratioStr,
    }));
  };

  const handleToggle3D = () => {
    if (is3DActive) {
      setCanvasState((prev) => ({
        ...prev,
        tiltX: 0,
        tiltY: 0,
        tiltZ: 0,
        scale: 1,
      }));
      setIs3DActive(false);
    } else {
      setCanvasState((prev) => ({
        ...prev,
        tiltX: 12,
        tiltY: -18,
        tiltZ: 6,
        scale: 0.95,
      }));
      setIs3DActive(true);
    }
  };

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      const cleanName = canvasState.companyName.toLowerCase().replace(/\s+/g, "-");
      link.download = `indic8-${cleanName}-${canvasState.numericValue}.png`;
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyGraphic = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const animationProgress = Math.min(1, Math.max(0, currentTime / duration));

  return (
    <div className="h-full w-full flex flex-col justify-between overflow-hidden bg-surface-canvas text-brand-primary select-none">
      {/* Studio Header */}
      <StudioHeader
        projectTitle={projectTitle}
        onTitleChange={setProjectTitle}
        zoomScale={canvasState.zoomScale}
        onZoomChange={(zoom) => handleUpdateCanvasState({ zoomScale: zoom })}
        onApplyTemplate={handleApplyTemplate}
        onOpenAuthModal={() => {}}
        onExportPng={handleExportPng}
        onCopyGraphic={handleCopyGraphic}
        isExporting={isExporting}
        copied={copied}
      />

      {/* Studio Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative max-md:flex-col max-md:overflow-y-auto">
        {/* Left Platform & Format Panel */}
        <div className="max-md:hidden shrink-0">
          <LeftPresetPanel
            state={canvasState}
            onApplyLayout={handleApplyLayout}
            onApplyTemplate={handleApplyTemplate}
            onSelectFormat={handleSelectFormat}
            onFrameTypeChange={(frame) =>
              handleUpdateCanvasState({ frameType: frame })
            }
          />
        </div>

        {/* Center Viewport Stage */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto relative bg-surface-canvas min-w-0">
          <div className="flex-1 flex items-center justify-center min-h-[380px] p-2">
            <CanvasStage
              state={canvasState}
              canvasRef={canvasRef}
              animationProgress={animationProgress}
              onUpdateState={handleUpdateCanvasState}
            />
          </div>

          {/* Floating Player Dock with Scrubber */}
          <FloatingControlDock
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onReset={() => {
              setCurrentTime(0);
              setIsPlaying(false);
            }}
            currentTime={currentTime}
            duration={duration}
            onSeek={(t) => {
              setCurrentTime(t);
              setIsPlaying(false);
            }}
            onToggle3D={handleToggle3D}
            speed={speed}
            onSpeedChange={setSpeed}
            isLooping={isLooping}
            onToggleLoop={() => setIsLooping(!isLooping)}
          />
        </div>

        {/* Right Properties Inspector */}
        <div className="max-md:w-full max-md:h-auto shrink-0">
          <RightPropertyPanel
            state={canvasState}
            onChange={handleUpdateCanvasState}
          />
        </div>
      </div>
    </div>
  );
};
