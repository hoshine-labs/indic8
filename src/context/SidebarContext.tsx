"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type SidebarLayout = "collapsible" | "sliding";

interface SidebarContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (isExpanded: boolean) => void;
  sidebarLayout: SidebarLayout;
  setSidebarLayout: (layout: SidebarLayout) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [sidebarLayout, setSidebarLayoutState] = useState<SidebarLayout>(() => {
    if (typeof window !== "undefined") {
      const savedLayout = localStorage.getItem("indic8-sidebar-layout") as SidebarLayout | null;
      if (savedLayout && (savedLayout === "collapsible" || savedLayout === "sliding")) {
        return savedLayout;
      }
    }
    return "collapsible";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-sidebar-expanded", isExpanded.toString());
  }, [isExpanded]);

  useEffect(() => {
    document.documentElement.setAttribute("data-sidebar-layout", sidebarLayout);
  }, [sidebarLayout]);

  const setSidebarLayout = (layout: SidebarLayout) => {
    setSidebarLayoutState(layout);
    localStorage.setItem("indic8-sidebar-layout", layout);
  };

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        setIsMobileOpen,
        isExpanded,
        setIsExpanded,
        sidebarLayout,
        setSidebarLayout,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
