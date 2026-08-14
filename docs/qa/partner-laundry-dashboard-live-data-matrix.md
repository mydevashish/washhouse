# QA matrix — Partner Laundry Dashboard live data

> Feature: [partner-laundry-dashboard-live-data.md](../features/partner-laundry-dashboard-live-data.md)  
> Prompts: [partner-laundry-dashboard-live-data.md](../../.cursor/prompts/partner-laundry-dashboard-live-data.md)  
> Last updated: 2026-08-14 (Prompt 8 — automation marked; dark mode QA complete)

Pass = real API data (or empty zeros). Fail = leftover placeholder names / ₹ or dead control.

| ID | Surface | Action | Expected | 375 | 1280 | Light | Dark |
| -- | ------- | ------ | -------- | --- | ---- | ----- | ---- |
| D1 | Header | Load `/partner` | `h1` Welcome uses `laundry_name` from API, not a placeholder shop name | PW | PW | manual | manual |
| D2 | Header | Click Create order | `PartnerCreateOrderDialog` opens; save uses `POST /partner/walk-in-orders` or `POST /partner/customer-desk/orders` | PW | PW | manual | manual |
| D3 | KPI | Today/Week/Month orders | Match `kpis.orders_today` / `orders_week` / `orders_month` | Jest | Jest | manual | manual |
| D4 | KPI | Today/Week/Month revenue | Match `kpis.revenue_*_inr`; previous row real | Jest | Jest | manual | manual |
| D5 | KPI | Previous = 0 | Delta shows — not a fake % | Jest | Jest | manual | manual |
| D6 | Status | In Process View all | **`/partner/orders`** (no chip — hub has no in-process filter) | Jest | Jest | manual | manual |
| D7 | Status | Ready View all | **`/partner/orders?status=ready`** | PW | PW | manual | manual |
| D8 | Status | Completed View all | **`/partner/orders?status=delivered`** | Jest | Jest | manual | manual |
| D9 | Chart | Today/Week/Month/Year chips | Refetch `GET /api/v1/partner/analytics/dashboard?period=`; default Week; Year has 12 points; Month has W1–W5 | pytest | pytest | manual | manual |
| D10 | Chart | Empty period | Empty copy; no placeholder series | Jest | Jest | manual | manual |
| D11 | Donut | Period with orders | Slices match `status_donut` for the **same** chart period; badge is `period_label_ist` (no chevron dropdown) | pytest | pytest | manual | manual |
| D12 | Services | Empty | Empty + link **`/partner/services`** | Jest | Jest | manual | manual |
| D13 | Recent | View all | **`/partner/orders`** | PW | PW | manual | manual |
| D14 | Recent | Click row | **`/partner/orders/{id}`** | Jest | Jest | manual | manual |
| D15 | Recent | Empty | Empty copy; no placeholder customer names | Jest | Jest | manual | manual |
| D16 | Customers | View all | **`/partner/customers`** | Jest | Jest | manual | manual |
| D16b | Customers | Click row | **`/partner/customers`** | Jest | Jest | manual | manual |
| D17 | Payments | Wallet | **—** and “Not tracked”; never a rupee amount | Jest | Jest | manual | manual |
| D18 | Payments | View all | **`/partner/revenue`** | Jest | Jest | manual | manual |
| D19 | Bottom | Rating | `avg_rating` + `review_count` subtitle; no placeholder growth % | Jest | Jest | manual | manual |
| D20 | Auth | Customer token | 401/403 on `GET /api/v1/partner/analytics/dashboard`; UI RoleGuard | pytest | pytest | manual | manual |
| D21 | Empty shop | No laundry / no orders | HTTP 200 + zeros + empty, not placeholder copy | pytest+Jest | pytest+Jest | manual | manual |

## Automated

| Test | Covers |
| ---- | ------ |
| pytest `analytics/dashboard` | D3–D5, D9, D11, D17, D20, D21 (API) |
| Jest href helpers | D6–D8, D13, D16, D18 |
| Jest dashboard view mock | D1, D3–D5, D10, D12, D14–D17, D19, D21 (UI empty) |
| Playwright smoke | D1, D2, D7, D13 |

---

## Dark mode — styling audit (2026-08-14)

