"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassPlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";

export type FrameDecoration =
  | "none"
  | "macos"
  | "safari"
  | "card"
  | "stack"
  | "stack2"
  | "arc"
  | "windows";

interface FrameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFrame: FrameDecoration;
  onSelectFrame: (frame: FrameDecoration) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function FrameDialog({
  isOpen,
  onClose,
  selectedFrame,
  onSelectFrame,
  scale,
  onScaleChange,
  triggerRef,
}: FrameDialogProps) {
  const [mounted] = useState(() => typeof window !== "undefined");
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 180,
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

  if (!mounted) return null;

  const frameOptions: { id: FrameDecoration; label: string }[] = [
    { id: "none", label: "None" },
    { id: "macos", label: "MacOS" },
    { id: "safari", label: "Safari" },
    { id: "card", label: "Card" },
    { id: "stack", label: "Stack" },
    { id: "stack2", label: "Stack 2" },
    { id: "arc", label: "Arc" },
    { id: "windows", label: "Windows" },
  ];

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
          className="w-[310px] select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="group/popover z-50 rounded-[24px] border border-border-default bg-surface-base p-3 text-brand-primary shadow-2xl overflow-hidden flex flex-col gap-3 cupertino-glass"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-border-default px-1">
              <span className="text-[11px] font-semibold text-brand-secondary uppercase tracking-wider">
                Frame Style
              </span>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full size-7 text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Frame Decoration Grid (3 Columns) */}
            <div className="grid grid-cols-3 gap-1.5 p-0">
              {frameOptions.map((f) => {
                const isSelected = selectedFrame === f.id;

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onSelectFrame(f.id);
                    }}
                    className={`group flex flex-col items-center justify-center gap-1.5 rounded-[14px] p-1.5 transition-all active:scale-[0.98] ${isSelected
                        ? "bg-surface-subtle text-brand-primary"
                        : "bg-transparent hover:bg-surface-subtle/50 text-brand-secondary"
                      }`}
                  >
                    {/* Visual Frame Thumbnail */}
                    <div
                      className={`relative h-11 w-full overflow-hidden rounded-[10px] p-1 transition-all flex items-center justify-center ${isSelected
                          ? "bg-brand-primary text-surface-canvas shadow-sm"
                          : "border border-border-default bg-surface-subtle text-brand-secondary group-hover:border-border-hover group-hover:text-brand-primary"
                        }`}
                    >
                      {f.id === "none" && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m2 2 20 20" />
                          <path d="M8.35 2.69A10 10 0 0 1 21.3 15.65" />
                          <path d="M19.08 19.08A10 10 0 1 1 4.92 4.92" />
                        </svg>
                      )}

                      {f.id === "macos" && (
                        <div className="size-full overflow-hidden rounded-[4px] bg-black/20 flex flex-col">
                          <div className="flex h-[8px] w-full items-center gap-[2px] bg-black/20 px-1">
                            <div className="size-1 rounded-full bg-red-400" />
                            <div className="size-1 rounded-full bg-amber-400" />
                            <div className="size-1 rounded-full bg-emerald-400" />
                          </div>
                          <div className="flex-1 p-0.5">
                            <div className="h-full w-full rounded-[2px] bg-black/10" />
                          </div>
                        </div>
                      )}

                      {f.id === "safari" && (
                        <div className="size-full overflow-hidden rounded-[4px] bg-black/20 flex flex-col">
                          <div className="flex h-[9px] w-full items-center gap-[3px] bg-black/25 px-1">
                            <div className="flex gap-[2px]">
                              <div className="size-1 rounded-full bg-red-400" />
                              <div className="size-1 rounded-full bg-amber-400" />
                              <div className="size-1 rounded-full bg-emerald-400" />
                            </div>
                            <div className="h-[5px] flex-1 rounded-full bg-white/20 mx-1" />
                          </div>
                          <div className="flex-1 p-0.5">
                            <div className="h-full w-full rounded-[2px] bg-black/10" />
                          </div>
                        </div>
                      )}

                      {f.id === "card" && (
                        <div className="size-full rounded-[6px] border border-current p-0.5">
                          <div className="h-full w-full rounded-[3px] bg-current opacity-15" />
                        </div>
                      )}

                      {f.id === "stack" && (
                        <div className="relative size-full">
                          <div className="absolute inset-x-1.5 top-0.5 h-full rounded-[4px] bg-current opacity-10" />
                          <div className="absolute inset-x-0.5 top-1.5 h-full rounded-[4px] border border-current bg-surface-subtle" />
                        </div>
                      )}

                      {f.id === "stack2" && (
                        <div className="relative size-full">
                          <div className="absolute inset-x-2 top-0 h-full rounded-[4px] bg-current opacity-10" />
                          <div className="absolute inset-x-1 top-1 h-full rounded-[4px] bg-current opacity-20" />
                          <div className="absolute inset-x-0 top-2 h-full rounded-[4px] border border-current bg-surface-subtle" />
                        </div>
                      )}

                      {f.id === "arc" && (
                        <div className="size-full overflow-hidden rounded-[4px] bg-black/20 flex">
                          <div className="w-2.5 h-full bg-black/30 flex flex-col gap-0.5 p-0.5">
                            <div className="size-1 rounded-full bg-white/40" />
                            <div className="size-1 rounded-full bg-white/40" />
                          </div>
                          <div className="flex-1 p-0.5">
                            <div className="h-full w-full rounded-[2px] bg-black/10" />
                          </div>
                        </div>
                      )}

                      {f.id === "windows" && (
                        <div className="size-full overflow-hidden rounded-[3px] bg-black/20 flex flex-col">
                          <div className="flex h-[7px] w-full items-center justify-between bg-black/25 px-1">
                            <div className="h-[2px] w-3 rounded-full bg-white/30" />
                            <div className="flex gap-[2px]">
                              <div className="size-1 bg-white/30" />
                              <div className="size-1 bg-white/30" />
                              <div className="size-1 bg-red-400" />
                            </div>
                          </div>
                          <div className="flex-1 p-0.5">
                            <div className="h-full w-full rounded-[1px] bg-black/10" />
                          </div>
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-medium truncate text-center ${isSelected ? "text-brand-primary font-semibold" : "text-brand-secondary group-hover:text-brand-primary"
                        }`}
                    >
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Frame Scale Slider */}
            <div className="border-t border-border-default pt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="font-medium text-brand-secondary flex items-center gap-1">
                  <MagnifyingGlassPlusIcon className="w-3.5 h-3.5" />
                  <span>Frame Scale</span>
                </span>
                <span className="font-mono text-brand-primary font-medium">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.2"
                step="0.05"
                value={scale}
                onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
