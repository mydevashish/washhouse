# Feature: Complaints and disputes

> Status: **shipped** (as disputes; path prefix `/complaints/admin/*`)  
> Last updated: 2026-07-28

## Data model

- `complaints`: user_id, order_id, type, description, status, admin_notes

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| POST | `/api/v1/complaints` | File complaint | customer |
| GET | `/api/v1/complaints/admin/list` | Queue | admin |
| PATCH | `/api/v1/complaints/admin/{id}/status` | Resolve (notes + status) | admin |

> Spec historically listed `/admin/complaints`; shipped under `/complaints/admin/*`.

## Types

`missing_items`, `damaged_items`, `delayed_delivery`, `refund_request` (+ extended dispute types)

## UX

- Admin `/admin/disputes` — resolve/reject/closed requires confirmation dialog
- P2: richer notification fan-out for dispute SLAs (`docs/features/notifications.md`) — do not block launch
