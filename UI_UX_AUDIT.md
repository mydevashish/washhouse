# UI/UX Audit — DLM Platform

**Date:** 2026-06-03  
**Method:** Code review, component patterns, route inventory, TypeScript build validation  
**Device testing:** Not performed on physical Android/iPhone in this audit

**UI/UX score: 72/100**

---

## Scoring rubric

10 = Production polish, a11y AA, responsive, no defects  
9 = Minor issues only  
&lt;9 = Listed below with required improvements

---

## Customer (browse + app)

| Page | Score | Issues if &lt;9 |
| ---- | ----- | -------------- |
| Landing `/` | 8 | Marketing polish varies; verify LCP on hero |
| Discover `/discover` | 8 | Search/filter UX good; empty states need live test |
| Laundry detail `/discover/[id]` | 8 | Storefront integration; pricing clarity OK |
| Checkout `/checkout/[laundryId]` | 7 | Payment failure UX depends on Razorpay config |
| Login `/login` | 9 | Touch targets 44px; no forgot-password link (**BUG-001**) |
| Register `/register` | 8 | Standard form; password rules visibility |
| Orders `/orders` | 8 | List + tracking; reorder missing |
| Order detail `/orders/[id]` | 9 | Custody timeline, dispute form, proof display |
| Disputes `/disputes` | 8 | Select fixed; photo upload UX solid |
| Account `/account` | 7 | Loyalty display likely minimal |

---

## Partner

| Page | Score | Issues |
| ---- | ----- | ------ |
| Overview `/partner` | 9 | KPI grid + trust score card |
| Orders `/partner/orders` | 8 | Dense cards; mobile scroll |
| Pickups / Deliveries | 8 | Operational flows |
| Storefront `/partner/storefront` | 7 | Builder complexity — verify mobile |
| Staff / Customers / Revenue | 8 | Functional tables |
| Notifications | 6 | **Stub data** — misleading UX |
| Settings / Reports | 7 | Placeholder depth unknown |

---

## Admin

| Page | Score | Issues |
| ---- | ----- | ------ |
| Dashboard `/admin` | 8 | KPI cards |
| Laundries / Customers / Orders | 8 | CRUD present |
| Approvals / Commission | 8 | |
| Disputes `/admin/disputes` | 9 | Full evidence bundle — post Select fix |
| Fraud `/admin/fraud` | 9 | New; acknowledge/resolve |
| Trust scores | 9 | Customer + partner tabs |
| Inventory changes | 8 | Was missing RoleGuard — fixed |
| Audit | 8 | Log viewer |
| Notifications | 6 | Dashboard-derived, not real-time |
| Settings | 7 | |

---

## Cross-cutting UX

| Area | Score | Notes |
| ---- | ----- | ----- |
| Dark / light mode | 9 | `next-themes`, CSS variables |
| Typography | 8 | Consistent scale; verify Hindi numerals if needed |
| Spacing / alignment | 8 | Tailwind + shadcn patterns |
| Responsiveness | 8 | Mobile-first login; admin tables need scroll |
| Accessibility | 7 | axe in Playwright deps; not run. Login tabs have `role="tablist"` |
| Contrast | 8 | Design tokens; verify warning/destructive in dark |
| Hydration | 9 | `ClientDate`, `useMounted`, auth bootstrap |
| Navigation | 8 | Role-specific shells; admin nav comprehensive |
| Loading states | 9 | Skeletons + PageSpinner |
| Error states | 8 | InfoBanner, toast via sonner |
| Empty states | 8 | EmptyState component used |

---

## Components below 9/10 (action required)

1. **Login** — missing forgot password link (8→9 after BUG-001)
2. **Partner notifications** — fake seed data (6)
3. **Admin notifications** — dashboard proxy, not real inbox (6)
4. **Checkout** — payment edge cases (7)
5. **Account / loyalty** — incomplete earn/redeem UX (7)

---

## Mobile-specific

- Touch targets: login buttons meet 44px min-height
- Forms: native selects on disputes — accessible on mobile
- Tables: partner/admin use card fallbacks in some views — verify all tables
- Order tracking: timeline component scroll-friendly

**Not tested:** iOS Safari safe areas, Android keyboard overlap on OTP inputs.

---

## Fixes applied (UX-related)

- Dispute type/status selects — build was broken; now functional
- Trust score card error banner — valid variant
- Inventory changes admin page — consistent shell + access denied for non-admin

---

## Recommendations

1. Add forgot-password flow and link from login
2. Replace notification stubs with real API or hide nav item until ready
3. Run `@axe-core/playwright` in CI on critical paths
4. Add "Book again" on completed orders
5. Partner mobile audit on pickup photo upload (camera capture)
