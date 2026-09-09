"use client";

import React, { useState, useId, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui";
import { SyncedAvatar } from "@/components/ui/SyncedAvatar";
import {
  HomeIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  ClockIcon,
  CircleStackIcon,
  PaintBrushIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { useSidebar } from "@/context/SidebarContext";
import { useIndic8Store } from "@/lib/indic8Store";
import { ActiveNavTab } from "@/lib/types";
import { useSession } from "@/lib/auth/client";
import { AuthModal } from "@/components/auth/AuthModal";
import { useMounted } from "@/lib/useMounted";

export function Sidebar() {
  const mounted = useMounted();
  const { activeTab, setActiveTab, postWorthyMilestones } = useIndic8Store();
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [bottomHoveredId, setBottomHoveredId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const groupId = useId();

  const { data: session, isPending } = useSession();
  const user = session?.user;

  const { isMobileOpen, setIsMobileOpen, isExpanded, setIsExpanded, sidebarLayout } =
    useSidebar();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobileOpen]);

  const currentTab = mounted ? activeTab : "dashboard";
  const badgeCount = mounted && postWorthyMilestones.length > 0 ? postWorthyMilestones.length : undefined;

  const navigation: Array<{
    id: ActiveNavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
      { id: "dashboard", label: "Dashboard", icon: <HomeIcon className="w-[18px] h-[18px]" /> },
      { id: "products", label: "Products", icon: <CubeIcon className="w-[18px] h-[18px]" /> },
      { id: "compare", label: "Compare", icon: <ArrowsRightLeftIcon className="w-[18px] h-[18px]" /> },
      {
        id: "gallery",
        label: "Gallery",
        icon: <SparklesIcon className="w-[18px] h-[18px]" />,
        badge: badgeCount,
      },
      { id: "activity", label: "Activity", icon: <ClockIcon className="w-[18px] h-[18px]" /> },
      { id: "providers", label: "Providers", icon: <CircleStackIcon className="w-[18px] h-[18px]" /> },
      { id: "studio", label: "Studio Canvas", icon: <PaintBrushIcon className="w-[18px] h-[18px]" /> },
    ];

  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Account");
  const userInitials = (user?.name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleProfileClick = () => {
    if (user) {
      setActiveTab("profile");
      setIsMobileOpen(false);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Flex Spacer */}
      <div
        aria-hidden="true"
        className={`sidebar-spacer shrink-0 sidebar-layout-transition ${isExpanded
          ? "w-0 md:w-56"
          : sidebarLayout === "sliding"
            ? "w-0 md:w-0"
            : "w-0 md:w-16"
          }`}
      />

      <aside
        className={`sidebar-aside sidebar-layout-transition bg-surface-sidebar border-r border-border-default flex flex-col justify-between h-full select-none overflow-hidden fixed inset-y-0 left-0 z-50 transform ${isMobileOpen ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full md:translate-x-0"
          } ${isExpanded ? "w-56" : sidebarLayout === "sliding" ? "w-0 border-r-0" : "w-16"}`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Logo Header */}
          <div className="sidebar-logo-header h-[3.75rem] px-4 w-full border-b border-border-default shrink-0">
            <div className="flex items-center justify-between h-full w-full">
              {/* Left side: Logo & Title */}
              <div
                className="flex items-center cursor-pointer"
                onClick={() => {
                  if (sidebarLayout === "collapsible") {
                    if (typeof window !== "undefined" && window.innerWidth >= 768) {
                      setIsExpanded(!isExpanded);
                    } else {
                      setIsMobileOpen(false);
                    }
                  }
                }}
                onMouseEnter={() => sidebarLayout === "collapsible" && setIsLogoHovered(true)}
                onMouseLeave={() => sidebarLayout === "collapsible" && setIsLogoHovered(false)}
              >
                <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
                  <AnimatePresence>
                    {sidebarLayout === "collapsible" && isLogoHovered ? (
                      <motion.div
                        key="arrow"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute flex items-center justify-center text-brand-primary hidden md:flex"
                      >
                        {isExpanded ? (
                          <ChevronLeftIcon className="w-4 h-4" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4" />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="logo"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute flex items-center justify-center"
                      >
                        <Logo variant="icon" size={18} iconClassName="text-brand-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div
                  className={`ml-2 sidebar-layout-transition whitespace-nowrap overflow-hidden ${isExpanded ? "opacity-100 max-w-36" : "opacity-0 max-w-0"
                    }`}
                >
                  <Logo variant="text" textClassName="text-brand-primary font-bold tracking-tight" />
                </div>
              </div>

              {/* Right side: Close Button (Mobile only) */}
              <div className="flex items-center justify-center md:hidden">
                <button
                  className="p-1 text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav
            className="relative px-3 pt-3 isolate flex-1 overflow-x-hidden"
            onMouseLeave={() => setHoveredTab(null)}
          >
            <ul className="relative z-20 flex flex-col gap-1 m-0 p-0">
              {navigation.map((item) => {
                const isActive = currentTab === item.id;
                const isHovered = hoveredTab === item.id;

                return (
                  <li key={item.id} className="h-9 flex items-center">
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileOpen(false);
                      }}
                      onMouseEnter={() => setHoveredTab(item.id)}
                      className={`relative w-full h-9 flex items-center rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer ${isActive ? "text-brand-primary font-semibold" : "text-brand-muted"
                        }`}
                    >
                      {mounted && isHovered && (
                        <motion.div
                          layoutId={`sidebar-ghost-${groupId}`}
                          className="absolute inset-0 bg-border-default rounded-full z-0"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                      )}

                      {mounted && isActive && (
                        <motion.div
                          layoutId={`sidebar-active-${groupId}`}
                          className="absolute inset-0 bg-surface-base border border-border-default shadow-xs rounded-full z-[5]"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                      )}

                      <div className="relative z-20 w-10 h-9 shrink-0 flex items-center justify-center">
                        <div
                          className={`transition-colors duration-200 ${isActive ? "text-brand-primary" : "text-brand-muted"
                            }`}
                        >
                          {item.icon}
                        </div>
                      </div>

                      <div
                        className={`relative z-20 flex-1 flex items-center justify-between ml-1 pr-2 sidebar-layout-transition whitespace-nowrap overflow-hidden ${isExpanded ? "opacity-100 max-w-40" : "opacity-0 max-w-0"
                          }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="inline-flex px-1.5 aspect-square items-center justify-center rounded-full text-[10px] font-bold bg-indigo-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom Section: Settings + User Profile */}
        <div
          className="px-3 pb-3 shrink-0 flex flex-col gap-1.5 border-t border-border-default pt-2"
          onMouseLeave={() => setBottomHoveredId(null)}
        >
          {/* Settings Button */}
          <button
            onClick={() => {
              setActiveTab("settings");
              setIsMobileOpen(false);
            }}
            onMouseEnter={() => setBottomHoveredId("settings")}
            className={`relative w-full flex items-center h-9 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer ${currentTab === "settings" ? "text-brand-primary font-semibold" : "text-brand-muted"
              }`}
          >
            {mounted && bottomHoveredId === "settings" && (
              <motion.div
                layoutId={`sidebar-ghost-bottom-${groupId}`}
                className="absolute inset-0 bg-border-default rounded-full z-0"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}

            {mounted && currentTab === "settings" && (
              <motion.div
                layoutId={`sidebar-active-bottom-${groupId}`}
                className="absolute inset-0 bg-surface-base border border-border-default shadow-xs rounded-full z-[5]"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}

            <div className="relative z-20 w-10 h-9 shrink-0 flex items-center justify-center">
              <Cog6ToothIcon
                className={`w-[18px] h-[18px] ${currentTab === "settings" ? "text-brand-primary" : "text-brand-muted"}`}
              />
            </div>
            <div
              className={`relative z-20 flex-1 flex items-center ml-1 sidebar-layout-transition whitespace-nowrap overflow-hidden ${isExpanded ? "opacity-100 max-w-36" : "opacity-0 max-w-0"
                }`}
            >
              <span className="truncate text-left">Settings</span>
            </div>
          </button>

          {/* User Profile Section (Under Settings) */}
          {mounted && isPending ? (
            <div className="w-full h-10 rounded-full bg-surface-subtle/50 animate-pulse flex items-center px-2">
              <div className="w-7 h-7 rounded-full bg-surface-subtle" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleProfileClick}
              onMouseEnter={() => setBottomHoveredId("profile")}
              className={`relative w-full flex items-center h-10 px-1 rounded-full transition-colors duration-150 cursor-pointer ${currentTab === "profile"
                ? "text-brand-primary font-semibold"
                : "text-brand-muted hover:text-brand-primary"
                }`}
              title={user ? `Signed in as ${user.email} (Click to open profile)` : "Sign In / Create Account"}
            >
              {mounted && bottomHoveredId === "profile" && (
                <motion.div
                  layoutId={`sidebar-ghost-bottom-${groupId}`}
                  className="absolute inset-0 bg-border-default rounded-full z-0"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}

              {mounted && currentTab === "profile" && (
                <motion.div
                  layoutId={`sidebar-active-bottom-${groupId}`}
                  className="absolute inset-0 bg-surface-base border border-border-default shadow-xs rounded-full z-[5]"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}

              {/* Avatar (Synchronized Master GIF playback) */}
              <div className="relative z-20 w-7 h-7 shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-surface-subtle border border-border-default text-brand-primary font-bold text-[11px] shadow-2xs">
                <SyncedAvatar
                  src={user?.image}
                  alt={userName}
                  fallbackText={user ? userInitials : undefined}
                  fallbackIcon={!user ? <UserIcon className="w-4 h-4 text-brand-secondary" /> : undefined}
                  className="w-full h-full"
                />
              </div>

              {/* Name */}
              <div
                className={`relative z-20 flex-1 flex items-center ml-2.5 sidebar-layout-transition whitespace-nowrap overflow-hidden ${isExpanded ? "opacity-100 max-w-36" : "opacity-0 max-w-0"
                  }`}
              >
                <span
                  className={`text-xs truncate ${currentTab === "profile" || user
                    ? "font-semibold text-brand-primary"
                    : "text-brand-secondary font-medium"
                    }`}
                >
                  {user ? userName : "Sign In"}
                </span>
              </div>
            </button>
          )}
        </div>
      </aside>

      {/* Auth Modal Trigger (When logged out) */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
