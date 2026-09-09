"use client";

import { motion } from "framer-motion";
import React, { useState, useId } from "react";

export interface TabOption {
  id: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  title?: string;
  badge?: string | number;
}

export interface AnimatedTabsProps {
  options: TabOption[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
  variant?: "default" | "segmented";
  layoutId?: string;
}

function renderTabIcon(
  icon: React.ComponentType<{ className?: string }> | React.ReactNode | undefined,
  isActive: boolean,
  size: "sm" | "md"
) {
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    return icon;
  }
  const Component = icon as React.ComponentType<{ className?: string }>;
  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return <Component className={iconClass} />;
}

export function AnimatedTabs({
  options,
  activeId,
  onChange,
  className = "",
  size = "md",
  layoutId,
}: AnimatedTabsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const internalId = useId();
  const activeLayoutId = layoutId || `tabs-active-pill-${internalId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const hoverLayoutId = `tabs-hover-pill-${internalId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const heightClass = size === "sm" ? "h-7.5 text-[11px]" : "h-9 text-xs";
  const paddingClass = size === "sm" ? "px-2.5" : "px-3";

  return (
    <div
      className={`relative inline-flex items-center gap-0.5 p-[2px] bg-surface-sidebar rounded-full border border-border-default shadow-xs select-none w-fit shrink-0 ${heightClass} ${className}`}
      onMouseLeave={() => setHoveredId(null)}
    >
      {options.map((option) => {
        const isActive = activeId === option.id;
        const isHovered = hoveredId === option.id;

        return (
          <button
            key={option.id}
            type="button"
            title={option.title || option.label}
            onClick={() => onChange(option.id)}
            onMouseEnter={() => setHoveredId(option.id)}
            className={`relative h-full flex items-center justify-center ${paddingClass} rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isActive
                ? "text-brand-primary font-semibold"
                : "text-brand-secondary hover:text-brand-primary"
            }`}
          >
            {/* Hover Ghost Indicator: Always renders on hovered tab and glides behind active pill */}
            {isHovered && (
              <motion.div
                layoutId={hoverLayoutId}
                className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-full z-0 pointer-events-none"
                transition={{ type: "spring", bounce: 0.15, duration: 0.25 }}
              />
            )}

            {/* Active Pill Indicator: Sits at z-[2] above ghost indicator */}
            {isActive && (
              <motion.div
                layoutId={activeLayoutId}
                className="absolute inset-0 rounded-full z-[2] bg-surface-base shadow-xs border border-border-default pointer-events-none"
                transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
              />
            )}

            {/* Content: Always at z-10 above all background indicator pills */}
            <span className="relative z-10 flex items-center gap-1.5 pointer-events-none">
              {renderTabIcon(option.icon, isActive, size)}
              {option.label && <span>{option.label}</span>}
              {option.badge !== undefined && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-brand-primary/10 text-brand-primary">
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
