# indic8 — Unified Revenue & Product Intelligence Design System

This document strictly codifies the exact design rules, mathematical constants, semantic color tokens, component reuse guidelines, and physical interaction properties that give the **indic8** platform its signature ultra-premium, data-dense, and tactile SaaS aesthetic.

---

## 1. Golden Rule: Reusable Component Discovery First
Before creating **any** new button, tab bar, dropdown, toolbar, modal, or status element, you **MUST first inspect and reuse existing core components** from `src/components/ui/` and `src/lib/`. 

Never implement ad-hoc custom buttons or primitive tab loops when a standard design system component already exists.

| UI Element | Existing Standard Component | File Location | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Tab Controls** | `<AnimatedTabs />` | `src/components/ui/Tabs.tsx` | Framer Motion sliding spring indicator, `sm`/`md` sizing, `rounded-full`. |
| **Toolbars & Micro-actions** | `<AnimatedToolbar />` | `src/components/ui/AnimatedToolbar.tsx` | Gliding ghost hover indicator, layoutId scoping, icon support. |
| **Dropdown Menus** | `<Dropdown />` | `src/components/ui/Dropdown.tsx` | 3D swinging entry animation (`rotateX`), icon prefixes, search. |
| **Platform / Brand Logos** | `<BrandIcon />` | `src/lib/brandLogos.tsx` | Official SVGs for Stripe, Polar, LemonSqueezy, X, Instagram, TikTok, etc. |
| **Card Containers** | `<Card />` | `src/components/ui/index.tsx` | Border highlights, subtle backdrop blurs, consistent padding. |
| **Status Badges** | `<Badge />` | `src/components/ui/index.tsx` | Semantic color tokens (success, warning, danger, neutral). |
| **Dividers & Highlighting** | `<SmartBorder />` | `src/components/ui/LineComponent.tsx` | Inset dual-tone highlighting and conveyor shimmer line animation. |

---

## 2. Button Design System & Token Hierarchy
All buttons across the application must follow strict visual hierarchy and tactile feedback principles.

### Shape & Physical Interaction
- **Shape:** Standard buttons are **full-rounded pills (`rounded-full`)**.
- **Tactile Physics:** All interactive buttons must have `active:scale-[0.98]` or `active:scale-95` on click for a physical spring feel.
- **Cursor:** Explicit `cursor-pointer` on all interactive triggers.

### Standard Button Variants

#### 1. Primary Action Button (High Contrast)
Used for main submit actions, modal downloads, and key CTAs.
```tsx
className="h-10 px-5 rounded-full bg-brand-primary text-surface-canvas font-semibold text-xs shadow-xs hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
```

#### 2. Secondary / Outline Button
Used for complementary actions (e.g. "Copy Image", "Export Package").
```tsx
className="h-10 px-5 rounded-full bg-surface-base hover:bg-surface-subtle text-brand-primary border border-border-default shadow-2xs font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
```

#### 3. Ghost / Tertiary Button
Used for auxiliary actions, studio openers, and toolbar buttons.
```tsx
className="h-10 px-4 rounded-full bg-surface-subtle hover:bg-surface-base text-brand-secondary hover:text-brand-primary border border-border-default font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
```

#### 4. Card Overlay Action Pills
Used for hover actions over graphics and cards.
```tsx
// Secondary Glass Pill:
className="h-8 px-3 rounded-full bg-surface-canvas/90 hover:bg-surface-canvas text-brand-primary border border-border-default shadow-xs flex items-center justify-center gap-1.5 transition text-xs font-semibold cursor-pointer active:scale-[0.98]"

// Primary Accent Pill:
className="h-8 px-3 rounded-full bg-brand-primary text-surface-canvas hover:opacity-90 font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98]"
```

---

## 3. Concentric Nested Corner Radius Mathematics
Whenever nesting containers, cards, buttons, or inner thumbnail boxes, you **must apply concentric corner radius mathematics**:

$$\text{Outer Radius} = \text{Inner Radius} + \text{Padding}$$

