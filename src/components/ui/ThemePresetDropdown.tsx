"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import {
  DARK_THEME_OPTIONS,
  CURATED_DARK_THEME_OPTIONS,
  NEUTRAL_ACCENT_THEME_OPTIONS,
  DarkThemePreset,
} from "@/lib/theme";
import { CheckIcon, ChevronDownIcon, SparklesIcon } from "@heroicons/react/20/solid";
import { useMounted } from "@/lib/useMounted";

interface ThemePresetDropdownProps {
  className?: string;
}

export const ThemePresetDropdown: React.FC<ThemePresetDropdownProps> = ({ className = "" }) => {
  const mounted = useMounted();
  const { isDark, darkPreset, setDarkPreset } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"neutral" | "curated">(() => {
    return darkPreset.startsWith("neutral") || darkPreset === "neutral" ? "neutral" : "curated";
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOption = DARK_THEME_OPTIONS.find((o) => o.id === darkPreset) || DARK_THEME_OPTIONS[0];

  if (!mounted || !isDark) return null;

  return (
    <div ref={dropdownRef} className={`relative select-none ${className}`}>
      {/* Trigger Button: Minimal Full-Rounded Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2.5 rounded-full bg-surface-base border border-border-default hover:bg-surface-subtle text-brand-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
        title="Choose Dark Mode Palette & Accent Preset"
      >
        <span
          className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
          style={{ backgroundColor: activeOption.swatch }}
        />
        <span className="text-xs font-semibold">{activeOption.label}</span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-brand-muted transition-transform duration-150 ${
            isOpen ? "rotate-180 text-brand-primary" : ""
          }`}
        />
      </button>

      {/* Popover Menu with Tabs */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.2 }}
            className="absolute right-0 mt-1.5 w-60 rounded-2xl border border-border-default bg-surface-canvas shadow-xl z-50 p-2 space-y-2"
          >
            {/* Header / Tabs */}
            <div className="flex items-center justify-between pb-1 px-1">
              <div className="flex items-center gap-1 bg-surface-base p-0.5 rounded-xl border border-border-default w-full">
                <button
                  type="button"
                  onClick={() => setTab("neutral")}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-center ${
                    tab === "neutral"
                      ? "bg-surface-subtle text-brand-primary font-semibold shadow-xs"
                      : "text-brand-muted hover:text-brand-primary"
                  }`}
                >
                  Neutral Accents
                </button>
                <button
                  type="button"
                  onClick={() => setTab("curated")}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-center ${
                    tab === "curated"
                      ? "bg-surface-subtle text-brand-primary font-semibold shadow-xs"
                      : "text-brand-muted hover:text-brand-primary"
                  }`}
                >
                  Curated Dark
                </button>
              </div>
            </div>

            {/* Accent Swatch Palette Grid for quick selection in Neutral mode */}
            {tab === "neutral" && (
              <div className="px-1 py-1">
                <div className="grid grid-cols-6 gap-1.5 p-1.5 bg-surface-base rounded-xl border border-border-default mb-1">
                  {NEUTRAL_ACCENT_THEME_OPTIONS.map((preset) => {
                    const isSelected = darkPreset === preset.id;
                    return (
                      <button
                        key={`grid-${preset.id}`}
                        type="button"
                        onClick={() => {
                          setDarkPreset(preset.id);
                        }}
                        title={preset.label}
                        className={`size-6 rounded-full flex items-center justify-center transition-transform cursor-pointer relative ${
                          isSelected ? "ring-2 ring-brand-primary ring-offset-2 ring-offset-surface-canvas scale-110" : "hover:scale-115 opacity-85 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: preset.swatch }}
                      >
                        {isSelected && (
                          <span className="size-1.5 rounded-full bg-black/80 dark:bg-black/60" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List */}
            <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-0.5 px-0.5">
              {(tab === "neutral" ? NEUTRAL_ACCENT_THEME_OPTIONS : CURATED_DARK_THEME_OPTIONS).map(
                (preset) => {
                  const isSelected = darkPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setDarkPreset(preset.id);
                        setIsOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-surface-subtle text-brand-primary font-semibold"
                          : "text-brand-secondary hover:bg-surface-subtle/50 hover:text-brand-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: preset.swatch }}
                        />
                        <div className="truncate">
                          <span className="block truncate leading-tight">{preset.label}</span>
                          <span className="block text-[10px] text-brand-muted truncate leading-tight">
                            {preset.sublabel}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckIcon className="w-4 h-4 text-brand-primary shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
