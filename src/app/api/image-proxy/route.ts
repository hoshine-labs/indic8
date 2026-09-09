import { NextRequest, NextResponse } from "next/server";

// Deterministic color palette for high-fidelity dynamic product covers
const PALETTES = [
  { bg: "#0f172a", accent: "#3b82f6", glow: "#1d4ed8", text: "#93c5fd" },
  { bg: "#141824", accent: "#10b981", glow: "#047857", text: "#a7f3d0" },
  { bg: "#1a1625", accent: "#8b5cf6", glow: "#6d28d9", text: "#c4b5fd" },
  { bg: "#1c1917", accent: "#f59e0b", glow: "#b45309", text: "#fde68a" },
  { bg: "#091e24", accent: "#06b6d4", glow: "#0e7490", text: "#a5f3fc" },
];

function generateProductCoverSvg(name: string, provider: string = "polar"): string {
  const cleanName = name || "Software Product";
  const hash = cleanName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const p = PALETTES[hash % PALETTES.length];

  // Truncate long title for SVG display
  const displayTitle = cleanName.length > 24 ? cleanName.substring(0, 22) + "..." : cleanName;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300" fill="none">
  <defs>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="600" y2="300" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${p.bg}"/>
      <stop offset="100%" stop-color="#07080b"/>
    </linearGradient>
    <radialGradient id="glow-grad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(300 150) rotate(90) scale(160 320)">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="600" height="300" rx="16" fill="url(#bg-grad)"/>
  <rect width="600" height="300" rx="16" fill="url(#grid)"/>
  <rect width="600" height="300" rx="16" fill="url(#glow-grad)"/>

  <!-- Geometric Abstract Badge -->
  <g transform="translate(300, 105)">
    <rect x="-32" y="-32" width="64" height="64" rx="18" fill="${p.accent}" fill-opacity="0.12" stroke="${p.accent}" stroke-opacity="0.35" stroke-width="1.5"/>
    <path d="M-12 -6L0 -14L12 -6L0 2L-12 -6Z" stroke="${p.accent}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-12 2L0 10L12 2" stroke="${p.accent}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M-12 10L0 18L12 10" stroke="${p.accent}" stroke-width="2" stroke-linejoin="round"/>
  </g>

  <!-- Product Title -->
  <text x="300" y="195" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif" font-size="20" font-weight="600" letter-spacing="-0.02em">
    ${displayTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
  </text>

  <!-- Provider pill -->
  <g transform="translate(300, 225)">
    <rect x="-42" y="-10" width="84" height="20" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="0" y="3.5" text-anchor="middle" fill="${p.text}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace" font-size="9" font-weight="600" letter-spacing="0.05em">
      ${provider.toUpperCase()}
    </text>
  </g>
</svg>`;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const name = req.nextUrl.searchParams.get("name") || "Software Product";
  const provider = req.nextUrl.searchParams.get("provider") || "polar";

  if (url && url.startsWith("http")) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      clearTimeout(timeout);

      if (res.ok) {
        const contentType = res.headers.get("content-type") || "image/png";
        const arrayBuffer = await res.arrayBuffer();

        return new NextResponse(Buffer.from(arrayBuffer), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
    } catch {
      // Graceful fallback to dynamic cover SVG on network timeout
    }
  }

  // Generate crisp dynamic SVG product cover
  const svgCover = generateProductCoverSvg(name, provider);

  return new NextResponse(svgCover, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
