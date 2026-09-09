export type PlatformCategory =
  | "all"
  | "revenue"
  | "social"
  | "developer"
  | "general";

export interface FormatPreset {
  id: string;
  name: string;
  platform: string;
  ratioStr: string; // e.g. "16 / 9"
  aspectRatio: string; // e.g. "16:9"
  width?: number;
  height?: number;
  iconName?: string;
  span?: 1 | 2;
}

export interface PlatformFormatGroup {
  name: string;
  icon: string;
  formats: FormatPreset[];
}

export const COMMON_ASPECT_RATIOS: FormatPreset[] = [
  { id: "auto", name: "Auto", platform: "General", ratioStr: "16 / 9", aspectRatio: "Auto", span: 1 },
  { id: "16-9", name: "16:9 Landscape", platform: "General", ratioStr: "16 / 9", aspectRatio: "16:9", span: 2 },
  { id: "1-1", name: "1:1 Square", platform: "General", ratioStr: "1 / 1", aspectRatio: "1:1", span: 1 },
  { id: "9-16", name: "9:16 Portrait / Reel", platform: "General", ratioStr: "9 / 16", aspectRatio: "9:16", span: 1 },
  { id: "4-5", name: "4:5 Social Feed", platform: "General", ratioStr: "4 / 5", aspectRatio: "4:5", span: 1 },
  { id: "4-3", name: "4:3 Classic", platform: "General", ratioStr: "4 / 3", aspectRatio: "4:3", span: 1 },
  { id: "21-9", name: "21:9 Ultrawide", platform: "General", ratioStr: "21 / 9", aspectRatio: "21:9", span: 2 },
];

export const PLATFORM_FORMAT_GROUPS: PlatformFormatGroup[] = [
  {
    name: "X (Twitter)",
    icon: "x",
    formats: [
      { id: "x-post", name: "Tweet Graphic", platform: "X", ratioStr: "16 / 9", aspectRatio: "16:9", span: 2 },
      { id: "x-header", name: "Header Banner", platform: "X", ratioStr: "3 / 1", aspectRatio: "3:1", span: 2 },
      { id: "x-avatar", name: "Square Avatar", platform: "X", ratioStr: "1 / 1", aspectRatio: "1:1", span: 1 },
    ],
  },
  {
    name: "Instagram",
    icon: "instagram",
    formats: [
      { id: "ig-square", name: "Square Post", platform: "Instagram", ratioStr: "1 / 1", aspectRatio: "1:1", span: 1 },
      { id: "ig-portrait", name: "Portrait (4:5)", platform: "Instagram", ratioStr: "4 / 5", aspectRatio: "4:5", span: 1 },
      { id: "ig-story", name: "Story & Reel", platform: "Instagram", ratioStr: "9 / 16", aspectRatio: "9:16", span: 1 },
      { id: "ig-landscape", name: "Landscape", platform: "Instagram", ratioStr: "16 / 9", aspectRatio: "16:9", span: 2 },
    ],
  },
  {
    name: "YouTube",
    icon: "youtube",
    formats: [
      { id: "yt-thumb", name: "Video Thumbnail", platform: "YouTube", ratioStr: "16 / 9", aspectRatio: "16:9", span: 2 },
      { id: "yt-shorts", name: "Shorts (9:16)", platform: "YouTube", ratioStr: "9 / 16", aspectRatio: "9:16", span: 1 },
      { id: "yt-cover", name: "Channel Banner", platform: "YouTube", ratioStr: "16 / 9", aspectRatio: "16:9", span: 2 },
    ],
  },
  {
    name: "LinkedIn",
    icon: "linkedin",
    formats: [
      { id: "li-share", name: "Feed Post", platform: "LinkedIn", ratioStr: "1.91 / 1", aspectRatio: "1.91:1", span: 2 },
      { id: "li-square", name: "Square Carousel", platform: "LinkedIn", ratioStr: "1 / 1", aspectRatio: "1:1", span: 1 },
      { id: "li-cover", name: "Profile Cover", platform: "LinkedIn", ratioStr: "4 / 1", aspectRatio: "4:1", span: 2 },
    ],
  },
  {
    name: "Product Hunt",
    icon: "producthunt",
    formats: [
      { id: "ph-gallery", name: "Launch Gallery", platform: "Product Hunt", ratioStr: "16 / 9", aspectRatio: "16:9", span: 2 },
      { id: "ph-thumb", name: "Product Icon", platform: "Product Hunt", ratioStr: "1 / 1", aspectRatio: "1:1", span: 1 },
    ],
  },
  {
    name: "TikTok",
    icon: "tiktok",
    formats: [
      { id: "tt-post", name: "Vertical Video", platform: "TikTok", ratioStr: "9 / 16", aspectRatio: "9:16", span: 1 },
      { id: "tt-photos", name: "Photo Mode", platform: "TikTok", ratioStr: "1 / 1", aspectRatio: "1:1", span: 1 },
    ],
  },
  {
    name: "Reddit",
    icon: "reddit",
    formats: [
      { id: "rd-standard", name: "Post Banner", platform: "Reddit", ratioStr: "16 / 9", aspectRatio: "16:9", span: 2 },
      { id: "rd-square", name: "Square Image", platform: "Reddit", ratioStr: "1 / 1", aspectRatio: "1:1", span: 1 },
    ],
  },
  {
    name: "Facebook",
    icon: "facebook",
    formats: [
      { id: "fb-landscape", name: "Shared Link / Post", platform: "Facebook", ratioStr: "16 / 9", aspectRatio: "16:9", span: 2 },
      { id: "fb-square", name: "Square Post", platform: "Facebook", ratioStr: "1 / 1", aspectRatio: "1:1", span: 1 },
    ],
  },
  {
    name: "Open Graph",
    icon: "globe",
    formats: [
      { id: "og-std", name: "Standard Social Preview (OG)", platform: "Open Graph", ratioStr: "1.91 / 1", aspectRatio: "1.91:1", span: 2 },
      { id: "og-sq", name: "Square Card", platform: "Open Graph", ratioStr: "1 / 1", aspectRatio: "1:1", span: 1 },
    ],
  },
];

