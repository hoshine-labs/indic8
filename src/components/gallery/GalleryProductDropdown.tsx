"use client";

import React, { useState, useRef, useId, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandIcon } from "@/lib/brandLogos";
import { useDropdownPosition } from "@/components/ui";
import {
  CubeIcon,
  ChevronDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

interface ProductItem {
  id: string;
  name: string;
  isArchived?: boolean;
  channels?: Array<{ provider: string }>;
  providers?: Array<{ provider: string }>;
}

interface GalleryProductDropdownProps {
  availableProducts: ProductItem[];
  selectedProductIds: string[];
  onToggleProduct: (id: string) => void;
  onResetAll: () => void;
}

export const GalleryProductDropdown: React.FC<GalleryProductDropdownProps> = memo(({
  availableProducts,
  selectedProductIds,
  onToggleProduct,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const hoverLayoutId = `gallery-prod-drop-hover-${uniqueId}`;
  const dropdownPos = useDropdownPosition(dropdownRef, isOpen, 300, 340);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
      setHoveredOptionId(null);
    }
  }, [isOpen]);

  // Filtered options based on internal search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts;
    const q = searchQuery.toLowerCase();
    return availableProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [availableProducts, searchQuery]);

  return (
    <div ref={dropdownRef} className="relative inline-block shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full bg-surface-base hover:bg-surface-subtle border text-brand-primary font-medium flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-[0.98] h-9 px-3.5 text-xs gap-2 ${
          isOpen
            ? "border-brand-primary/40 ring-1 ring-brand-primary/20"
            : "border-border-default"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CubeIcon className="w-3.5 h-3.5 text-brand-muted shrink-0" />
          <span className="font-normal text-brand-primary truncate max-w-[170px]">
            {selectedProductIds.length === 0
              ? "All Products"
              : selectedProductIds.length === 1
              ? availableProducts.find((p) => p.id === selectedProductIds[0])?.name || "1 Product Selected"
              : `${selectedProductIds.length} Products Selected`}
          </span>
        </div>

        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-brand-muted shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ type: "spring", bounce: 0.12, duration: 0.2 }}
            className={`absolute top-full mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-[24px] border border-border-default bg-surface-base shadow-2xl p-2 space-y-1.5 z-50 overscroll-contain ${
              dropdownPos.align === "right" ? "right-0" : "left-0"
            }`}
          >
            {/* Search Bar */}
            <div className="p-1 pb-1.5 border-b border-border-default/60">
              <div className="relative flex items-center">
                <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-2.5 text-brand-muted pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-7 pl-7 pr-6 rounded-full bg-surface-subtle border border-border-default/80 text-[11px] text-brand-primary placeholder:text-brand-muted focus:outline-none focus:border-brand-primary transition font-normal"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-brand-muted hover:text-brand-primary cursor-pointer"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Subtitle / Counter */}
            <div className="flex items-center justify-between px-3 py-0.5 text-[10px] text-brand-muted font-mono">
              <span>Filter gallery posts by product</span>
              <span>
                {selectedProductIds.length === 0
                  ? `All (${availableProducts.length})`
                  : `${selectedProductIds.length} / ${availableProducts.length} selected`}
              </span>
            </div>

            {/* Scrollable Circle Checkbox Options List */}
            <div
              className="max-h-64 overflow-y-auto custom-scrollbar space-y-0.5 overscroll-contain p-0.5"
              onMouseLeave={() => setHoveredOptionId(null)}
            >
              {/* All Products Option */}
              <div
                onMouseEnter={() => setHoveredOptionId("all")}
                onClick={() => onToggleProduct("all")}
                className="relative w-full min-h-[40px] px-3.5 py-2.5 rounded-full text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer select-none text-brand-primary"
              >
                {hoveredOptionId === "all" && (
                  <motion.div
                    layoutId={hoverLayoutId}
                    className="absolute inset-0 bg-surface-subtle rounded-full z-0"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.2 }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      selectedProductIds.length === 0
                        ? "bg-brand-primary border-brand-primary text-surface-canvas shadow-xs"
                        : "border-border-default/80 bg-surface-canvas"
                    }`}
                  >
                    {selectedProductIds.length === 0 && (
                      <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <span className="truncate text-xs font-normal text-brand-primary">
                    All Products
                  </span>
                </div>

                <div className="relative z-10 text-right font-mono text-[11px] font-normal text-brand-muted">
                  {availableProducts.length}
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-4 text-center text-xs text-brand-muted font-normal">
                  No matching products
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const isHovered = hoveredOptionId === p.id;
                  const provider = p.channels?.[0]?.provider || p.providers?.[0]?.provider;

                  return (
                    <div
                      key={p.id}
                      onMouseEnter={() => setHoveredOptionId(p.id)}
                      onClick={() => onToggleProduct(p.id)}
                      className="relative w-full min-h-[40px] px-3.5 py-2.5 rounded-full text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer select-none text-brand-primary"
                    >
                      {isHovered && (
                        <motion.div
                          layoutId={hoverLayoutId}
                          className="absolute inset-0 bg-surface-subtle rounded-full z-0"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.2 }}
                        />
                      )}

                      {/* Left: Circle Checkbox & Product Name */}
                      <div className="relative z-10 flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-brand-primary border-brand-primary text-surface-canvas shadow-xs"
                              : "border-border-default/80 bg-surface-canvas"
                          }`}
                        >
                          {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </div>

                        <span className="truncate text-xs font-normal text-brand-primary">
                          {p.name}
                          {p.isArchived && (
                            <span className="ml-1.5 text-[10px] text-brand-muted font-mono">
                              (Archived)
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Right: Provider Icon Only (No Revenue) */}
                      {provider && (
                        <div className="relative z-10 w-4 h-4 flex items-center justify-center shrink-0">
                          <BrandIcon provider={provider} className="w-3.5 h-3.5" colored={true} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GalleryProductDropdown.displayName = "GalleryProductDropdown";
