"use client";

import React, { useState, useRef } from "react";
import { useIndic8Store } from "@/lib/indic8Store";
import { BrandIcon } from "@/lib/brandLogos";
import { Card } from "@/components/ui";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import confetti from "canvas-confetti";
import {
  ArrowDownTrayIcon,
  ArchiveBoxIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/20/solid";

interface ExportFormatOption {
  id: string;
  name: string;
  ratio: string;
  ratioStr: string;
  platform: string;
  brandName?: string;
  useMobileIcon?: boolean;
  filename: string;
}

export const BatchExportModal: React.FC = () => {
  const {
    isBatchExportOpen,
    setIsBatchExportOpen,
    activeExportPreset,
  } = useIndic8Store();

  const [selectedFormatIds, setSelectedFormatIds] = useState<string[]>([
    "x-landscape",
    "ig-square",
    "story-reels",
    "linkedin-landscape",
  ]);
  const [isPackaging, setIsPackaging] = useState(false);
  const [activePreviewRatio, setActivePreviewRatio] = useState<string>("16 / 9");

  const previewCardRef = useRef<HTMLDivElement>(null);

  if (!isBatchExportOpen || !activeExportPreset) return null;

  const exportFormats: ExportFormatOption[] = [
    {
      id: "x-landscape",
      name: "X / Twitter Banner",
      ratio: "16:9",
      ratioStr: "16 / 9",
      platform: "X / Twitter",
      brandName: "twitter",
      filename: "revenue-milestone-x.png",
    },
    {
      id: "ig-square",
      name: "Instagram Square",
      ratio: "1:1",
      ratioStr: "1 / 1",
      platform: "Instagram",
      brandName: "instagram",
      filename: "revenue-milestone-instagram.png",
    },
    {
      id: "story-reels",
      name: "Stories & Reels",
      ratio: "9:16",
      ratioStr: "9 / 16",
      platform: "Stories / Reels",
      useMobileIcon: true,
      filename: "revenue-milestone-story.png",
    },
    {
      id: "linkedin-landscape",
      name: "LinkedIn Post",
      ratio: "16:9",
      ratioStr: "16 / 9",
      platform: "LinkedIn",
      brandName: "linkedin",
      filename: "revenue-milestone-linkedin.png",
    },
  ];

  const toggleFormat = (id: string) => {
    if (selectedFormatIds.includes(id)) {
      if (selectedFormatIds.length > 1) {
        setSelectedFormatIds(selectedFormatIds.filter((f) => f !== id));
      }
    } else {
      setSelectedFormatIds([...selectedFormatIds, id]);
    }
  };

  const handleExportSinglePNG = async () => {
    if (!previewCardRef.current) return;
    try {
      setIsPackaging(true);
      const dataUrl = await toPng(previewCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `indic8-${activeExportPreset.title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error("Export error", err);
    } finally {
      setIsPackaging(false);
    }
  };

  const handleExportZipPackage = async () => {
    if (!previewCardRef.current) return;
    try {
      setIsPackaging(true);
      const zip = new JSZip();

      const dataUrl = await toPng(previewCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");

      selectedFormatIds.forEach((id) => {
        const formatObj = exportFormats.find((f) => f.id === id);
        if (formatObj) {
          zip.file(formatObj.filename, base64Data, { base64: true });
        }
      });

      const copyContent = `indic8 Verified Milestone Social Copy
Title: ${activeExportPreset.title}
Metric: ${activeExportPreset.currencySymbol}${activeExportPreset.numericValue.toLocaleString()}${activeExportPreset.suffix}
Verified Gateway: ${activeExportPreset.verifiedSource}

=== Minimal Copy ===
${activeExportPreset.socialCopy.minimal}

=== Story-Driven Copy ===
${activeExportPreset.socialCopy.story}

=== Founder-Style Copy ===
${activeExportPreset.socialCopy.founder}
`;
      zip.file("social-copy.txt", copyContent);

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `indic8-${activeExportPreset.title.toLowerCase().replace(/\s+/g, "-")}-package.zip`;
      link.click();

      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error("ZIP Generation error", err);
    } finally {
      setIsPackaging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <Card className="w-full max-w-2xl border border-border-default bg-surface-base p-6 space-y-5 max-h-[95vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ArrowDownTrayIcon className="w-4 h-4 text-brand-primary" />
              <h3 className="text-base font-bold text-brand-primary">
                Export Graphic Package
              </h3>
            </div>
            <p className="text-xs text-brand-secondary mt-0.5">
              Render authentic milestone graphics for X, Instagram, LinkedIn, and Stories.
            </p>
          </div>

          <button
            onClick={() => setIsBatchExportOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-primary hover:bg-surface-subtle transition cursor-pointer"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Live Graphic Stage Preview */}
        <div className="flex justify-center p-5 rounded-xl bg-surface-canvas border border-border-default overflow-hidden">
          <div
            ref={previewCardRef}
            style={{ aspectRatio: activePreviewRatio }}
            className="w-full max-w-sm p-6 rounded-xl bg-gradient-to-br from-[#121316] to-[#0A0A0C] border border-white/10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-white/90">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                <BrandIcon
                  name={activeExportPreset.verifiedSource}
                  className="w-3 h-3"
                  colored={true}
                />
                <span className="capitalize">
                  {activeExportPreset.verifiedSource}
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                indic8
              </span>
            </div>

            <div className="my-4 text-center space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                {activeExportPreset.metricLabel}
              </span>
              <div className="text-3xl font-extrabold tracking-tight text-white">
                {activeExportPreset.currencySymbol}
                {activeExportPreset.numericValue.toLocaleString()}
                {activeExportPreset.suffix}
              </div>
              <div className="text-[11px] text-white/70">
                {activeExportPreset.subtext}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-white/50">
              <span>{activeExportPreset.growthDelta}</span>
              <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Formats Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-brand-muted tracking-wider block">
            Target Aspect Ratios:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {exportFormats.map((format) => {
              const isSelected = selectedFormatIds.includes(format.id);
              return (
                <div
                  key={format.id}
                  onClick={() => {
                    toggleFormat(format.id);
                    setActivePreviewRatio(format.ratioStr);
                  }}
                  className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? "bg-surface-subtle border-brand-dark text-brand-primary"
                      : "bg-surface-base border-border-default text-brand-secondary hover:text-brand-primary"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-surface-base border border-border-default flex items-center justify-center">
                      {format.useMobileIcon ? (
                        <DevicePhoneMobileIcon className="w-4 h-4 text-brand-primary" />
                      ) : (
                        <BrandIcon name={format.brandName || "twitter"} className="w-4 h-4" colored={true} />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{format.name}</div>
                      <div className="text-[10px] text-brand-muted">{format.ratio}</div>
                    </div>
                  </div>

                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                      isSelected
                        ? "bg-brand-primary text-surface-canvas"
                        : "border border-border-default"
                    }`}
                  >
                    {isSelected && <CheckIcon className="w-3 h-3 text-surface-canvas" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-border-default pt-3">
          <button
            onClick={handleExportSinglePNG}
            disabled={isPackaging}
            className="px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-light text-brand-primary font-semibold text-xs border border-border-default active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchExportOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-secondary hover:text-brand-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExportZipPackage}
              disabled={isPackaging || selectedFormatIds.length === 0}
              className="px-4 py-1.5 rounded-lg bg-brand-primary text-surface-canvas font-semibold text-xs hover:bg-brand-darker active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <ArchiveBoxIcon className="w-3.5 h-3.5" />
              <span>
                {isPackaging ? "Packaging..." : `Export ZIP (${selectedFormatIds.length})`}
              </span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
