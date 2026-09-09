"use client";

import React, { useState, useEffect, useRef, useId, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

export interface DropdownOption {
  id: string;
  label: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  label?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  align?: "left" | "right" | "auto";
  size?: "sm" | "md" | "lg";
  width?: "auto" | "trigger" | string;
  maxHeight?: string;
  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;
  customTrigger?: (props: {
    isOpen: boolean;
    selectedOption?: DropdownOption;
    toggle: () => void;
  }) => React.ReactNode;
}

function renderIcon(
  icon: React.ComponentType<{ className?: string }> | React.ReactNode | undefined,
  className = "w-3.5 h-3.5"
) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  const Comp = icon as React.ComponentType<{ className?: string }>;
  return <Comp className={className} />;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select option",
  icon,
  label,
  searchable = false,
  searchPlaceholder = "Search...",
  align = "auto",
  size = "md",
  width = "auto",
  maxHeight = "max-h-60",
  className = "",
  triggerClassName = "",
  popoverClassName = "",
  customTrigger,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [computedAlign, setComputedAlign] = useState<"left" | "right">("left");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const hoverLayoutId = `dropdown-hover-pill-${uniqueId}`;

  const selectedOption = useMemo(
    () => options.find((opt) => opt.id === value),
    [options, value]
  );

  // Auto position calculation
  useEffect(() => {
    if (align === "auto" && containerRef.current && isOpen) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.left;
      const spaceLeft = rect.right;
      if (spaceRight < 220 && spaceLeft >= 220) {
        setComputedAlign("right");
      } else {
        setComputedAlign("left");
      }
    } else if (align !== "auto") {
      setComputedAlign(align);
    }
  }, [align, isOpen]);

  // Click outside and Escape key handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const sizeClasses = {
    sm: "h-8 px-2.5 text-[11px] gap-1.5",
    md: "h-9 px-3.5 text-xs gap-2",
    lg: "h-10 px-4 text-xs gap-2.5",
  }[size];

  const toggle = () => {
    setIsOpen((prev) => !prev);
    if (isOpen) setSearchQuery("");
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block select-none ${className}`}
      onMouseLeave={() => setHoveredId(null)}
    >
      {/* 1. Trigger Button */}
      {customTrigger ? (
        customTrigger({ isOpen, selectedOption, toggle })
      ) : (
        <button
          type="button"
          onClick={toggle}
          className={`rounded-full bg-surface-base hover:bg-surface-subtle border border-border-default text-brand-primary font-medium flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-[0.98] ${sizeClasses} ${triggerClassName}`}
        >
          <div className="flex items-center gap-2 min-w-0 truncate">
            {icon ? renderIcon(icon) : selectedOption?.icon ? renderIcon(selectedOption.icon) : null}
            <span className="truncate font-semibold">
              {selectedOption ? (label ? `${label}: ${selectedOption.label}` : selectedOption.label) : placeholder}
            </span>
          </div>

          <ChevronDownIcon
            className={`w-3.5 h-3.5 text-brand-muted shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* 2. Dropdown Popover with Smooth Follow Spring Indicator & Corner Math */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: "spring", bounce: 0.12, duration: 0.2 }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            style={{
              width: width === "trigger" ? "100%" : width === "auto" ? undefined : width,
              minWidth: width === "auto" ? "180px" : undefined,
            }}
            className={`absolute top-full mt-1.5 z-50 rounded-[24px] border border-border-default bg-surface-base shadow-2xl p-2 space-y-1 overscroll-contain ${
              computedAlign === "right" ? "right-0" : "left-0"
            } ${popoverClassName}`}
          >
            {/* Optional Search Bar */}
            {searchable && (
              <div className="p-1 pb-1.5 border-b border-border-default/60">
                <div className="relative flex items-center">
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 text-brand-muted pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full h-7 pl-7 pr-6 rounded-full bg-surface-subtle border border-border-default/80 text-[11px] text-brand-primary placeholder:text-brand-muted focus:outline-hidden focus:border-brand-primary transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 text-brand-muted hover:text-brand-primary"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Options List */}
            <div
              className={`overflow-y-auto custom-scrollbar space-y-0.5 overscroll-contain ${maxHeight}`}
              onMouseLeave={() => setHoveredId(null)}
            >
              {filteredOptions.length === 0 ? (
                <div className="py-3 px-3 text-center text-[11px] text-brand-muted font-medium">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.id === value;
                  const isHighlighted = (hoveredId ? hoveredId === option.id : isSelected);

                  return (
                    <React.Fragment key={option.id}>
                      {option.divider && (
                        <div className="my-1 border-t border-border-default/60" />
                      )}

                      <button
                        type="button"
                        disabled={option.disabled}
                        onClick={() => {
                          onChange(option.id);
                          setIsOpen(false);
                          setSearchQuery("");
                        }}
                        onMouseEnter={() => setHoveredId(option.id)}
                        className={`relative w-full px-3.5 py-2 rounded-full text-left flex items-center justify-between text-xs transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected
                            ? "text-brand-primary font-semibold"
                            : "text-brand-secondary hover:text-brand-primary"
                        }`}
                      >
                        {/* Smooth Gliding Active / Hover Indicator Pill */}
                        {isHighlighted && (
                          <motion.div
                            layoutId={hoverLayoutId}
                            className="absolute inset-0 rounded-full bg-surface-subtle -z-10 shadow-2xs border border-border-default/40"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.2 }}
                          />
                        )}

                        <div className="flex items-center gap-2 min-w-0">
                          {option.icon && renderIcon(option.icon)}
                          <div className="min-w-0">
                            <div className="truncate">{option.label}</div>
                            {option.sublabel && (
                              <div className="text-[10px] text-brand-muted truncate font-mono">
                                {option.sublabel}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {option.badge !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-subtle font-mono text-brand-muted">
                              {option.badge}
                            </span>
                          )}
                          {isSelected && (
                            <CheckIcon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          )}
                        </div>
                      </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