### Examples:
- **Inner Box:** `rounded-[8px]` (8px) + **Padding:** `p-1` (4px) $\rightarrow$ **Outer Container:** `rounded-[12px]` (12px).
- **Inner Box:** `rounded-[10px]` (10px) + **Padding:** `p-1.5` (6px) $\rightarrow$ **Outer Container:** `rounded-[16px]` (16px).
- **Nested Card:** `rounded-[20px]` inside modal with `p-4` (16px) $\rightarrow$ **Outer Modal:** `rounded-[36px]`.

Applying this rule guarantees that nested border curves remain mathematically parallel without ugly clipping or uneven corner thickness.

---

## 4. Typography & Spacing Hierarchy
To achieve a calm, focused, and professional "command center" feel, elements must be strictly dense rather than sparse.

- **Primary Text (Data / Titles):** `text-[13px]` / `text-sm font-semibold`
- **Secondary Text (Labels / Metadata):** `text-[12px]` / `text-xs text-brand-secondary`
- **Tertiary Text (Badges / Micro-copy):** `text-[11px]` or `text-[10px]` font-mono tracking-wider.
- **Page Titles:** `text-xl md:text-2xl font-black text-brand-primary tracking-tight`
- **Global Spacing:** Base container padding is `p-4` to `p-6`. Card gaps are `gap-3` to `gap-4`.

---

## 5. Color Palette (Semantic Tokens)
The entire project is built using a strict semantic color system natively powered by CSS variables within Tailwind's `@theme` directive in `globals.css`. **No hardcoded hex values should be used in Tailwind utility classes.**

### Backgrounds & Surfaces:
- **Canvas / Global:** `bg-surface-canvas` (`#FFFFFF` light / `#050505` dark)
- **Cards / Base Surface:** `bg-surface-base` (`#FFFFFF` light / `#161616` dark)
- **Subtle Sections:** `bg-surface-subtle` (`#FAFAFA` light / `#121212` dark)
- **Ghost Indicator / Hover:** `bg-surface-ghost` (`#F0F0F0` light / `#1C1C1C` dark)
- **Sidebar:** `bg-surface-sidebar` (`#F8F8F8` light / `#09090b` dark)

### Text & Brand Typography:
- **Primary (Titles / Main Data):** `text-brand-primary` (`#111111` light / `#EDEDED` dark)
- **Secondary (Labels / Descriptions):** `text-brand-secondary` (`#666666` light / `#999999` dark)
- **Muted (Metadata / Subtext):** `text-brand-muted` (`#888888` light / `#737373` dark)
- **Disabled / Borders:** `text-brand-disabled` (`#AAAAAA` light / `#525252` dark)

### Borders:
- **Standard Structure:** `border-border-default` (`#E5E5E5` light / `#1E1E1E` dark)
- **Highlight (Dual-tone Inset):** `border-border-highlight` (`#FFFFFF` light / `#242424` dark)
- **Shadow (Bottom Border):** `border-border-shadow` (`#E0E0E0` light / `#000000` dark)

---

## 6. Physics & Animation (Framer Motion)
We do not use jarring CSS fades for primary interactions. We use physical spring mathematics.

### The "Ghost Indicator" (LayoutId)
For any tab, sidebar menu, toolbar, or dropdown list, hovering does NOT trigger an abrupt CSS background change on the item itself. Instead, a *single* background element (`layoutId`) physically glides between items.
- **Spring Config:** `type: "spring", bounce: 0.15, duration: 0.4`
- **Color:** `bg-surface-ghost` (hover) or `bg-surface-base border border-border-default` (active).
- **Scoping (Crucial):** All `layoutId` props MUST be suffixed with a unique instance ID (e.g., `layoutId={"indicator-" + useId()}`). This prevents ghost indicators from flying across the screen during page navigation.

---

## 7. Media & Profile Avatar Resilience
When displaying user avatars or product media:
1. **Fallback Image Error Handling:** Always supply `onError={(e) => setImageError(true)}` to prevent broken image placeholders.
2. **Initials Fallback Badge:** Always render a clean background circle with uppercase initials if no image is present or if loading fails.
3. **CORS:** Always include `crossOrigin="anonymous"` on canvas-rendered `<img />` tags for clean export serialization.