export interface MilestoneTemplate {
  id: string;
  title: string;
  platform: string;
  category: PlatformCategory;
  numericValue: number;
  currencySymbol: string;
  currencyCode: string;
  prefix: string;
  suffix: string;
  metricLabel: string;
  subtext: string;
  growthDelta: string;
  verifiedSource: "stripe" | "github" | "custom" | "producthunt" | "youtube" | "x" | "instagram" | "tiktok" | "reddit" | "linkedin" | "none";
  templateStyle: "keynote" | "stripe-card" | "github-terminal" | "producthunt-badge" | "youtube-play" | "social-glass";
  backdropId: string;
  chartStyle: "wave" | "bars" | "none";
  aspectRatio: string;
  ratioStr: string;
  frameType: "keynote" | "browser" | "glass" | "bezel" | "macos" | "safari" | "card" | "stack" | "stack2" | "arc" | "windows";
  accentColor: string;
  companyName: string;
  creatorHandle: string;
}

export const PLATFORM_MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  {
    id: "stripe-100k-arr",
    title: "$100K ARR Milestone",
    platform: "Stripe",
    category: "revenue",
    numericValue: 100000,
    currencySymbol: "$",
    currencyCode: "USD",
    prefix: "",
    suffix: " ARR",
    metricLabel: "Annual Recurring Revenue",
    subtext: "First 6-figure SaaS milestone achieved",
    growthDelta: "+142% YoY",
    verifiedSource: "stripe",
    templateStyle: "stripe-card",
    backdropId: "midnight-obsidian",
    chartStyle: "wave",
    aspectRatio: "16:9",
    ratioStr: "16 / 9",
    frameType: "keynote",
    accentColor: "#635BFF",
    companyName: "indic8",
    creatorHandle: "@founder",
  },
  {
    id: "github-10k-stars",
    title: "10,000 GitHub Stars",
    platform: "GitHub",
    category: "developer",
    numericValue: 10000,
    currencySymbol: "",
    currencyCode: "RAW",
    prefix: "",
    suffix: " Stars ★",
    metricLabel: "Open Source Milestone",
    subtext: "Trending #1 across developers worldwide",
    growthDelta: "+1.4k this week",
    verifiedSource: "github",
    templateStyle: "github-terminal",
    backdropId: "emerald-noir",
    chartStyle: "wave",
    aspectRatio: "16:9",
    ratioStr: "16 / 9",
    frameType: "keynote",
    accentColor: "#2EA44F",
    companyName: "indic8",
    creatorHandle: "@founder",
  },
  {
    id: "producthunt-rank1",
    title: "Product of the Day #1",
    platform: "Product Hunt",
    category: "developer",
    numericValue: 1,
    currencySymbol: "#",
    currencyCode: "RAW",
    prefix: "#",
    suffix: " Product of the Day",
    metricLabel: "Launch Milestone",
    subtext: "Voted #1 on Product Hunt launch day",
    growthDelta: "Trending #1",
    verifiedSource: "producthunt",
    templateStyle: "producthunt-badge",
    backdropId: "sunset-ember",
    chartStyle: "none",
    aspectRatio: "16:9",
    ratioStr: "16 / 9",
    frameType: "keynote",
    accentColor: "#DA552F",
    companyName: "indic8",
    creatorHandle: "@founder",
  },
  {
    id: "youtube-100k-subs",
    title: "100k Subscribers Award",
    platform: "YouTube",
    category: "social",
    numericValue: 100000,
    currencySymbol: "",
    currencyCode: "RAW",
    prefix: "",
    suffix: " Subscribers",
    metricLabel: "Silver Creator Award",
    subtext: "100,000 creator community milestone",
    growthDelta: "+12.4k/mo",
    verifiedSource: "youtube",
    templateStyle: "youtube-play",
    backdropId: "rose-crimson",
    chartStyle: "bars",
    aspectRatio: "16:9",
    ratioStr: "16 / 9",
    frameType: "keynote",
    accentColor: "#FF0000",
    companyName: "indic8",
    creatorHandle: "@founder",
  },
  {
    id: "x-verified-50k",
    title: "50,000 X Followers",
    platform: "X",
    category: "social",
    numericValue: 50000,
    currencySymbol: "",
    currencyCode: "RAW",
    prefix: "",
    suffix: " Followers",
    metricLabel: "Verified Founder Audience",
    subtext: "High-signal design and engineering audience",
    growthDelta: "+4.8k this month",
    verifiedSource: "x",
    templateStyle: "social-glass",
    backdropId: "cosmic-aurora",
    chartStyle: "wave",
    aspectRatio: "16:9",
    ratioStr: "16 / 9",
    frameType: "keynote",
    accentColor: "#1DA1F2",
    companyName: "indic8",
    creatorHandle: "@founder",
  },
];
