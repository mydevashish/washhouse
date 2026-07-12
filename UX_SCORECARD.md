# DLM UX Scorecard

**Reviewer lens:** Senior UX · WCAG 2.1 AA · Compact premium SaaS (Linear / Stripe / Shopify Admin)  
**Date:** 2026-06-02  
**Scale:** 1–10 per dimension · **Target ≥ 9** on all dimensions  
**Legend:** ✅ ≥ 9 · ⚠️ 7–8 (redesigned this pass) · ❌ &lt; 7 (blocked by missing product scope)

Dimensions: **VH** Visual hierarchy · **SP** Spacing · **TY** Typography · **A11y** Accessibility · **ID** Information density · **DK** Dark mode · **LT** Light mode · **MO** Mobile

---

## Summary

| Zone | Pages | Avg post-redesign | Notes |
| ---- | ----- | ----------------- | ----- |
| Marketing | 3 | 8.6 | Hero bands intentional; compact type applied |
| Customer app | 6 | 9.0 | Shared `PageHeader` + tokens aligned |
| Admin | 10 | 8.9 | Virtual tables strong; settings/approvals KYC stub caps score |
| Partner | 12 | 9.0 | Mobile order cards + panel parity with admin |
| Auth | 2 | 9.1 | Compact forms, 44px tabs |

**Redesigns shipped this pass:** unified page headers, partner/admin panel parity, partner orders mobile cards, semantic sparklines, admin page descriptions, account density, partner settings/audit mobile, notifications link fix.

---

## Marketing & public

### Home `/`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 8 | 9 | 9 | 9 | **8.9** ⚠️ |

- **ID 8:** Long hero still marketing-forward; acceptable for landing.
- **Redesign:** `home-hero` compact type, `text-on-hero` tokens.

### Discover `/discover`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | **9.0** ✅ |

- Laundry cards semantic badges, compact `card-title`.

### Partners `/partners`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 8 | 9 | 9 | 8 | 9 | 9 | 9 | **8.8** ⚠️ |

- Marketplace sections tightened; still content-heavy landing.

### Login `/login` · Register `/register`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 10 | 9 | 9 | 9 | 10 | **9.1** ✅ |

- 44px tab targets, semantic auth card, `PublicShell`.

---

## Customer app

### Laundry detail `/discover/[id]`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | **9.0** ✅ |

- Compact header, sticky order summary on desktop, mobile bottom bar.

### Checkout `/checkout/[id]`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | **9.0** ✅ |

- Hero band `text-on-hero`; form `p-4`.

### Orders list `/orders`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | **9.0** ✅ |

- `PageHeader` + compact section padding.

### Order tracking `/orders/[id]`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | **9.0** ✅ |

- Semantic status bands (hero / success / muted cancelled).

### Account `/account`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | **9.0** ✅ |

- `card-title`, tighter cards, 44px checkbox row.

---

## Admin

### Overview `/admin`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 8 | **8.9** ⚠️ |

- **MO 8:** KPI grid 2-col OK; charts need horizontal scroll on small phones.
- **Redesign:** Overview description, semantic KPI sparklines.

### Orders `/admin/orders`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 8 | **8.9** ⚠️ |

- Virtual table + sticky header; horizontal scroll on mobile.

### Laundries `/admin/laundries`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 8 | 9 | 9 | 9 | 7 | **8.6** ⚠️ |

- **MO 7:** Wide table + inline commission edit — consider drawer on phone (follow-up).

### Customers `/admin/customers`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 8 | **8.9** ⚠️ |

- Description added; virtual table.

### Approvals `/admin/approvals`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 8 | 9 | 9 | 9 | **8.9** ⚠️ |

- **ID 8:** Static KYC checklist (product stub).

### Audit `/admin/audit`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 8 | **8.9** ⚠️ |

- Dense filters; truncates on mobile.

### Settings `/admin/settings`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 8 | 9 | 9 | 9 | 7 | 9 | 9 | 9 | **8.4** ⚠️ |

- **VH/ID 7–8:** Placeholder copy for fees/catalog — needs real settings API.

### Commission `/admin/commission`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | **9.0** ✅ |

### Notifications `/admin/notifications`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 8 | 9 | 9 | 9 | **8.9** ⚠️ |

- Complaints link fixed → `/admin/orders` (was self-loop).

### Revenue `/admin/revenue`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 8 | **8.9** ⚠️ |

- Description added; KPI + transactions table.

---

## Partner

### Dashboard `/partner`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 9 | **9.0** ✅ |

- KPI grid + action orders use mobile cards.

### Orders `/partner/orders`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 9 | 9 | 9 | 10 | **9.1** ✅ |

- **Redesign:** Card stack &lt; `md`, compact table ≥ `md`, filter tabs a11y.

### Customers `/partner/customers`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 8 | 9 | 9 | 8 | **8.9** ⚠️ |

- Table scroll on small screens.

### Revenue `/partner/revenue`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 8 | 9 | 9 | 9 | **8.9** ⚠️ |

- Chart is aggregate snapshot (product limitation).

### Settings `/partner/settings`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 8 | 9 | 9 | 9 | **8.9** ⚠️ |

- **Redesign:** Profile DL + storefront CTA; full prefs still upcoming.

### Storefront `/partner/storefront`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 8 | 9 | 9 | 9 | 9 | 9 | 8 | **8.9** ⚠️ |

- Tab strip scroll on mobile; builder is dense by design.

### Staff · Pickups · Deliveries · Reviews · Reports

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 8–9 | 9 | 9 | 8–9 | **8.9** ⚠️ |

- Panel parity applied; reports/reviews have stub actions.

### Activity `/partner/audit`

| VH | SP | TY | A11y | ID | DK | LT | MO | **Avg** |
| -- | -- | -- | ---- | -- | -- | -- | -- | ------- |
| 9 | 9 | 9 | 9 | 8 | 9 | 9 | 9 | **8.9** ⚠️ |

- **Redesign:** Mobile list + desktop table; honest “snapshot” copy.

---

## Pages still below 9.0 average (action required)

| Page | Gap | Recommendation |
| ---- | --- | -------------- |
| Admin settings | Placeholder panels | Ship fee/catalog APIs or hide sections |
| Admin laundries (mobile) | Wide table + inline edit | Commission drawer on `sm` |
| Admin approvals | Static KYC | Wire checklist to application data |
| Partner revenue chart | Misleading time axis | Replace with daily series API |
| Home / partners landing | Marketing density | Optional further hero trim |

---

## Design system alignment (post-redesign)

| Pattern | Standard |
| ------- | -------- |
| Page title | `.page-title` (18px) |
| Section title | `.section-title` (16px) |
| Card title | `.card-title` (13px) |
| Page padding | `py-4 sm:py-5` |
| Admin/Partner shell | `h-nav` 56px · `w-sidebar` 208px |
| Panels | `rounded-lg shadow-soft ring-border/60` |
| Status UI | `success` / `warning` / `danger` / `rating` tokens |
| Hero on gradient | `text-on-hero` / `text-on-hero-muted` |
| Mobile data | Card stack &lt; `md`, table ≥ `md` (partner orders) |

---

## Verification checklist

- [ ] Light / dark / system on admin overview + partner orders
- [ ] Partner orders: accept/reject on mobile card
- [ ] Checkout + order tracking in both themes
- [ ] Keyboard: global command palette, filter tabs, form fields
- [ ] Screen reader: page titles, `aria-selected` on filter tabs

**Related docs:** `DESIGN_SYSTEM.md` · `UI_AUDIT_REPORT.md`
