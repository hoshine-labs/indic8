# indic8 — Architecture, UX Simplification & Chart System Refactor (v2)

## 1. Executive Summary & What indic8 Is Now

**indic8** is a calm, unified revenue and product intelligence command center designed for indie hackers, software developers, and creators.

Instead of navigating fragmented dashboards across **Stripe, Polar.sh, RevenueCat, Apple App Store Connect, Google Play Console, and Lemon Squeezy**, indic8 aggregates telemetry from all payment channels into a clean, border-defined command center and provides an integrated **Studio Canvas** for generating authentic, verified social announcement graphics.

### The v2 Refactor Objective
In v2, the application transitioned from an internal-admin-heavy feel into a calm, focused product built on **progressive disclosure**, an explicit **Query Layer**, an isolated **Provider Adapter Architecture**, and a native **EvilCharts** composition layer.

---

## 2. End-to-End Architecture & Data Pipeline

```
                 PAYMENT PROVIDER APIS
 (Stripe API, Polar REST v1, RevenueCat API, App Store, Google Play, Lemon Squeezy)
                           │
                           ▼
               PROVIDER ADAPTER LAYER
             (src/lib/providers/adapter.ts)
  * Concrete adapters for each provider (e.g. StripeAdapter, PolarAdapter)
  * Exposes: connect(), disconnect(), sync(), getProducts(), getTransactions()
  * Tracks explicit capabilities (supportsMRR, supportsRefunds, etc.)
                           │
                           ▼
                 RAW PROVIDER DATA
  * Production: Live authenticated provider JSON records
  * Development: Explicitly isolated in src/data/fixtures/developmentFixtures.ts
                           │
                           ▼
                 NORMALIZATION LAYER
           (src/lib/domain/normalization.ts)
  * Standardizes raw provider payloads into canonical records
  * Sums channel revenue, links multi-platform listings, preserves external IDs
                           │
                           ▼
               CANONICAL DOMAIN MODELS
               (src/lib/domain/types.ts)
  * Money { amount, currency } (src/lib/domain/money.ts)
  * UnifiedProduct, ProductChannel, CanonicalTransaction, CanonicalSubscription
  * Milestone, PortfolioOverview, ComparisonResult
                           │
                           ▼
                 DOMAIN METRIC ENGINE
             (src/lib/metrics/engine.ts)
  * Pure calculation functions: calculatePortfolioRevenue(), calculatePortfolioMRR()
  * Pure rules engine: detectMilestones(), calculateProductComparison()
  * Reusable metric registry (src/lib/metrics/registry.ts)
                           │
                           ▼
                     QUERY LAYER
              (src/lib/queries/index.ts)
  * Single boundary between domain logic and user interface:
    - getPortfolioOverview()
    - getRevenueSeries()
    - getProductOverview()
    - getProductMetrics()
    - getComparison()
    - getMilestones()
    - getProviderOverview()
                           │
                           ▼
                 INDIC8 UI & VIEWPORTS
  * DashboardView (4 KPIs + RevenueChart + Progressive Secondary Drawer)
  * ProductsView (Streamlined cards + Slide-Over Inspector)
  * Canonical Product Page (/products/[productId])
  * CompareView (Horizontal bar ComparisonChart + Core Matrix)
  * GalleryView (Ready to Share + Copywriting engine)
  * ProvidersView (Gateway health + Expandable capabilities)
  * StudioCanvas (3D Tilt Viewport, Keyframe Scrubber, Multi-Ratio Export)
                           │
                           ▼
                 EVILCHARTS LAYER
             (src/components/charts/)
  * Thin composition layer: Indic8Chart, RevenueChart, ProductRevenueChart, ComparisonChart
  * Recharts engine underneath with Light/Dark/Auto theme tokens
```

---

## 3. Data Integrity: Real Telemetry vs. Development Fixtures