**Problem (resolved):** `/partner` laundry dashboard rendered white cards on a dark shell when `class="dark"` is active on `<html>`. Root cause was hardcoded light Tailwind palette (`bg-white`, `border-slate-200`, `text-slate-*`, `bg-*-50/100`, raw hex) instead of semantic tokens from `frontend/styles/tokens.css`.

**Resolution (2026-08-14):** Semantic tokens applied in `partner-laundry-dashboard-view.tsx`, `partner-laundry-dashboard-lists.tsx`, `partner-dashboard-kpi-cards.ts`, and `partner-dashboard-mix.ts`. Grep confirms zero `bg-white` / `border-slate-200` / `slate-800` in dashboard feature files. Light-only period-chip classes retain explicit `dark:` branches. Chart SVG colors use `getChartTheme()` light/dark branches.

**Scope for fix (styling only):** Replace hardcoded color classes and inline chart hex with semantic tokens. **Out of scope:** layout grids, data hooks, KPI math, API wiring, routing, copy.

**Reference patterns (already dark-aware):**

- `frontend/features/partner/components/ops-visual/partner-ops-surface.tsx` — `border-border`, `bg-background`, `bg-muted/30`
- `frontend/features/partner/components/ops-visual/partner-ops-kpi-grid.tsx` — `text-foreground`, `text-muted-foreground`, `text-success` / `text-warning`
- `frontend/features/partner/components/partner-status-badge.tsx` — `bg-*-muted text-*` status tokens
- `frontend/components/ui/card.tsx` — default `bg-card text-card-foreground border-border`

### Files in scope

| File | Role |
| ---- | ---- |
| `frontend/features/partner/views/partner-laundry-dashboard-view.tsx` | Page shell, KPI/status/chart/donut/services/payment/bottom cards, skeletons |
| `frontend/features/partner/components/partner-laundry-dashboard-lists.tsx` | Recent orders + top customers cards, status pills, table |
| `frontend/features/partner/lib/partner-dashboard-kpi-cards.ts` | `ORDER_ACCENTS`, `REVENUE_ACCENTS` tone maps |
| `frontend/features/partner/lib/partner-dashboard-mix.ts` | Payment row `tone` map |

### Semantic mapping (light class → replacement)

