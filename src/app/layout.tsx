import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { Indic8Provider } from "@/lib/indic8Store";
import { DARK_THEMES, generateCssVariables } from "@/lib/theme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  preload: false,
});

export const metadata: Metadata = {
  title: "indic8 — Unified Revenue & Product Intelligence",
  description:
    "Unified revenue and product intelligence command center for creators, indie hackers, and developers selling software across Stripe, Polar, RevenueCat, Google Play, App Store, and Lemon Squeezy.",
};

// Pre-serialized theme definitions for zero-flash initial execution
const serializedThemes = JSON.stringify(
  Object.fromEntries(
    Object.entries(DARK_THEMES).map(([k, v]) => [k, generateCssVariables(v)])
  )
);

const themeScript = `
(function() {
  try {
    var storedTheme = localStorage.getItem("indic8-theme");
    var storedPreset = localStorage.getItem("indic8-dark-preset") || "zinc";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = storedTheme === "dark" || (storedTheme !== "light" && prefersDark);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      var themes = ${serializedThemes};
      var vars = themes[storedPreset] || themes["zinc"];
      if (vars) {
        for (var key in vars) {
          root.style.setProperty(key, vars[key]);
        }
      }
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <head>
        <script
          id="indic8-theme-init"
          dangerouslySetInnerHTML={{ __html: themeScript }}
          suppressHydrationWarning
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-surface-canvas text-brand-primary overflow-hidden select-none"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SidebarProvider>
            <Indic8Provider>{children}</Indic8Provider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
