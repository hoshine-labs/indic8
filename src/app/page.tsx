"use client";

import React from "react";
import { useIndic8Store } from "@/lib/indic8Store";
import { useMounted } from "@/lib/useMounted";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DashboardView } from "@/components/dashboard";
import { ProductsView } from "@/components/products";
import { CompareView } from "@/components/compare";
import { GalleryView } from "@/components/gallery";
import { ActivityView } from "@/components/activity";
import { ProvidersView } from "@/components/providers";
import { SettingsView } from "@/components/settings";
import { StudioView } from "@/components/studio";
import { ProfileView } from "@/components/profile";
import { BatchExportModal } from "@/components/export";
import { OnboardingModal } from "@/components/onboarding";

export default function Indic8MasterApp() {
  const { activeTab } = useIndic8Store();
  const mounted = useMounted();

  const currentTab = mounted ? activeTab : "dashboard";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-canvas text-brand-primary">
      {/* 1. Left Minimal Sidebar */}
      <Sidebar />

      {/* 2. Right Viewport */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Dynamic Main Workspace Tab */}
        <main className="flex-1 overflow-y-auto bg-surface-canvas relative">
          {currentTab === "dashboard" && <DashboardView />}
          {currentTab === "products" && <ProductsView />}
          {currentTab === "compare" && <CompareView />}
          {currentTab === "gallery" && <GalleryView />}
          {currentTab === "activity" && <ActivityView />}
          {currentTab === "providers" && <ProvidersView />}
          {currentTab === "studio" && <StudioView />}
          {currentTab === "settings" && <SettingsView />}
          {currentTab === "profile" && <ProfileView />}
        </main>
      </div>

      {/* Global Modals */}
      <BatchExportModal />
      <OnboardingModal />
    </div>
  );
}