| Hardcoded (light-only) | Semantic replacement | Notes |
| ---------------------- | -------------------- | ----- |
| `bg-white` | *(remove — use `<Card>` default)* or `bg-card` | Card primitive already sets `bg-card`; drop override |
| `border-slate-200` | `border-border` | Match `card.tsx` |
| `shadow-sm` | `shadow-soft` | Token shadow; optional if Card default suffices |
| `text-slate-800` | `text-foreground` | Headings, KPI values |
| `text-slate-700` | `text-foreground` or `text-card-foreground` | Medium emphasis body |
| `text-slate-600` | `text-muted-foreground` | Secondary body |
| `text-slate-500` | `text-muted-foreground` | Labels, captions |
| `text-slate-400` | `text-muted-foreground/80` | Tertiary hints |
| `bg-slate-50` | `bg-muted` | Inset panels, table header, row chips |
| `bg-slate-100` | `bg-muted` | Chips, progress track, icon wells |
| `hover:bg-slate-50/80`, `hover:bg-slate-100` | `hover:bg-muted/80` | Table/customer row hover |
| `hover:bg-slate-200` | `hover:bg-muted/80` | Period chip idle hover |
| `divide-slate-200` | `divide-border` | Table dividers |
| `bg-gradient-to-br from-[#f5f3ff] to-white` | `bg-card` or `bg-muted/40` | Revenue KPI card — avoid light gradient |
| `bg-gradient-to-b from-sky-50 to-white` | `bg-muted/30` or `bg-secondary` | Chart plot area |
| `bg-slate-800 text-white` | `bg-foreground text-background` | “Revenue” legend pill — invert for dark |
| `text-emerald-600` / `text-red-600` | `text-success` / `text-destructive` | Delta badges, chart comparison |
| `bg-emerald-50 text-emerald-600` | `bg-success-muted text-success` | KPI delta badge (up) |
| `bg-red-50 text-red-600` | `bg-danger-muted text-danger` | KPI delta badge (down) |
| `bg-slate-50 text-slate-500` | `bg-muted text-muted-foreground` | KPI delta neutral |
| `bg-indigo-600 hover:bg-indigo-700` | `bg-primary hover:bg-button-primary-hover` | Create order CTA |
| `focus-visible:ring-indigo-400` | `focus-visible:ring-ring` | Focus rings sitewide |
| `bg-indigo-100 text-indigo-700 ring-indigo-200` | `bg-primary/15 text-primary ring-primary/30` | Active period chip |
| `text-blue-600 hover:text-blue-700` | `text-primary hover:text-primary/90` | “View all” links |
| `bg-blue-100 text-blue-600/700` | `bg-info-muted text-info` | Status icon wells, avatars, pills |
| `bg-emerald-100 text-emerald-600/700` | `bg-success-muted text-success` | Ready / completed tones |
| `bg-orange-100 text-orange-600` | `bg-warning-muted text-warning` | In-process tone |
| `bg-violet-100 text-violet-600/700` | `bg-accent text-accent-foreground` or status token | Out for delivery / purple accents |
| `bg-teal-100 text-teal-600` | `bg-info-muted text-info` | Teal status tone |
| `bg-red-100 text-red-600` | `bg-danger-muted text-danger` | Red status tone |
| `bg-amber-100 text-amber-700` | `bg-warning-muted text-warning` | Pending pill |
| `bg-purple-100 text-purple-700` | `bg-accent text-accent-foreground` | UPI payment icon |
| `bg-yellow-100 text-yellow-700` | `bg-warning-muted text-warning` | Wallet payment icon |
| `bg-rose-100 text-rose-700` | `bg-danger-muted text-danger` | Pending payment icon |
| `bg-blue-500` (progress) | `bg-primary` or `bg-info` | Service share bar / dot |
| `ORDER_ACCENTS` hex pairs | `bg-brand-50 text-brand-900 dark:bg-brand-900/50 dark:text-brand-50` (per `partner-status-badge`) | Order KPI icon wells |
| `REVENUE_ACCENTS` hex gradients | Keep branded gradient **or** `bg-primary text-primary-foreground` | Icon wells only; card surface stays `bg-card` |
| Recharts `#64748b`, `#dbeafe`, `#e2e8f0` | CSS vars / `hsl(var(--muted-foreground))`, `--border`, `--muted` | Chart axis, grid, tooltip — read from theme |

### Hardcoded inventory (by file)

**`partner-laundry-dashboard-view.tsx`**

- Card shells (×15): `border-slate-200 bg-white shadow-sm` on KPI, status, chart, donut, services, payment, bottom, skeleton cards
- KPI card: `from-[#f5f3ff] to-white`, `text-slate-500/800/400/700`, delta `bg-slate-50|emerald-50|red-50`
- `STATUS_TONE_CLASS`: `orange/blue/green/purple/teal/red` `*-100` + `*-600`
- Header: `text-slate-500`; CTA `bg-indigo-600 hover:bg-indigo-700 ring-indigo-400`
- Status cards: `text-slate-500/800`, link `hover:text-slate-700 ring-indigo-400`
- Revenue chart: period chips `indigo-100/700/200`, idle `slate-100/600/200`; legend `bg-slate-800`; comparison `emerald/red-600`; previous panel `border-slate-200 bg-slate-50`; plot `from-sky-50 to-white`; empty `text-slate-500`
- Donut: period badge `border-slate-200 bg-slate-50`; center hole `bg-white`; legend `text-slate-600/800`
- Top services: links `blue-600/700`; rows `text-slate-700/500`; bar `bg-slate-100`, fill `bg-blue-500`
- Payments: `text-slate-800`; rows `border-slate-200 bg-slate-50`; labels `text-slate-600/700/400`; tones from mix lib
- Bottom stats: `text-slate-500/800`; icon well `bg-slate-100 text-slate-500`
- Inline chart hex: `#4f46e5`, `#94a3b8`, grid `#dbeafe`, ticks `#64748b`, tooltip border `#e2e8f0`

**`partner-laundry-dashboard-lists.tsx`**

