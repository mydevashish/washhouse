# Feature: Partner dashboard

> Status: **shipping** (Phase 1 ops UX redesign A+B+C)  
> Last updated: 2026-08-04

## UX goal

Partners understand today’s floor within **10 seconds**: orders, needs action, ready, sales, pickups/deliveries — then create orders and advance status on a dedicated detail page.

## Phase 1 surfaces (WashHouse-inspired hierarchy)

| Surface | Route | Notes |
| ------- | ----- | ----- |
| **A Dashboard** | `/partner` | KPI grid (2×4), status chart, recent orders → detail, footer strip |
| **B New Order** | `/partner/new-order` | Walk-in + doorstep assisted modes; deep-link `?phone=&name=&mode=` |
| **C Order details** | `/partner/orders/[id]` | Customer/items/totals + status stepper + existing advance/evidence actions |

**Out of scope (Phase 2):** Invoice print/PDF, bag/garment tag printing, Admin POS-style overview rebuild (Admin shell polish only in Phase 1).

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/partner/orders` | Queue by status | partner |
| GET | `/api/v1/partner/orders/{id}` | Order detail | partner |
| PATCH | `/api/v1/partner/orders/{id}/status` | Update status | partner |
| POST | `/api/v1/partner/orders/{id}/accept` | Accept | partner |
| POST | `/api/v1/partner/orders/{id}/reject` | Reject | partner |
| GET | `/api/v1/partner/analytics/summary` | KPIs | partner |
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

## Acceptance criteria

- [x] Dashboard shows real analytics/ops KPIs (no invented metrics)
- [x] New Order creates walk-in or assisted orders via existing APIs
- [x] Order detail shows DLM status stepper (doorstep vs walk-in shortened)
- [ ] Dashboard loads < 2s on 4G (no 3D) — keep charts dynamic-imported
