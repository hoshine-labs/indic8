"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
import {
  ThemeTokens,
  DarkThemePreset,
  ACTIVE_DARK_THEME_KEYWORD,
  getThemeTokens,
  applyThemeToDocument,
} from "@/lib/theme";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  darkPreset: DarkThemePreset;
  setDarkPreset: (preset: DarkThemePreset) => void;
  tokens: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function runSynchronizedTransition(updateFn: () => void) {
  if (typeof document === "undefined") {
    updateFn();
    return;
  }

  const root = document.documentElement;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hasViewTransition =
    "startViewTransition" in document && !prefersReducedMotion;

  if (hasViewTransition) {
    // 1. Temporarily disable sub-element transitions so the new DOM snapshot
    // is captured at its complete, final values with zero staggered delays
    root.classList.add("theme-transitioning");

    try {
      const transition = (
        document as unknown as {
          startViewTransition: (cb: () => void) => { finished: Promise<void> };
        }
      ).startViewTransition(() => {
        updateFn();
      });

      if (transition && typeof transition.finished?.then === "function") {
        transition.finished.finally(() => {
          root.classList.remove("theme-transitioning");
        });
      } else {
        requestAnimationFrame(() => {
          root.classList.remove("theme-transitioning");
        });
      }
    } catch {
      root.classList.remove("theme-transitioning");
      updateFn();
    }
  } else {
    // Fallback for browsers without View Transitions (or with reduced motion)
    root.classList.add("theme-fade-fallback");
    updateFn();
    window.setTimeout(() => {
      root.classList.remove("theme-fade-fallback");
    }, 260);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [darkPreset, setDarkPresetState] =
    useState<DarkThemePreset>(ACTIVE_DARK_THEME_KEYWORD);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(true);

  useEffect(() => {
    // Read saved preference on client mount
    try {
      const savedTheme = localStorage.getItem("indic8-theme") as ThemeMode | null;
      if (
        savedTheme &&
        (savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system")
      ) {
        setThemeState(savedTheme);
      }
      const savedPreset = localStorage.getItem(
        "indic8-dark-preset"
      ) as DarkThemePreset | null;
      if (savedPreset) {
        setDarkPresetState(savedPreset);
      }
    } catch {}

    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setSystemIsDark(mediaQuery.matches);

      const handleSystemChange = (e: MediaQueryListEvent) => {
        setSystemIsDark(e.matches);
      };

      mediaQuery.addEventListener("change", handleSystemChange);
      return () => mediaQuery.removeEventListener("change", handleSystemChange);
    }
  }, []);

  const isDark = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return systemIsDark;
  }, [theme, systemIsDark]);

  const tokens = useMemo(() => {
    return getThemeTokens(isDark, darkPreset);
  }, [isDark, darkPreset]);

  // Synchronize on system dark change if mode is "system"
  useEffect(() => {
    if (theme === "system") {
      applyThemeToDocument(systemIsDark, darkPreset);
    }
  }, [theme, systemIsDark, darkPreset]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      const nextIsDark =
        newTheme === "dark"
          ? true
          : newTheme === "light"
          ? false
          : typeof window !== "undefined"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
          : true;

      runSynchronizedTransition(() => {
        applyThemeToDocument(nextIsDark, darkPreset);
        flushSync(() => {
          setThemeState(newTheme);
        });
        try {
          localStorage.setItem("indic8-theme", newTheme);
        } catch {}
      });
    },
    [darkPreset]
  );

  const setDarkPreset = useCallback(
    (newPreset: DarkThemePreset) => {
      runSynchronizedTransition(() => {
        applyThemeToDocument(isDark, newPreset);
        flushSync(() => {
          setDarkPresetState(newPreset);
        });
        try {
          localStorage.setItem("indic8-dark-preset", newPreset);
        } catch {}
      });
    },
    [isDark]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        darkPreset,
        setDarkPreset,
        tokens,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

