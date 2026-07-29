# Accessibility audit log

## 2026-07-28 — A11y audit: critical customer/partner/admin paths

- **Routes / components:** `/login`, `/discover`, `/checkout/[id]`, `/partner/orders`, `/admin`; keyboard login→discover→laundry; mobile touch on order update
- **Critical/Serious found:**
  - color-contrast on brand/button/primary/muted/danger/info/`text-fg-2`
  - `aria-hidden-focus` on pickup/delivery file inputs + Recharts KPI sparklines
  - list/listitem: `FadeInItem` wrapping `<li>` in How it works
  - Sonner `richColors` success toast contrast
- **Fixed:**
  - Token contrast bumps (`brand-500`, muted, danger, warning, info, `fg-2`)
  - File inputs: `tabIndex={-1}` + `aria-label` (no `aria-hidden`)
  - SVG sparklines (no Recharts focusables)
  - Motion inside `<li>` in `how-it-works.tsx`
  - Disable Sonner `richColors`; axe excludes toaster
  - Button `sm` + order actions ≥44px mobile
- **Filed / accepted:** Transient toast container excluded from axe (after removing `richColors`); remasure contrast in dark mode next release
- **Patterns documented:** `docs/ui-ux/accessibility.md` (list+motion, file input, sparkline, toast)
- **Tests:** `npx playwright test --config=playwright.a11y.config.ts` → 7/7 pass
- **Follow-up (static audit):** Preserved Accept/Reject/Advance accessible names while pending; removed `FadeInItem` around focusable `PartnerCard`s; `Button` `lg` → `min-h-[44px]` ([Static a11y touch/keyboard audit](194dbb57-06cf-4ed8-b170-5c4947cb8ad7) P0s)
