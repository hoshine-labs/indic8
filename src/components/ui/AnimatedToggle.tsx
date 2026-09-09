"use client";

import React, { useId, useState } from "react";
import { motion } from "framer-motion";

export interface AnimatedToggleOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface AnimatedToggleProps {
  options: AnimatedToggleOption[];
  activeId: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
  className?: string;
  layoutId?: string;
}

export function AnimatedToggle({
  options,
  activeId,
  onChange,
  size = "sm",
  className = "",
  layoutId,
}: AnimatedToggleProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const internalId = useId();
  const activeLayoutId = layoutId || `toggle-active-pill-${internalId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const hoverLayoutId = `toggle-hover-pill-${internalId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const heightClass = size === "sm" ? "h-7 text-[11px]" : "h-8 text-xs";
  const paddingClass = size === "sm" ? "px-2.5" : "px-3";

  return (
    <div
      className={`relative inline-flex items-center gap-0.5 p-[2px] bg-surface-sidebar rounded-full border border-border-default shadow-xs select-none shrink-0 ${heightClass} ${className}`}
      onMouseLeave={() => setHoveredId(null)}
    >
      {options.map((opt) => {
        const isActive = activeId === opt.id;
        const isHovered = hoveredId === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            onMouseEnter={() => setHoveredId(opt.id)}
            className={`relative h-full flex items-center justify-center ${paddingClass} rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isActive
                ? "text-brand-primary font-semibold"
                : "text-brand-secondary hover:text-brand-primary"
            }`}
          >
            {/* Hover Ghost Pill */}
            {isHovered && (
              <motion.div
                layoutId={hoverLayoutId}
                className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-full z-0 pointer-events-none"
                transition={{ type: "spring", bounce: 0.15, duration: 0.25 }}
              />
            )}

            {/* Active Pill Indicator */}
            {isActive && (
              <motion.div
                layoutId={activeLayoutId}
                className="absolute inset-0 rounded-full z-[2] bg-surface-base shadow-xs border border-border-default pointer-events-none"
                transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
              />
            )}

            {/* Content Label & Badge */}
            <span className="relative z-10 flex items-center gap-1.5 pointer-events-none">
              {opt.icon}
              <span>{opt.label}</span>
              {opt.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    isActive
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "bg-surface-subtle text-brand-muted"
                  }`}
                >
                  {opt.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