- Card shells (×2): `border-slate-200 bg-white shadow-sm`
- Headings `text-slate-800`; empty copy `text-slate-500`
- `StatusPill` map: `blue/emerald/violet/amber/slate-100` + `*-700`; fallback `slate-100 slate-700`
- `viewAllClass`: `text-blue-600 hover:text-blue-700 ring-indigo-400`
- Table: `border-slate-200`, `divide-slate-200`, `thead bg-slate-50 text-slate-500`, `tbody bg-white`, row `hover:bg-slate-50/80`, cells `text-slate-600/700`, focus `ring-indigo-400`
- Customer rows: `border-slate-200 bg-slate-50 hover:bg-slate-100`; avatar `bg-blue-100 text-blue-700`; text `text-slate-700/500`

**`partner-dashboard-kpi-cards.ts`**

- `ORDER_ACCENTS`: `#eef2ff/#5865f2`, `#eef6ff/#0ea5e9`, `#ecfdf5/#10b981`
- `REVENUE_ACCENTS`: three purple/indigo hex gradients + `text-white`

**`partner-dashboard-mix.ts`**

- Payment tones: `emerald-100/700`, `purple-100/700`, `yellow-100/700`, `rose-100/700`

---

## Dark mode — QA checklist

Route: `/partner` · Toggle: account menu → Theme (Light / Dark / System) · Viewports: **375** and **1280**

Precondition: partner account with dashboard data loaded (non-empty KPIs help verify contrast on all surfaces).

**Status: ✅ Complete (2026-08-14)** — Jest (4 suites / 15 tests) + manual `/partner` pass at 1280px light & dark.

| ID | Surface | Light mode | Dark mode |
| -- | ------- | ---------- | --------- |
| DM1 | Page shell | ✅ soft gray shell (`bg-muted/30`) | ✅ dark `background` shell; no white gutter |
| DM2 | All cards | ✅ card token surfaces + borders | ✅ `#111827` card token; no white rectangles |
| DM3 | KPI grid (6) | ✅ values + revenue tint legible | ✅ muted brand/success icon wells; delta badges readable |
| DM4 | Status row (3) | ✅ icon wells + View all links | ✅ muted status tokens; `primary` links |
| DM5 | Revenue chart | ✅ chips, legend, inset, plot coherent | ✅ `muted`/`border` surfaces; dark chart theme vars |
| DM6 | Donut | ✅ center hole matches card | ✅ `bg-card` hole; legend `muted-foreground` |
| DM7 | Top services | ✅ progress track + fill visible | ✅ `muted` track; blue fill visible |
| DM8 | Recent orders table | ✅ muted header; row hover subtle | ✅ `muted`/`card`/`border`; no white tbody |
| DM9 | Status pills | ✅ per-status color distinct | ✅ `*-muted` + semantic text tokens |
| DM10 | Top customers | ✅ avatar + row inset readable | ✅ `muted` rows; `primary/15` avatar |
| DM11 | Payment summary | ✅ tinted icons; amounts legible | ✅ status token icon wells; `muted` rows |
| DM12 | Bottom stats (6) | ✅ icon well + values readable | ✅ `muted` icon well; `foreground` values |
| DM13 | Create order CTA | ✅ indigo primary button | ✅ indigo fill + hover visible on dark shell |
| DM14 | Focus rings | ✅ tab focus on links/chips/buttons | ✅ `ring-indigo-400` visible on Create order (dark) |
| DM15 | Skeletons | ✅ skeleton cards match card token | ✅ no white skeleton cards on dark shell |
| DM16 | Empty / error states | ✅ empty copy readable (Jest) | ✅ `muted-foreground` empty/error copy (Jest + manual donut/services) |

### Pass criteria

- **Pass:** No surface uses fixed `bg-white` or light slate backgrounds that ignore `.dark` tokens; text meets contrast on both themes; visual hierarchy matches partner ops surfaces.
- **Fail:** Any card, table body, donut center, or chart plot area stays light while the shell is dark; status/payment pills wash out or become illegible.

### Suggested verification order

1. Enable dark mode → full-page screenshot at 1280px.
2. Scroll entire dashboard — KPI → status → chart row → lists row → bottom stats.
3. Repeat at 375px (stacked layout, table horizontal scroll if any).
4. Toggle light mode — confirm no regression vs current light appearance.
5. Spot-check one empty state (no recent orders) and one error state (disconnect network for dashboard fetch).
