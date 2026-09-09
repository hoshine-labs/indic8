export interface BackdropPreset {
  id: string;
  name: string;
  type: "gradient" | "mesh" | "solid" | "image";
  background: string;
  previewBg: string;
  isNoise?: boolean;
}

export const BACKDROP_PRESETS: BackdropPreset[] = [
  {
    id: "midnight-obsidian",
    name: "Obsidian Studio",
    type: "mesh",
    background: "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(120, 119, 198, 0.15), rgba(255, 255, 255, 0)), #08090C",
    previewBg: "radial-gradient(circle at top, #1E1F29, #08090C)",
  },
  {
    id: "linear-indigo",
    name: "Linear Indigo",
    type: "mesh",
    background: "radial-gradient(ellipse 90% 60% at 50% 0%, #4338CA 0%, rgba(67, 56, 202, 0.35) 50%, transparent 80%), #07080E",
    previewBg: "linear-gradient(135deg, #4338CA, #07080E)",
  },
  {
    id: "stripe-mesh",
    name: "Stripe Purple Mesh",
    type: "mesh",
    background: "radial-gradient(at 10% 20%, #6366F1 0px, transparent 55%), radial-gradient(at 90% 80%, #9333EA 0px, transparent 55%), #0A0A14",
    previewBg: "linear-gradient(135deg, #6366F1, #9333EA)",
  },
  {
    id: "emerald-noir",
    name: "Emerald Noir",
    type: "mesh",
    background: "radial-gradient(at 15% 15%, #059669 0px, transparent 50%), radial-gradient(at 85% 85%, #042F2E 0px, transparent 60%), #050807",
    previewBg: "linear-gradient(135deg, #059669, #042F2E)",
  },
  {
    id: "sunset-ember",
    name: "Sunset Ember",
    type: "mesh",
    background: "radial-gradient(at 20% 15%, #EA580C 0px, transparent 55%), radial-gradient(at 80% 85%, #BE123C 0px, transparent 55%), #0F080A",
    previewBg: "linear-gradient(135deg, #EA580C, #BE123C)",
  },
  {
    id: "cosmic-aurora",
    name: "Cosmic Aurora",
    type: "mesh",
    background: "radial-gradient(at 85% 15%, #0284C7 0px, transparent 50%), radial-gradient(at 15% 85%, #10B981 0px, transparent 50%), #040914",
    previewBg: "linear-gradient(135deg, #0284C7, #10B981)",
  },
  {
    id: "rose-crimson",
    name: "Rose Crimson",
    type: "mesh",
    background: "radial-gradient(at 20% 20%, #BE123C 0px, transparent 55%), radial-gradient(at 80% 80%, #4C0519 0px, transparent 60%), #0B0407",
    previewBg: "linear-gradient(135deg, #BE123C, #4C0519)",
  },
  {
    id: "cyber-slate",
    name: "Cyber Slate",
    type: "mesh",
    background: "radial-gradient(at 15% 15%, #0EA5E9 0px, transparent 45%), radial-gradient(at 85% 85%, #334155 0px, transparent 55%), #060B14",
    previewBg: "linear-gradient(135deg, #0EA5E9, #334155)",
  },
  {
    id: "frosted-pearl",
    name: "Frosted Pearl (Light)",
    type: "gradient",
    background: "linear-gradient(180deg, #FFFFFF 0%, #EEF2F6 100%)",
    previewBg: "linear-gradient(180deg, #FFFFFF 0%, #EEF2F6 100%)",
  },
  {
    id: "soft-slate-light",
    name: "Studio Slate (Light)",
    type: "gradient",
    background: "linear-gradient(145deg, #F8FAFC 0%, #E2E8F0 100%)",
    previewBg: "linear-gradient(145deg, #F8FAFC 0%, #E2E8F0 100%)",
  },
  {
    id: "pure-black",
    name: "Pure OLED Black",
    type: "solid",
    background: "#000000",
    previewBg: "#000000",
  },
  {
    id: "monochrome-smoke",
    name: "Monochrome Studio",
    type: "gradient",
    background: "radial-gradient(circle at 50% 40%, #1E2028 0%, #08090C 100%)",
    previewBg: "radial-gradient(circle at center, #1E2028, #08090C)",
  },
];

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  scale: number;
  perspective: number;
  frameType: "keynote" | "browser" | "glass" | "bezel";
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "flat-keynote",
    name: "Apple Keynote Flat",
    description: "Centered crisp keynote announcement",
    tiltX: 0,
    tiltY: 0,
    tiltZ: 0,
    scale: 1,
    perspective: 1200,
    frameType: "keynote",
  },
  {
    id: "tilt-left",
    name: "Perspective Tilt Left",
    description: "Hardware 3D angle with deep perspective",
    tiltX: 12,
    tiltY: -18,
    tiltZ: 6,
    scale: 0.95,
    perspective: 1000,
    frameType: "keynote",
  },
  {
    id: "tilt-right",
    name: "Perspective Tilt Right",
    description: "Sleek right isometric projection",
    tiltX: 12,
    tiltY: 18,
    tiltZ: -6,
    scale: 0.95,
    perspective: 1000,
    frameType: "keynote",
  },
  {
    id: "browser-float",
    name: "macOS Studio Window",
    description: "Floating browser window with traffic lights",
    tiltX: 6,
    tiltY: -8,
    tiltZ: 0,
    scale: 0.96,
    perspective: 1200,
    frameType: "browser",
  },
  {
    id: "glass-card",
    name: "Cupertino Translucent",
    description: "Apple frosted glass backdrop blur",
    tiltX: 0,
    tiltY: 0,
    tiltZ: 0,
    scale: 1,
    perspective: 1200,
    frameType: "glass",
  },
  {
    id: "pitch-forward",
    name: "Dramatic Forward Pitch",
    description: "Bold announcement hero angle",
    tiltX: 22,
    tiltY: 0,
    tiltZ: 0,
    scale: 0.92,
    perspective: 900,
    frameType: "keynote",
  },
];

export interface CurrencyItem {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const WORLD_CURRENCIES: CurrencyItem[] = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "AED", symbol: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "BTC", symbol: "₿", name: "Bitcoin", flag: "🪙" },
  { code: "ETH", symbol: "Ξ", name: "Ethereum", flag: "💠" },
  { code: "SOL", symbol: "◎", name: "Solana", flag: "⚡" },
  { code: "RAW", symbol: "", name: "Raw Metric (No Currency)", flag: "#" },
];
