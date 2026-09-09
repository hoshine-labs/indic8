"use client";

import React, { useState, useRef, useMemo } from "react";
import { toPng, toBlob } from "html-to-image";
import { SocialPostData, PostStyleId } from "./types";
import { GalleryCanvasGraphic } from "./GalleryCanvasGraphic";
import { useIndic8Store } from "@/lib/indic8Store";
import { BrandIcon } from "@/lib/brandLogos";
import { AnimatedTabs } from "@/components/ui/Tabs";
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";

export interface FormatPresetItem {
  id: string;
  name: string;
  platform: "General" | "Instagram" | "X" | "TikTok";
  aspectRatio: string;
  ratioStr: string;
  width: number;
  height: number;
  span?: 1 | 2;
}

export interface PlatformFormatGroupItem {
  name: string;
  icon: string;
  formats: FormatPresetItem[];
}

const COMMON_RATIOS: FormatPresetItem[] = [
  { id: "auto", name: "Auto", platform: "General", aspectRatio: "Auto", ratioStr: "4 / 5", width: 1080, height: 1350, span: 1 },
  { id: "1-1", name: "Square", platform: "General", aspectRatio: "1:1", ratioStr: "1 / 1", width: 1080, height: 1080, span: 1 },
  { id: "4-5", name: "Portrait", platform: "General", aspectRatio: "4:5", ratioStr: "4 / 5", width: 1080, height: 1350, span: 1 },
  { id: "4-3", name: "Standard", platform: "General", aspectRatio: "4:3", ratioStr: "4 / 3", width: 1200, height: 900, span: 1 },
  { id: "3-2", name: "Classic", platform: "General", aspectRatio: "3:2", ratioStr: "3 / 2", width: 1200, height: 800, span: 1 },
  { id: "9-16", name: "Vertical", platform: "General", aspectRatio: "9:16", ratioStr: "9 / 16", width: 1080, height: 1920, span: 1 },
  { id: "16-9", name: "Widescreen", platform: "General", aspectRatio: "16:9", ratioStr: "16 / 9", width: 1920, height: 1080, span: 2 },
  { id: "21-9", name: "Ultrawide", platform: "General", aspectRatio: "21:9", ratioStr: "21 / 9", width: 2560, height: 1080, span: 2 },
];

const PLATFORM_GROUPS: PlatformFormatGroupItem[] = [
  {
    name: "Instagram",
    icon: "instagram",
    formats: [
      { id: "ig-square", name: "Square Post", platform: "Instagram", aspectRatio: "1:1", ratioStr: "1 / 1", width: 1080, height: 1080, span: 1 },
      { id: "ig-portrait", name: "Portrait Post", platform: "Instagram", aspectRatio: "4:5", ratioStr: "4 / 5", width: 1080, height: 1350, span: 1 },
      { id: "ig-story", name: "Story / Reel", platform: "Instagram", aspectRatio: "9:16", ratioStr: "9 / 16", width: 1080, height: 1920, span: 1 },
      { id: "ig-landscape", name: "Landscape Post", platform: "Instagram", aspectRatio: "16:9", ratioStr: "16 / 9", width: 1920, height: 1080, span: 2 },
    ],
  },
  {
    name: "X (Twitter)",
    icon: "x",
    formats: [
      { id: "x-post", name: "Tweet Image", platform: "X", aspectRatio: "16:9", ratioStr: "16 / 9", width: 1920, height: 1080, span: 2 },
      { id: "x-header", name: "Header Photo", platform: "X", aspectRatio: "3:1", ratioStr: "3 / 1", width: 1500, height: 500, span: 2 },
      { id: "x-avatar", name: "Profile Photo", platform: "X", aspectRatio: "1:1", ratioStr: "1 / 1", width: 1080, height: 1080, span: 1 },
    ],
  },
  {
    name: "TikTok",
    icon: "tiktok",
    formats: [
      { id: "tt-post", name: "Post", platform: "TikTok", aspectRatio: "9:16", ratioStr: "9 / 16", width: 1080, height: 1920, span: 1 },
      { id: "tt-photos", name: "Photos", platform: "TikTok", aspectRatio: "1:1", ratioStr: "1 / 1", width: 1080, height: 1080, span: 1 },
    ],
  },
];

