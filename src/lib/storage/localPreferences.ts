/**
 * Local Preferences Layer (localStorage)
 * 
 * Used strictly for lightweight, non-sensitive UI settings:
 * - Theme ("dark" | "light")
 * - Sidebar expanded & layout mode
 * - Last selected time range filter
 * - Table density
 * - Studio UI settings
 */

import { assertClientStorageSafe } from "./storagePolicy";

export interface UserLocalPreferences {
  theme: "dark" | "light";
  sidebarLayout: "sliding" | "floating";
  sidebarExpanded: boolean;
  lastDateRange: string;
  tableDensity: "compact" | "normal" | "spacious";
  lastActiveTab?: string;
  primaryCurrency?: string;
  dashboardMetricsOrder?: string[];
}

const DEFAULT_PREFERENCES: UserLocalPreferences = {
  theme: "dark",
  sidebarLayout: "sliding",
  sidebarExpanded: true,
  lastDateRange: "30d",
  tableDensity: "normal",
  lastActiveTab: "dashboard",
};

const PREFIX = "indic8_pref_";

export const LocalPreferences = {
  get<K extends keyof UserLocalPreferences>(key: K): UserLocalPreferences[K] {
    if (typeof window === "undefined") {
      return DEFAULT_PREFERENCES[key];
    }
    try {
      const raw = localStorage.getItem(`${PREFIX}${String(key)}`);
      if (raw === null) return DEFAULT_PREFERENCES[key];
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PREFERENCES[key];
    }
  },

  set<K extends keyof UserLocalPreferences>(key: K, value: UserLocalPreferences[K]): void {
    if (typeof window === "undefined") return;
    try {
      assertClientStorageSafe(String(key), value);
      localStorage.setItem(`${PREFIX}${String(key)}`, JSON.stringify(value));
    } catch (err) {
      console.warn(`[LocalPreferences] Failed to save preference: ${String(key)}`, err);
    }
  },

  getAll(): UserLocalPreferences {
    return {
      theme: this.get("theme"),
      sidebarLayout: this.get("sidebarLayout"),
      sidebarExpanded: this.get("sidebarExpanded"),
      lastDateRange: this.get("lastDateRange"),
      tableDensity: this.get("tableDensity"),
      lastActiveTab: this.get("lastActiveTab"),
    };
  },

  clear(): void {
    if (typeof window === "undefined") return;
    try {
      Object.keys(DEFAULT_PREFERENCES).forEach((key) => {
        localStorage.removeItem(`${PREFIX}${key}`);
      });
    } catch (err) {
      console.warn("[LocalPreferences] Failed to clear preferences", err);
    }
  },
};
