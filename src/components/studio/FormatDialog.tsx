"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/20/solid";
import {
  PLATFORM_FORMAT_GROUPS,
  COMMON_ASPECT_RATIOS,
  FormatPreset,
} from "@/lib/platforms";
import { BrandIcon } from "@/lib/brandLogos";
import { motion, AnimatePresence } from "framer-motion";

interface FormatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFormatId: string;
  onSelectFormat: (format: FormatPreset) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function FormatDialog({
  isOpen,
  onClose,
  selectedFormatId,
  onSelectFormat,
  triggerRef,
}: FormatDialogProps) {
  const [search, setSearch] = useState("");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [mounted] = useState(() => typeof window !== "undefined");
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 120,
    left: 16,
  });
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        left: Math.max(12, rect.left),
      });
    }
  }, [isOpen, triggerRef]);

  // Click outside logic ignoring trigger button
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }
      if (triggerRef?.current && triggerRef.current.contains(target)) {
        return;
      }
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // Filter logic
  const filteredCommon = useMemo(() => {
    if (!search.trim()) return COMMON_ASPECT_RATIOS;
    const query = search.toLowerCase();
    return COMMON_ASPECT_RATIOS.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.aspectRatio.toLowerCase().includes(query)
    );
  }, [search]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return PLATFORM_FORMAT_GROUPS;
    const query = search.toLowerCase();

    return PLATFORM_FORMAT_GROUPS.map((group) => {
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

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(customWidth.replace(/\D/g, ""), 10);
    const h = parseInt(customHeight.replace(/\D/g, ""), 10);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      onSelectFormat({
        id: `custom-${w}x${h}`,
        name: `Custom ${w}×${h}`,
        aspectRatio: `${w}:${h}`,
        ratioStr: `${w} / ${h}`,
        platform: "Custom",
        span: 2,
      });
      onClose();
    }
  };

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9999,
          }}
          className="w-[340px] select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="group/popover z-50 rounded-[24px] border border-border-default bg-surface-base text-brand-primary shadow-2xl overflow-hidden flex flex-col cupertino-glass p-0"
          >
            {/* Search Header */}
            <div className="flex items-center border-b border-border-default px-3.5 py-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-brand-secondary shrink-0" />
              <input
                type="text"
                className="flex h-10 rounded-full text-[13px] placeholder:text-brand-secondary w-full border-none bg-transparent px-2.5 text-ellipsis outline-none text-brand-primary"
                placeholder="Search.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium rounded-full size-7 shrink-0 text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scrollable Vertical List of Aspect Ratio Cards */}
            <div className="relative scrollable-vertical overflow-x-hidden h-96 overflow-y-scroll p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div
                dir="ltr"
                role="radiogroup"
                className="justify-center select-none grid grid-cols-4 items-start gap-1.5"
                tabIndex={0}
                style={{ outline: "none" }}
              >
                {/* 1. Top Common Ratios (Auto, 1:1, 4:3, 3:2, 1.618:1, 5:4, 16:9) */}
                {filteredCommon.map((format) => {
                  const isSelected =
                    selectedFormatId === format.id ||
                    selectedFormatId === format.aspectRatio ||
                    (format.id === "auto" && (selectedFormatId === "Auto" || selectedFormatId === "16:9"));

                  if (format.id === "auto") {
                    return (
                      <button
                        key={format.id}
                        type="button"
                        data-state={isSelected ? "on" : "off"}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          onSelectFormat(format);
                        }}
                        className={`items-center text-sm font-medium transition-colors group flex h-full flex-col justify-between gap-1.5 rounded-[14px] p-1.5 cursor-pointer ${isSelected
                            ? "bg-surface-subtle text-brand-primary"
                            : "bg-transparent hover:bg-surface-subtle/50 text-brand-secondary"
                          }`}
                        style={{ gridColumn: "span 1 / span 1" }}
                      >
                        <div className="flex w-full flex-1 items-center justify-center">
                          <div
                            className={`grid h-11 w-full place-content-center rounded-[10px] transition-all ${isSelected
                                ? "bg-brand-primary text-surface-canvas shadow-sm font-bold"
                                : "border border-border-default bg-surface-subtle text-brand-secondary group-hover:border-border-hover group-hover:text-brand-primary"
                              }`}
                          >
                            <ArrowsPointingOutIcon className="w-5 h-5" />
                          </div>
                        </div>
                        <div
                          className={`text-[11px] font-medium truncate text-center w-full px-0.5 ${isSelected ? "text-brand-primary font-semibold" : "text-brand-secondary group-hover:text-brand-primary"
                            }`}
                        >
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
                      onClick={() => {
                        onSelectFormat(format);
                      }}
                      className={`items-center text-sm font-medium transition-colors group flex h-fit flex-col justify-between gap-1.5 rounded-[14px] p-1.5 cursor-pointer ${isSelected
                          ? "bg-surface-subtle text-brand-primary"
                          : "bg-transparent hover:bg-surface-subtle/50 text-brand-secondary"
                        }`}
                      style={{
                        gridColumn: `span ${format.span || 1} / span ${format.span || 1}`,
                      }}
                    >
                      <div className="flex w-full flex-1 items-center justify-center">
                        <div
                          className={`grid flex-1 place-content-center rounded-[10px] font-mono text-[12px] min-h-[38px] max-h-[56px] w-full transition-all ${isSelected
                              ? "bg-brand-primary text-surface-canvas font-bold shadow-sm"
                              : "border border-border-default bg-surface-subtle text-brand-secondary font-medium group-hover:border-border-hover group-hover:text-brand-primary"
                            }`}
                          style={{ aspectRatio: format.ratioStr }}
                        >
                          {format.aspectRatio}
                        </div>
                      </div>
                      <div
                        className={`w-full px-0.5 text-[11px] font-medium truncate text-center ${isSelected ? "text-brand-primary font-semibold" : "text-brand-secondary group-hover:text-brand-primary"
                          }`}
                      >
                        {format.name}
                      </div>
                    </button>
                  );
                })}

                {/* 2. Platform Formats Categories */}
                {filteredGroups.map((group) => (
                  <div
                    key={group.name}
                    className="col-span-4 py-2 first-of-type:pt-0 last-of-type:pb-0"
                  >
                    {/* Platform Header */}
                    <div className="flex items-center gap-2 px-1 py-1.5 text-[13px] font-medium text-brand-primary">
                      <BrandIcon
                        name={group.icon || group.name}
                        className="w-4 h-4 shrink-0"
                        colored={true}
                      />
                      <span>{group.name}</span>
                    </div>

                    {/* Platform Aspect Ratio Buttons Grid */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {group.formats.map((format) => {
                        const isSelected =
                          selectedFormatId === format.id ||
                          selectedFormatId === format.aspectRatio;

                        return (
                          <button
                            key={format.id}
                            type="button"
                            data-state={isSelected ? "on" : "off"}
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => {
                              onSelectFormat(format);
                            }}
                            className={`items-center text-sm font-medium transition-colors group flex h-fit flex-col justify-between gap-1.5 rounded-[14px] p-1.5 cursor-pointer ${isSelected
                                ? "bg-surface-subtle text-brand-primary"
                                : "bg-transparent hover:bg-surface-subtle/50 text-brand-secondary"
                              }`}
                            style={{
                              gridColumn: `span ${format.span || 1} / span ${format.span || 1}`,
                            }}
                          >
                            <div className="flex w-full flex-1 items-center justify-center">
                              <div
                                className={`grid flex-1 place-content-center rounded-[10px] font-mono text-[12px] min-h-[38px] max-h-[56px] w-full transition-all ${isSelected
                                    ? "bg-brand-primary text-surface-canvas font-bold shadow-sm"
                                    : "border border-border-default bg-surface-subtle text-brand-secondary font-medium group-hover:border-border-hover group-hover:text-brand-primary"
                                  }`}
                                style={{ aspectRatio: format.ratioStr }}
                              >
                                {format.aspectRatio}
                              </div>
                            </div>
                            <div
                              className={`w-full px-0.5 text-[11px] font-medium truncate text-center ${isSelected ? "text-brand-primary font-semibold" : "text-brand-secondary group-hover:text-brand-primary"
                                }`}
                            >
                              {format.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {filteredCommon.length === 0 && filteredGroups.length === 0 && (
                  <div className="col-span-4 py-12 text-center text-xs text-brand-secondary">
                    No matching resolutions found.
                  </div>
                )}
              </div>
            </div>

            {/* Custom Resolution Form Footer */}
            <form
              onSubmit={handleCustomSubmit}
              className="flex items-center gap-2 border-t border-border-default p-2.5 bg-surface-base"
            >
              <div className="flex items-center gap-1.5 flex-1">
                <div className="flex items-center gap-1.5 px-3 h-8 bg-surface-subtle border border-border-default rounded-full flex-1 focus-within:border-border-hover transition-colors">
                  <span className="text-[10px] font-mono font-bold text-brand-secondary">W</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Width"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-full text-[12px] font-mono bg-transparent outline-none text-brand-primary placeholder:text-brand-secondary"
                  />
                </div>

                <div className="flex items-center gap-1.5 px-3 h-8 bg-surface-subtle border border-border-default rounded-full flex-1 focus-within:border-border-hover transition-colors">
                  <span className="text-[10px] font-mono font-bold text-brand-secondary">H</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Height"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-full text-[12px] font-mono bg-transparent outline-none text-brand-primary placeholder:text-brand-secondary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!customWidth || !customHeight}
                className="inline-flex items-center justify-center rounded-full text-xs font-semibold bg-brand-primary text-surface-canvas h-8 px-4 hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.98] shrink-0 shadow-sm"
              >
                Set
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
