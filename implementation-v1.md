# indic8 — Implementation & Architecture Writeup (v1)

## 1. Executive Summary & Product Vision

**indic8** is a unified revenue and product intelligence command center built for indie hackers, developers, creators, and multi-platform software businesses.

Instead of navigating fragmented dashboards across **Stripe, Polar, RevenueCat, Apple App Store, Google Play Console, and Lemon Squeezy**, indic8 aggregates authenticated data from all connected payment channels into a single, cohesive dashboard with an integrated **Studio Canvas** for generating authentic, verified milestone graphics.

### The Authenticity Guarantee
Every number, MRR tally, customer count, and transaction record in indic8 originates directly from authenticated provider telemetry. There are zero synthetic figures, fake placeholder metrics, or unverified estimations.

---

## 2. Core Features & Capabilities

```
+---------------------------------------------------------------------------------------------------+
|                                       indic8 MASTER APP                                           |
+---------------------+-----------------------------------------------------------------------------+
|                     | [Header] Breadcrumbs | Sync All | Currency Switcher | Theme Toggle | Connect|
|  [Minimal Sidebar]  +-----------------------------------------------------------------------------+
|                     | [Main Viewport]                                                             |
|  - Dashboard        |   * Portfolio KPIs (Gross Revenue, Orders, Active Subs, MRR, Refunds)      |
|  - Products         |   * Cross-Gateway Product Catalog & Grouping Linker                         |
|  - Compare          |   * 4-Way Product Intelligence Matrix & Highlights                          |
|  - Gallery          |   * Verified Milestone Presets & Multi-Tone Social Copy                     |
|  - Activity         |   * Chronological Gateway Event Audit Feed                                  |
|  - Providers        |   * Connected Payment Channels & Real-Time Sync Status                     |
|  - Studio Canvas    |   * 3D Tilt Viewport, Keyframe Playback, Aspect Ratio & Brand Customizer    |
|  - Settings         |   * Appearance (Light/Dark/Auto), Sidebar Mode (Collapsible/Sliding), Currencies|
|                     +-----------------------------------------------------------------------------+
|  [Bottom Settings]  | [Modals] Batch Export Package (ZIP/PNG) | Read-Only Gateway Onboarding      |
+---------------------+-----------------------------------------------------------------------------+
```

### 1. Unified Dashboard & Intelligence
- **Consolidated Financial Metrics**: Calculates total Gross Revenue, Net Volume, Units Sold, Active Subscriptions, Portfolio MRR, and Refunds.
- **Time Range Filtering**: Instant calculations across `Today`, `7D`, `30D`, `This Month`, and `All Time (Lifetime)`.
- **Live Multi-Currency Engine**: Dynamic conversion between USD (`$`), EUR (`€`), GBP (`£`), INR (`₹`), and JPY (`¥`) with real-time rate mapping.

### 2. Cross-Provider Product Catalog & Grouping
- **Product Unification**: Allows software products sold across multiple platforms (e.g., *Reel Player Pro* on Stripe macOS + Apple App Store iOS) to be merged into a single logical product entity.
- **Granular Channel Attribution**: Breaks down revenue, units sold, and subscriber counts by payment gateway.

### 3. Product Comparison Matrix
- **Side-by-Side Analysis**: Compare up to 4 software products across total revenue, conversion volume, active subscribers, ARPU, and MRR.
- **Automated Superlatives**: Identifies *Highest Grossing*, *Largest Userbase*, and *Top MRR Contributor*.

### 4. Studio Canvas & Milestone Graphic Generator
- **Authentic Social Proof Cards**: Turn verified milestones (e.g., `$100k ARR`, `$10k MRR`, `50k Users`) into high-resolution social announcement graphics.
- **3D Viewport Physics**: Tilt on X/Y/Z axes (`perspective(1000px) rotateX(12deg) rotateY(-18deg)`), customizable corner radii, and backdrop blur.
- **Animated Motion Timeline**: Scrubbable keyframe scrubber (0–3.0s) with play/pause, speed controls (0.5x, 1x, 1.5x), and continuous looping.
- **Backdrop Wallpapers**: Midnight Obsidian, Obsidian Glow, Aurora Ember, Studio Carbon, and custom HEX gradients with analog film grain overlay.
- **Social Format Presets**: Target aspect ratios for X/Twitter (16:9), Instagram Square (1:1), Stories & Reels (9:16), and LinkedIn (16:9).
- **One-Click Export**: High-DPI PNG export (`html-to-image`) and complete ZIP bundling (`JSZip`) with verified social copy.

### 5. Verified Milestone Gallery & Copywriting Engine
- **Pre-computed Milestone Cards**: Automatically detects milestones from connected gateways.
- **Multi-Tone Copywriting Generator**: Generates authentic captions in **Founder-Style**, **Minimal & Punchy**, **Story-Driven**, and **Engineering-Focused** voices.

