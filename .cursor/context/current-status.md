# Current Status

> Updated whenever a major milestone shifts. The source of truth for "where are we?".

**Last updated:** 2026-08-04

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
- **Booking Requests convert-to-order** (2026-08-04): confirmed/`force` contacted → Customer Desk assisted factory; FE Convert enabled; expiry job remains next.
- **Customer Desk Slices 1–5** (2026-08-04): lookup/history + assisted create API + Admin/Partner UI + QA matrix (IDOR, role 403, guest→registered link), Playwright smoke, a11y, security checklist (PII/audit/no mass export), desk indexes. Status: **review**.

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