interface ShareExportModalProps {
  post: SocialPostData | null;
  styleId?: PostStyleId;
  isOpen: boolean;
  onClose: () => void;
  onStyleChange?: (postId: string, styleId: PostStyleId) => void;
}

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  const { loadMilestoneIntoStudio } = useIndic8Store();
  
  // Active Aspect Ratio string (Default: 4:5 Portrait)
  const [selectedRatio, setSelectedRatio] = useState<string>("4:5");
  const [selectedName, setSelectedName] = useState<string>("Portrait");
  const [search, setSearch] = useState("");
  const [quality, setQuality] = useState<1 | 2 | 3 | 4>(1); // Default 1x
  const [isExporting, setIsExporting] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Search filtering
  const filteredCommon = useMemo(() => {
    if (!search.trim()) return COMMON_RATIOS;
    const query = search.toLowerCase();
    return COMMON_RATIOS.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.aspectRatio.toLowerCase().includes(query)
    );
  }, [search]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return PLATFORM_GROUPS;
    const query = search.toLowerCase();

    return PLATFORM_GROUPS.map((group) => {
      const groupMatches = group.name.toLowerCase().includes(query);
      const matchedFormats = group.formats.filter(
        (f) =>
          groupMatches ||
          f.name.toLowerCase().includes(query) ||
          f.aspectRatio.toLowerCase().includes(query) ||
          f.platform.toLowerCase().includes(query)
      );
      return {
        ...group,
        formats: matchedFormats,
      };
    }).filter((g) => g.formats.length > 0);
  }, [search]);

  // Viewport dimensions for crisp stage display
  const stageStyles = useMemo(() => {
    switch (selectedRatio) {
      case "9:16":
        return { width: "215px", height: "382px", ratioStr: "9 / 16" };
      case "16:9":
        return { width: "380px", height: "214px", ratioStr: "16 / 9" };
      case "21:9":
        return { width: "390px", height: "165px", ratioStr: "21 / 9" };
      case "3:1":
        return { width: "390px", height: "130px", ratioStr: "3 / 1" };
      case "4:3":
        return { width: "340px", height: "255px", ratioStr: "4 / 3" };
      case "3:2":
        return { width: "340px", height: "226px", ratioStr: "3 / 2" };
      case "1:1":
        return { width: "290px", height: "290px", ratioStr: "1 / 1" };
      case "4:5":
      case "Auto":
      default:
        return { width: "270px", height: "338px", ratioStr: "4 / 5" };
    }
  }, [selectedRatio]);

  // Base Pixel Dimensions Calculation
  const baseDimensions = useMemo(() => {
    switch (selectedRatio) {
      case "4:5":
        return { width: 1080, height: 1350 };
      case "1:1":
        return { width: 1080, height: 1080 };
      case "9:16":
        return { width: 1080, height: 1920 };
      case "16:9":
        return { width: 1920, height: 1080 };
      case "4:3":
        return { width: 1200, height: 900 };
      case "3:2":
        return { width: 1200, height: 800 };
      case "21:9":
        return { width: 2560, height: 1080 };
      case "3:1":
        return { width: 1500, height: 500 };
      default:
        return { width: 1080, height: 1350 };
    }
  }, [selectedRatio]);

  const outputDimensions = useMemo(() => {
    return {
      width: baseDimensions.width * quality,
      height: baseDimensions.height * quality,
    };
  }, [baseDimensions, quality]);

  if (!isOpen || !post) return null;

  // Format selection handler
  const handleSelectFormat = (format: FormatPresetItem) => {
    const actualRatio = format.aspectRatio === "Auto" ? "4:5" : format.aspectRatio;
    setSelectedRatio(actualRatio);
    setSelectedName(format.name);
  };

  // Direct Vector SVG High-Resolution Rasterization Helpers
  const getHighResPngDataUrl = async (targetWidth: number, targetHeight: number): Promise<string> => {
    if (!previewRef.current) throw new Error("No preview ref");
    const svgElement = previewRef.current.querySelector("svg");
    if (!svgElement) {
      return toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: quality * 2,
        quality: 1,
      });
    }

    try {
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute("width", targetWidth.toString());
      svgClone.setAttribute("height", targetHeight.toString());

      // Convert any non-data images to data URI to avoid tainting canvas
      const images = Array.from(svgClone.querySelectorAll("image"));
      for (const imgEl of images) {
        const href = imgEl.getAttribute("href") || imgEl.getAttribute("xlink:href");
        if (href && !href.startsWith("data:")) {
          try {
            const res = await fetch(href, { mode: "cors" });
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            imgEl.setAttribute("href", dataUrl);
          } catch {
            // If CORS restricts fetch, remove the external href to avoid tainting
            imgEl.removeAttribute("href");
            imgEl.removeAttribute("xlink:href");
          }
        }
      }

      const svgString = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext("2d", { alpha: false });
            if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error("Canvas context unavailable"));
              return;
            }
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.fillStyle = "#F2F2F2";
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const dataUrl = canvas.toDataURL("image/png", 1.0);
            URL.revokeObjectURL(url);
            resolve(dataUrl);
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };
        img.src = url;
      });
    } catch {
      // Safe fallback to html-to-image
      return toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: quality * 2,
        quality: 1,
      });
    }
  };

  const getHighResPngBlob = async (targetWidth: number, targetHeight: number): Promise<Blob> => {
    if (!previewRef.current) throw new Error("No preview ref");
    const svgElement = previewRef.current.querySelector("svg");
    if (!svgElement) {
      const b = await toBlob(previewRef.current, {
        cacheBust: true,
        pixelRatio: quality * 2,
        quality: 1,
      });
      if (b) return b;
      throw new Error("Failed to generate blob");
    }

    try {
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute("width", targetWidth.toString());
      svgClone.setAttribute("height", targetHeight.toString());

      // Convert any non-data images to data URI to avoid tainting canvas
      const images = Array.from(svgClone.querySelectorAll("image"));
      for (const imgEl of images) {
        const href = imgEl.getAttribute("href") || imgEl.getAttribute("xlink:href");
        if (href && !href.startsWith("data:")) {
          try {
            const res = await fetch(href, { mode: "cors" });
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            imgEl.setAttribute("href", dataUrl);
          } catch {
            imgEl.removeAttribute("href");
            imgEl.removeAttribute("xlink:href");
          }
        }
      }

      const svgString = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext("2d", { alpha: false });
            if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error("Canvas context unavailable"));
              return;
            }
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.fillStyle = "#F2F2F2";
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(url);
                if (blob) resolve(blob);
                else reject(new Error("Blob generation failed"));
              },
              "image/png",
              1.0
            );
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };
        img.src = url;
      });
    } catch {
      // Safe fallback to html-to-image
      const b = await toBlob(previewRef.current, {
        cacheBust: true,
        pixelRatio: quality * 2,
        quality: 1,
      });
      if (b) return b;
      throw new Error("Failed to generate blob");
    }
  };

  // Download High-Resolution PNG
  const handleDownload = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const targetW = outputDimensions.width;
      const targetH = outputDimensions.height;
      const dataUrl = await getHighResPngDataUrl(targetW, targetH);
      const link = document.createElement("a");
      const cleanName = post.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const cleanRatio = selectedRatio.replace(/[^a-z0-9]+/gi, "x");
      link.download = `${cleanName}-${cleanRatio}-${quality}x-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.warn("Export download failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image directly to Clipboard
  const handleCopyImage = async () => {
    if (!previewRef.current || isCopyingImage) return;
    setIsCopyingImage(true);
    try {
      const targetW = outputDimensions.width;
      const targetH = outputDimensions.height;
      const blob = await getHighResPngBlob(targetW, targetH);
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2200);
      }
    } catch (err) {
      console.warn("Copy image failed:", err);
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Open in Canvas Studio
  const handleCustomizeInStudio = () => {
    loadMilestoneIntoStudio({
      numericValue: post.metricValue,
      metricLabel: post.formattedMetric,
      currencyCode: post.currency,
      currencySymbol: post.currencySymbol,
      subtext: post.subtitle,
      verifiedSource: post.provider,
      growthDelta: post.growthDelta,
      accentColor: "#3754F6",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200">
      {/* Fixed Dimension Modal Shell */}
      <div
        className="relative w-full max-w-[980px] h-[640px] flex flex-col rounded-[24px] border border-border-default bg-surface-canvas shadow-2xl overflow-hidden text-brand-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border-default shrink-0">
          <div>
            <h3 className="text-base font-bold text-brand-primary tracking-tight">
              Export Graphic
            </h3>
            <p className="text-xs text-brand-secondary">
              Select resolution, choose pixel density, and download production-ready announcement graphics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle transition cursor-pointer"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Partition Fixed Layout */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          
          {/* Left Partition: Visual Preview Stage */}
          <div className="w-full lg:w-[450px] h-full bg-surface-base/70 p-6 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-border-default shrink-0 overflow-hidden relative">
            
            {/* Center Viewport Container */}
            <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
              <div
                style={{
                  width: stageStyles.width,
                  height: stageStyles.height,
                  aspectRatio: stageStyles.ratioStr,
                }}
                className="relative bg-[#F2F2F2] shadow-2xl overflow-hidden rounded-none transition-all duration-250 ease-out flex items-center justify-center"
              >
                <div ref={previewRef} className="w-full h-full">
                  <GalleryCanvasGraphic
                    post={post}
                    aspectRatio={selectedRatio as any}
                    isUnrounded={true}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>

            {/* Bottom-Pinned Dimension Detail Badge */}
            <div className="pt-3 pb-1 shrink-0">
              <div className="flex items-center gap-2 text-[11px] font-mono text-brand-secondary bg-surface-canvas px-3.5 py-1.5 rounded-full border border-border-default shadow-xs">
                <span className="font-bold text-brand-primary">{selectedRatio}</span>
                <span className="text-border-default">•</span>
                <span className="font-medium text-brand-primary">
                  {outputDimensions.width} × {outputDimensions.height} px
                </span>
                <span className="text-border-default">•</span>
                <span className="text-brand-muted">{quality}x {selectedName}</span>
              </div>
            </div>
          </div>

          {/* Right Partition: Format Cards Grid + Quality Tabs + Actions */}
          <div className="flex-1 h-full p-5 overflow-hidden flex flex-col justify-between space-y-3">
            
            {/* 1. Full-Rounded Search Header */}
            <div className="flex items-center border border-border-default rounded-full px-3.5 py-1 bg-surface-subtle/60 hover:bg-surface-subtle focus-within:bg-surface-canvas focus-within:border-brand-primary transition shrink-0">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
              <input
                type="text"
                className="flex h-7 rounded-full text-xs placeholder:text-brand-secondary w-full border-none bg-transparent px-2 text-ellipsis outline-none text-brand-primary"
                placeholder="Search formats, resolutions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex items-center justify-center rounded-full size-5 shrink-0 text-brand-secondary hover:text-brand-primary"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. 5-Column Responsive Grid with Clean Clean Subtitles */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 [scrollbar-width:thin]">
              <div
                dir="ltr"
                role="radiogroup"
                className="justify-center select-none grid grid-cols-5 items-start gap-1"
                tabIndex={0}
                style={{ outline: "none" }}
              >
                {/* Common Formats */}
                {filteredCommon.map((format) => {
                  const isSelected =
                    selectedRatio === format.aspectRatio ||
                    (format.id === "auto" && selectedRatio === "4:5");

                  if (format.id === "auto") {
                    return (
                      <button
                        key={format.id}
                        type="button"
                        data-state={isSelected ? "on" : "off"}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectFormat(format)}
                        className={`items-center text-sm font-medium transition-all group flex h-fit flex-col justify-between gap-1 rounded-[12px] p-1 cursor-pointer ${
                          isSelected
                            ? "bg-surface-subtle text-brand-primary ring-1 ring-border-default/60 shadow-2xs"
                            : "bg-transparent hover:bg-surface-subtle/50 text-brand-secondary"
                        }`}
                        style={{ gridColumn: "span 1 / span 1" }}
                      >
                        <div className="flex w-full flex-1 items-center justify-center">
                          <div
                            className={`grid flex-1 place-content-center rounded-[8px] border transition-all ${
                              isSelected
                                ? "border-transparent bg-brand-primary text-surface-canvas shadow-xs font-bold"
                                : "border-border-default bg-surface-subtle/40 text-brand-secondary group-hover:bg-surface-subtle/90 group-hover:border-border-hover group-hover:text-brand-primary"
                            }`}
                            style={{ aspectRatio: "16 / 9" }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-proportions"
                              aria-hidden="true"
                            >
                              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                              <path d="M12 9v11"></path>
                              <path d="M2 9h13a2 2 0 0 1 2 2v9"></path>
                            </svg>
                          </div>
                        </div>
                        <div className="text-[11px] font-medium text-brand-secondary group-data-[state=on]:text-brand-primary text-center truncate w-full px-0.5">
                          Auto
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={format.id}
                      type="button"
                      data-state={isSelected ? "on" : "off"}
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelectFormat(format)}
                      className={`items-center text-sm font-medium transition-all group flex h-fit flex-col justify-between gap-1 rounded-[12px] p-1 cursor-pointer ${
                        isSelected
                          ? "bg-surface-subtle text-brand-primary ring-1 ring-border-default/60 shadow-2xs"
                          : "bg-transparent hover:bg-surface-subtle/50 text-brand-secondary"
                      }`}
                      style={{
                        gridColumn: `span ${format.span || 1} / span ${format.span || 1}`,
                      }}
                    >
                      <div className="flex w-full flex-1 items-center justify-center">
                        <div
                          className={`grid flex-1 place-content-center rounded-[8px] border text-[11px] font-mono transition-all ${
                            isSelected
                              ? "border-transparent bg-brand-primary text-surface-canvas font-bold shadow-xs"
                              : "border-border-default bg-surface-subtle/40 text-brand-secondary font-medium group-hover:bg-surface-subtle/90 group-hover:border-border-hover group-hover:text-brand-primary"
                          }`}
                          style={{ aspectRatio: format.ratioStr }}
                        >
                          {format.aspectRatio}
                        </div>
                      </div>
                      <div className="w-full px-0.5 text-[11px] font-medium text-brand-secondary group-data-[state=on]:text-brand-primary text-center truncate">
                        {format.name}
                      </div>
                    </button>
                  );
                })}

                {/* Essential Platform Groups with Logos */}
                {filteredGroups.map((group) => (
                  <div
                    key={group.name}
                    className="col-span-5 py-2 first-of-type:pt-1 last-of-type:pb-0"
                  >
                    {/* Platform Header */}
                    <div className="flex items-center gap-1.5 px-1 py-1 text-xs font-semibold text-brand-primary">
                      <BrandIcon
                        name={group.icon || group.name}
                        className="w-3.5 h-3.5 shrink-0"
                        colored={true}
                      />
                      <span>{group.name}</span>
                    </div>

                    {/* Platform Format Buttons */}
                    <div className="grid grid-cols-5 gap-1 mt-0.5">
                      {group.formats.map((format) => {
                        const isSelected = selectedRatio === format.aspectRatio;

                        return (
                          <button
                            key={format.id}
                            type="button"
                            data-state={isSelected ? "on" : "off"}
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleSelectFormat(format)}
                            className={`items-center text-sm font-medium transition-all group flex h-fit flex-col justify-between gap-1 rounded-[12px] p-1 cursor-pointer ${
                              isSelected
                                ? "bg-surface-subtle text-brand-primary ring-1 ring-border-default/60 shadow-2xs"
                                : "bg-transparent hover:bg-surface-subtle/50 text-brand-secondary"
                            }`}
                            style={{
                              gridColumn: `span ${format.span || 1} / span ${format.span || 1}`,
                            }}
                          >
                            <div className="flex w-full flex-1 items-center justify-center">
                              <div
                                className={`grid flex-1 place-content-center rounded-[8px] border text-[11px] font-mono transition-all ${
                                  isSelected
                                    ? "border-transparent bg-brand-primary text-surface-canvas font-bold shadow-xs"
                                    : "border-border-default bg-surface-subtle/40 text-brand-secondary font-medium group-hover:bg-surface-subtle/90 group-hover:border-border-hover group-hover:text-brand-primary"
                                }`}
                                style={{ aspectRatio: format.ratioStr }}
                              >
                                {format.aspectRatio}
                              </div>
                            </div>
                            <div className="w-full px-0.5 text-[11px] font-medium text-brand-secondary group-data-[state=on]:text-brand-primary text-center truncate">
                              {format.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Export Quality Tabs + Full-Rounded Action Buttons */}
            <div className="pt-3 border-t border-border-default space-y-2.5 shrink-0">
              
              {/* Quality Density Selector with AnimatedTabs */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary font-mono">
                  Export Density
                </span>
                <AnimatedTabs
                  options={[
                    { id: "1", label: "1x" },
                    { id: "2", label: "2x" },
                    { id: "3", label: "3x" },
                    { id: "4", label: "4x" },
                  ]}
                  activeId={String(quality)}
                  onChange={(id) => setQuality(Number(id) as 1 | 2 | 3 | 4)}
                  size="sm"
                />
              </div>

              {/* Full-Rounded Action Buttons: Download & Copy Equal Width (flex-1) */}
              <div className="flex items-center gap-2">
                {/* Download PNG Button (flex-1, Full Rounded) */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex-1 h-10 px-5 rounded-full bg-brand-primary text-surface-canvas font-semibold text-xs shadow-xs hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>{isExporting ? "Rendering..." : `Download PNG (${quality}x)`}</span>
                </button>

                {/* Copy Image Button (flex-1, Full Rounded, Equal Width to Download) */}
                <button
                  type="button"
                  onClick={handleCopyImage}
                  disabled={isCopyingImage}
                  className="flex-1 h-10 px-5 rounded-full bg-surface-base hover:bg-surface-subtle text-brand-primary border border-border-default shadow-2xs font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                  title="Copy image to clipboard"
                >
                  {copySuccess ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-500 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="w-4 h-4" />
                      <span>{isCopyingImage ? "Copying..." : "Copy Image"}</span>
                    </>
                  )}
                </button>

                {/* Studio Button (Full Rounded) */}
                <button
                  type="button"
                  onClick={handleCustomizeInStudio}
                  className="h-10 px-5 rounded-full bg-surface-subtle hover:bg-surface-base text-brand-secondary hover:text-brand-primary border border-border-default font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] shrink-0"
                  title="Open in Custom Studio"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  <span>Studio</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
