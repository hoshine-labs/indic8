"use client";

import React, { useMemo, memo } from "react";
import { useSession } from "@/lib/auth/client";
import { SocialPostData, PostStyleId, AspectRatioKey } from "./types";
import { BrandIcon } from "@/lib/brandLogos";
import { useStaticAvatar } from "@/lib/useStaticAvatar";
import { LocalPreferences } from "@/lib/storage/localPreferences";
import { useIndic8Store } from "@/lib/indic8Store";
import { Indic8Chart } from "@/components/charts/Indic8Chart";
import { RevenuePoint, CurrencyCode } from "@/lib/domain/types";

interface GalleryCanvasGraphicProps {
  post: SocialPostData;
  styleId?: PostStyleId;
  aspectRatio?: AspectRatioKey | string;
  className?: string;
  isUnrounded?: boolean;
}

export const GalleryCanvasGraphic: React.FC<GalleryCanvasGraphicProps> = memo(({
  post,
  styleId,
  aspectRatio,
  className = "",
  isUnrounded = false,
}) => {
  const { data: session } = useSession();
  const { products } = useIndic8Store();
  const customAvatar = typeof window !== "undefined" ? LocalPreferences.get("customAvatarUrl") : null;
  const userImage = customAvatar || session?.user?.image;
  const { staticUrl, hasError } = useStaticAvatar(userImage);

  // Effective style (1 = Claymorphism Chart, 2 = 3D Golden Medal Award)
  const effectiveStyleId = (styleId || post.defaultStyleId || 1) as PostStyleId;
  const isMedalStyle = effectiveStyleId === 2;

  // Effective Aspect Ratio
  const effectiveRatio = aspectRatio || post.aspectRatio || (isMedalStyle ? "16:9" : "4:5");

  const uniqueId = useMemo(
    () => post.id.replace(/[^a-zA-Z0-9_-]/g, ""),
    [post.id]
  );

  // Find matching product in store for authentic photos / metadata
  const product = useMemo(() => {
    return products.find(
      (p) => p.id === post.productId || p.name === post.productName
    );
  }, [products, post.productId, post.productName]);

  const rawProductImageUrl = product?.imageUrl || product?.medias?.[0];
  const productImageUrl = useMemo(() => {
    if (!rawProductImageUrl) return null;
    if (rawProductImageUrl.startsWith("data:") || rawProductImageUrl.startsWith("/")) {
      return rawProductImageUrl;
    }
    return `/api/image-proxy?url=${encodeURIComponent(rawProductImageUrl)}`;
  }, [rawProductImageUrl]);

  // Cache for extracted image dominant colors
  const [extractedColor, setExtractedColor] = React.useState<{
    r: number;
    g: number;
    b: number;
    h: number;
    s: number;
    l: number;
  } | null>(null);

  // Extract dominant key color directly from product image when available
  React.useEffect(() => {
    if (!productImageUrl || typeof window === "undefined") return;

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const size = 32;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let totalWeight = 0;
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Skip near-white/transparent background pixels
          if (r > 240 && g > 240 && b > 240) continue;
          // Skip dark background pixels (below 45) to avoid false color noise from dark icon backgrounds
          if (r < 45 && g < 45 && b < 45) continue;

          const rN = r / 255;
          const gN = g / 255;
          const bN = b / 255;
          const max = Math.max(rN, gN, bN);
          const min = Math.min(rN, gN, bN);
          const l = (max + min) / 2;
          const d = max - min;
          const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

          // Only consider pixels with real color saturation and reasonable luminance
          if (s < 0.25 || l < 0.20 || l > 0.85) continue;

          // Favor vibrant saturated pixels
          const weight = s * (1 - Math.abs(l - 0.5));
          if (weight > 0.05) {
            rSum += r * weight;
            gSum += g * weight;
            bSum += b * weight;
            totalWeight += weight;
          }
        }

        if (totalWeight > 0) {
          const avgR = Math.round(rSum / totalWeight);
          const avgG = Math.round(gSum / totalWeight);
          const avgB = Math.round(bSum / totalWeight);

          // RGB to HSL
          const rN = avgR / 255;
          const gN = avgG / 255;
          const bN = avgB / 255;
          const max = Math.max(rN, gN, bN);
          const min = Math.min(rN, gN, bN);
          const d = max - min;
          let h = 0;
          if (d !== 0) {
            if (max === rN) h = ((gN - bN) / d + (gN < bN ? 6 : 0)) * 60;
            else if (max === gN) h = ((bN - rN) / d + 2) * 60;
            else h = ((rN - gN) / d + 4) * 60;
          }
          const l = (max + min) / 2;
          const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

          setExtractedColor({
            r: avgR,
            g: avgG,
            b: avgB,
            h: Math.round(h),
            s: Math.max(0.40, s),
            l,
          });
        }
      } catch {
        // Fallback gracefully on cross-origin or canvas read errors
      }
    };

    img.src = productImageUrl;

    return () => {
      isMounted = false;
    };
  }, [productImageUrl]);

  // Provider Info
  const providerInfo = useMemo(() => {
    const raw = String(post.provider || "stripe").toLowerCase().replace(/[^a-z0-9]/g, "");

    if (raw.includes("polar")) {
      return { name: "Polar", color: "#0062FF", isPolar: true, themeId: "polar-blue" };
    }
    if (raw.includes("lemon")) {
      return { name: "Lemon Squeezy", color: "#F59E0B", isLemon: true, themeId: "champagne-gold" };
    }
    if (raw.includes("revenuecat")) {
      return { name: "RevenueCat", color: "#F2545B", isRevenueCat: true, themeId: "sunset-coral" };
    }
    if (raw.includes("google")) {
      return { name: "Google Play", color: "#1A73E8", isGoogle: true, themeId: "google-blue" };
    }
    if (raw.includes("appstore") || raw.includes("apple")) {
      return { name: "App Store", color: "#007AFF", isApple: true, themeId: "apple-blue" };
    }
    if (raw.includes("dodo")) {
      return { name: "Dodo Payments", color: "#059669", isDodo: true, themeId: "mint-emerald" };
    }
    if (raw.includes("paddle")) {
      return { name: "Paddle", color: "#0D9488", isPaddle: true, themeId: "seafoam-teal" };
    }
    return { name: "Stripe", color: "#533AFD", isStripe: true, themeId: "royal-violet" };
  }, [post.provider]);

  // Distinct Rich Palettes with Harmonious Key Colors, Chromatic Colored Shadows, and Tailored Light Metal Finishes
  const POST_THEMES = useMemo(
    () => [
      // 1. Amber Orange (Warm Light Rose Bronze Medal)
      {
        id: "amber-orange",
        accentColor: "#EA580C",
        bgTop: "#FFF5EB",
        bgBottom: "#FFFCF7",
        shadowR: 0.55,
        shadowG: 0.18,
        shadowB: 0.02,
        medalBg: "#FFFFFF",
        patternStroke: "#FFEDD5",
        titleColor: "#3B1306",
        subtitleColor: "#783A20",
        frameBase: "#7C2D12",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#FED7AA" },
          { offset: "52%", color: "#FFFFFF" },
          { offset: "76%", color: "#FB923C" },
          { offset: "100%", color: "#EA580C" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#FFF7ED" },
          { offset: "28%", color: "#FED7AA" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "90%", color: "#FB923C" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "25%", color: "#FED7AA" },
          { offset: "60%", color: "#FFFFFF" },
          { offset: "100%", color: "#EA580C" },
        ],
      },
      // 2. Champagne Gold (Warm Polished Light Champagne Gold Medal)
      {
        id: "champagne-gold",
        accentColor: "#D97706",
        bgTop: "#FEF9EE",
        bgBottom: "#FFFCF7",
        shadowR: 0.50,
        shadowG: 0.28,
        shadowB: 0.02,
        medalBg: "#FFFFFF",
        patternStroke: "#FEF3C7",
        titleColor: "#2C1802",
        subtitleColor: "#6E4D1B",
        frameBase: "#92400E",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#FDE68A" },
          { offset: "52%", color: "#FFFFFF" },
          { offset: "76%", color: "#F59E0B" },
          { offset: "100%", color: "#D97706" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#FFFBEB" },
          { offset: "28%", color: "#FDE68A" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "90%", color: "#F59E0B" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "25%", color: "#FDE68A" },
          { offset: "60%", color: "#FFFFFF" },
          { offset: "100%", color: "#D97706" },
        ],
      },
      // 3. Arctic / Sky Blue (Platinum Silver Medal)
      {
        id: "arctic-blue",
        accentColor: "#0062FF",
        bgTop: "#EFF6FF",
        bgBottom: "#F8FAFC",
        shadowR: 0.04,
        shadowG: 0.18,
        shadowB: 0.45,
        medalBg: "#FFFFFF",
        patternStroke: "#E2E8F0",
        titleColor: "#0A1931",
        subtitleColor: "#3B5377",
        frameBase: "#334155",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "22%", color: "#CBD5E1" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#F8FAFC" },
          { offset: "28%", color: "#CBD5E1" },
          { offset: "55%", color: "#FFFFFF" },
          { offset: "90%", color: "#94A3B8" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#CBD5E1" },
          { offset: "62%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
      },
      // 4. Royal Violet (Platinum Silver Medal)
      {
        id: "royal-violet",
        accentColor: "#7C3AED",
        bgTop: "#F5F3FF",
        bgBottom: "#FAF8FF",
        shadowR: 0.20,
        shadowG: 0.08,
        shadowB: 0.48,
        medalBg: "#FFFFFF",
        patternStroke: "#EDE9FE",
        titleColor: "#1E1035",
        subtitleColor: "#523F70",
        frameBase: "#334155",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "22%", color: "#CBD5E1" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#F8FAFC" },
          { offset: "28%", color: "#CBD5E1" },
          { offset: "55%", color: "#FFFFFF" },
          { offset: "90%", color: "#94A3B8" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#CBD5E1" },
          { offset: "62%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
      },
      // 5. Sunset Coral (Light Rose Bronze Medal)
      {
        id: "sunset-coral",
        accentColor: "#E11D48",
        bgTop: "#FFF1F2",
        bgBottom: "#FFF9F9",
        shadowR: 0.55,
        shadowG: 0.08,
        shadowB: 0.18,
        medalBg: "#FFFFFF",
        patternStroke: "#FFE4E6",
        titleColor: "#380A16",
        subtitleColor: "#7A283C",
        frameBase: "#881337",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#FECDD3" },
          { offset: "52%", color: "#FFFFFF" },
          { offset: "76%", color: "#FB7185" },
          { offset: "100%", color: "#E11D48" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#FFF1F2" },
          { offset: "28%", color: "#FECDD3" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "90%", color: "#FB7185" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "25%", color: "#FECDD3" },
          { offset: "60%", color: "#FFFFFF" },
          { offset: "100%", color: "#E11D48" },
        ],
      },
      // 6. Emerald Mint (Platinum Silver Medal)
      {
        id: "mint-emerald",
        accentColor: "#059669",
        bgTop: "#ECFDF5",
        bgBottom: "#F6FCF9",
        shadowR: 0.02,
        shadowG: 0.35,
        shadowB: 0.22,
        medalBg: "#FFFFFF",
        patternStroke: "#D1FAE5",
        titleColor: "#062E1F",
        subtitleColor: "#285945",
        frameBase: "#334155",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "22%", color: "#CBD5E1" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#F8FAFC" },
          { offset: "28%", color: "#CBD5E1" },
          { offset: "55%", color: "#FFFFFF" },
          { offset: "90%", color: "#94A3B8" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#CBD5E1" },
          { offset: "62%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
      },
      // 7. Seafoam Teal (Platinum Silver Medal)
      {
        id: "seafoam-teal",
        accentColor: "#0D9488",
        bgTop: "#F0FDFA",
        bgBottom: "#F5FDFB",
        shadowR: 0.03,
        shadowG: 0.32,
        shadowB: 0.30,
        medalBg: "#FFFFFF",
        patternStroke: "#CCFBF1",
        titleColor: "#092D28",
        subtitleColor: "#2D5952",
        frameBase: "#334155",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "22%", color: "#CBD5E1" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#F8FAFC" },
          { offset: "28%", color: "#CBD5E1" },
          { offset: "55%", color: "#FFFFFF" },
          { offset: "90%", color: "#94A3B8" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#CBD5E1" },
          { offset: "62%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
      },
      // 8. Radiant Fuchsia (Platinum Silver Medal)
      {
        id: "radiant-fuchsia",
        accentColor: "#DB2777",
        bgTop: "#FDF2F8",
        bgBottom: "#FDF4F9",
        shadowR: 0.55,
        shadowG: 0.08,
        shadowB: 0.32,
        medalBg: "#FFFFFF",
        patternStroke: "#FCE7F3",
        titleColor: "#30061D",
        subtitleColor: "#6B274B",
        frameBase: "#334155",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "22%", color: "#CBD5E1" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#F8FAFC" },
          { offset: "28%", color: "#CBD5E1" },
          { offset: "55%", color: "#FFFFFF" },
          { offset: "90%", color: "#94A3B8" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#CBD5E1" },
          { offset: "62%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
      },
    ],
    []
  );

  // Compute theme matching the PRODUCT'S DOMINANT / KEY COLOR rather than just the gateway provider!
  const postTheme = useMemo(() => {
    // If we extracted a dominant color from the product image, build a custom dynamic theme:
    if (extractedColor) {
      const { h, s } = extractedColor;
      const isGold = h >= 38 && h <= 75;
      const isBronze = (h >= 15 && h < 38) || (h >= 345 && h <= 360) || (h >= 0 && h < 15);

      // Deep shadow color RGB multipliers based on extracted hue
      let sR = 0.04;
      let sG = 0.18;
      let sB = 0.45;
      if (h >= 15 && h < 45) {
        sR = 0.55;
        sG = 0.18;
        sB = 0.02;
      } else if (h >= 45 && h < 75) {
        sR = 0.50;
        sG = 0.28;
        sB = 0.02;
      } else if (h >= 75 && h < 165) {
        sR = 0.02;
        sG = 0.35;
        sB = 0.22;
      } else if (h >= 165 && h < 210) {
        sR = 0.03;
        sG = 0.32;
        sB = 0.30;
      } else if (h >= 210 && h < 265) {
        sR = 0.04;
        sG = 0.18;
        sB = 0.45;
      } else if (h >= 265 && h < 310) {
        sR = 0.20;
        sG = 0.08;
        sB = 0.48;
      } else {
        sR = 0.55;
        sG = 0.08;
        sB = 0.25;
      }

      const goldGradients = {
        frameBase: "#92400E",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#FDE68A" },
          { offset: "52%", color: "#FFFFFF" },
          { offset: "76%", color: "#F59E0B" },
          { offset: "100%", color: "#D97706" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#FFFBEB" },
          { offset: "28%", color: "#FDE68A" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "90%", color: "#F59E0B" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "25%", color: "#FDE68A" },
          { offset: "60%", color: "#FFFFFF" },
          { offset: "100%", color: "#D97706" },
        ],
      };

      const bronzeGradients = {
        frameBase: "#7C2D12",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#FED7AA" },
          { offset: "52%", color: "#FFFFFF" },
          { offset: "76%", color: "#FB923C" },
          { offset: "100%", color: "#EA580C" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#FFF7ED" },
          { offset: "28%", color: "#FED7AA" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "90%", color: "#FB923C" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "25%", color: "#FED7AA" },
          { offset: "60%", color: "#FFFFFF" },
          { offset: "100%", color: "#EA580C" },
        ],
      };

      const silverGradients = {
        frameBase: "#334155",
        frameGrad1: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "22%", color: "#CBD5E1" },
          { offset: "58%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
        frameGrad2: [
          { offset: "0%", color: "#F8FAFC" },
          { offset: "28%", color: "#CBD5E1" },
          { offset: "55%", color: "#FFFFFF" },
          { offset: "90%", color: "#94A3B8" },
        ],
        frameGrad3: [
          { offset: "0%", color: "#FFFFFF" },
          { offset: "24%", color: "#CBD5E1" },
          { offset: "62%", color: "#FFFFFF" },
          { offset: "100%", color: "#94A3B8" },
        ],
      };

      const frameConfig = isGold ? goldGradients : isBronze ? bronzeGradients : silverGradients;

      return {
        id: `extracted-${h}`,
        accentColor: `hsl(${h}, ${Math.round(Math.max(s, 0.7) * 100)}%, 50%)`,
        bgTop: `hsl(${h}, 36%, 93%)`,
        bgBottom: `hsl(${h}, 18%, 98.5%)`,
        shadowR: sR,
        shadowG: sG,
        shadowB: sB,
        medalBg: "#FFFFFF",
        patternStroke: `hsl(${h}, 30%, 90%)`,
        titleColor: `hsl(${h}, 45%, 12%)`,
        subtitleColor: `hsl(${h}, 25%, 36%)`,
        ...frameConfig,
      };
    }

    const pName = String(post.productName || "").toLowerCase();
    const pCat = String(post.category || "").toLowerCase();

    // 1. Explicit Product Keyword Dominant Color Detection
    if (pName.includes("card") || pName.includes("stack") || pName.includes("orange") || pName.includes("fire") || pName.includes("amber")) {
      return POST_THEMES.find((t) => t.id === "amber-orange")!;
    }
    if (pName.includes("coin") || pName.includes("gold") || pName.includes("lemon") || pName.includes("screenflow") || pName.includes("yellow")) {
      return POST_THEMES.find((t) => t.id === "champagne-gold")!;
    }
    if (pName.includes("sync") || pName.includes("wear") || pName.includes("reel") || pName.includes("player") || pName.includes("blue") || pName.includes("cloud")) {
      return POST_THEMES.find((t) => t.id === "arctic-blue")!;
    }
    if (pName.includes("fast") || pName.includes("syntax") || pName.includes("ai") || pName.includes("saas") || pName.includes("copilot") || pName.includes("purple") || pName.includes("violet")) {
      return POST_THEMES.find((t) => t.id === "royal-violet")!;
    }
    if (pName.includes("coral") || pName.includes("rose") || pName.includes("revenue") || pName.includes("ruby") || pName.includes("red")) {
      return POST_THEMES.find((t) => t.id === "sunset-coral")!;
    }
    if (pName.includes("dodo") || pName.includes("eco") || pName.includes("green") || pName.includes("mint")) {
      return POST_THEMES.find((t) => t.id === "mint-emerald")!;
    }
    if (pName.includes("paddle") || pName.includes("teal") || pName.includes("seafoam")) {
      return POST_THEMES.find((t) => t.id === "seafoam-teal")!;
    }

    // 2. Deterministic Hash across the 8 distinct palettes based on product name
    const seed = `${post.productId || ""}_${post.productName || ""}_${post.id || ""}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % POST_THEMES.length;
    return POST_THEMES[idx];
  }, [extractedColor, post.productId, post.productName, post.id, post.category, POST_THEMES]);

  const accentColor = postTheme.accentColor;
  const medalTheme = postTheme;

  // Pure SVG Provider Logo Vector Renderer (No foreignObject for flawless canvas export)
  const renderProviderMark = (provider: string, isWhite: boolean = false, size: number = 24) => {
    const p = String(provider || "stripe").toLowerCase().replace(/[^a-z0-9]/g, "");
    const baseScale = size / 24;

    if (p.includes("polar")) {
      return (
        <g transform={`scale(${0.088 * baseScale}) translate(-150, -150)`}>
          <path
            fill={isWhite ? "#FFFFFF" : "#0062FF"}
            fillRule="evenodd"
            clipRule="evenodd"
            d="M66.428 274.26c68.448 46.333 161.497 28.406 207.83-40.041 46.335-68.448 28.408-161.497-40.04-207.83C165.77-19.946 72.721-2.019 26.388 66.428-19.948 134.878-2.02 227.928 66.427 274.26ZM47.956 116.67c-17.119 52.593-11.412 105.223 11.29 139.703C18.04 217.361 7.275 150.307 36.943 92.318c18.971-37.082 50.623-62.924 85.556-73.97-31.909 18.363-59.945 53.466-74.544 98.322Zm127.391 166.467c36.03-10.531 68.864-36.752 88.338-74.815 29.416-57.497 19.083-123.905-21.258-163.055 21.793 34.496 27.046 86.275 10.204 138.02-15.016 46.134-44.246 81.952-77.284 99.85Zm8.28-16.908c24.318-20.811 44.389-55.625 53.309-97.439 14.097-66.097-4.385-127.592-41.824-148.113 19.858 26.718 29.91 78.613 23.712 136.656-4.739 44.391-18.01 83.26-35.197 108.896ZM63.717 131.844c-14.201 66.586 4.66 128.501 42.657 148.561-20.378-26.396-30.777-78.891-24.498-137.694 4.661-43.657 17.574-81.974 34.349-107.614-23.957 20.886-43.687 55.392-52.507 96.747Zm136.117 17.717c1.074 67.912-20.244 123.317-47.612 123.748-27.369.433-50.425-54.27-51.498-122.182-1.073-67.913 20.244-123.318 47.613-123.75 27.368-.432 50.425 54.271 51.497 122.184Z"
          />
        </g>
      );
    }

    if (p.includes("google")) {
      return (
        /* Optical horizontal centering (+2px rightwards) for right-pointing play triangle */
        <g transform={`scale(${0.048 * baseScale}) translate(-205, -256)`}>
          <path fill="#EA4335" d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z" />
          <path fill="#FBBC04" d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z" />
          <path fill="#34A853" d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z" />
          <path fill="#4285F4" d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z" />
        </g>
      );
    }

    if (p.includes("lemon")) {
      return (
        <g transform={`scale(${0.92 * baseScale}) translate(-10.5, -14)`}>
          <path
            fill={isWhite ? "#FFFFFF" : "#F59E0B"}
            fillRule="evenodd"
            clipRule="evenodd"
            d="m6.92882 17.1856 7.51128 3.4727c.931.4306 1.5881 1.1533 1.943 1.9823.8976 2.0993-.3292 4.2463-2.255 5.0185-1.9262.7718-3.979.2751-4.91242-1.908l-3.26891-7.6645c-.25331-.5941.38303-1.1779.98205-.901Zm.45024-2.248 7.75364-2.931c2.5769-.9741 5.3918.869 5.3538 3.547-.0006.035-.0012.0699-.0021.1052-.0557 2.6078-2.7923 4.3606-5.3126 3.438l-7.7854-2.8495c-.62104-.2272-.62563-1.076-.00734-1.3097Zm-.43407-1.0152 7.62211-3.2387c2.5328-1.07634 3.1756-4.30675 1.1919-6.17327a9.026257 9.026257 0 0 0-.0783-.07315c-1.9449-1.80521-5.1599-1.16961-6.26712 1.20811L5.99323 12.9915c-.2729.5858.34387 1.1891.95176.9309Zm-1.9615-1.2798 2.77116-7.59845c.34357-.94215.27993-1.90295-.07526-2.73195C6.77994.21378 4.34409-.463579 2.41853.309741.493284 1.08336-.594621 2.84029.340622 5.02253L3.63095 12.6787c.25515.5933 1.13166.5699 1.35254-.0361Z"
          />
        </g>
      );
    }

    if (p.includes("revenuecat")) {
      return (
        <g transform={`scale(${baseScale}) translate(-12, -12)`}>
          <path
            d="M4.3036.3999c-1.5246 0-3.2129.1508-4.303.4136v14.9997c.3083.1722.8432.28 1.5632.28.7404 0 1.2553-.1072 1.5433-.28v-5.2323a14.8588 14.8588 0 0 0 2.121.1512h.3294l2.8604 5.0588c.432.195 1.0288.3024 1.9348.3024.8033 0 1.38-.1104 1.6476-.3024l-3.437-5.8358c1.4195-.8004 2.326-2.2698 2.326-4.4964C10.8894 1.827 8.4232.4 4.3037.4zm15.4543 0c-1.3788 0-2.624.2707-3.6901.7945-2.4552 1.203-3.9609 3.7376-3.9609 7.3627 0 4.8245 2.6552 7.7155 7.1659 7.7155.9 0 1.5868-.3014 2.005.2554.4194.5568-.3582 1.2165-.7746 1.5105-1.6338 1.1544-5.7217-.1024-9.4908-.4804C5.5994 17.015.9264 16.3009.146 19.1928c-.4104 1.5264.1225 2.5013.6421 3.0503 1.044 1.1046 2.882 1.357 4.344 1.357a13.959 13.959 0 0 0 2.0508-.1558 1.311 1.311 0 0 0 1.023-.8063c.1674-.4254.0861-.904-.212-1.2562a1.3464 1.3464 0 0 0-1.2352-.4523c-1.5012.2706-3.6213.8685-4.4343.0105-.2748-.291-.2268-1.0037 0-1.2257.6048-.8748 4.493-.5393 8.4127-.0293 4.329.4344 8.4023 1.8609 10.945.6351.9955-.48 2.318-1.1941 2.318-3.792h-.0012c0-1.1473-.1489-2.274-.4476-3.3797-1.3818.1872-2.4783.2857-3.2883.2941-2.845 0-4.869-1.4484-4.869-5.0963 0-3.648 2.0461-5.1573 5.0179-5.1573 1.2011 0 2.129.2512 3.1405.7336.1062-.9234-.1058-2.1605-.5906-2.8523-.78-.4608-2.0014-.6703-3.2038-.6703z"
            fill={isWhite ? "#FFFFFF" : "#F2545B"}
          />
        </g>
      );
    }

    if (p.includes("apple") || p.includes("appstore")) {
      return (
        <g transform={`scale(${0.024 * baseScale}) translate(-407, -500)`}>
          <path
            d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
            fill={isWhite ? "#FFFFFF" : "#007AFF"}
          />
        </g>
      );
    }

    if (p.includes("dodo")) {
      return (
        <g transform={`scale(${0.8 * baseScale}) translate(-15, -15)`}>
          <rect x="0" y="0" width="30" height="30" rx="15" fill={isWhite ? "#FFFFFF" : "#059669"} />
          <path d="M12.9679 11.4606H12.9599C12.4637 11.3182 11.9387 11.603 11.7707 12.0734C11.585 12.579 11.8795 13.1582 12.3997 13.3182C13.6737 13.6798 14.2211 11.8542 12.9679 11.4606Z" fill={isWhite ? "#059669" : "#FFFFFF"} />
          <path d="M23.8265 14.0425C22.1859 10.4505 16.9523 11.9369 16.4689 10.9961C15.0525 8.77368 12.4084 7.52568 9.54993 8.16888C9.10979 7.99288 7.59411 7.94488 6.6146 8.56088L7.20518 8.82168C7.25 8.84088 7.23719 8.83608 7.30281 8.86008C7.5701 8.96088 7.52368 8.93208 7.33162 9.03768C6.89148 9.29528 6.34251 9.59448 6 10.0441C6.0144 10.0649 6.75384 10.2425 6.75384 10.2425C6.76664 10.2457 6.90429 10.2601 6.87388 10.3209C4.45551 14.1385 8.5336 19.9001 10.5134 23.0009H16.2449C15.3598 21.4169 14.3483 19.2553 14.694 17.7881C14.7564 17.5225 14.8364 17.1849 15.1629 17.1401C15.952 17.0137 17.0083 17.0249 17.7605 16.9401C17.7605 16.9401 17.7643 16.9401 17.7717 16.9401C17.9318 16.9321 21.8498 16.4345 22.7877 18.8761C22.8678 19.1001 23.0518 18.9545 23.1254 18.8073C23.8249 17.4169 24.2762 15.2281 23.8297 14.0441L23.8265 14.0425ZM17.5013 12.8633C17.226 13.3545 17.0387 13.9929 16.9907 14.5497C16.9651 14.9033 17.0019 15.2521 17.0371 15.6057C17.0563 15.8009 17.0579 16.0473 16.9011 16.1753C16.765 16.2905 16.5393 16.3017 16.3121 16.3177C15.1965 16.3129 12.4757 16.3177 11.4273 15.6041L11.4209 15.5993C9.89564 14.6697 9.07938 12.5705 9.98527 10.9401C10.2782 10.3865 10.8175 10.0265 11.4321 9.89048C12.2228 9.70968 13.0935 9.84408 13.7993 10.2137C14.0874 10.3593 14.4315 10.5513 14.694 10.7721C15.2141 11.2265 15.6591 11.6985 16.3409 11.8441C16.6546 11.9337 16.9811 11.9209 17.2948 11.9849C17.8822 12.1257 17.7349 12.4601 17.4997 12.8601L17.5013 12.8633Z" fill={isWhite ? "#059669" : "#FFFFFF"} />
        </g>
      );
    }

    if (p.includes("paddle")) {
      return (
        <g transform={`scale(${baseScale}) translate(-12, -12)`}>
          <path
            d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
            stroke={isWhite ? "#FFFFFF" : "#0D9488"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      );
    }

    // Default Stripe mark
    return (
      <g transform={`scale(${baseScale}) translate(-12.5, -12)`}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1 23.5L24 18.5V0.5L1 5.5V23.5Z"
          fill={isWhite ? "#FFFFFF" : "#533AFD"}
        />
      </g>
    );
  };

  const isOrderPost = post.category === "volume" || post.title.toUpperCase().includes("ORDER");

  // Metric value formatting for Claymorphism Chart
  const formattedValue = useMemo(() => {
    if (isOrderPost) {
      const num = typeof post.metricValue === "number" && !isNaN(post.metricValue) ? Math.round(post.metricValue) : 0;
      return `${num.toLocaleString()} ${num === 1 ? "Order" : "Orders"}`;
    }
    const symbol = post.currencySymbol || "$";
    const num = typeof post.metricValue === "number" && !isNaN(post.metricValue) ? post.metricValue : 0;
    const formattedNum = num % 1 !== 0 ? num.toFixed(2) : num.toLocaleString();
    return `${symbol}${formattedNum}`;
  }, [isOrderPost, post.metricValue, post.currencySymbol]);

  // Canonical Dashboard Indic8Chart Revenue Points
  const chartRevenuePoints: RevenuePoint[] = useMemo(() => {
    if (!post.timeSeriesData || post.timeSeriesData.length === 0) return [];
    const cur = (post.currency || "USD") as CurrencyCode;
    return post.timeSeriesData.map((pt: any) => ({
      date: pt.date || pt.dateShort || pt.label || "",
      amount: typeof pt.amount === "number" ? pt.amount : typeof pt.value === "number" ? pt.value : 0,
      currency: cur,
      formattedAmount: pt.formattedAmount || `${post.currencySymbol || "$"}${typeof pt.amount === "number" ? pt.amount.toLocaleString() : (pt.value || 0).toLocaleString()}`,
    }));
  }, [post.timeSeriesData, post.currency, post.currencySymbol]);

  // Find peak / milestone point index for non-interactive locked tooltip display
  const peakIndex = useMemo(() => {
    if (typeof post.peakIndex === "number" && post.peakIndex >= 0 && post.peakIndex < chartRevenuePoints.length) {
      return post.peakIndex;
    }
    if (!chartRevenuePoints || chartRevenuePoints.length === 0) return 0;
    let maxIdx = 0;
    let maxVal = -Infinity;
    chartRevenuePoints.forEach((pt, idx) => {
      const val = typeof pt.amount === "number" ? pt.amount : 0;
      if (val > maxVal) {
        maxVal = val;
        maxIdx = idx;
      }
    });
    return maxVal > 0 ? maxIdx : chartRevenuePoints.length - 1;
  }, [post.peakIndex, chartRevenuePoints]);

  const isPortfolio = useMemo(() => {
    return post.productId === "portfolio-all" || (Boolean(post.providers) && (post.providers?.length || 0) > 1);
  }, [post.productId, post.providers]);

  const activeProviders = useMemo(() => {
    if (post.providers && post.providers.length > 0) {
      return post.providers;
    }
    return [post.provider || "stripe"];
  }, [post.providers, post.provider]);

  const getProviderName = (prov: string) => {
    const raw = String(prov || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (raw.includes("polar")) return "Polar";
    if (raw.includes("lemon")) return "Lemon Squeezy";
    if (raw.includes("revenuecat")) return "RevenueCat";
    if (raw.includes("google")) return "Google Play";
    if (raw.includes("apple") || raw.includes("appstore")) return "App Store";
    if (raw.includes("dodo")) return "Dodo Payments";
    if (raw.includes("paddle")) return "Paddle";
    if (raw.includes("stripe")) return "Stripe";
    return String(prov).charAt(0).toUpperCase() + String(prov).slice(1);
  };

  const deltaText = useMemo(() => {
    const rawDelta = (post.growthDelta || "").trim();
    // Guard against repeating the big metric number:
    // e.g. if rawDelta is "+$383" and formattedValue is "$383" or contains the exact metric value without a % or text
    const cleanMetric = formattedValue.replace(/[^0-9.]/g, "");
    const cleanDelta = rawDelta.replace(/[^0-9.]/g, "");

    const isDuplicateNumber = cleanDelta && cleanMetric && cleanDelta === cleanMetric && !rawDelta.includes("%");

    if (rawDelta && !isDuplicateNumber) {
      return rawDelta;
    }

    if (post.category === "volume" || post.title.toUpperCase().includes("ORDER")) {
      const num = typeof post.metricValue === "number" && !isNaN(post.metricValue) ? Math.round(post.metricValue) : 0;
      return `+${num.toLocaleString()} ${num === 1 ? "order" : "orders"}`;
    }

    if (chartRevenuePoints.length >= 2) {
      const half = Math.floor(chartRevenuePoints.length / 2);
      const firstSum = chartRevenuePoints.slice(0, half).reduce((acc, p) => acc + p.amount, 0);
      const secondSum = chartRevenuePoints.slice(half).reduce((acc, p) => acc + p.amount, 0);
      if (firstSum > 0) {
        const pct = ((secondSum - firstSum) / firstSum) * 100;
        return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% Growth`;
      }
    }

    return "+138.6% Growth";
  }, [post.growthDelta, formattedValue, post.category, post.title, post.metricValue, chartRevenuePoints]);

  const renderBottomProviderLogos = (centerY: number) => {
    if (!isPortfolio || activeProviders.length === 0) return null;

    const count = activeProviders.length;
    const circleSize = 64;
    const circleRadius = 32;
    const gap = 16;
    const totalW = count * circleSize + (count - 1) * gap;
    const startX = 540 - totalW / 2;

    return (
      <g>
        {activeProviders.map((prov, i) => {
          const cx = startX + i * (circleSize + gap) + circleRadius;
          const cy = centerY;
          return (
            <g key={`prov-circle-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={circleRadius}
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              <g transform={`translate(${cx}, ${cy})`}>
                {renderProviderMark(String(prov), false, 32)}
              </g>
            </g>
          );
        })}
      </g>
    );
  };

  const pillPaddingLeft = 28;
  const arrowWidth = 28;
  const arrowGap = 16;
  const pillPaddingRight = 26;

  const estimatedTextWidth = useMemo(() => {
    return Math.round(deltaText.length * 19.5);
  }, [deltaText]);

  const pillWidth = useMemo(() => {
    return Math.max(180, pillPaddingLeft + estimatedTextWidth + arrowGap + arrowWidth + pillPaddingRight);
  }, [estimatedTextWidth]);

  const initialLetter = useMemo(() => {
    const clean = (post.founderHandle || "").replace("@", "");
    return (clean[0] || post.productName?.[0] || "W").toUpperCase();
  }, [post.founderHandle, post.productName]);

  const displayName = useMemo(() => {
    if (post.productName && post.productName.length > 36) {
      return `${post.productName.substring(0, 34)}...`;
    }
    return post.productName || "Product";
  }, [post.productName]);

  // Medal Style Texts
  const medalTitle = useMemo(() => {
    if (post.productName) {
      if (post.productName.length > 24) {
        return `New sale of ${post.productName.substring(0, 22)}...`;
      }
      return `New sale of ${post.productName}`;
    }
    return "New sale of your product";
  }, [post.productName]);

  const medalSubtitle = useMemo(() => {
    if (post.subtitle && post.subtitle.length < 52 && !post.subtitle.toLowerCase().includes("verified revenue")) {
      return post.subtitle;
    }
    return "Great work! You just made a new sale.";
  }, [post.subtitle]);

  // ViewBox and Dimensions
  const { W, H, isVertical916, ratioCss, scale, offsetX, offsetY } = useMemo(() => {
    if (isMedalStyle) {
      const baseW = 1940;
      const baseH = 1130;
      let targetW = 1940;
      let targetH = 1130;
      let rStr = "1940 / 1130";

      switch (effectiveRatio) {
        case "1:1":
          targetW = 1940;
          targetH = 1940;
          rStr = "1 / 1";
          break;
        case "4:5":
          targetW = 1940;
          targetH = 2425;
          rStr = "4 / 5";
          break;
        case "9:16":
          targetW = 1940;
          targetH = 3448;
          rStr = "9 / 16";
          break;
        case "4:3":
          targetW = 1940;
          targetH = 1455;
          rStr = "4 / 3";
          break;
        case "16:9":
        case "Auto":
        default:
          targetW = 1940;
          targetH = 1130;
          rStr = "1940 / 1130";
          break;
      }

      const s = Math.min(targetW / baseW, targetH / baseH);
      const ox = (targetW - baseW * s) / 2;
      const oy = (targetH - baseH * s) / 2;

      return {
        W: targetW,
        H: targetH,
        isVertical916: false,
        ratioCss: rStr,
        scale: s,
        offsetX: ox,
        offsetY: oy,
      };
    }

    // Claymorphism Chart Style (Base: 1080x1350)
    if (effectiveRatio === "9:16") {
      return {
        W: 1080,
        H: 1920,
        isVertical916: true,
        ratioCss: "9 / 16",
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      };
    }

    let targetW = 1080;
    let targetH = 1350;
    let rStr = "4 / 5";

    switch (effectiveRatio) {
      case "1:1":
        targetW = 1080;
        targetH = 1080;
        rStr = "1 / 1";
        break;
      case "16:9":
        targetW = 1920;
        targetH = 1080;
        rStr = "16 / 9";
        break;
      case "4:3":
        targetW = 1200;
        targetH = 900;
        rStr = "4 / 3";
        break;
      case "3:2":
        targetW = 1200;
        targetH = 800;
        rStr = "3 / 2";
        break;
      case "21:9":
        targetW = 2560;
        targetH = 1080;
        rStr = "21 / 9";
        break;
      case "4:5":
      case "Auto":
      default:
        targetW = 1080;
        targetH = 1350;
        rStr = "4 / 5";
        break;
    }

    const s = Math.min(targetW / 1080, targetH / 1350);
    const ox = (targetW - 1080 * s) / 2;
    const oy = (targetH - 1350 * s) / 2;

    return {
      W: targetW,
      H: targetH,
      isVertical916: false,
      ratioCss: rStr,
      scale: s,
      offsetX: ox,
      offsetY: oy,
    };
  }, [isMedalStyle, effectiveRatio]);

  // Two-line wrapping logic for large title if needed:
  const titleLines = useMemo(() => {
    if (
      medalTitle.length > 20 &&
      (effectiveRatio === "9:16" || effectiveRatio === "4:5" || effectiveRatio === "1:1")
    ) {
      const words = medalTitle.split(" ");
      if (words.length >= 3) {
        const mid = Math.ceil(words.length / 2);
        return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
      }
    }
    return [medalTitle];
  }, [medalTitle, effectiveRatio]);

  // ==========================================
  // RENDER POST STYLE 2: 3D GOLDEN MEDAL AWARD
  // ==========================================
  if (isMedalStyle) {
    const W_ACTUAL = 1940;
    let H_ACTUAL = 1091.25; // Exact 16:9
    let medalScale = 1.0;
    let medalCenterY = 345;
    let titleY = 680;
    let titleFontSize = 76;
    let subtitleY = 760;
    let subtitleFontSize = 40;
    let footerY = 980;
    let footerScale = 1.0;
    let rStr = "16 / 9";

    switch (effectiveRatio) {
      case "9:16":
        H_ACTUAL = 3448.88;
        medalScale = 1.95;
        medalCenterY = 1180;
        titleY = 1960;
        titleFontSize = 118;
        subtitleY = titleLines.length > 1 ? 2300 : 2140;
        subtitleFontSize = 58;
        footerY = 3080;
        footerScale = 1.85;
        rStr = "9 / 16";
        break;
      case "4:5":
        H_ACTUAL = 2425;
        medalScale = 1.55;
        medalCenterY = 880;
        titleY = 1420;
        titleFontSize = 100;
        subtitleY = titleLines.length > 1 ? 1700 : 1560;
        subtitleFontSize = 52;
        footerY = 2200;
        footerScale = 1.45;
        rStr = "4 / 5";
        break;
      case "1:1":
        H_ACTUAL = 1940;
        medalScale = 1.30;
        medalCenterY = 680;
        titleY = 1130;
        titleFontSize = 90;
        subtitleY = titleLines.length > 1 ? 1360 : 1240;
        subtitleFontSize = 48;
        footerY = 1760;
        footerScale = 1.25;
        rStr = "1 / 1";
        break;
      case "4:3":
        H_ACTUAL = 1455;
        medalScale = 1.12;
        medalCenterY = 490;
        titleY = 850;
        titleFontSize = 82;
        subtitleY = titleLines.length > 1 ? 1030 : 930;
        subtitleFontSize = 44;
        footerY = 1320;
        footerScale = 1.10;
        rStr = "4 / 3";
        break;
      case "3:2":
        H_ACTUAL = 1293.33;
        medalScale = 1.05;
        medalCenterY = 430;
        titleY = 780;
        titleFontSize = 78;
        subtitleY = titleLines.length > 1 ? 950 : 855;
        subtitleFontSize = 42;
        footerY = 1175;
        footerScale = 1.05;
        rStr = "3 / 2";
        break;
      case "21:9":
        H_ACTUAL = 831.42;
        medalScale = 0.88;
        medalCenterY = 250;
        titleY = 530;
        titleFontSize = 66;
        subtitleY = 595;
        subtitleFontSize = 35;
        footerY = 745;
        footerScale = 0.88;
        rStr = "21 / 9";
        break;
      case "3:1":
        H_ACTUAL = 646.66;
        medalScale = 0.76;
        medalCenterY = 190;
        titleY = 425;
        titleFontSize = 58;
        subtitleY = 480;
        subtitleFontSize = 30;
        footerY = 575;
        footerScale = 0.78;
        rStr = "3 / 1";
        break;
      case "16:9":
      case "Auto":
      default:
        H_ACTUAL = 1091.25;
        medalScale = 1.0;
        medalCenterY = 350;
        titleY = 685;
        titleFontSize = 76;
        subtitleY = 765;
        subtitleFontSize = 40;
        footerY = 980;
        footerScale = 1.0;
        rStr = "16 / 9";
        break;
    }

    // Full 3D Medal Facet Compound Path containing all inner bevels & faceted depth cuts
    const MEDAL_FACET_PATH =
      "M951.698 157.101C963.027 150.56 976.986 150.56 988.315 157.101L1135.35 241.993C1146.68 248.534 1153.66 260.623 1153.66 273.705V443.489C1153.66 456.571 1146.68 468.66 1135.35 475.201L988.315 560.093C976.986 566.634 963.027 566.634 951.698 560.093L804.66 475.201C793.331 468.66 786.352 456.571 786.352 443.489V273.705C786.352 260.623 793.331 248.534 804.66 241.993L951.698 157.101ZM945.002 223.291C942.188 221.653 939.41 221.828 936.657 223.496C930.794 227.048 924.927 230.594 918.983 234.186C916.087 235.937 913.171 237.699 910.229 239.479C909.13 240.132 908.031 240.788 906.933 241.443C904.566 242.856 902.198 244.27 899.82 245.665C894.998 248.494 890.176 251.323 885.354 254.152C859.548 269.295 833.741 284.437 807.918 299.551C802.605 302.661 799.934 307.072 799.927 313.336C799.914 325.433 799.856 337.532 799.799 349.63C799.729 364.613 799.658 379.597 799.671 394.581C799.675 399.063 799.612 403.548 799.548 408.033C799.392 419.114 799.235 430.196 800.093 441.245C800.871 451.254 805.199 459.773 814.109 465.132C826.363 472.503 838.655 479.811 850.947 487.119C859.947 492.47 868.947 497.82 877.932 503.196C901.891 517.529 925.82 531.913 949.73 546.327C952.161 547.793 954.652 549.004 957.392 549.697C963.914 551.346 970.396 551.561 976.67 548.736C980.253 547.123 980.533 543.148 977.341 540.865C976.766 540.454 976.162 540.082 975.56 539.711C975.463 539.651 975.365 539.591 975.268 539.531C957.541 528.573 939.645 517.896 921.748 507.22C912.142 501.49 902.535 495.76 892.955 489.985C871.445 477.021 849.93 464.066 828.414 451.114C822.61 447.621 819.499 442.556 819.498 435.715C819.494 398.004 819.493 360.294 819.528 322.584C819.534 316.578 822.002 311.844 827.291 308.787C831.401 306.411 835.517 304.046 839.633 301.68C845.483 298.317 851.333 294.955 857.167 291.564C878.828 278.974 900.48 266.367 922.131 253.759C928.33 250.15 934.528 246.541 940.727 242.932C941.749 242.337 942.775 241.748 943.802 241.159C946.516 239.602 949.23 238.045 951.869 236.369C955.674 233.953 955.627 229.726 951.882 227.386C949.731 226.042 947.538 224.766 945.346 223.491L945.002 223.291ZM851.817 318.527C851.135 313.984 847.084 312.015 843.11 314.274C842.425 314.664 841.753 315.078 841.08 315.492C840.12 316.084 839.16 316.676 838.162 317.196C834.264 319.225 832.757 322.383 832.782 326.759C832.859 340.08 832.843 353.402 832.827 366.884C832.821 371.86 832.814 376.858 832.813 381.886C832.813 386.442 832.818 390.999 832.823 395.555C832.835 407.454 832.847 419.354 832.785 431.253C832.759 436.171 834.94 439.654 838.968 442.087C856.598 452.737 874.234 463.377 891.908 473.953C914.515 487.481 937.112 501.023 959.537 514.853C969.671 521.103 979.833 527.31 990.011 533.489C995.789 536.997 1001.74 537.42 1007.71 534.004C1017.47 528.425 1027.19 522.787 1036.9 517.149L1036.92 517.14L1037.04 517.068C1063.03 501.994 1089.01 486.913 1114.98 471.819C1115.87 471.3 1116.77 470.786 1117.67 470.273C1122.53 467.491 1127.4 464.709 1131.64 460.972C1135.66 457.429 1139.07 453.434 1140.23 448.016C1140.87 445.043 1140.9 441.969 1138.21 439.909C1135.69 437.983 1133.22 439.155 1130.8 440.593C1113.2 451.037 1095.54 461.362 1077.65 471.289C1061.72 480.129 1045.78 488.936 1029.83 497.744C1021.28 502.464 1012.73 507.185 1004.19 511.91C999.101 514.725 994.132 514.483 989.228 511.442C984.751 508.664 980.267 505.898 975.773 503.147C966.99 497.772 958.207 492.395 949.425 487.018C920.39 469.24 891.354 451.462 862.282 433.745C855.306 429.494 852.007 423.543 852.018 415.402C852.05 391.583 852.017 367.764 851.983 343.944C851.973 336.567 851.963 329.189 851.954 321.811C851.954 321.674 851.954 321.537 851.954 321.399C851.956 320.438 851.958 319.47 851.817 318.527ZM977.245 165.712C968.317 163.169 959.606 163.571 951.479 168.334C946.51 171.245 946.57 176.239 951.434 179.304C958.571 183.803 965.744 188.244 973.039 192.762C975.034 193.998 977.039 195.24 979.055 196.489C987.629 201.593 996.203 206.696 1004.78 211.8C1024.72 223.671 1044.67 235.543 1064.61 247.415C1068.55 249.762 1072.5 252.107 1076.44 254.453C1088.32 261.518 1100.19 268.583 1112.05 275.683C1115.88 277.975 1118.27 281.389 1119.05 285.841C1119.24 286.914 1119.38 288.013 1119.38 289.101C1119.42 302.786 1119.41 316.471 1119.39 330.155C1119.36 353.907 1119.33 377.659 1119.6 401.41C1119.67 407.458 1117.17 411.958 1112.06 415.076C1097.47 423.993 1082.71 432.65 1067.84 441.095L1060.28 445.385L1060 445.544C1039.88 456.964 1019.77 468.384 999.654 479.812C998.851 480.268 998.048 480.722 997.244 481.175C994.115 482.942 990.984 484.709 987.935 486.605C984.118 488.979 984.185 492.957 987.941 495.347C988.424 495.654 988.918 495.944 989.412 496.235C990.099 496.639 990.785 497.043 991.442 497.492C995.212 500.068 998.894 499.832 1002.79 497.611C1007.27 495.057 1011.79 492.577 1016.31 490.097C1019.59 488.299 1022.87 486.501 1026.13 484.675C1061.12 465.089 1096.11 445.502 1131.06 425.857C1137.25 422.378 1140.58 417.119 1140.57 409.766C1140.53 390.643 1140.54 371.519 1140.56 352.396C1140.56 343.27 1140.57 334.144 1140.57 325.017C1140.57 318.365 1140.57 311.712 1140.56 305.059C1140.55 296.147 1140.54 287.235 1140.55 278.323C1140.56 272.08 1138.97 266.345 1134.99 261.495C1131.18 256.857 1126.63 253.004 1121.45 249.961C1097.74 236.024 1074.01 222.108 1050.27 208.206C1028.48 195.444 1006.76 182.565 985.277 169.295C982.752 167.736 980.084 166.52 977.245 165.712ZM977.33 243.403C972.798 240.786 967.215 240.786 962.683 243.403L873.907 294.657C869.375 297.274 866.584 302.109 866.584 307.342V409.852C866.584 415.084 869.375 419.92 873.907 422.536L962.683 473.791C967.215 476.408 972.798 476.408 977.33 473.791L1066.11 422.536C1070.64 419.92 1073.43 415.084 1073.43 409.852V307.342C1073.43 302.109 1070.64 297.274 1066.11 294.657L977.33 243.403ZM939.994 187.579C934.872 184.354 929.23 184.534 923.968 187.551C918.328 190.786 912.749 194.129 907.17 197.472C904.884 198.842 902.597 200.213 900.305 201.576C894.016 205.317 887.726 209.056 881.437 212.796C862.554 224.024 843.671 235.252 824.807 246.511C824.196 246.876 823.583 247.238 822.97 247.601C818.285 250.375 813.591 253.154 809.546 256.87C802.863 263.01 799.39 270.549 799.963 279.725C800.316 285.377 803.815 287.168 808.626 284.318C826.054 273.997 843.487 263.684 861.179 253.219C867.254 249.63 873.329 246.04 879.404 242.451C897.837 231.56 916.27 220.67 934.7 209.774C938.552 207.496 942.55 207.171 946.401 209.44C956.011 215.101 965.541 220.9 975.062 226.711C985.415 233.031 995.759 239.366 1006.1 245.701C1016.42 252.018 1026.73 258.335 1037.06 264.637C1042.7 268.08 1048.35 271.504 1054 274.927C1062.4 280.012 1070.79 285.097 1079.15 290.246C1084.33 293.437 1087.45 298.132 1087.78 304.38C1087.95 307.596 1087.99 310.821 1088 314.042C1088.04 327.294 1088.07 340.546 1088.1 353.798C1088.14 369.893 1088.18 385.988 1088.22 402.082C1088.23 403.446 1088.32 404.832 1088.58 406.167C1089.38 410.208 1093.17 411.924 1096.72 409.891C1097.44 409.482 1098.14 409.043 1098.84 408.604C1099.71 408.06 1100.57 407.517 1101.47 407.03C1105.1 405.06 1106.65 402.084 1106.57 397.936C1106.46 392.043 1106.47 386.147 1106.49 380.252C1106.49 378.193 1106.49 376.134 1106.49 374.076L1106.49 370.969C1106.48 345.126 1106.47 319.284 1106.48 293.441C1106.48 289.097 1104.76 285.833 1100.96 283.594C1096.15 280.763 1091.35 277.931 1086.55 275.1C1061.75 260.494 1036.96 245.887 1012.22 231.19C1009.12 229.348 1006.02 227.507 1002.92 225.666C981.832 213.157 960.746 200.647 939.994 187.579Z";

    return (
      <div
        style={{
          aspectRatio: className.includes("h-full") ? undefined : rStr,
          background: `linear-gradient(180deg, ${medalTheme.bgTop} 0%, ${medalTheme.bgBottom} 100%)`,
        }}
        className={`relative w-full h-full overflow-hidden select-none ${
          isUnrounded ? "rounded-none" : "rounded-2xl"
        } ${className}`}
      >
        <svg
          viewBox={`0 0 ${W_ACTUAL} ${H_ACTUAL}`}
          className="w-full h-full block"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter
              id={`filter0_ddd_${uniqueId}`}
              x="720"
              y="60"
              width="500"
              height="580"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />

              {/* 1. Upward White Ambient Specular Glow */}
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha1"
              />
              <feOffset dy="-28" />
              <feGaussianBlur stdDeviation="22" />
              <feComposite in2="hardAlpha1" operator="out" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.85 0"
              />
              <feBlend mode="normal" in2="BackgroundImageFix" result={`effect1_glow_${uniqueId}`} />

              {/* 2. Downward Soft Ambient Ground Shadow (Rich colored shadow from gradient tone) */}
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha2"
              />
              <feOffset dy="26" />
              <feGaussianBlur stdDeviation="22" />
              <feComposite in2="hardAlpha2" operator="out" />
              <feColorMatrix
                type="matrix"
                values={`0 0 0 0 ${medalTheme.shadowR} 0 0 0 0 ${medalTheme.shadowG} 0 0 0 0 ${medalTheme.shadowB} 0 0 0 0.28 0`}
              />
              <feBlend mode="normal" in2={`effect1_glow_${uniqueId}`} result={`effect2_shadow_${uniqueId}`} />

              {/* 3. Downward Contact Depth Shadow (Denser colored shadow close to base) */}
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha3"
              />
              <feOffset dy="14" />
              <feGaussianBlur stdDeviation="10" />
              <feComposite in2="hardAlpha3" operator="out" />
              <feColorMatrix
                type="matrix"
                values={`0 0 0 0 ${medalTheme.shadowR} 0 0 0 0 ${medalTheme.shadowG} 0 0 0 0 ${medalTheme.shadowB} 0 0 0 0.22 0`}
              />
              <feBlend mode="normal" in2={`effect2_shadow_${uniqueId}`} result={`effect3_shadow_${uniqueId}`} />

              <feBlend mode="normal" in="SourceGraphic" in2={`effect3_shadow_${uniqueId}`} result="shape" />
            </filter>

            <filter
              id={`filter1_ii_${uniqueId}`}
              x="786.352"
              y="150.195"
              width="367.312"
              height="416.805"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="1.15" />
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"
              />
              <feBlend mode="screen" in2="shape" result={`effect1_innerShadow_${uniqueId}`} />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="-2" />
              <feGaussianBlur stdDeviation="1.15" />
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.143161 0 0 0 0 0.134312 0 0 0 0 0.18258 0 0 0 1 0"
              />
              <feBlend mode="color-burn" in2={`effect1_innerShadow_${uniqueId}`} result={`effect2_innerShadow_${uniqueId}`} />
            </filter>

            {/* Clean Elevation Drop Shadow for Center Medal App Tile */}
            <filter
              id={`filter3_cleanShadow_${uniqueId}`}
              x="890"
              y="280"
              width="160"
              height="160"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.14" />
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.08" />
            </filter>

            {/* Background Full-Artboard Gradient with Theme Palette */}
            <linearGradient
              id={`paint0_linear_${uniqueId}`}
              x1="0"
              y1="0"
              x2="0"
              y2="100%"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0%" stopColor={medalTheme.bgTop} />
              <stop offset="100%" stopColor={medalTheme.bgBottom} />
            </linearGradient>

            {/* Medal Metallic Specular Multi-Stop Gradients (Silver, Gold, Bronze, Titanium based on Theme) */}
            <linearGradient
              id={`paint1_linear_${uniqueId}`}
              x1="970.006"
              y1="152.195"
              x2="970.006"
              y2="564.999"
              gradientUnits="userSpaceOnUse"
            >
              {(medalTheme.frameGrad1 || [
                { offset: "0%", color: "#FFFFFF" },
                { offset: "22%", color: "#CBD5E1" },
                { offset: "58%", color: "#FFFFFF" },
                { offset: "100%", color: "#94A3B8" },
              ]).map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>

            <linearGradient
              id={`paint2_linear_${uniqueId}`}
              x1="851.555"
              y1="152.195"
              x2="1088.46"
              y2="564.999"
              gradientUnits="userSpaceOnUse"
            >
              {(medalTheme.frameGrad2 || [
                { offset: "0%", color: "#F8FAFC" },
                { offset: "28%", color: "#CBD5E1" },
                { offset: "55%", color: "#FFFFFF" },
                { offset: "90%", color: "#94A3B8" },
              ]).map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>

            <linearGradient
              id={`paint3_linear_${uniqueId}`}
              x1="786.352"
              y1="451.295"
              x2="1153.66"
              y2="265.899"
              gradientUnits="userSpaceOnUse"
            >
              {(medalTheme.frameGrad3 || [
                { offset: "0%", color: "#FFFFFF" },
                { offset: "24%", color: "#CBD5E1" },
                { offset: "62%", color: "#FFFFFF" },
                { offset: "100%", color: "#94A3B8" },
              ]).map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>

            {/* Diagonal Texture Pattern */}
            <pattern
              id={`pattern0_${uniqueId}`}
              patternUnits="userSpaceOnUse"
              patternTransform="matrix(11.4507 0 0 19.8333 790.465 157.643)"
              preserveAspectRatio="none"
              viewBox="-14.5 -14.5039 104.098 180.303"
              width="1"
              height="1"
            >
              <use href={`#pattern0_${uniqueId}_inner`} xlinkHref={`#pattern0_${uniqueId}_inner`} transform="translate(-208.195 -360.605)" />
              <use href={`#pattern0_${uniqueId}_inner`} xlinkHref={`#pattern0_${uniqueId}_inner`} transform="translate(-104.098 -360.605)" />
              <use href={`#pattern0_${uniqueId}_inner`} xlinkHref={`#pattern0_${uniqueId}_inner`} transform="translate(0 -360.605)" />
              <use href={`#pattern0_${uniqueId}_inner`} xlinkHref={`#pattern0_${uniqueId}_inner`} transform="translate(-208.195 -180.303)" />
              <use href={`#pattern0_${uniqueId}_inner`} xlinkHref={`#pattern0_${uniqueId}_inner`} transform="translate(-104.098 -180.303)" />
              <use href={`#pattern0_${uniqueId}_inner`} xlinkHref={`#pattern0_${uniqueId}_inner`} transform="translate(0 -180.303)" />
              <use href={`#pattern0_${uniqueId}_inner`} xlinkHref={`#pattern0_${uniqueId}_inner`} transform="translate(-208.195 0)" />
              <use href={`#pattern0_${uniqueId}_inner`} xlinkHref={`#pattern0_${uniqueId}_inner`} transform="translate(-104.098 0)" />
              <g id={`pattern0_${uniqueId}_inner`}>
                <path d="M0 0L208.195 360.605" stroke={medalTheme.patternStroke || "white"} strokeWidth="29" strokeLinecap="round" />
              </g>
            </pattern>

            <clipPath id={`productClip_${uniqueId}`}>
              <rect x="923" y="310" width="94" height="94" rx="24" />
            </clipPath>
          </defs>

          {/* 1. Full-Bleed Theme Gradient Background */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#paint0_linear_${uniqueId})`}
          />

          {/* 2. Scaled & Positioned 3D Award Medal */}
          <g transform={`translate(${970 - 970 * medalScale}, ${medalCenterY - 358 * medalScale}) scale(${medalScale})`}>
            <g filter={`url(#filter0_ddd_${uniqueId})`}>
              {/* Layer 1: Base Hexagon Background Card (Controlled directly by theme's medalBg) */}
              <path
                d="M938.01 170.671C957.811 159.238 982.208 159.238 1002.01 170.671L1115.96 236.459C1135.76 247.892 1147.96 269.02 1147.96 291.885V423.463C1147.96 446.328 1135.76 467.456 1115.96 478.888L1002.01 544.677C982.208 556.11 957.811 556.11 938.01 544.677L824.06 478.888C804.258 467.456 792.06 446.328 792.06 423.463V291.885C792.06 269.02 804.258 247.892 824.06 236.459L938.01 170.671Z"
                fill={medalTheme.medalBg || "#FAFAFB"}
              />
              {/* Layer 2: Diagonal Texture Pattern (Clean stripes on top of medalBg) */}
              <path
                d="M938.01 170.671C957.811 159.238 982.208 159.238 1002.01 170.671L1115.96 236.459C1135.76 247.892 1147.96 269.02 1147.96 291.885V423.463C1147.96 446.328 1135.76 467.456 1115.96 478.888L1002.01 544.677C982.208 556.11 957.811 556.11 938.01 544.677L824.06 478.888C804.258 467.456 792.06 446.328 792.06 423.463V291.885C792.06 269.02 804.258 247.892 824.06 236.459L938.01 170.671Z"
                fill={`url(#pattern0_${uniqueId})`}
                fillOpacity="0.74"
              />

              {/* Polished Metallic Beveled Frame (Silver, Gold, Bronze, Titanium) */}
              <g filter={`url(#filter1_ii_${uniqueId})`}>
                <path d={MEDAL_FACET_PATH} fill={medalTheme.frameBase || "#1E293B"} />
                <path d={MEDAL_FACET_PATH} fill={`url(#paint1_linear_${uniqueId})`} />
                <path d={MEDAL_FACET_PATH} fill={`url(#paint2_linear_${uniqueId})`} fillOpacity="0.6" />
                <path d={MEDAL_FACET_PATH} fill={`url(#paint3_linear_${uniqueId})`} fillOpacity="0.4" />
              </g>

              {/* Center Medal App Icon / Product Image Tile with Clean 3D Elevation */}
              <g filter={`url(#filter3_cleanShadow_${uniqueId})`}>
                {productImageUrl ? (
                  <g>
                    <rect
                      x="923"
                      y="310"
                      width="94"
                      height="94"
                      rx="24"
                      fill="#FFFFFF"
                      stroke="rgba(0,0,0,0.06)"
                      strokeWidth="1.5"
                    />
                    <image
                      href={productImageUrl}
                      x="923"
                      y="310"
                      width="94"
                      height="94"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#productClip_${uniqueId})`}
                    />
                  </g>
                ) : (
                  <g>
                    {/* Sleek App Icon Squircle with Product/Provider Key Color */}
                    <rect
                      x="923"
                      y="310"
                      width="94"
                      height="94"
                      rx="24"
                      fill={accentColor}
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="1.5"
                    />
                    {/* Bold Centered App Initial Letter */}
                    <text
                      x="970"
                      y="374"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontFamily="'Geist', -apple-system, sans-serif"
                      fontWeight="700"
                      fontSize="48"
                      letterSpacing="-0.02em"
                    >
                      {initialLetter}
                    </text>
                  </g>
                )}
              </g>
            </g>
          </g>

          {/* 3. Scaled Title & Subtitle with Multi-Line Support */}
          <text
            x="970"
            y={titleY}
            textAnchor="middle"
            fill={medalTheme.titleColor}
            fontFamily="'Geist', -apple-system, sans-serif"
            fontWeight="600"
            fontSize={titleFontSize}
            letterSpacing="-0.025em"
          >
            {titleLines.length === 1 ? (
              titleLines[0]
            ) : (
              <>
                <tspan x="970" dy="0">
                  {titleLines[0]}
                </tspan>
                <tspan x="970" dy={titleFontSize * 1.15}>
                  {titleLines[1]}
                </tspan>
              </>
            )}
          </text>

          <text
            x="970"
            y={subtitleY}
            textAnchor="middle"
            fill={medalTheme.subtitleColor}
            fontFamily="'Geist', -apple-system, sans-serif"
            fontWeight="400"
            fontSize={subtitleFontSize}
          >
            {medalSubtitle}
          </text>

          {/* 4. Scaled & Positioned Responsive Footer Bar (Symmetrical layout with equal spacing) */}
          {(() => {
            const providerNameStr = providerInfo.name;
            const charWidthMap: Record<string, number> = {
              i: 10, l: 10, j: 12, I: 11, " ": 12,
              r: 16, t: 16, f: 14,
              m: 32, w: 28, M: 34, W: 36,
            };
            let providerTextWidth = 0;
            for (const ch of providerNameStr) {
              providerTextWidth += charWidthMap[ch] || 22;
            }
            providerTextWidth = Math.ceil(providerTextWidth);

            const iconRadius = 24;
            const iconContainerSize = iconRadius * 2;
            const iconGap = 16;
            const dividerMargin = 32;
            const dividerWidth = 3.5;
            const shieldSize = 46.4; // Normalized shield width (1073.71 - 1027.3)
            const shieldGap = 14;
            const verifiedTextWidth = 136;

            const leftBlockWidth = iconContainerSize + iconGap + providerTextWidth;
            const rightBlockWidth = shieldSize + shieldGap + verifiedTextWidth;
            const totalFooterWidth = leftBlockWidth + dividerMargin * 2 + dividerWidth + rightBlockWidth;
            const footerStartX = (W_ACTUAL - totalFooterWidth) / 2;

            const iconCenterX = footerStartX + iconRadius;
            const providerTextX = footerStartX + iconContainerSize + iconGap;
            const dividerX = footerStartX + leftBlockWidth + dividerMargin;
            const shieldX = dividerX + dividerWidth + dividerMargin;
            const verifiedTextX = shieldX + shieldSize + shieldGap;

            return (
              <g transform={`translate(${970 - 970 * footerScale}, ${footerY - 953 * footerScale}) scale(${footerScale})`}>
                {/* Left Group: Light Neutral Circular Provider Badge Container */}
                <circle cx={iconCenterX} cy="953" r={iconRadius} fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />

                {/* Pure Vector Provider Logo Mark Centered in Circle */}
                <g transform={`translate(${iconCenterX}, 953)`}>
                  {renderProviderMark(post.provider, false, 26)}
                </g>

                {/* Provider Name */}
                <text
                  x={providerTextX}
                  y="965"
                  fill={medalTheme.titleColor}
                  fontFamily="'Geist', -apple-system, sans-serif"
                  fontWeight="500"
                  fontSize="38"
                >
                  {providerInfo.name}
                </text>

                {/* Center Vertical Divider Line (Exact equal 32px spacing on left and right) */}
                <path
                  d={`M${dividerX} 933L${dividerX} 973`}
                  stroke="#CBD5E1"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Right Group: Red Shield Badge + "Verified" (Normalized translation from x=1027.3) */}
                <g transform={`translate(${shieldX - 1027.3}, 0)`}>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1050.88 976.952C1064.01 973.574 1073.71 961.658 1073.71 947.471C1073.71 944.151 1073.18 940.952 1072.19 937.957C1072 937.377 1071.48 936.973 1070.88 936.925L1070.76 936.92H1070.4C1063.09 936.92 1056.46 934.069 1051.54 929.413C1050.96 928.862 1050.05 928.862 1049.47 929.414C1044.29 934.328 1037.4 937.023 1030.27 936.923C1029.61 936.914 1029.02 937.334 1028.81 937.96C1027.81 941.029 1027.29 944.239 1027.3 947.469L1027.3 948.132C1027.6 962.026 1037.2 973.624 1050.13 976.952C1050.37 977.016 1050.63 977.016 1050.88 976.952Z"
                    fill="#FB1100"
                  />
                  <path
                    d="M1043.16 953.913L1048.58 959.338L1057.62 946.68"
                    stroke="white"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>

                {/* "Verified" Text */}
                <text
                  x={verifiedTextX}
                  y="965"
                  fill={medalTheme.titleColor}
                  fontFamily="'Geist', -apple-system, sans-serif"
                  fontWeight="300"
                  fontSize="38"
                >
                  Verified
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    );
  }

  // ==========================================
  // RENDER POST STYLE 1: CLAYMORPHISM CHART
  // ==========================================
  return (
    <div
      style={{ aspectRatio: className.includes("h-full") ? undefined : ratioCss }}
      className={`relative w-full h-full overflow-hidden select-none bg-[#F2F2F2] ${
        isUnrounded ? "rounded-none" : "rounded-2xl"
      } ${className}`}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={`avatarClip_${uniqueId}`}>
            <circle cx="85.5" cy="85" r="35" />
          </clipPath>

          <linearGradient
            id={`greyLinearGrad_${uniqueId}`}
            x1="540"
            y1={isVertical916 ? "780" : "200"}
            x2="540"
            y2={isVertical916 ? "1920" : "1350"}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E9E9E9" />
            <stop offset="1" stopColor="#C4C4C4" />
          </linearGradient>

          <linearGradient
            id={`areaGrad_${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
          </linearGradient>

          <filter id={`tooltipShadow_${uniqueId}`} x="-20%" y="-30%" width="140%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.10" />
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.06" />
          </filter>

          <filter id={`dotShadow_${uniqueId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.18" />
          </filter>
        </defs>

        <rect width={W} height={H} rx={isUnrounded ? 0 : 28} fill="#F2F2F2" />

        {isVertical916 ? (
          <g>
            <g transform="translate(0, 50)">
              {staticUrl && !hasError ? (
                <g>
                  <circle cx="85.5" cy="85" r="35" fill="#E2E8F0" />
                  <image
                    href={staticUrl}
                    x="50"
                    y="50"
                    width="71"
                    height="70"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#avatarClip_${uniqueId})`}
                  />
                </g>
              ) : (
                <g>
                  <rect x="50" y="50" width="71" height="70" rx="35" fill="#E2E8F0" />
                  <text
                    x="85.5"
                    y="94"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontFamily="'Inter', -apple-system, sans-serif"
                    fontWeight="700"
                    fontSize="26"
                  >
                    {initialLetter}
                  </text>
                </g>
              )}

              <text
                x="142"
                y="97"
                fill="#000000"
                fontFamily="'Inter', -apple-system, sans-serif"
                fontWeight="500"
                fontSize={displayName.length > 26 ? "32" : "40"}
                letterSpacing="-0.02em"
              >
                {displayName}
              </text>

              {/* Clean Light Neutral Provider Badge Container with Authentic Colored Logo Mark */}
              {!isPortfolio && (
                <g>
                  <circle cx="994.5" cy="85" r="35" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                  <g transform="translate(994.5, 85)">
                    {renderProviderMark(post.provider, false, 34)}
                  </g>
                </g>
              )}
            </g>

            <path
              d="M50 980 C50 885.719 50 838.579 79.2893 809.289 C108.579 780 155.719 780 250 780 H830 C924.281 780 971.421 780 1000.71 809.289 C1030 838.579 1030 885.719 1030 980 V1920 H50 Z"
              fill={`url(#greyLinearGrad_${uniqueId})`}
            />

            <g transform="translate(0, 580)">
              <rect x="100" y="255" width="880" height="880" rx="60" fill="#000000" opacity="0.08" />
              <rect x="90" y="240" width="900" height="900" rx="60" fill="#FFFFFF" stroke="#D7D7D7" strokeWidth="1.5" />

              <text x="150" y="336" fill="#5E5E5E" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="500" fontSize="34">
                {post.title || "Revenue"}
              </text>
              <text x="150" y="442" fill="#1E1E1E" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="500" fontSize={formattedValue.length > 10 ? "76" : "94"} letterSpacing="-0.03em">
                {formattedValue}
              </text>

              <g>
                <rect x="151.5" y="476.5" width={pillWidth} height="71" rx="35.5" fill="#F2F2F2" stroke="#DBDBDB" strokeWidth="1.5" />
                <text
                  x={151.5 + pillPaddingLeft}
                  y="522"
                  fill="#000000"
                  fontFamily="'Inter', -apple-system, sans-serif"
                  fontWeight="600"
                  fontSize="30"
                >
                  {deltaText}
                </text>
                <g transform={`translate(${151.5 + pillPaddingLeft + estimatedTextWidth + arrowGap}, 498)`}>
                  <path
                    d="M28.001 7.5V15.5C28.001 15.765 27.895 16.02 27.708 16.207C27.52 16.395 27.266 16.5 27.001 16.5C26.735 16.5 26.481 16.395 26.293 16.207C26.106 16.02 26.001 15.765 26.001 15.5V9.914L15.708 20.208C15.615 20.3 15.505 20.374 15.383 20.425C15.262 20.475 15.132 20.501 15.001 20.501C14.869 20.501 14.739 20.475 14.618 20.425C14.496 20.374 14.386 20.3 14.293 20.208L10.001 15.914L1.708 24.208C1.52 24.395 1.266 24.501 1.001 24.501C0.735 24.501 0.481 24.395 0.293 24.208C0.105 24.02 0 23.765 0 23.5C0 23.235 0.105 22.98 0.293 22.792L9.293 13.792C9.386 13.7 9.496 13.626 9.618 13.575C9.739 13.525 9.869 13.499 10.001 13.499C10.132 13.499 10.262 13.525 10.383 13.575C10.505 13.626 10.615 13.7 10.708 13.792L15.001 18.086L24.587 8.5H19.001C18.735 8.5 18.481 8.395 18.293 8.207C18.106 8.02 18.001 7.765 18.001 7.5C18.001 7.235 18.106 6.98 18.293 6.793C18.481 6.605 18.735 6.5 19.001 6.5H27.001C27.266 6.5 27.52 6.605 27.708 6.793C27.895 6.98 28.001 7.235 28.001 7.5Z"
                    fill="#34C759"
                  />
                </g>
              </g>

              {/* Canonical Dashboard Indic8Chart Component */}
              <foreignObject x="140" y="570" width="800" height="520">
                <div
                  style={{ width: "800px", height: "520px" }}
                  className="w-full h-full select-none"
                >
                  <Indic8Chart
                    id={`gallery_chart_v_${post.id}_${uniqueId}`}
                    data={chartRevenuePoints}
                    currency={post.currency || "USD"}
                    color={accentColor}
                    label={post.category === "volume" || isOrderPost ? "Orders" : "Gross Revenue"}
                    height={480}
                    showBrush={false}
                    showGrid={true}
                    showYAxis={false}
                    minTickGap={70}
                    interactive={false}
                    staticIndex={peakIndex}
                    forceLight={true}
                    indicatorVariant="dashed"
                    valueFormatter={
                      isOrderPost
                        ? (val) => `${Math.round(val).toLocaleString()} ${Math.round(val) === 1 ? "order" : "orders"}`
                        : undefined
                    }
                  />
                </div>
              </foreignObject>

              {/* Bottom Multi-Provider Badges for Consolidated Portfolio */}
              {renderBottomProviderLogos(1240)}
            </g>
          </g>
        ) : (
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            {/* Top Header Bar */}
            <g>
              {staticUrl && !hasError ? (
                <g>
                  <circle cx="85.5" cy="85" r="35" fill="#E2E8F0" />
                  <image
                    href={staticUrl}
                    x="50"
                    y="50"
                    width="71"
                    height="70"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#avatarClip_${uniqueId})`}
                  />
                </g>
              ) : (
                <g>
                  <rect x="50" y="50" width="71" height="70" rx="35" fill="#E2E8F0" />
                  <text
                    x="85.5"
                    y="94"
                    textAnchor="middle"
                    fill="#0F172A"
                    fontFamily="'Inter', -apple-system, sans-serif"
                    fontWeight="700"
                    fontSize="26"
                  >
                    {initialLetter}
                  </text>
                </g>
              )}

              <text
                x="142"
                y="97"
                fill="#000000"
                fontFamily="'Inter', -apple-system, sans-serif"
                fontWeight="500"
                fontSize={displayName.length > 26 ? "32" : "40"}
                letterSpacing="-0.02em"
              >
                {displayName}
              </text>

              {/* Clean Light Neutral Provider Badge Container with Authentic Colored Logo Mark */}
              {!isPortfolio && (
                <g>
                  <circle cx="994.5" cy="85" r="35" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                  <g transform="translate(994.5, 85)">
                    {renderProviderMark(post.provider, false, 34)}
                  </g>
                </g>
              )}
            </g>

            {/* Chassis Container */}
            <path
              d="M50 400 C50 305.719 50 258.579 79.2893 229.289 C108.579 200 155.719 200 250 200 H830 C924.281 200 971.421 200 1000.71 229.289 C1030 258.579 1030 305.719 1030 400 V1350 H50 Z"
              fill={`url(#greyLinearGrad_${uniqueId})`}
            />

            {/* White Container Card */}
            <rect x="100" y="255" width="880" height="880" rx="60" fill="#000000" opacity="0.08" />
            <rect x="90" y="240" width="900" height="900" rx="60" fill="#FFFFFF" stroke="#D7D7D7" strokeWidth="1.5" />

            {/* Metric Summary Box */}
            <text x="150" y="336" fill="#5E5E5E" fontFamily="'Inter', -apple-system, sans-serif" fontWeight="500" fontSize="34">
              {post.title || "Revenue"}
            </text>

            <text
              x="150"
              y="442"
              fill="#1E1E1E"
              fontFamily="'Inter', -apple-system, sans-serif"
              fontWeight="500"
              fontSize={formattedValue.length > 10 ? "76" : "94"}
              letterSpacing="-0.03em"
            >
              {formattedValue}
            </text>

            {/* Growth Pill */}
            <g>
              <rect
                x="151.5"
                y="476.5"
                width={pillWidth}
                height="71"
                rx="35.5"
                fill="#F2F2F2"
                stroke="#DBDBDB"
                strokeWidth="1.5"
              />
              <text
                x={151.5 + pillPaddingLeft}
                y="522"
                fill="#000000"
                fontFamily="'Inter', -apple-system, sans-serif"
                fontWeight="600"
                fontSize="30"
              >
                {deltaText}
              </text>

              <g transform={`translate(${151.5 + pillPaddingLeft + estimatedTextWidth + arrowGap}, 498)`}>
                <path
                  d="M28.001 7.5V15.5C28.001 15.765 27.895 16.02 27.708 16.207C27.52 16.395 27.266 16.5 27.001 16.5C26.735 16.5 26.481 16.395 26.293 16.207C26.106 16.02 26.001 15.765 26.001 15.5V9.914L15.708 20.208C15.615 20.3 15.505 20.374 15.383 20.425C15.262 20.475 15.132 20.501 15.001 20.501C14.869 20.501 14.739 20.475 14.618 20.425C14.496 20.374 14.386 20.3 14.293 20.208L10.001 15.914L1.708 24.208C1.52 24.395 1.266 24.501 1.001 24.501C0.735 24.501 0.481 24.395 0.293 24.208C0.105 24.02 0 23.765 0 23.5C0 23.235 0.105 22.98 0.293 22.792L9.293 13.792C9.386 13.7 9.496 13.626 9.618 13.575C9.739 13.525 9.869 13.499 10.001 13.499C10.132 13.499 10.262 13.525 10.383 13.575C10.505 13.626 10.615 13.7 10.708 13.792L15.001 18.086L24.587 8.5H19.001C18.735 8.5 18.481 8.395 18.293 8.207C18.106 8.02 18.001 7.765 18.001 7.5C18.001 7.235 18.106 6.98 18.293 6.793C18.481 6.605 18.735 6.5 19.001 6.5H27.001C27.266 6.5 27.52 6.605 27.708 6.793C27.895 6.98 28.001 7.235 28.001 7.5Z"
                  fill="#34C759"
                />
              </g>
            </g>

            {/* Canonical Dashboard Indic8Chart Component */}
            <foreignObject x="140" y="570" width="800" height="520">
              <div
                style={{ width: "800px", height: "520px" }}
                className="w-full h-full select-none"
              >
                <Indic8Chart
                  id={`gallery_chart_h_${post.id}_${uniqueId}`}
                  data={chartRevenuePoints}
                  currency={post.currency || "USD"}
                  color={accentColor}
                  label={post.category === "volume" || isOrderPost ? "Orders" : "Gross Revenue"}
                  height={480}
                  showBrush={false}
                  showGrid={true}
                  showYAxis={false}
                  minTickGap={70}
                  interactive={false}
                  staticIndex={peakIndex}
                  forceLight={true}
                  indicatorVariant="dashed"
                  valueFormatter={
                    isOrderPost
                      ? (val) => `${Math.round(val).toLocaleString()} ${Math.round(val) === 1 ? "order" : "orders"}`
                      : undefined
                  }
                />
              </div>
            </foreignObject>

            {/* Bottom Multi-Provider Badges for Consolidated Portfolio */}
            {renderBottomProviderLogos(1240)}
          </g>
        )}
      </svg>
    </div>
  );
});

GalleryCanvasGraphic.displayName = "GalleryCanvasGraphic";
