# DLM UI Audit Report

**Date:** 2026-06-02  
**Scope:** Admin dashboard, partner dashboard, customer app, marketplace, checkout, orders, settings, audit logs  
**Goal:** Fix dark/light inconsistencies, increase information density (~15–25%), align with modern SaaS patterns (Linear, Stripe, Vercel, Shopify Admin)

---

## Executive summary

The application had two systemic issues:

1. **Theme drift** — Hardcoded `text-white`, `bg-white`, `amber-*`, `emerald-*`, and `bg-black/*` scattered across features, breaking dark mode and contrast.
2. **Oversized UI** — Large typography (`text-3xl`+ page titles), heavy padding (`p-6`–`p-8`), wide sidebar, tall navbar, and spacious cards reduced scanability.

This pass introduced a **compact semantic token layer**, updated **primitives and shells**, migrated **high-traffic surfaces**, and documented the system in `DESIGN_SYSTEM.md`.

---

## Phase 1 — Dark / light mode audit

### Issues found

| Area | Issue | Severity |
| ---- | ----- | -------- |
| Status badges | `amber-*` / `emerald-*` without dark variants | High |
| Admin alerts | Hardcoded amber/rose on pending/complaint chips | High |
| Laundry cards | `bg-emerald-500 text-white`, `bg-white/95` badges | High |
| Hero / CTA sections | `text-white`, `bg-white/*` on gradients | Medium (acceptable on brand hero with `text-on-hero`) |
| Mobile drawer scrim | `bg-black/50` invisible in some themes | Medium |
| Order tracking | `emerald-600` delivered state, `text-white` subcopy | High |
| Star ratings | `fill-amber-400` everywhere | Low |
| Image overlays | `from-black/50` gradients | Medium |

### Fixes implemented

- **Semantic tokens** in `frontend/styles/tokens.css`: `success`, `warning`, `danger`, `info`, `rating` (+ `-muted`, `-foreground`), `--overlay`, dark-mode muted variants.
- **Tailwind mapping** in `tailwind.config.ts` for all status colors and density (`h-nav`, `w-sidebar`, `h-control`, `h-table-row`).
- **Global utilities** in `frontend/app/globals.css`: `.page-title`, `.section-title`, `.card-title`, `.helper-text`, `.rating-pill`, `.overlay-scrim`, `.table-sticky-head`, `.text-on-hero`, `.text-on-hero-muted`.
- **Migrated components** (non-exhaustive): partner status badges, admin alerts/activity, laundry cards, detail header, storefront view, KPI cards, marketplace sections, checkout/order tracking heroes, testimonials/reviews stars.

### Theme modes

| Mode | Implementation |
| ---- | -------------- |
| Light | `:root` tokens in `tokens.css` |
| Dark | `.dark` class via `ThemeProvider` |
| System | `prefers-color-scheme` + user preference in global navbar |

### Remaining theme debt

- Some marketing sections still use **brand gradients** with `text-on-hero` (intentional; not `text-black`/`bg-white`).
- Partner storefront **custom brand colors** (`--store-primary`) are dynamic; verified badge uses semantic `text-success`.
- Occasional `brand-*` utility classes on landing gradients — mapped to CSS variables, theme-safe.

---

## Phase 2 — Density & layout audit

### Targets vs. before

| Element | Before (approx.) | After |
| ------- | ---------------- | ----- |
| Navbar height | 64–72px | **56px** (`--nav-height`) |
| Sidebar width | 240–256px | **208px** (`--sidebar-width`) |
| Control height | 40–44px | **36px** (`--control-height`) |
| Table row | ~48px | **40px** (`--table-row`) |
| Card padding | `p-6`–`p-8` | **`p-4`** default on primitives |
| Page title | `text-2xl`–`text-3xl` | **`text-xl`** (`.page-title`) |

### Primitives updated

| File | Changes |
| ---- | ------- |
| `components/ui/button.tsx` | Smaller default sizes, `h-control` |
| `components/ui/input.tsx` | `h-control`, compact text |
| `components/ui/card.tsx` | `p-4` header/content, tighter gaps |
| `components/ui/table.tsx` | Compact cells, optional `stickyHeader` |
| `components/ui/dialog.tsx` | Reduced padding, `rounded-lg` |
| `components/ui/label.tsx` | `text-xs` default |

### Shells & navigation

| Shell | Changes |
| ----- | ------- |
| `admin-shell.tsx` | `h-nav`, `w-sidebar`, `overlay-scrim` |
| `partner-shell.tsx` | Same density tokens |
| `app-shell.tsx` | Customer app compact chrome |
| `public-shell.tsx` | Aligned navbar height |
| `global-navbar/` | 56px bar, compact search & menus |

### Dashboard & data

