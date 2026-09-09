"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  ChevronDownIcon,
  XMarkIcon,
  HashtagIcon,
} from "@heroicons/react/20/solid";
import { WORLD_CURRENCIES } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";

export const SUPPORTED_CURRENCIES = WORLD_CURRENCIES;

interface CurrencyPopoverProps {
  currencyCode?: string;
  onSelectCurrency: (code: string, symbol: string) => void;
}

export function CurrencyPopover({
  currencyCode = "USD",
  onSelectCurrency,
}: CurrencyPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCurrency =
    WORLD_CURRENCIES.find((c) => c.code === currencyCode) || WORLD_CURRENCIES[0];

  const filteredCurrencies = WORLD_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Trigger Button — Split left side */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 flex items-center gap-1.5 px-3 text-[12px] font-medium text-brand-primary bg-surface-subtle hover:bg-surface-subtle/50 border-r border-border-default transition-colors select-none rounded-l-full"
        title="Select Currency"
      >
        {selectedCurrency.code === "RAW" ? (
          <HashtagIcon className="w-3.5 h-3.5 text-brand-secondary" />
        ) : (
          <span className="text-[13px]">{selectedCurrency.flag}</span>
        )}
        <span className="font-mono text-brand-secondary text-[11px]">
          {selectedCurrency.code}
        </span>
        {selectedCurrency.symbol && (
          <span className="font-bold text-brand-primary text-[11px]">
            {selectedCurrency.symbol}
          </span>
        )}
        <ChevronDownIcon
          className={`w-2.5 h-2.5 text-brand-secondary ml-0.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-brand-primary" : ""
          }`}
        />
      </button>

      {/* In-place Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-2xl bg-surface-base border border-border-default p-2 text-brand-primary shadow-2xl cupertino-glass max-h-72 flex flex-col"
          >
            {/* Search Input */}
            <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-full bg-surface-subtle border border-border-default mb-1.5 shrink-0">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search currency..."
                className="w-full bg-transparent text-[11px] text-brand-primary outline-none placeholder:text-brand-muted"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="p-0.5 rounded-full text-brand-secondary hover:text-brand-primary"
                >
                  <XMarkIcon className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Currency List */}
            <div className="overflow-y-auto flex flex-col gap-0.5 max-h-48 pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {filteredCurrencies.map((c) => {
                const isSelected = c.code === currencyCode;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onSelectCurrency(c.code, c.symbol);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] transition-colors ${
                      isSelected
                        ? "bg-brand-primary text-surface-canvas font-semibold"
                        : "text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {c.code === "RAW" ? (
                        <HashtagIcon className={`w-3.5 h-3.5 ${isSelected ? "text-surface-canvas" : "text-brand-secondary"}`} />
                      ) : (
                        <span className="text-[12px]">{c.flag}</span>
                      )}
                      <span className={`font-mono font-bold text-[11px] ${isSelected ? "text-surface-canvas" : "text-brand-primary"}`}>
                        {c.code}
                      </span>
                      <span className={`text-[10px] truncate max-w-[90px] ${isSelected ? "opacity-90" : "text-brand-secondary"}`}>
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      <span className={`font-semibold font-mono text-[11px] ${isSelected ? "text-surface-canvas" : "text-brand-primary"}`}>
                        {c.symbol}
                      </span>
                      {isSelected && (
                        <CheckIcon className="w-3 h-3 text-surface-canvas" />
                      )}
                    </div>
                  </button>
                );
              })}

              {filteredCurrencies.length === 0 && (
                <div className="py-4 text-center text-[11px] text-brand-secondary">
                  No currencies found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
