"use client";

import React, { useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { useIndic8Store, CURRENCY_RATES } from "@/lib/indic8Store";
import { useMounted } from "@/lib/useMounted";
import { Card, AnimatedTabs, Dropdown } from "@/components/ui";
import { CurrencyCode } from "@/lib/types";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/20/solid";

export const SettingsView: React.FC = () => {
  const { sidebarLayout, setSidebarLayout } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { primaryCurrency, setPrimaryCurrency } = useIndic8Store();
  const mounted = useMounted();

  const [workspaceName, setWorkspaceName] = useState("Acme Software Studio");
  const [founderHandle, setFounderHandle] = useState("@founder");
  const [milestoneThreshold, setMilestoneThreshold] = useState("10000");
  const [selectedVoice, setSelectedVoice] = useState("founder");

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as ThemeMode);
  };

  return (
    <div className="flex flex-col h-full bg-surface-canvas select-none">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-brand-primary tracking-tight">
              Settings
            </h1>
            <p className="text-xs text-brand-secondary mt-1">
              Manage your workspace preferences, navigation layout, and appearance.
            </p>
          </div>

          <div className="space-y-6">
            {/* Section 1: Appearance */}
            <section>
              <h2 className="text-[14px] font-semibold text-brand-primary mb-3">
                Appearance
              </h2>
              <Card className="p-5 border border-border-default bg-surface-base rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-brand-primary">
                      Theme Preference
                    </h3>
                    <p className="text-[11px] text-brand-secondary mt-0.5">
                      Choose how indic8 looks to you.
                    </p>
                  </div>

                  <div className="shrink-0">
                    {mounted ? (
                      <AnimatedTabs
                        options={[
                          { id: "light", label: "Light", icon: SunIcon },
                          { id: "dark", label: "Dark", icon: MoonIcon },
                          { id: "system", label: "Auto", icon: ComputerDesktopIcon },
                        ]}
                        activeId={theme}
                        onChange={handleThemeChange}
                        size="md"
                        layoutId="settings-theme-pill"
                      />
                    ) : (
                      <div className="w-48 h-9 bg-surface-sidebar rounded-full border border-border-default" />
                    )}
                  </div>
                </div>
              </Card>
            </section>

            {/* Section 2: Sidebar Preferences */}
            <section>
              <h2 className="text-[14px] font-semibold text-brand-primary mb-3">
                Sidebar Preferences
              </h2>
              <Card className="p-5 border border-border-default bg-surface-base rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xs font-semibold text-brand-primary">
                      Sidebar Layout
                    </h3>
                    <p className="text-[11px] text-brand-secondary mt-0.5">
                      Choose how the main navigation behaves on desktop.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Collapsible Silhouette */}
                    <button
                      type="button"
                      onClick={() => setSidebarLayout("collapsible")}
                      className="relative flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div
                        className={`w-24 h-16 rounded-xl border-2 p-1 flex gap-1 transition-all ${
                          sidebarLayout === "collapsible"
                            ? "border-brand-primary bg-brand-primary/5"
                            : "border-border-default bg-surface-subtle group-hover:border-border-hover"
                        }`}
                      >
                        <div
                          className={`w-3 rounded-full transition-colors ${
                            sidebarLayout === "collapsible"
                              ? "bg-brand-primary"
                              : "bg-brand-muted"
                          }`}
                        />
                        <div
                          className={`flex-1 rounded-lg transition-colors ${
                            sidebarLayout === "collapsible"
                              ? "bg-brand-primary/20"
                              : "bg-border-default"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium transition-colors ${
                          sidebarLayout === "collapsible"
                            ? "text-brand-primary font-semibold"
                            : "text-brand-muted group-hover:text-brand-secondary"
                        }`}
                      >
                        Collapsible
                      </span>
                    </button>

                    {/* Sliding Silhouette */}
                    <button
                      type="button"
                      onClick={() => setSidebarLayout("sliding")}
                      className="relative flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div
                        className={`w-24 h-16 rounded-xl border-2 p-1 relative flex gap-1 transition-all overflow-hidden ${
                          sidebarLayout === "sliding"
                            ? "border-brand-primary bg-brand-primary/5"
                            : "border-border-default bg-surface-subtle group-hover:border-border-hover"
                        }`}
                      >
                        <div
                          className={`absolute top-0 bottom-0 left-0 w-8 z-10 transition-colors ${
                            sidebarLayout === "sliding"
                              ? "bg-brand-primary/40"
                              : "bg-brand-muted/80"
                          }`}
                        />
                        <div
                          className={`flex-1 rounded-lg transition-colors z-0 ${
                            sidebarLayout === "sliding"
                              ? "bg-brand-primary/20"
                              : "bg-border-default"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium transition-colors ${
                          sidebarLayout === "sliding"
                            ? "text-brand-primary font-semibold"
                            : "text-brand-muted group-hover:text-brand-secondary"
                        }`}
                      >
                        Sliding Overlay
                      </span>
                    </button>
                  </div>
                </div>
              </Card>
            </section>

            {/* Section 3: Financial Units */}
            <section>
              <h2 className="text-[14px] font-semibold text-brand-primary mb-3">
                Financial Units & Telemetry
              </h2>
              <Card className="p-5 border border-border-default bg-surface-base rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-brand-primary">
                      Default Currency
                    </h3>
                    <p className="text-[11px] text-brand-secondary mt-0.5">
                      All cross-platform revenues will be converted to this currency.
                    </p>
                  </div>

                  <Dropdown
                    options={(Object.keys(CURRENCY_RATES) as CurrencyCode[]).map((cur) => ({
                      id: cur,
                      label: `${cur} (${CURRENCY_RATES[cur].symbol})`,
                      sublabel: cur === "USD" ? "Primary Base" : undefined,
                    }))}
                    value={primaryCurrency}
                    onChange={(id) => setPrimaryCurrency(id as CurrencyCode)}
                    icon={CurrencyDollarIcon}
                    size="md"
                    width="180px"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border-default">
                  <div>
                    <h3 className="text-xs font-semibold text-brand-primary">
                      Milestone Detection Threshold
                    </h3>
                    <p className="text-[11px] text-brand-secondary mt-0.5">
                      Trigger automated graphic generation at revenue increments.
                    </p>
                  </div>

                  <div className="relative w-36">
                    <CurrencyDollarIcon
                      className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-muted"
                    />
                    <input
                      type="number"
                      value={milestoneThreshold}
                      onChange={(e) => setMilestoneThreshold(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-1.5 rounded-full bg-surface-subtle border border-border-default text-xs text-brand-primary outline-none focus:border-brand-primary/40 transition shadow-xs"
                    />
                  </div>
                </div>
              </Card>
            </section>

            {/* Section 4: Brand Identity & Voice */}
            <section>
              <h2 className="text-[14px] font-semibold text-brand-primary mb-3">
                Workspace Identity & Voice
              </h2>
              <Card className="p-5 border border-border-default bg-surface-base rounded-2xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-brand-secondary">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full px-3.5 py-1.5 rounded-full bg-surface-subtle border border-border-default text-xs text-brand-primary outline-none focus:border-brand-primary/40 transition shadow-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-brand-secondary">
                      Founder Handle
                    </label>
                    <input
                      type="text"
                      value={founderHandle}
                      onChange={(e) => setFounderHandle(e.target.value)}
                      className="w-full px-3.5 py-1.5 rounded-full bg-surface-subtle border border-border-default text-xs text-brand-primary outline-none focus:border-brand-primary/40 transition shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-border-default">
                  <label className="text-xs font-medium text-brand-secondary block">
                    Default Copywriting Tone
                  </label>
                  <AnimatedTabs
                    options={[
                      { id: "founder", label: "Founder-Style" },
                      { id: "minimal", label: "Minimal & Punchy" },
                      { id: "story", label: "Story-Driven" },
                      { id: "technical", label: "Engineering" },
                    ]}
                    activeId={selectedVoice}
                    onChange={(id) => setSelectedVoice(id)}
                    size="md"
                    layoutId="settings-voice-pill"
                  />
                </div>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
