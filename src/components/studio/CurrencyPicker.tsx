"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";
import { WORLD_CURRENCIES, CurrencyItem } from "@/lib/constants";

interface CurrencyPickerProps {
  value: string;
  onChange: (currency: CurrencyItem) => void;
}

export function CurrencyPicker({ value, onChange }: CurrencyPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurrency =
    WORLD_CURRENCIES.find((c) => c.code === value) || WORLD_CURRENCIES[0];

  const filteredCurrencies = WORLD_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium text-brand-primary hover:bg-surface-subtle rounded-l-lg transition-colors focus:outline-none select-none"
      >
        <span className="text-[14px]">{selectedCurrency.flag}</span>
        <span className="font-mono text-brand-secondary text-[12px]">
          {selectedCurrency.code}
        </span>
        <span className="font-semibold text-brand-primary">
          {selectedCurrency.symbol}
        </span>
        <ChevronDownIcon className="w-3 h-3 text-brand-secondary ml-0.5 opacity-70" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1.5 w-64 z-50 rounded-xl bg-surface-base border border-ui-active p-1.5 shadow-none overflow-hidden"
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-subtle border border-ui-default mb-1.5">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search currency or crypto..."
                className="w-full bg-transparent text-[12px] text-brand-primary outline-none placeholder:text-brand-muted"
                autoFocus
              />
            </div>

            <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
              {filteredCurrencies.map((c) => {
                const isSelected = c.code === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] transition-colors ${
                      isSelected
                        ? "bg-surface-subtle font-medium text-brand-primary"
                        : "text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[13px]">{c.flag}</span>
                      <span className="font-mono font-medium text-brand-primary text-[11px]">
                        {c.code}
                      </span>
                      <span className="text-brand-secondary text-[11px] truncate max-w-[100px]">
                        {c.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-brand-primary font-mono text-[12px]">
                        {c.symbol}
                      </span>
                      {isSelected && <CheckIcon className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
              {filteredCurrencies.length === 0 && (
                <div className="py-4 text-center text-[11px] text-brand-secondary">
                  No currency found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
