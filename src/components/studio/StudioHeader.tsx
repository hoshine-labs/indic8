"use client";

import React, { useState } from "react";
import {
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  SparklesIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
} from "@heroicons/react/20/solid";
import { PLATFORM_MILESTONE_TEMPLATES, MilestoneTemplate } from "@/lib/platforms";
import { BrandIcon } from "@/lib/brandLogos";
import { motion, AnimatePresence } from "framer-motion";
import { useIndic8Store } from "@/lib/indic8Store";

interface StudioHeaderProps {
  projectTitle: string;
  onTitleChange: (title: string) => void;
  zoomScale: number;
  onZoomChange: (scale: number) => void;
  onApplyTemplate: (data: MilestoneTemplate) => void;
  onOpenAuthModal: () => void;
  onExportPng: () => void;
  onCopyGraphic: () => void;
  isExporting: boolean;
  copied: boolean;
}

export function StudioHeader({
  projectTitle,
  onTitleChange,
  zoomScale,
  onZoomChange,
  onApplyTemplate,
  onExportPng,
  onCopyGraphic,
  isExporting,
  copied,
}: StudioHeaderProps) {
  const { setActiveTab } = useIndic8Store();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  return (
    <div className="w-full h-11 bg-surface-base border-b border-border-default px-4 flex items-center justify-between select-none shrink-0">
      {/* Left: Back to Dashboard & Project Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setActiveTab("dashboard")}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-subtle hover:bg-surface-light border border-border-default text-xs font-semibold text-brand-primary transition-colors cursor-pointer"
          title="Return to Dashboard"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <div className="w-[1px] h-4 bg-border-default hidden sm:block" />

        {/* Editable Title */}
        <div className="flex items-center">
          {isEditingTitle ? (
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              autoFocus
              className="text-xs font-semibold text-brand-primary bg-surface-subtle border border-border-default rounded-md px-2 py-0.5 outline-none focus:border-brand-primary"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-xs font-semibold text-brand-primary hover:bg-surface-subtle px-2 py-0.5 rounded-md transition-colors cursor-pointer truncate max-w-[160px]"
            >
              {projectTitle}
            </button>
          )}
        </div>
      </div>

      {/* Center: Templates Dropdown */}
      <div className="relative hidden sm:block">
        <button
          onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-light border border-border-default text-xs font-medium text-brand-primary transition-colors cursor-pointer"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Preset Milestones</span>
          <ChevronDownIcon className="w-3 h-3 text-brand-muted" />
        </button>

        <AnimatePresence>
          {isTemplatesOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-64 p-1.5 rounded-xl bg-surface-base border border-border-default shadow-xl z-50 flex flex-col gap-1 max-h-72 overflow-y-auto"
            >
              {PLATFORM_MILESTONE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    onApplyTemplate(tmpl);
                    setIsTemplatesOpen(false);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-subtle text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <BrandIcon name={tmpl.verifiedSource} className="w-3.5 h-3.5" colored={true} />
                    <span className="text-xs font-medium text-brand-primary">
                      {tmpl.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-brand-muted font-mono">
                    {tmpl.currencySymbol}
                    {tmpl.numericValue.toLocaleString()}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Zoom & Export Controls */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center p-0.5 rounded-md bg-surface-subtle border border-border-default">
          <button
            onClick={() => onZoomChange(Math.max(0.6, zoomScale - 0.1))}
            className="p-1 text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <MagnifyingGlassMinusIcon className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-brand-secondary px-1 min-w-[34px] text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(1.5, zoomScale + 0.1))}
            className="p-1 text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
            title="Zoom In"
          >
            <MagnifyingGlassPlusIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Copy Image */}
        <button
          onClick={onCopyGraphic}
          disabled={isExporting}
          className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-light border border-border-default text-xs font-medium text-brand-primary flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5 text-status-success" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <DocumentDuplicateIcon className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>

        {/* Export PNG */}
        <button
          onClick={onExportPng}
          disabled={isExporting}
          className="px-3 py-1 rounded-lg bg-brand-primary text-surface-canvas font-semibold text-xs hover:bg-brand-darker active:scale-[0.98] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          <span>{isExporting ? "Exporting..." : "Export"}</span>
        </button>
      </div>
    </div>
  );
}
