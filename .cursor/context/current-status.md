# Current Status

> Updated whenever a major milestone shifts. The source of truth for "where are we?".

**Last updated:** 2026-08-14

## Phase

- [x] **Phase 0 — Doc consolidation**: product index, traceability, feature specs, ADR-002.
- [x] **Phase 1 — Foundations**: auth (httpOnly refresh, OTP/WhatsApp stub, password reset), UI shell, dark mode, PWA icons.
- [x] **Phase 2 — Customer MVP**: discovery API/FE, order create API (GST), live tracking (WebSocket + polling fallback).
- [x] **Phase 3 — Partner MVP**: register laundry, orders, status, QR scan API (inventory/staff tables ready).
- [x] **Phase 4 — Admin**: pending approvals, dashboard KPIs, complaints API.
- [x] **Phase 5 — Payments + subscriptions**: Razorpay/COD stubs, plans seed, notification stubs.
- [x] **Phase 6 — Launch**: loyalty API, landing hero, runbooks, E2E smoke tests.

## Currently shipping

- Customer booking + tracking UI, partner/admin dashboards, review + commission APIs
- **Partner Ops UX Phase 1 (A+B+C)** (2026-08-04): denser Partner/Admin shell; `/partner` dashboard KPI layout; `/partner/new-order` workspace; `/partner/orders/[id]` detail + stepper. Invoice/tags deferred → **Shop Floor Mode Phase 2+** ([partner-shop-floor.md](../../docs/features/partner-shop-floor.md), spec 2026-08-08).
- **Booking Requests convert-to-order** (2026-08-04): confirmed/`force` contacted → Customer Desk assisted factory; FE Convert enabled; expiry job remains next.
- **Customer Desk Slices 1–5** (2026-08-04): lookup/history + assisted create API + Admin/Partner UI + QA matrix. Status: **review**.
- **Orders Hub hard-merge** (2026-08-04): Spec + nav + hub tabs + redirects; **Admin + Partner ops shells** (`features/admin|partner/orders-hub`) with requests badge on header/tab + Playwright smoke (admin + partner). See [orders-hub.md](../../docs/features/orders-hub.md).
- **Partner Customers & Orders Hub** (2026-08-08): **review** — P1–P8 done. Spec: [partner-customers-orders-hub.md](../../docs/features/partner-customers-orders-hub.md). Matrix: [partner-customers-orders-hub-matrix.md](../../docs/qa/partner-customers-orders-hub-matrix.md).
- **Customers & Orders — Visual polish** (2026-08-08): **review** — Prompt 0–5 (density, pillars split-card, badges, decluttered Orders tab). Spec: [partner-customers-orders-hub-ui-polish.md](../../docs/features/partner-customers-orders-hub-ui-polish.md). Pack: [partner-customers-orders-hub-ui-polish.md](../prompts/partner-customers-orders-hub-ui-polish.md). Staging: light/dark @ 375 / 1280.
- **Partner Shop Floor Mode** (2026-08-08): **display mode retired** — no toggle; no floor home/boards chrome; print + Cloth Wall remain as shared modules; `today`/`ready`/`more` redirect to hub chips / settings. Spec history: [partner-shop-floor.md](../../docs/features/partner-shop-floor.md).
- **Partner Owner Command Center** (2026-08-08): **in progress** — P1–P6 (nav, agentic home, money, logistics, customer CRM, staff roster/coverage). Spec: [partner-owner-command-center.md](../../docs/features/partner-owner-command-center.md). Next: Prompt 7 (polish/QA). Evolve nav with Customers & Orders Hub (do not fork).
- **UI fix + backend pagination** (2026-08-08): Prompts **0–8** **done**. List pagination standard enforced (default **10**); QA matrix + regression tests locked. Pack: [ui-fix-and-backend-pagination.md](../prompts/ui-fix-and-backend-pagination.md). Matrix: [partner-admin-pagination-matrix.md](../../docs/qa/partner-admin-pagination-matrix.md).
- **Customers & Orders — single create + coupons** (2026-08-09): Sidebar **New order** removed; intake via hub **Create order** tab only; walk-in + doorstep (address) in one wizard; shop **Coupons** CRUD (`/partner/coupons`). Spec: [partner-coupons.md](../../docs/features/partner-coupons.md).
- **Partner laundry dashboard redesign** (2026-08-10): **review** — Prompt pack **0–8** on `/partner` (period overview, chart, recent 10, create modal, success print, WhatsApp, invoice gating, polish). Spec: [partner-laundry-dashboard-redesign.md](../../docs/features/partner-laundry-dashboard-redesign.md).
- **Partner laundry dashboard live data** (2026-08-14): **review** — Prompt 8 done (dark tokens, a11y, Jest view + Playwright smoke). Spec: [partner-laundry-dashboard-live-data.md](../../docs/features/partner-laundry-dashboard-live-data.md). Pack: [partner-laundry-dashboard-live-data.md](../prompts/partner-laundry-dashboard-live-data.md).
- **Partner Customers & Orders — four pillars workspace** (2026-08-10): **review** — Prompt pack **0–8** (Customers · Orders · Coupons · Services tiles + modals on `/partner/orders`; nav redirects; `POST /partner/customers`). Spec: [partner-customers-orders-four-pillars-workspace.md](../../docs/features/partner-customers-orders-four-pillars-workspace.md). Matrix: [partner-four-pillars-workspace-matrix.md](../../docs/qa/partner-four-pillars-workspace-matrix.md).

## Blocked / Waiting

- Live Razorpay Checkout.js (server order create shipped)
- **Production deploy** — Phase 0–2 blockers: forgot-password UI (BUG-001), staging backend health, CI green on remote
- `staging.dlm.app` + Railway/Neon target stack not yet wired (interim: washhouse.vercel.app + Render)

## Risks (top 3)

1. **Razorpay webhooks** — idempotency + reconciliation runbook required.
2. **Partner onboarding** — manual approval may bottleneck early growth.
3. **Performance on low-end Android** — keep dashboards lean.

## ADRs

- [ADR-001](../docs/decisions/ADR-001-payment-provider.md) — Razorpay + COD (Accepted)
- [ADR-002](../docs/decisions/ADR-002-subscription-billing.md) — Subscription billing (Accepted)

## Active feature flags

- `PRELAUNCH_STATS` / `NEXT_PUBLIC_PRELAUNCH_STATS` (default `true`) — marketing/discover/about KPI bands show “Coming Soon” instead of invented live counts; set `false` at launch.