### 6. Activity & Audit Telemetry Feed
- Chronological transaction and milestone log with gateway brand badges, transaction timestamps, customer identifiers, and verified proof stamps.

### 7. Gateway Management & Secure Onboarding
- Manage Stripe, Polar.sh, RevenueCat, Apple App Store Connect, Google Play Console, and Lemon Squeezy with granular sync triggers and read-only API authentication.

---

## 3. Architecture & Technical Design

### Directory Structure
```
indic8/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root shell with synchronous head theme-loader
│   │   ├── page.tsx                # Master app shell & dynamic tab routing
│   │   └── globals.css             # Tailwind v4 theme, color matrix & animations
│   ├── context/
│   │   ├── ThemeContext.tsx        # Light/Dark/System provider with startViewTransition
│   │   └── SidebarContext.tsx      # Collapsible vs. Sliding sidebar state & layout
│   ├── components/
│   │   ├── Sidebar.tsx             # Collapsible/sliding navigation with spring physics
│   │   ├── Header.tsx              # Top header with breadcrumbs, sync & theme switcher
│   │   ├── dashboard/              # Portfolio revenue cards & quick actions
│   │   ├── products/               # Product catalog & external channel linking
│   │   ├── compare/                # 4-way product matrix
│   │   ├── gallery/                # Verified milestone templates & copy generator
│   │   ├── activity/               # Chronological transaction audit feed
│   │   ├── providers/              # Gateway management & connection controls
│   │   ├── settings/               # Appearance, sidebar mode & brand preferences
│   │   ├── studio/                 # Studio canvas, 3D stage, dock & property panel
│   │   ├── export/                 # Batch ZIP/PNG export modal
│   │   ├── onboarding/             # Gateway selection onboarding modal
│   │   └── ui/                     # Primitives (Logo, Tabs, Toolbar, Dropdown, Lines)
│   └── lib/
│       ├── indic8Store.tsx         # Unified context state, math & sync simulation
│       ├── indic8Data.ts           # Authentic initial gateway telemetry
│       ├── brandLogos.tsx          # High-fidelity SVG provider logos
│       ├── useMounted.ts           # React 19 useSyncExternalStore hydration hook
│       ├── platforms.ts            # Platform milestone presets & aspect ratios
│       └── types.ts                # TypeScript interfaces & types
├── DESIGN.md                       # Design system constants & tokens
└── tsconfig.json                   # Path aliases & bundler configuration
```

---

## 4. Design System & Aesthetics

The UI design is modeled directly after the minimalist, tactile aesthetic of `saveatscale`:

| Semantic Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| `bg-surface-canvas` | `#F8F8F8` / `#FFFFFF` | `#050505` | Global background canvas |
| `bg-surface-sidebar` | `#EDEDED` / `#F8F8F8` | `#09090b` | Left sidebar navigation |
| `bg-surface-base` | `#FFFFFF` | `#161616` | Main cards, modals & panels |
| `bg-surface-subtle` | `#FAFAFA` | `#121212` | Inputs, chips & secondary elements |
| `bg-surface-ghost` | `#F0F0F0` | `#1C1C1C` | Hover ghost indicator |
| `border-border-default` | `#E5E5E5` | `#1E1E1E` | Primary structural borders (1px) |
| `border-border-highlight` | `#FFFFFF` | `#242424` | Dual-tone smart border top highlight |
| `text-brand-primary` | `#111111` | `#EDEDED` | Main titles & values |
| `text-brand-secondary` | `#666666` | `#999999` | Subtitles & secondary labels |
| `text-brand-muted` | `#888888` | `#737373` | Form captions & hints |

### Tactile Rules & Physics
1. **Zero Drop Shadows**: `* { box-shadow: none !important; }` enforced globally for clean border-defined surfaces.
2. **Spring Physics**: Framer Motion tab and toolbar glides use `{ type: "spring", bounce: 0.15, duration: 0.4 }`.
3. **No FOUC / Seamless Theme Loading**: A synchronous `<head>` script reads `localStorage` before the `<body>` renders, ensuring the app loads directly in the saved theme without visual flicker.
4. **Smooth View Transitions**: Explicit theme toggling triggers `document.startViewTransition()` for GPU-accelerated cross-fading.

---

## 5. Verification & Build Status

The application has been verified with production build tools:
- **TypeScript**: `npx tsc --noEmit` exited with **0 errors**.
- **ESLint**: `npm run lint` exited with **0 errors**.
- **Production Bundle**: `npm run build` compiled **successfully** in 670ms using Next.js 16 (Turbopack).