### Are the numbers real or dummy?
1. **Current Local State**:
   - The application currently runs on **development fixtures** strictly isolated in [`src/data/fixtures/developmentFixtures.ts`](file:///Users/neeldedkawala/Documents/Website/indic8/src/data/fixtures/developmentFixtures.ts).
   - These fixtures mimic real multi-channel telemetry (e.g. *Reel Player Pro* on Stripe macOS + Apple App Store iOS, *HyperFocus* on RevenueCat + Google Play, *FastSaaS* on Stripe + Polar).
2. **Production Isolation**:
   - **Zero synthetic figures in production code**: Business calculations never fabricate data or generate random values.
   - If a connected provider does not supply subscription or refund telemetry, the metric engine explicitly displays **`Unavailable`** rather than fabricating estimates.
3. **Turnkey Provider Integration**:
   - Every provider adapter in [`src/lib/providers/adapter.ts`](file:///Users/neeldedkawala/Documents/Website/indic8/src/lib/providers/adapter.ts) implements `PaymentProviderAdapter`.
   - Connecting real API tokens (such as the Polar REST v1 token or Stripe restricted keys) feeds directly into the normalization layer without requiring any frontend or UI refactoring.

---

## 4. UX Simplification & Progressive Disclosure

Every viewport now prioritizes the most important user question first:

### 1. Dashboard: *"How is my business doing?"*
- **Primary Viewport**:
  - **4 Core KPIs**: Gross Revenue (`$181,830`), Paid Orders (`2,740`), Customers (`2,580`), and MRR (`$10,730`).
  - **Primary Revenue Chart**: Clean area chart showing revenue trajectory over the selected time range (`Today`, `7D`, `30D`, `This Month`, `All Time`).
  - **Filter Bar**: `[Date Range Filter] [All Gateways] [Filters +]`.
- **Progressive Disclosure**:
  - Secondary telemetry (Refund count & 0.51% refund rate, Average Order Value, per-gateway revenue split) is tucked under a smooth collapsible **"Show Secondary Telemetry"** toggle.

### 2. Products: *"What products exist and how are they performing?"*
- **Streamlined Product Cards**:
  - Displays Product Name, Category Badge, Revenue, Order Count, Connected Provider Badges, and a clear **"View Product →"** link.
- **Slide-Over Inspector (`ProductDetailInspector`)**:
  - Clicking any card opens a slide-over panel showing 30-day revenue trend and channel attribution.
- **Canonical Product Route (`/products/[productId]`)**:
  - A dedicated full-page experience for every product with comprehensive KPI cards, trend charts, channel breakdown, and 1-click **"Generate Milestone Post"** into Studio.

### 3. Compare: *"Which products perform better?"*
- **Calm Product Selector**: Compact chip selector supporting side-by-side comparison for up to 4 products.
- **Horizontal Bar Comparison Chart**: Direct comparative revenue visualizer without messy overlapping curves.
- **Core Matrix**: Revenue, Sales, Customers, MRR, and YoY Growth.
- **Progressive "More Metrics"**: Collapsible section for AOV, Subscriptions, and Refund counts.

### 4. Milestone Gallery: *"What do I have worth posting?"*
- **Section 1: Ready to Share**: Automatically detects verified milestones (e.g. `$100K ARR`, `1,000 Orders`, `$5K MRR`) with 1-click **"Create Post"** directly into Studio Canvas.
- **Section 2: Graphic Templates & Copywriting**: High-contrast graphic presets with a built-in **Multi-Tone Copywriting Engine** (Founder, Minimal, Story, Engineering) for instant clipboard copy.

### 5. Providers: *"Are my data sources connected and healthy?"*
- **Clean Health Cards**: Gateway name, connection status badge, account ID, last synced timestamp, and 1-click **Sync Now**.
- **Expandable Capabilities Inspector**: Reveals supported metrics on interaction.

### 6. Studio Canvas: *"How do I turn verified data into a post?"*
- **3D Tilt Stage**: Full interactive perspective tilt (`perspective(1000px) rotateX(...) rotateY(...)`), corner radius adjustments, and analog film grain overlay.
- **Motion Timeline**: Keyframe scrubber (0–3.0s) with speed controls (0.5x, 1x, 1.5x) and continuous looping.
- **Structured Accordion Controls**: `Template`, `Data`, `Style`, `Motion`, `Identity`, `Export` with collapsible advanced toggles.
- **Multi-Format Export Engine**: Export high-DPI PNGs or complete ZIP bundles for X/Twitter (16:9), Instagram Square (1:1), Stories/Reels (9:16), and LinkedIn (16:9).

---

## 5. EvilCharts Integration & Theme System

The chart layer in [`src/components/charts/`](file:///Users/neeldedkawala/Documents/Website/indic8/src/components/charts/) wraps the EvilCharts/Recharts presentation layer:

| Chart Component | Chart Type | Use Case |
| :--- | :--- | :--- |
| **`RevenueChart`** | Area / Line | Portfolio revenue trend over time with provenance annotations |
| **`ProductRevenueChart`** | Area / Line | Individual product 30-day revenue trend |
| **`ComparisonChart`** | Horizontal Bar | Multi-product comparative revenue ranking |
| **`ChartTooltip`** | Floating HUD | Tactile tooltip with formatted currency and verified provenance badge |

### Dynamic Theme Adaptation
All charts dynamically read [`CHART_TOKENS`](file:///Users/neeldedkawala/Documents/Website/indic8/src/components/charts/chartTokens.ts):
- **Light Mode**: Clean dark stroke (`#111111`), subtle grid (`#EBEBEB`), and crisp white tooltips.
- **Dark Mode**: Soft luminous stroke (`#EDEDED`), deep charcoal grid (`#1E1E1E`), and dark obsidian tooltips (`#161616`).
- **GPU Cross-Fade**: Theme toggles use `document.startViewTransition()` for smooth fades.

---

## 6. Directory Structure Overview

```
indic8/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Synchronous blocking head script (Zero FOUC)
│   │   ├── page.tsx                # Master app shell & dynamic tab routing
│   │   ├── globals.css             # Tailwind v4 theme, border hierarchy & tokens
│   │   └── products/
│   │       └── [productId]/
│   │           └── page.tsx        # Canonical product detail page
│   ├── context/
│   │   ├── ThemeContext.tsx        # Light/Dark/Auto theme with View Transitions
│   │   └── SidebarContext.tsx      # Collapsible vs Sliding sidebar state
│   ├── components/
│   │   ├── Sidebar.tsx             # Minimal 1px border sidebar navigation
│   │   ├── Header.tsx              # Breadcrumbs, sync indicator & theme toggle
│   │   ├── charts/                 # Internal EvilCharts layer
│   │   │   ├── Indic8Chart.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── ProductRevenueChart.tsx
│   │   │   ├── ComparisonChart.tsx
│   │   │   ├── ChartTooltip.tsx
│   │   │   ├── ChartEmptyState.tsx
│   │   │   ├── chartTokens.ts
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── filters/            # Reusable filter bar & popovers
│   │   │   └── index.tsx           # Primitives (Logo, Tabs, Dropdown, Lines)
│   │   ├── dashboard/              # DashboardView
│   │   ├── products/               # ProductsView & ProductDetailInspector
│   │   ├── compare/                # CompareView
│   │   ├── gallery/                # GalleryView
│   │   ├── providers/              # ProvidersView
│   │   ├── studio/                 # CanvasStage, 3D dock & RightPropertyPanel
│   │   └── settings/               # SettingsView
│   ├── data/
│   │   └── fixtures/               # Isolated development mock records
│   │       └── developmentFixtures.ts
│   └── lib/
│       ├── domain/                 # Canonical domain models & money arithmetic
│       │   ├── types.ts
│       │   ├── money.ts
│       │   └── normalization.ts
│       ├── providers/              # Payment provider adapters
│       │   └── adapter.ts
│       ├── metrics/                # Pure metric calculations & registry
│       │   ├── engine.ts
│       │   └── registry.ts
│       ├── queries/                # Query Layer (Boundary between domain & UI)
│       │   └── index.ts
│       ├── indic8Store.tsx         # Unified store context
│       ├── indic8Data.ts           # Backward-compatible fixtures
│       ├── brandLogos.tsx          # SVGL brand logos
│       └── useMounted.ts           # React 19 hydration safety hook
├── implementation-v1.md
├── implementation-v2.md
└── package.json
```

---

## 7. Verification & Build Status

The application has been verified against strict build checks:
- **TypeScript**: `npx tsc --noEmit` exited with **0 errors**.
- **ESLint**: `npm run lint` exited with **0 errors**.
- **Production Build**: `npm run build` compiled **successfully** in Turbopack, generating both static routes (`/`, `/_not-found`) and dynamic on-demand routes (`/products/[productId]`).
