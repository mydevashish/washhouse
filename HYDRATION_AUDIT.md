# Hydration Audit — Findings & Fixes

**Date:** 2026-06-02  
**Goal:** Eliminate React hydration mismatches (no warning suppression on app UI).

---

## Root causes identified

1. **Zustand `persist` rehydrating before React hydration** — server HTML used empty defaults; client first paint used `localStorage` (user, notifications).
2. **Notification badge rendered during first client render** — unread count differed from server (0 vs N).
3. **Auth UI in navbar** — persisted user visible immediately on client, server showed signed-out chrome.
4. **Time-based render logic** — `Date.now()` enabled partner attention filters on client only.
5. **Checkout slot builder** — `new Date()` inside `useMemo` on SSR and client could diverge.
6. **Locale formatting** — `toLocaleString` / `toLocaleDateString` in a few components without mount gate.

---

## Infrastructure added

| Asset | Purpose |
| ----- | ------- |
| `lib/hooks/use-mounted.ts` | Existing hook — gate browser-only UI |
| `lib/hooks/use-store-hydrated.ts` | Optional hook for persist hydration completion |
| `components/providers/store-hydration.tsx` | Calls `rehydrate()` on auth + nav notification stores after mount |
| `components/ui/client-locale-number.tsx` | Locale integers after mount; plain digits on SSR |

### Store changes

```ts
// auth.store.ts + nav-notifications.store.ts
skipHydration: true
```

```ts
// nav-notifications.store.ts — stable seed timestamp (no Date.now at init)
const SEED_CREATED_AT = '2026-01-01T12:00:00.000Z';
```

`StoreHydration` mounted in `providers/index.tsx` before `SessionManager`.

---

## Component fixes

### Notifications (`NavbarNotifications`)

- `useMounted()` before unread badge, seeding, dropdown list.
- SSR + first client paint: bell only, **no badge**, empty dropdown until mounted.
- `ensureSeeded()` runs in `useEffect` only.

### Auth navbar (`NavbarUserMenu`)

- Placeholder skeleton until `useMounted()`.
- Then show Sign in **or** user menu (never both between server/client).

### Theme (`NavbarThemeToggle`)

- Uses shared `useMounted()`; Sun icon placeholder until mount (matches `next-themes` pattern).

### Shells

| Shell | Fix |
| ----- | --- |
| `admin-shell` | `mounted` gates dashboard query, sidebar badges, sidebar user, `userRole` |
| `partner-shell` | Already gated badges; added `userRole` + `laundryName` |
| `app-shell` | `userRole` only when mounted |

### Partner views

- `partner-overview-view.tsx` — stats/orders/attention only when `mounted`.
- `partner-notifications-view.tsx` — same.

### Checkout

- `checkout-view.tsx` — `pickupSlots` / `deliverySlots` built only when `mounted`.

### Marketing / discover

- `stats-section.tsx` — removed `suppressHydrationWarning`; show `0` until mounted then animate.
- `laundry-card.tsx` — `ClientLocaleNumber` for review count.
- `laundry-reviews-tab.tsx` — `ClientDate` + `ClientLocaleNumber`.

### Partner orders

- `partner-order-card.tsx` — `ClientDate` for pickup time.
- `partner-customers-panel.tsx` — `ClientDate` for last order date.

### Admin tables & charts

- `admin-orders-table.tsx`, `admin-users-table.tsx`, `admin-transactions-table.tsx` — `ClientDate` in date columns.
- `admin-analytics-charts.tsx` — `formatIndiaShortDate()` (fixed `Asia/Kolkata` TZ).

### Discover / storefront

- `laundry-detail-header.tsx` — `ClientLocaleNumber` for review counts.
- `laundry-storefront-view.tsx` — `ClientLocaleNumber` for orders completed.

### Datetime utilities

- `lib/datetime.ts` — added `formatIndiaShortDate()` for chart labels (SSR-safe with explicit TZ).

---

## Theme system

- `<html suppressHydrationWarning>` retained — **only** for `next-themes` class injection (documented in Next.js).
- `NavbarThemeToggle` does not read theme during SSR; stable Sun icon until mount.

---

## Validation checklist

| Area | Status |
| ---- | ------ |
| Admin dashboard | Badges/user gated |
| Partner dashboard | Attention/badges gated |
| Customer app | `userRole` gated |
| Login | Toast from query in `useEffect` only |
| Navbar notifications | Badge gated |
| Theme switcher | Placeholder icon |
| Orders / checkout | Slots after mount |
| Settings | No persist mismatch |
| TypeScript | `npm run type-check` passes |

### Manual test

1. Hard refresh while logged in (`/admin`, `/partner`, `/discover`).
2. Open DevTools console — confirm **no** “Hydration failed” errors.
3. Toggle theme — no mismatch warning.
4. Open notification bell — badge appears after mount without console errors.

---

## Files changed (summary)

**New:** `store-hydration.tsx`, `use-store-hydrated.ts`, `client-locale-number.tsx`, `HYDRATION_RISKS.md`, `HYDRATION_AUDIT.md`

**Updated:** `auth.store.ts`, `nav-notifications.store.ts`, `providers/index.tsx`, `navbar-notifications.tsx`, `navbar-user-menu.tsx`, `navbar-theme-toggle.tsx`, `admin-shell.tsx`, `partner-shell.tsx`, `app-shell.tsx`, `partner-overview-view.tsx`, `partner-notifications-view.tsx`, `checkout-view.tsx`, `stats-section.tsx`, `laundry-card.tsx`, `laundry-reviews-tab.tsx`, `partner-order-card.tsx`, `partner-customers-panel.tsx`, `admin-orders-table.tsx`, `admin-users-table.tsx`, `admin-transactions-table.tsx`, `admin-analytics-charts.tsx`, `laundry-detail-header.tsx`, `laundry-storefront-view.tsx`, `lib/datetime.ts`

---

## Related docs

- `HYDRATION_RISKS.md` — full pattern scan
- `SESSION_MANAGEMENT.md` — idle overlay (client-only, no SSR mismatch)
- `DESIGN_SYSTEM.md` — `ClientDate` pattern documented via component usage
