# Feature: Partner dashboard

> Status: planned  
> Last updated: 2026-06-01

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/partner/orders` | Queue by status | partner |
| PATCH | `/api/v1/partner/orders/{id}/status` | Update status | partner |
| POST | `/api/v1/partner/orders/{id}/accept` | Accept | partner |
| POST | `/api/v1/partner/orders/{id}/reject` | Reject | partner |
| GET | `/api/v1/partner/analytics/summary` | KPIs | partner |

## Frontend

- `frontend/app/(partner)/`, `frontend/features/partner/`
- Customer Desk (**review**): `/partner/customer-desk` — name/phone search (laundry-scoped, max 20), paginated own-laundry history, assisted doorstep create + walk-in handoff — [customer-desk.md](customer-desk.md); insights row **Open desk**; Orders/Walk-in **Find customer**
- Walk-in (shipped): `/partner/walk-in-orders` (desk deep-link prefill `?phone=&name=&new=1`)

## Acceptance criteria

- [ ] Dashboard loads < 2s on 4G (no 3D)
