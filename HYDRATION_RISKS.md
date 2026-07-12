# Hydration Risk Inventory

Audit date: 2026-06-02  
Scope: `frontend/` (excluding `node_modules`)

## Search patterns scanned

| Pattern | Risk if used during render |
| ------- | --------------------------- |
| `typeof window` / `document` | Server vs client branch |
| `localStorage` / `sessionStorage` | Client-only state on first paint |
| `navigator` | Client-only APIs |
| `Date.now()` / `new Date()` | Time/timezone drift |
| `Math.random()` / `crypto.randomUUID()` | Non-deterministic output |
| `toLocaleString` / `Intl` | Node vs browser formatting |
| Zustand `persist` | Rehydrated state differs from SSR defaults |

---

## Critical (fixed)

| File | Issue | Severity |
| ---- | ----- | -------- |
| `store/auth.store.ts` | `persist` rehydrated `user` before hydration → navbar showed avatar while SSR showed “Sign in” | **Critical** |
| `store/nav-notifications.store.ts` | `persist` + `new Date()` in seed → unread badge/count mismatch | **Critical** |
| `navbar-notifications.tsx` | Rendered unread badge from store on first client paint | **Critical** |
| `navbar-user-menu.tsx` | Rendered persisted user on first client paint | **Critical** |
| `partner-overview-view.tsx` | `Date.now()` in `buildAttentionItems` when `queriesEnabled` true on client only | **High** |
| `partner-notifications-view.tsx` | Same `Date.now()` pattern | **High** |
| `checkout-view.tsx` | `buildPickupSlots()` uses `new Date()` in `useMemo` on SSR + client | **High** |

---

## High (fixed)

| File | Issue |
| ---- | ----- |
| `admin-shell.tsx` | Dashboard badges + sidebar user before mount |
| `partner-shell.tsx` | Badges, laundry name, `userRole` (partially fixed earlier; completed) |
| `app-shell.tsx` | `userRole` for quick actions |
| `stats-section.tsx` | `suppressHydrationWarning` masked animated counter mismatch |
| `laundry-reviews-tab.tsx` | `toLocaleDateString` on review dates |
| `partner-order-card.tsx` | `toLocaleString` on pickup time |
| `laundry-card.tsx` | `toLocaleString` on review count |

---

## Medium (acceptable / gated)

| File | Notes |
| ---- | ----- |
| `app/layout.tsx` | `suppressHydrationWarning` on `<html>` only — required for `next-themes` class on `<html>`; not a suppression of app bugs |
| `navbar-theme-toggle.tsx` | Icon swaps after mount (Sun placeholder on SSR) |
| `components/ui/client-date.tsx` | Already gates with `useMounted` → `…` placeholder |
| `session-manager.tsx` / `idle-*` | Client-only; no SSR output |
| `lib/idle/season.ts` | `new Date().getMonth()` only called from canvas `useEffect` |

---

## Low (client-only / event handlers)

| File | Notes |
| ---- | ----- |
| `order-tracking.tsx` | `navigator.clipboard` in click handler only |
| `login/page.tsx` | `window` only inside `afterLogin` / effects |
| `partner/storefront/*` | `crypto.randomUUID()` in button handlers for new rows |
| `cart-storage.ts` | `sessionStorage` in functions, not render |
| `lib/table/table-perf.ts` | Dev-only `performance.now` |

---

## Admin / data tables (fixed)

| File | Fix |
| ---- | --- |
| `admin-orders-table.tsx` | `ClientDate` |
| `admin-users-table.tsx` | `ClientDate` |
| `admin-transactions-table.tsx` | `ClientDate` |
| `admin-analytics-charts.tsx` | `formatIndiaShortDate()` |

---

## Remaining recommendations

1. Prefer `ClientDate` / `ClientLocaleNumber` for any new locale-sensitive UI.
2. Never call `Date.now()` in render paths; use `useMounted` + `useEffect`.
3. New persisted Zustand stores must use `skipHydration: true` + `StoreHydration` rehydrate.
4. Do not use `suppressHydrationWarning` on app components except `<html>` for themes.