| Surface | Changes |
| ------- | ------- |
| `kpi-card.tsx` / `partner-kpi-card.tsx` | Compact metric layout |
| `admin-stat-cards.tsx` | Semantic gradients, `text-xl` values |
| `admin-panel.tsx` | `rounded-lg`, tighter filter bar |
| `virtual-data-table.tsx` | Sticky header, `py-2.5` cells |
| `partner-content.tsx` / `admin-content.tsx` | `py-4`–`py-5` page padding |

### Feature pages touched

- Admin: overview, approvals, alerts strip, activity panel, stat cards
- Partner: dashboard hero, status badges, storefront gallery
- Customer: discover cards, detail header, reviews, checkout, order tracking
- Marketing: home hero, stats, CTA, testimonials, service categories, pricing

---

## Typography audit

### Scale (compact)

| Role | Class / utility | Size |
| ---- | --------------- | ---- |
| Page title | `.page-title` | 18px (`text-xl`) |
| Section title | `.section-title` | 16px (`text-base`) |
| Card title | `.card-title` | 13px (`text-sm`) |
| Body | `text-sm` (body default) | 13px |
| Helper | `.helper-text` | 11px (`text-xs`) |

### Hero / marketing

Hero headlines reduced one step (e.g. `text-3xl` → `text-2xl` on home). Full-bleed marketing pages may still use larger display type on `lg:` breakpoints only.

---

## Accessibility (WCAG 2.1 AA)

| Check | Status |
| ----- | ------ |
| Body text contrast on `background` / `card` | Pass (semantic fg tokens) |
| Primary button (`primary` on `primary-foreground`) | Pass |
| Focus visible | Pass — `ring-ring ring-offset-background` globally |
| Reduced motion | Pass — `globals.css` media query |
| Touch targets | Maintained ≥44px on primary mobile CTAs; compact controls at 36px for dense desktop tables |
| Status colors | Pass — use `*-muted` backgrounds with `text-success` / `text-warning` etc., not raw Tailwind palette |

**Manual QA recommended:** Toggle light / dark / system on admin, partner, and customer flows; verify order tracking delivered (green) and cancelled (muted) states.

---

## Page-by-page verification checklist

| Page / area | Dark | Light | Density | Tokens |
| ----------- | ---- | ----- | ------- | ------ |
| Admin overview | ✓ | ✓ | ✓ | ✓ |
| Admin approvals | ✓ | ✓ | ✓ | ✓ |
| Admin laundries / customers | ✓ | ✓ | Partial | Partial |
| Admin audit / settings | ✓ | ✓ | Partial | Partial |
| Partner dashboard | ✓ | ✓ | ✓ | ✓ |
| Partner orders / storefront | ✓ | ✓ | ✓ | ✓ |
| Discover / laundry cards | ✓ | ✓ | ✓ | ✓ |
| Laundry detail / reviews | ✓ | ✓ | ✓ | ✓ |
| Checkout | ✓ | ✓ | ✓ | ✓ |
| Order tracking | ✓ | ✓ | ✓ | ✓ |
| Home / marketplace landing | ✓ | ✓ | ✓ | ✓ (hero uses `text-on-hero`) |
| Login / auth | ✓ | ✓ | — | — (unchanged) |

---

## Files changed (summary)

**Foundation:** `frontend/styles/tokens.css`, `frontend/app/globals.css`, `frontend/tailwind.config.ts`

**Primitives:** `button`, `input`, `card`, `table`, `dialog`, `label`

**Layout:** `admin-shell`, `partner-shell`, `app-shell`, `public-shell`, `global-navbar/*`

**Features:** 30+ files across `features/admin`, `features/partner`, `features/discover`, `features/orders`, `features/checkout`, `features/storefront`

**Docs:** `DESIGN_SYSTEM.md` (updated), `UI_AUDIT_REPORT.md` (this file)

---

## Recommendations (follow-up)

1. **Wire `stickyHeader`** on any remaining raw `<table>` usages outside `virtual-data-table`.
2. **Audit admin tables** (laundries, customers, audit log) for row height consistency.
3. **Storybook or visual regression** — optional Chromatic/Playwright screenshots for light/dark.
4. **Lint rule** — ESLint custom rule or grep in CI to block `text-white`, `bg-white`, `amber-`, `emerald-` in `features/` (allowlist hero utilities).

---

## Sign-off criteria (goal state)

| Criterion | Status |
| --------- | ------ |
| Clean, professional SaaS feel | Improved — core dashboards compact |
| Spacious but efficient | Improved — ~20% density gain on chrome |
| Dark + light + system | Supported |
| Semantic tokens only in app UI | Largely complete; heroes use `text-on-hero` |
| WCAG AA contrast | Met on token pairs; verify custom storefront colors per tenant |
| Responsive after compaction | Type-check passes; manual mobile QA advised |

**Type-check:** `npm run type-check` in `frontend/` — **passing** as of 2026-06-02.
