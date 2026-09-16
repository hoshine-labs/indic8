"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import { useIndic8Store, CURRENCY_RATES } from "@/lib/indic8Store";
import { useMounted } from "@/lib/useMounted";
import { useSession, signOut } from "@/lib/auth/client";
import { AuthModal } from "@/components/auth/AuthModal";
import { Card, AnimatedTabs, Dropdown } from "@/components/ui";
import { SyncedAvatar } from "@/components/ui/SyncedAvatar";
import { AvatarCropModal } from "./AvatarCropModal";
import { LocalPreferences } from "@/lib/storage/localPreferences";
import { CurrencyCode } from "@/lib/types";
import { DARK_THEME_OPTIONS } from "@/lib/theme";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  CurrencyDollarIcon,
  UserIcon,
  PhotoIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  CheckIcon,
  SparklesIcon,
  CircleStackIcon,
  ArrowRightIcon,
  IdentificationIcon,
  EnvelopeIcon,
  PencilIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/20/solid";

type SettingsTab = "general" | "account";

export const SettingsView: React.FC = () => {
  const mounted = useMounted();
  const { sidebarLayout, setSidebarLayout } = useSidebar();
  const { theme, setTheme, isDark, darkPreset, setDarkPreset } = useTheme();
  const {
    primaryCurrency,
    setPrimaryCurrency,
    loadDemoData,
    clearAllData,
    isDemoMode,
    providers,
    setActiveTab,
  } = useIndic8Store();

  const { data: session, refetch: refetchSession } = useSession();
  const user = session?.user;

  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>("general");

  // General tab states
  const [workspaceName, setWorkspaceName] = useState("Acme Software Studio");
  const [founderHandle, setFounderHandle] = useState("@founder");
  const [milestoneThreshold, setMilestoneThreshold] = useState("10000");
  const [selectedVoice, setSelectedVoice] = useState("founder");

  // Account tab states
  const [displayName, setDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userBio, setUserBio] = useState("Indie Hacker & Software Creator");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [selectedCropFile, setSelectedCropFile] = useState<File | null>(null);
  const [initialCropSrc, setInitialCropSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and synchronize user profile info
  useEffect(() => {
    const savedName = LocalPreferences.get("customDisplayName");
    const savedAvatar = LocalPreferences.get("customAvatarUrl");
    const savedBio = LocalPreferences.get("customBio");

    if (user?.name) {
      setDisplayName(savedName || user.name);
    } else if (savedName) {
      setDisplayName(savedName);
    } else {
      setDisplayName("Founder");
    }

    if (user?.email) {
      setUserEmail(user.email);
    } else {
      setUserEmail("founder@indic8.app");
    }

    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    } else if (user?.image) {
      setAvatarUrl(user.image);
    }

    if (savedBio) {
      setUserBio(savedBio);
    }
  }, [user]);

  const handleThemeModeChange = (newTheme: string) => {
    setTheme(newTheme as ThemeMode);
  };

  const handleEditCurrentAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (avatarUrl) {
      setSelectedCropFile(null);
      setInitialCropSrc(avatarUrl);
      setIsCropModalOpen(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedCropFile(file);
      setInitialCropSrc(null);
      setIsCropModalOpen(true);
    }
    // Reset input value so same file can be re-selected if needed
    e.target.value = "";
  };

  const handleAvatarSaved = (
    newAvatarUrl: string,
    crop?: { zoom: number; panX: number; panY: number }
  ) => {
    setAvatarUrl(newAvatarUrl);
    LocalPreferences.set("customAvatarUrl", newAvatarUrl);
    if (crop) {
      LocalPreferences.set("customAvatarCrop", crop);
    }
    window.dispatchEvent(new Event("indic8_profile_updated"));
    showSavedNotification();
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined);
    LocalPreferences.set("customAvatarUrl", undefined as any);
    LocalPreferences.set("customAvatarCrop", undefined as any);
    window.dispatchEvent(new Event("indic8_profile_updated"));
    showSavedNotification();
  };

  const handleSaveProfileDetails = () => {
    if (displayName.trim()) {
      LocalPreferences.set("customDisplayName", displayName.trim());
    }
    LocalPreferences.set("customBio", userBio.trim());
    window.dispatchEvent(new Event("indic8_profile_updated"));
    showSavedNotification();
  };

  const showSavedNotification = () => {
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
    }, 2500);
  };

  const activeThemeOption =
    DARK_THEME_OPTIONS.find((o) => o.id === darkPreset) || DARK_THEME_OPTIONS[0];

  const currentInitials = (displayName || user?.name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col h-full bg-surface-canvas select-none">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-default">
            <div>
              <h1 className="text-xl font-bold text-brand-primary tracking-tight">Settings</h1>
              <p className="text-xs text-brand-secondary mt-1">
                Customize your appearance, workspace preferences, and profile identity.
              </p>
            </div>

            {/* Top Level Nav Tabs: General vs Account */}
            <div className="shrink-0">
              {mounted ? (
                <AnimatedTabs
                  options={[
                    { id: "general", label: "General", icon: PaintBrushIcon },
                    { id: "account", label: "Account", icon: UserIcon },
                  ]}
                  activeId={activeSettingsTab}
                  onChange={(id) => setActiveSettingsTab(id as SettingsTab)}
                  size="md"
                  layoutId="settings-main-tab-pill"
                />
              ) : (
                <div className="w-52 h-9 bg-surface-base rounded-full border border-border-default" />
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: GENERAL SETTINGS */}
          {/* ========================================================================= */}
          {activeSettingsTab === "general" && (
            <div className="space-y-6">
              {/* Section 1: Appearance & Theme Selector */}
              <section className="relative z-30">
                <h2 className="text-[14px] font-semibold text-brand-primary mb-3">
                  Appearance
                </h2>
                <div className="p-5 border border-border-default bg-surface-base rounded-2xl space-y-4 shadow-xs overflow-visible">
                  {/* Theme Mode (Light / Dark / Auto) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-brand-primary">Theme Mode</h3>
                      <p className="text-[11px] text-brand-secondary mt-0.5">
                        Choose between light, dark, or system appearance.
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
                          onChange={handleThemeModeChange}
                          size="md"
                          layoutId="settings-theme-pill"
                        />
                      ) : (
                        <div className="w-48 h-9 bg-surface-sidebar rounded-full border border-border-default" />
                      )}
                    </div>
                  </div>

                  {/* Dark Mode Theme Preset & Accent Dropdown (Standard Non-Clipping Dropdown) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border-default relative z-40">
                    <div>
                      <h3 className="text-xs font-semibold text-brand-primary">
                        Dark Palette &amp; Accent
                      </h3>
                      <p className="text-[11px] text-brand-secondary mt-0.5">
                        Select a curated dark tone or neutral base with Tailwind color accent.
                      </p>
                    </div>

                    <div className="shrink-0 relative">
                      {mounted ? (
                        <Dropdown
                          options={DARK_THEME_OPTIONS.map((opt) => ({
                            id: opt.id,
                            label: opt.label,
                            sublabel: opt.category === "neutral" ? "Neutral Accent" : "Curated Dark",
                            icon: (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 inline-block shadow-2xs"
                                style={{ backgroundColor: opt.swatch }}
                              />
                            ),
                          }))}
                          value={darkPreset}
                          onChange={(id) => setDarkPreset(id as any)}
                          icon={
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 inline-block shadow-2xs"
                              style={{ backgroundColor: activeThemeOption.swatch }}
                            />
                          }
                          size="md"
                          width="240px"
                          maxHeight="max-h-72"
                          align="right"
                        />
                      ) : (
                        <div className="w-44 h-9 bg-surface-sidebar rounded-full border border-border-default" />
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Sidebar Preferences */}
              <section className="relative z-10">
                <h2 className="text-[14px] font-semibold text-brand-primary mb-3">
                  Sidebar Preferences
                </h2>
                <div className="p-5 border border-border-default bg-surface-base rounded-2xl shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xs font-semibold text-brand-primary">Sidebar Layout</h3>
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
                </div>
              </section>

              {/* Section 3: Financial Units */}
              <section className="relative z-10">
                <h2 className="text-[14px] font-semibold text-brand-primary mb-3">
                  Financial Units &amp; Telemetry
                </h2>
                <div className="p-5 border border-border-default bg-surface-base rounded-2xl space-y-4 shadow-xs overflow-visible">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-semibold text-brand-primary">Default Currency</h3>
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
                      align="right"
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
                      <CurrencyDollarIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                      <input
                        type="number"
                        value={milestoneThreshold}
                        onChange={(e) => setMilestoneThreshold(e.target.value)}
                        className="w-full pl-8 pr-3.5 py-1.5 rounded-full bg-surface-subtle border border-border-default text-xs text-brand-primary outline-none focus:border-brand-primary/40 transition shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 4: Brand Identity & Voice */}
              <section className="relative z-0">
                <h2 className="text-[14px] font-semibold text-brand-primary mb-3">
                  Workspace Identity &amp; Voice
                </h2>
                <div className="p-5 border border-border-default bg-surface-base rounded-2xl space-y-4 shadow-xs">
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
                </div>
              </section>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ACCOUNT SETTINGS */}
          {/* ========================================================================= */}
          {activeSettingsTab === "account" && (
            <div className="space-y-6">
              {/* Profile Avatar & Identity Card */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[14px] font-semibold text-brand-primary">
                    Profile &amp; Identity
                  </h2>
                  {isSavedNotice && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full animate-fade-in font-medium">
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Changes Saved</span>
                    </span>
                  )}
                </div>

                <div className="p-6 border border-border-default bg-surface-base rounded-2xl space-y-6 shadow-xs">
                  {/* Avatar Upload / Crop Area */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-border-default">
                    <div className="flex items-center gap-5">
                      {/* Avatar Display with Floating Edit Pencil Circle */}
                      <div className="relative shrink-0 group">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-20 h-20 md:w-22 md:h-22 rounded-full overflow-hidden border-2 border-border-default shadow-md bg-surface-subtle flex items-center justify-center relative cursor-pointer"
                        >
                          <SyncedAvatar
                            src={avatarUrl}
                            alt={displayName}
                            fallbackText={currentInitials}
                            className="w-full h-full"
                            fallbackClassName="w-full h-full bg-surface-subtle flex items-center justify-center text-brand-primary font-bold text-2xl"
                          />

                          {/* Center Hover Overlay to Select/Upload New Image */}
                          <div className="absolute inset-0 rounded-full bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                            <ArrowUpTrayIcon className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px] font-semibold">Change</span>
                          </div>
                        </div>

                        {/* Floating Pen Button on bottom-right corner - shown ONLY on hover to edit/crop current picture */}
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={handleEditCurrentAvatar}
                            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-surface-base border border-border-default hover:bg-surface-subtle shadow-md flex items-center justify-center text-brand-primary opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-150 cursor-pointer active:scale-90 z-10"
                            title="Crop / Edit Current Picture"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Info & Choose Button (only when avatar is NOT set) */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div>
                          <h3 className="text-xs font-semibold text-brand-primary">Profile Picture</h3>
                          <p className="text-[11px] text-brand-secondary mt-0.5">
                            {avatarUrl
                              ? "Click to change picture or adjust crop."
                              : "Upload a JPG, PNG, WebP, or animated GIF."}
                          </p>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        {!avatarUrl && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-8 px-4 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                            >
                              <PhotoIcon className="w-3.5 h-3.5" />
                              <span>Choose Picture</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remove button on the RIGHT side */}
                    {avatarUrl && (
                      <div className="self-start sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="h-8 px-3.5 rounded-full bg-surface-subtle hover:bg-surface-base border border-border-default text-brand-secondary hover:text-status-danger text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Form Details: Name & Bio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-brand-secondary">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Satoshi Nakamoto"
                        className="w-full px-3.5 py-2 rounded-full bg-surface-subtle border border-border-default text-xs text-brand-primary outline-none focus:border-brand-primary/40 transition shadow-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-brand-secondary">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={userEmail}
                        readOnly={!!user?.email}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className={`w-full px-3.5 py-2 rounded-full bg-surface-subtle border border-border-default text-xs text-brand-primary outline-none font-mono transition shadow-xs ${
                          user?.email ? "opacity-75 cursor-not-allowed" : "focus:border-brand-primary/40"
                        }`}
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-medium text-brand-secondary">
                        Role / Short Bio
                      </label>
                      <input
                        type="text"
                        value={userBio}
                        onChange={(e) => setUserBio(e.target.value)}
                        placeholder="e.g. Solo Founder &amp; SaaS Builder"
                        className="w-full px-3.5 py-2 rounded-full bg-surface-subtle border border-border-default text-xs text-brand-primary outline-none focus:border-brand-primary/40 transition shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Save Profile Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfileDetails}
                      className="h-8 px-5 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Save Profile</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Authentication & Gateway Status Grid */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account Status Card */}
                <div className="p-5 border border-border-default bg-surface-base rounded-2xl flex flex-col justify-between space-y-4 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-semibold text-brand-primary">
                          Authentication Status
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle border border-border-default text-brand-primary font-semibold">
                        {user ? "Authenticated" : "Local Guest"}
                      </span>
                    </div>

                    <p className="text-[11px] text-brand-secondary leading-relaxed">
                      {user
                        ? `Logged in as ${user.email}. Settings and credentials are synchronized with your account.`
                        : "Operating in local guest storage. Sign in to synchronize credentials and real-time revenue webhooks across devices."}
                    </p>
                  </div>

                  <div className="pt-2">
                    {user ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await signOut();
                          if (refetchSession) refetchSession();
                        }}
                        className="h-7 px-3 rounded-full text-xs font-semibold text-status-danger bg-status-danger-subtle hover:bg-status-danger-light transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="h-7 px-3.5 rounded-full bg-surface-subtle hover:bg-surface-base border border-border-default text-brand-primary text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>Sign In / Create Account</span>
                        <ArrowRightIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Gateways Shortcut Card */}
                <div className="p-5 border border-border-default bg-surface-base rounded-2xl flex flex-col justify-between space-y-4 shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CircleStackIcon className="w-4 h-4 text-brand-muted" />
                        <h3 className="text-xs font-semibold text-brand-primary">
                          Connected Gateways
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-semibold">
                        {providers.length} Active
                      </span>
                    </div>

                    <p className="text-[11px] text-brand-secondary leading-relaxed">
                      Manage credentials, real-time webhooks, and sync schedules for Stripe, Polar, Lemon Squeezy, Paddle, and Gumroad.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("providers")}
                      className="h-7 px-3.5 rounded-full bg-surface-subtle hover:bg-surface-base border border-border-default text-brand-primary text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Manage Providers</span>
                      <ArrowRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Data Management & Danger Zone */}
              <section>
                <h2 className="text-[14px] font-semibold text-brand-primary mb-3">
                  Data &amp; Cache Management
                </h2>
                <div className="p-5 border border-border-default bg-surface-base rounded-2xl space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-semibold text-brand-primary">Demo Dataset</h3>
                      <p className="text-[11px] text-brand-secondary mt-0.5">
                        Populate the workspace with realistic multi-provider products and orders.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={loadDemoData}
                      className="h-8 px-4 rounded-full bg-surface-subtle hover:bg-surface-base border border-border-default text-xs font-semibold text-brand-primary transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5" />
                      <span>{isDemoMode ? "Reload Demo Data" : "Load Demo Data"}</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border-default">
                    <div>
                      <h3 className="text-xs font-semibold text-status-danger">Clear Workspace Data</h3>
                      <p className="text-[11px] text-brand-secondary mt-0.5">
                        Reset all local preferences, cached metrics, and product catalogs.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearAllData}
                      className="h-8 px-4 rounded-full bg-status-danger-subtle hover:bg-status-danger-light text-status-danger text-xs font-semibold transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      <span>Clear All Data</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Crop & Preview Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        file={selectedCropFile}
        initialImageSrc={initialCropSrc}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedCropFile(null);
          setInitialCropSrc(null);
        }}
        onSave={handleAvatarSaved}
      />

      {/* Auth Modal for Sign In */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          if (refetchSession) refetchSession();
        }}
      />
    </div>
  );
};
