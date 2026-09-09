import { CurrencyCode, ProviderType } from "@/lib/types";

export type PostStyleId = 1 | 2 | 3 | 4 | 5;

export type AspectRatioKey = "4:5" | "1:1" | "9:16" | "16:9" | "4:3";

export interface PlatformPreset {
  id: string;
  name: string;
  platform: string;
  ratioKey: AspectRatioKey;
  ratioCss: string;
  aspectRatio: string;
  width: number;
  height: number;
  description: string;
  compatibility: string[];
  recommendedFor: string;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "instagram-portrait",
    name: "Portrait Post",
    platform: "Instagram & LinkedIn",
    ratioKey: "4:5",
    ratioCss: "4 / 5",
    aspectRatio: "4:5",
    width: 1080,
    height: 1350,
    description: "Maximum feed screen real estate on mobile devices",
    compatibility: ["Instagram Feed", "LinkedIn", "Threads", "Pinterest"],
    recommendedFor: "Mobile Feeds",
  },
  {
    id: "universal-square",
    name: "Square Post",
    platform: "Universal Feed",
    ratioKey: "1:1",
    ratioCss: "1 / 1",
    aspectRatio: "1:1",
    width: 1080,
    height: 1080,
    description: "Standard square format compatible with all social networks",
    compatibility: ["Instagram", "X (Twitter)", "LinkedIn", "Product Hunt"],
    recommendedFor: "Universal",
  },
  {
    id: "story-vertical",
    name: "Vertical Story & Reel",
    platform: "Full Screen Mobile",
    ratioKey: "9:16",
    ratioCss: "9 / 16",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    description: "Full vertical screen layout for immersive social stories",
    compatibility: ["Instagram Stories", "TikTok", "YouTube Shorts", "Snapchat"],
    recommendedFor: "Stories & Reels",
  },
  {
    id: "x-landscape",
    name: "Landscape Post",
    platform: "X / Twitter & Web",
    ratioKey: "16:9",
    ratioCss: "16 / 9",
    aspectRatio: "16:9",
    width: 1200,
    height: 675,
    description: "Optimal wide aspect ratio for desktop timelines and blog banners",
    compatibility: ["X (Twitter)", "YouTube Thumbnail", "Reddit", "Blog Banners"],
    recommendedFor: "Desktop & Feeds",
  },
  {
    id: "studio-classic",
    name: "Classic Presentation",
    platform: "Dribbble & Decks",
    ratioKey: "4:3",
    ratioCss: "4 / 3",
    aspectRatio: "4:3",
    width: 1200,
    height: 900,
    description: "Balanced presentation format for pitch decks and design showcases",
    compatibility: ["Dribbble", "Pitch Decks", "Keynote", "Product Hunt Gallery"],
    recommendedFor: "Presentations",
  },
];

export interface SocialPostData {
  id: string;
  title: string;
  subtitle: string;
  productName: string;
  productId?: string;
  category?: string;
  provider: ProviderType | string;
  metricValue: number;
  formattedMetric: string;
  currency: CurrencyCode;
  currencySymbol: string;
  growthDelta: string;
  peakLabel?: string;
  peakValue?: string;
  founderHandle: string;
  timestamp: string;
  aspectRatio: AspectRatioKey;
  timeSeriesData: Array<{ label: string; value: number }>;
  defaultStyleId: PostStyleId;
  socialCopy: {
    minimal: string;
    story: string;
    founder: string;
  };
  metricsBreakdown?: {
    mrr?: number;
    orders?: number;
    aov?: number;
  };
}
