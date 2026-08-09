# Feature: Partner dashboard

> Status: **shipping** (Phase 1 ops UX redesign A+B+C)  
> Last updated: 2026-08-09

## UX goal

Partners understand today’s floor within **10 seconds**: orders, needs action, ready, sales, pickups/deliveries — then create orders and advance status on a dedicated detail page.

**WashHouse ops visual (2026-08-09):** Admin-demo patterns → shared `ops-visual` components on `/partner`, new-order, and hub desk/directory. Spec: [partner-washhouse-ops-visual.md](partner-washhouse-ops-visual.md). QA: [partner-washhouse-ops-visual-matrix.md](../qa/partner-washhouse-ops-visual-matrix.md).

## Phase 1 surfaces (WashHouse-inspired hierarchy)

| Surface | Route | Notes |
| ------- | ----- | ----- |
| **A Dashboard** | `/partner` | KPI grid (2×4), status chart, recent orders → detail, footer strip |
| **B New Order** | `/partner/new-order` | Walk-in + doorstep assisted modes; deep-link `?phone=&name=&mode=` |
| **C Order details** | `/partner/orders/[id]` | Customer/items/totals + status stepper + existing advance/evidence actions |

**Phase 2+ — Partner Shop Floor Mode:** literacy-tolerant counter UX (4 home tiles, Cloth Wall, color tokens `R-42`, Ready handoff, thermal/A4 print). Spec: [partner-shop-floor.md](partner-shop-floor.md). Covers invoice/tag printing deferred from Phase 1.

**Phase 2+ — Owner Command Center (Advanced Mode):** calm agentic owner cockpit (5 pillars, money = gross / platform % / net / growth, image-led logistics + people). Spec: [partner-owner-command-center.md](partner-owner-command-center.md). **P1–P4 shipped** (nav + Overview + money + logistics hub); People polish (P5–P6) next. Shop Floor unchanged.

**Still out of scope (elsewhere):** Admin POS-style overview rebuild (Admin shell polish only in Phase 1).

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/partner/orders` | Queue by status — **server pages** (`page`/`page_size`, default **10**); see [`PAGINATION_STANDARD.md`](../../PAGINATION_STANDARD.md) | partner |
| GET | `/api/v1/partner/orders/{id}` | Order detail | partner |
| PATCH | `/api/v1/partner/orders/{id}/status` | Update status | partner |
| POST | `/api/v1/partner/orders/{id}/accept` | Accept | partner |
| POST | `/api/v1/partner/orders/{id}/reject` | Reject | partner |
| GET | `/api/v1/partner/analytics/summary` | KPIs + money intelligence (gross, platform %, commission ₹, net, growth, walk-in/doorstep) | partner |
| POST | `/api/v1/partner/walk-in-orders` | Walk-in create (New Order walk-in mode) | partner |

## Frontend

- Shell: `frontend/components/layout/partner-shell.tsx` (denser active nav)
- Nav: `frontend/features/partner/lib/partner-nav.ts` — **New Order** under Operations
- Overview: `frontend/features/partner/views/partner-overview-view.tsx`
- New Order: `frontend/features/partner/views/partner-new-order-view.tsx`
- Detail: `frontend/features/partner/views/partner-order-detail-view.tsx`
- Customer Desk (**review**): assisted lookup/create — [customer-desk.md](customer-desk.md); hub at `/partner/orders?tab=desk`
- Orders Hub (**review** hard-merge): `/partner/orders` — tabs Today/Orders \| Find customer \| Requests \| Directory — [orders-hub.md](orders-hub.md)
- Walk-in list: `/partner/walk-in-orders` (create primary path is New Order; desk prefill → `/partner/new-order?mode=walk_in&phone=&name=`)

## Lists / pagination

Partner Advanced lists follow the platform standard (default **10**, `useServerList`): orders, customers insights, walk-in, reviews, staff activity, settlements. QA matrix: [partner-admin-pagination-matrix.md](../qa/partner-admin-pagination-matrix.md).

## Acceptance criteria

- [x] Dashboard shows real analytics/ops KPIs (no invented metrics)
- [x] New Order creates walk-in or assisted orders via existing APIs
- [x] Order detail shows DLM status stepper (doorstep vs walk-in shortened)
- [ ] Dashboard loads < 2s on 4G (no 3D) — keep charts dynamic-imported
