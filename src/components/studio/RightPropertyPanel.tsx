"use client";

import React, { useState } from "react";
import { StudioCanvasState } from "./CanvasStage";
import {
  CurrencyPopover,
} from "./CurrencyPopover";
import { BACKDROP_PRESETS } from "@/lib/constants";
import { ChartStyle } from "./SparklineChart";
import { BrandIcon } from "@/lib/brandLogos";
import {
  ChevronRightIcon,
  SparklesIcon,
  ArrowsPointingOutIcon,
  SunIcon,
  CubeIcon,
  IdentificationIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/20/solid";
import { motion, AnimatePresence } from "framer-motion";

interface RightPropertyPanelProps {
  state: StudioCanvasState;
  onChange: (updates: Partial<StudioCanvasState>) => void;
}

export function RightPropertyPanel({
  state,
  onChange,
}: RightPropertyPanelProps) {
  // Allow multiple menus to be open simultaneously
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["backdrop", "metric"])
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCurrencySelect = (code: string, symbol: string) => {
    onChange({ currencyCode: code, currencySymbol: symbol });
  };

  return (
    <aside className="sticky top-[56px] right-0 flex h-[calc(100vh-56px)] w-64 shrink-0 flex-col gap-2.5 overflow-y-auto select-none bg-surface-canvas p-2 pb-16 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-colors duration-200">
      {/* ========================================================= */}
      {/* 1. BACKDROP ACCORDION */}
      {/* ========================================================= */}
      <div className="bg-surface-base border border-border-default rounded-[24px] overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() => toggleSection("backdrop")}
          className="flex h-11 w-full items-center justify-between px-3.5 text-left font-medium text-brand-primary tracking-tight"
        >
          <div className="flex items-center gap-2.5">
            <SunIcon className="w-4 h-4 text-brand-secondary shrink-0" />
            <span className="text-[13px] font-medium text-brand-primary">Backdrop</span>
          </div>
          <ChevronRightIcon
            className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ease-out ${
              openSections.has("backdrop") ? "rotate-90 text-brand-primary" : "text-brand-secondary"
            }`}
          />
        </button>

          <AnimatePresence initial={false}>
            {openSections.has("backdrop") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                  {/* Preset Backdrops Grid */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-brand-secondary uppercase tracking-wider">
                      Wallpapers & Gradients
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {BACKDROP_PRESETS.map((preset) => {
                        const isSelected =
                          state.backdropId === preset.id &&
                          !state.customBackdropColor;

                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() =>
                              onChange({
                                backdropId: preset.id,
                                customBackdropColor: undefined,
                              })
                            }
                            className={`group relative h-11 rounded-xl overflow-hidden border transition-all active:scale-[0.97] ${
                              isSelected
                                ? "ring-2 ring-brand-primary border-transparent scale-[1.02]"
                                : "border-border-default hover:border-border-hover"
                            }`}
                            title={preset.name}
                          >
                            <div
                              className="absolute inset-0 w-full h-full"
                              style={{ background: preset.previewBg || preset.background }}
                            />
                            {preset.isNoise && (
                              <div className="absolute inset-0 grain-overlay opacity-60 pointer-events-none" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Backdrop Blur Slider */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-brand-primary">Backdrop Blur</span>
                      <span className="font-mono text-brand-secondary">{state.backdropBlur || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={1}
                      value={state.backdropBlur || 0}
                      onChange={(e) => onChange({ backdropBlur: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 rounded-full bg-border-active appearance-none accent-brand-primary cursor-pointer"
                    />
                  </div>

                  {/* Noise Grain Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[12px] font-medium text-brand-primary">
                      Analog Film Grain
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange({ showGrain: !state.showGrain })}
                      className={`h-7 px-3 rounded-full text-[11px] font-medium transition-all ${
                        state.showGrain
                          ? "bg-brand-primary text-surface-canvas"
                          : "bg-surface-subtle border border-border-default text-brand-secondary hover:text-brand-primary"
                      }`}
                    >
                      {state.showGrain ? "Enabled" : "Off"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* 2. BORDER & CORNERS */}
        {/* ========================================================= */}
        <div className="bg-surface-base border border-border-default rounded-[24px] overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => toggleSection("border")}
            className="flex h-11 w-full items-center justify-between px-3.5 text-left font-medium text-brand-primary tracking-tight"
          >
            <div className="flex items-center gap-2.5">
              <ArrowsPointingOutIcon className="w-4 h-4 text-brand-secondary shrink-0" />
              <span className="text-[13px] font-medium text-brand-primary">Canvas & Chart</span>
            </div>
            <ChevronRightIcon
              className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ease-out ${
                openSections.has("canvas") ? "rotate-90 text-brand-primary" : "text-brand-secondary"
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSections.has("border") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                  {/* Corner Style Segmented Radio */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-brand-secondary uppercase tracking-wider">
                      Corner Geometry
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-surface-subtle p-1 rounded-full border border-border-default">
                      {[
                        { label: "Sharp", radius: 12 },
                        { label: "Smooth", radius: 28 },
                        { label: "Pill", radius: 44 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => onChange({ borderRadius: item.radius })}
                          className={`h-7 rounded-full text-[11px] font-medium transition-all ${
                            state.borderRadius === item.radius
                              ? "bg-brand-primary text-surface-canvas font-semibold"
                              : "text-brand-secondary hover:text-brand-primary"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Corner Radius Slider */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-brand-secondary">Custom Radius</span>
                      <span className="font-mono font-medium text-brand-primary bg-surface-subtle px-2 py-0.5 rounded-full border border-border-default text-[10px]">
                        {state.borderRadius ?? 32}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={52}
                      step={2}
                      value={state.borderRadius ?? 32}
                      onChange={(e) =>
                        onChange({ borderRadius: parseInt(e.target.value) })
                      }
                      className="w-full accent-brand-primary cursor-pointer h-1.5 bg-surface-subtle rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* 3. SHADOW & DEPTH */}
        {/* ========================================================= */}
        <div className="bg-surface-base border border-border-default rounded-[24px] overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => toggleSection("shadow")}
            className="flex h-11 w-full items-center justify-between px-3.5 text-left font-medium text-brand-primary tracking-tight"
          >
            <div className="flex items-center gap-2.5">
              <SparklesIcon className="w-4 h-4 text-brand-secondary shrink-0" />
              <span className="text-[13px] font-medium text-brand-primary">Metric & Counter</span>
            </div>
            <ChevronRightIcon
              className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ease-out ${
                openSections.has("metric") ? "rotate-90 text-brand-primary" : "text-brand-secondary"
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSections.has("shadow") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-medium text-brand-secondary uppercase tracking-wider">
                      Contrast & Boundary
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-surface-subtle p-1 rounded-full border border-border-default">
                      {(["none", "spread", "hug"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => onChange({ shadowIntensity: mode })}
                          className={`h-7 rounded-full text-[11px] font-medium capitalize transition-all ${
                            state.shadowIntensity === mode
                              ? "bg-brand-primary text-surface-canvas font-semibold"
                              : "text-brand-secondary hover:text-brand-primary"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* 4. METRIC & TELEMETRY */}
        {/* ========================================================= */}
        <div className="bg-surface-base border border-border-default rounded-[24px] overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => toggleSection("metric")}
            className="flex h-11 w-full items-center justify-between px-3.5 text-left font-medium text-brand-primary tracking-tight"
          >
            <div className="flex items-center gap-2.5">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-brand-secondary shrink-0" />
              <span className="text-[13px] font-medium text-brand-primary">Geometry</span>
            </div>
            <ChevronRightIcon
              className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ease-out ${
                openSections.has("geometry") ? "rotate-90 text-brand-primary" : "text-brand-secondary"
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSections.has("metric") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                  {/* Numeric Value & Currency Popover in unified split pill */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-brand-secondary">
                      Metric Number & Currency
                    </label>
                    <div className="flex items-center w-full h-10 rounded-full bg-surface-subtle border border-border-default focus-within:border-border-hover transition-colors overflow-visible">
                      <CurrencyPopover
                        currencyCode={state.currencyCode}
                        onSelectCurrency={handleCurrencySelect}
                      />
                      <input
                        type="number"
                        value={state.numericValue}
                        onChange={(e) =>
                          onChange({
                            numericValue: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="flex-1 h-full px-3.5 text-[13px] font-mono bg-transparent text-brand-primary outline-none min-w-0 rounded-r-full"
                      />
                    </div>
                  </div>

                  {/* Suffix / Unit */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-brand-secondary">
                      Metric Unit / Suffix
                    </label>
                    <input
                      type="text"
                      value={state.suffix}
                      onChange={(e) => onChange({ suffix: e.target.value })}
                      placeholder="e.g. ARR, Stars, Followers"
                      className="w-full h-9 px-3 rounded-full text-[12px] bg-surface-subtle border border-border-default text-brand-primary focus:border-border-hover outline-none"
                    />
                  </div>

                  {/* Metric Label */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-brand-secondary">
                      Title Heading
                    </label>
                    <input
                      type="text"
                      value={state.metricLabel}
                      onChange={(e) => onChange({ metricLabel: e.target.value })}
                      className="w-full h-9 px-3 rounded-full text-[12px] bg-surface-subtle border border-border-default text-brand-primary focus:border-border-hover outline-none"
                    />
                  </div>

                  {/* Growth Delta */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-brand-secondary">
                      Growth Pill Badge
                    </label>
                    <input
                      type="text"
                      value={state.growthDelta}
                      onChange={(e) => onChange({ growthDelta: e.target.value })}
                      placeholder="+24.5% MoM"
                      className="w-full h-9 px-3 rounded-full text-[12px] bg-surface-subtle border border-border-default text-brand-primary focus:border-border-hover outline-none"
                    />
                  </div>

                  {/* Chart Style Radio */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-brand-secondary">
                      Chart Telemetry Style
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-surface-subtle p-1 rounded-full border border-border-default">
                      {(["wave", "bars", "none"] as ChartStyle[]).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => onChange({ chartStyle: style })}
                          className={`h-7 rounded-full text-[11px] font-medium capitalize transition-all ${
                            state.chartStyle === style
                              ? "bg-brand-primary text-surface-canvas font-semibold"
                              : "text-brand-secondary hover:text-brand-primary"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* 5. 3D SPATIAL CAMERA */}
        {/* ========================================================= */}
        <div className="bg-surface-base border border-border-default rounded-[24px] overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => toggleSection("spatial")}
            className="flex h-11 w-full items-center justify-between px-3.5 text-left font-medium text-brand-primary tracking-tight"
          >
            <div className="flex items-center gap-2.5">
              <CubeIcon className="w-4 h-4 text-brand-secondary shrink-0" />
              <span className="text-[13px] font-medium text-brand-primary">3D Camera</span>
            </div>
            <ChevronRightIcon
              className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ease-out ${
                openSections.has("camera") ? "rotate-90 text-brand-primary" : "text-brand-secondary"
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSections.has("spatial") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                  {/* Quick Tilts */}
                  <div className="grid grid-cols-3 gap-1 bg-surface-subtle p-1 rounded-full border border-border-default">
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ tiltX: 0, tiltY: 0, tiltZ: 0, scale: 1 })
                      }
                      className="h-7 rounded-full text-[11px] font-medium text-brand-secondary hover:text-brand-primary"
                    >
                      Flat 2D
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ tiltX: 12, tiltY: -18, tiltZ: 6, scale: 0.95 })
                      }
                      className="h-7 rounded-full text-[11px] font-medium text-brand-secondary hover:text-brand-primary"
                    >
                      Angled 3D
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ tiltX: 20, tiltY: 0, tiltZ: -10, scale: 0.9 })
                      }
                      className="h-7 rounded-full text-[11px] font-medium text-brand-secondary hover:text-brand-primary"
                    >
                      Dynamic
                    </button>
                  </div>

                  {/* Tilt X Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-brand-secondary">Tilt X</span>
                      <span className="font-mono text-brand-primary">{state.tiltX}°</span>
                    </div>
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      value={state.tiltX}
                      onChange={(e) =>
                        onChange({ tiltX: parseInt(e.target.value) })
                      }
                      className="w-full accent-brand-primary cursor-pointer h-1.5 bg-surface-subtle rounded-full"
                    />
                  </div>

                  {/* Tilt Y Slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-brand-secondary">Tilt Y</span>
                      <span className="font-mono text-brand-primary">{state.tiltY}°</span>
                    </div>
                    <input
                      type="range"
                      min={-45}
                      max={45}
                      value={state.tiltY}
                      onChange={(e) =>
                        onChange({ tiltY: parseInt(e.target.value) })
                      }
                      className="w-full accent-brand-primary cursor-pointer h-1.5 bg-surface-subtle rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* 6. IDENTITY & BRANDING */}
        {/* ========================================================= */}
        <div className="bg-surface-base border border-border-default rounded-[24px] overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => toggleSection("identity")}
            className="flex h-11 w-full items-center justify-between px-3.5 text-left font-medium text-brand-primary tracking-tight"
          >
            <div className="flex items-center gap-2.5">
              <IdentificationIcon className="w-4 h-4 text-brand-secondary shrink-0" />
              <span className="text-[13px] font-medium text-brand-primary">Identity</span>
            </div>
            <ChevronRightIcon
              className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ease-out ${
                openSections.has("identity") ? "rotate-90 text-brand-primary" : "text-brand-secondary"
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSections.has("identity") && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="px-4 pb-4 pt-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-brand-secondary">
                      Company / Project Name
                    </label>
                    <input
                      type="text"
                      value={state.companyName}
                      onChange={(e) => onChange({ companyName: e.target.value })}
                      className="w-full h-9 px-3 rounded-full text-[12px] bg-surface-subtle border border-border-default text-brand-primary focus:border-border-hover outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-brand-secondary">
                      Creator Handle
                    </label>
                    <input
                      type="text"
                      value={state.creatorHandle}
                      onChange={(e) => onChange({ creatorHandle: e.target.value })}
                      className="w-full h-9 px-3 rounded-full text-[12px] bg-surface-subtle border border-border-default text-brand-primary focus:border-border-hover outline-none"
                    />
                  </div>

                  {/* Source Badge Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-brand-secondary">
                      Verified Trust Badge
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-surface-subtle p-1 rounded-2xl border border-border-default">
                      {[
                        { id: "stripe", label: "Stripe" },
                        { id: "github", label: "GitHub" },
                        { id: "youtube", label: "YouTube" },
                        { id: "x", label: "X" },
                        { id: "producthunt", label: "ProductHunt" },
                        { id: "none", label: "None" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            onChange({
                              verifiedSource:
                                item.id as StudioCanvasState["verifiedSource"],
                            })
                          }
                          className={`h-8 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                            state.verifiedSource === item.id
                              ? "bg-brand-primary text-surface-canvas font-semibold"
                              : "text-brand-secondary hover:text-brand-primary"
                          }`}
                        >
                          {item.id !== "none" && (
                            <BrandIcon
                              name={item.id}
                              className="w-3.5 h-3.5 shrink-0"
                              colored={state.verifiedSource !== item.id}
                            />
                          )}
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </aside>
  );
}
