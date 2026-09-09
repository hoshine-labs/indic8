"use client";

import React, { useState, useRef, useEffect } from "react";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useDropdownPosition } from "../useDropdownPosition";

export interface AdvancedFilterValues {
  minRevenue?: number;
  maxRevenue?: number;
  excludeRefunds?: boolean;
  category?: string;
}

export interface FilterPopoverProps {
  filters?: AdvancedFilterValues;
  onChange?: (filters: AdvancedFilterValues) => void;
  activeCount?: number;
  onReset?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  filters,
  onChange,
  activeCount = 0,
  onReset,
  children,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const position = useDropdownPosition(triggerRef, isOpen, 256);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = activeCount || (filters?.category || filters?.excludeRefunds ? 1 : 0);

  return (
    <div className={`relative ${className}`} ref={triggerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer select-none active:scale-[0.98] ${
          isOpen || count > 0
            ? "bg-surface-subtle border-brand-primary/40 text-brand-primary"
            : "bg-surface-base border-border-default hover:bg-surface-subtle text-brand-secondary hover:text-brand-primary"
        }`}
      >
        <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
        <span>Filters</span>
        {count > 0 && (
          <span className="w-4 h-4 rounded-full bg-brand-primary text-surface-canvas text-[10px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute z-40 w-64 bg-surface-base border border-border-default rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-100 select-none ${
            position.vertical === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${position.align === "right" ? "right-0" : "left-0"}`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-default">
            <span className="text-xs font-semibold text-brand-primary">Advanced Filters</span>
            {count > 0 && onReset && (
              <button
                onClick={onReset}
                className="text-[11px] text-brand-muted hover:text-brand-primary flex items-center gap-0.5 cursor-pointer"
              >
                <XMarkIcon className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
          <div className="space-y-3">
            {children || (
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-brand-secondary">
                  <input
                    type="checkbox"
                    checked={Boolean(filters?.excludeRefunds)}
                    onChange={(e) => onChange?.({ ...filters, excludeRefunds: e.target.checked })}
                    className="rounded border-border-default accent-brand-primary"
                  />
                  <span>Exclude Refunded Transactions</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
