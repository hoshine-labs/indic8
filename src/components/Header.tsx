"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRightIcon,
  Bars3BottomLeftIcon,
  ArrowPathIcon,
  PlusIcon,
  MoonIcon,
  SunIcon,
  BeakerIcon,
} from "@heroicons/react/24/solid";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { useIndic8Store } from "@/lib/indic8Store";
import { useMounted } from "@/lib/useMounted";
import { Logo } from "@/components/ui";
import { ActiveNavTab } from "@/lib/types";

const tabTitleMap: Record<ActiveNavTab, { parent: string; child: string }> = {
  dashboard: { parent: "Workspace", child: "Dashboard" },
  products: { parent: "Catalog", child: "Products" },
  compare: { parent: "Intelligence", child: "Compare" },
  gallery: { parent: "Creative", child: "Gallery" },
  activity: { parent: "Telemetry", child: "Activity" },
  providers: { parent: "Gateways", child: "Providers" },
  studio: { parent: "Creative", child: "Studio Canvas" },
  settings: { parent: "App", child: "Settings" },
  profile: { parent: "Account", child: "Profile" },
};

export function Header() {
  const {
    activeTab,
    setActiveTab,
    syncAllProviders,
    isSyncingAny,
    setIsOnboardingOpen,
    isDemoMode,
    clearAllData,
    loadDemoData,
    providers,
  } = useIndic8Store();
  const { setIsMobileOpen, isExpanded, setIsExpanded, sidebarLayout } = useSidebar();
  const { isDark, setTheme } = useTheme();
  const mounted = useMounted();

  const currentRoute = tabTitleMap[mounted ? activeTab : "dashboard"] || { parent: "Workspace", child: "Dashboard" };

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const hasConnectedProviders = mounted && providers.length > 0;

  return (
    <header className="h-[3.75rem] bg-surface-canvas border-b border-border-default flex justify-between items-center px-4 md:px-6 flex-shrink-0 relative z-10 gap-4 select-none">
      <div className="flex items-center gap-2 min-w-0">
        {/* Toggle sidebar button ONLY on Desktop Sliding mode */}
        {sidebarLayout === "sliding" && (
          <button
            className="hidden md:flex mr-2 p-1 text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            title="Toggle Sidebar"
          >
            <Bars3BottomLeftIcon className="w-5 h-5" />
          </button>
        )}

        {/* Header Logo: Visible on Mobile */}
        <div
          className="header-logo flex items-center mr-4 cursor-pointer shrink-0 md:hidden"
          onClick={() => {
            setIsExpanded(true);
            setIsMobileOpen(true);
          }}
        >
          <Logo variant="full" size={18} iconClassName="text-brand-primary" textClassName="text-brand-primary font-bold" />
        </div>

        {/* Breadcrumbs */}
        <div className="header-breadcrumbs flex items-center">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="text-brand-muted text-xs font-medium hover:text-brand-primary transition-colors cursor-pointer hidden sm:block"
          >
            {currentRoute.parent}
          </button>
          <ChevronRightIcon className="text-brand-disabled w-3.5 h-3.5 mx-1 hidden sm:block" />
          <span className="text-brand-primary text-xs font-semibold">
            {currentRoute.child}
          </span>
        </div>

        {/* Demo Mode Indicator (Subtle badge with quick switch) */}
        {isDemoMode && (
          <div className="ml-3 hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-mono">
            <BeakerIcon className="w-3 h-3" />
            <span>Demo Data</span>
            <button
              onClick={clearAllData}
              className="ml-1 text-[9px] underline opacity-80 hover:opacity-100 cursor-pointer font-sans"
              title="Reset to authentic zero-data state"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sync Button (only if connected providers exist) */}
        {hasConnectedProviders && (
          <motion.button
            layout
            onClick={syncAllProviders}
            disabled={isSyncingAny}
            title="Synchronize connected payment channels"
            transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
            className="px-3.5 py-1.5 h-8 bg-surface-base border border-border-default text-brand-primary rounded-full text-xs font-medium hover:bg-surface-subtle active:scale-[0.98] whitespace-nowrap shrink-0 flex items-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-xs overflow-hidden"
          >
            <ArrowPathIcon
              className={`w-3.5 h-3.5 text-brand-secondary transition-transform ${isSyncingAny ? "animate-spin text-brand-primary" : ""}`}
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isSyncingAny ? "syncing" : "sync"}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 2 }}
                transition={{ duration: 0.18 }}
                className="hidden sm:inline font-medium"
              >
                {isSyncingAny ? "Syncing" : "Sync"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        )}

        {/* Demo Telemetry Switch (For previewing when in zero-data state) */}
        {!hasConnectedProviders && !isDemoMode && (
          <button
            onClick={loadDemoData}
            title="Preview interface with isolated sample data"
            className="px-3 py-1.5 h-8 bg-surface-base border border-dashed border-border-default text-brand-muted hover:text-brand-primary rounded-full text-xs font-medium hover:bg-surface-subtle active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <BeakerIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Load Demo Data</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        {mounted ? (
          <button
            onClick={toggleTheme}
            className="p-2 h-8 w-8 rounded-full bg-surface-base border border-border-default text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle transition flex items-center justify-center cursor-pointer shadow-xs"
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
        ) : (
          <div className="h-8 w-8 rounded-full bg-surface-base border border-border-default opacity-0" />
        )}

        {/* Primary Action Button */}
        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="px-3.5 py-1.5 h-8 bg-brand-primary hover:opacity-90 text-surface-canvas rounded-full text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>Connect Provider</span>
        </button>
      </div>
    </header>
  );
}
