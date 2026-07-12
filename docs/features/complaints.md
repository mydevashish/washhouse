# Feature: Complaints and disputes

> Status: planned  
> Last updated: 2026-06-01

## Data model

- `complaints`: user_id, order_id, type, description, status, admin_notes

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| POST | `/api/v1/complaints` | File complaint | customer |
| GET | `/api/v1/admin/complaints` | Queue | admin |
| PATCH | `/api/v1/admin/complaints/{id}` | Resolve | admin |

## Types

`missing_items`, `damaged_items`, `delayed_delivery`, `refund_request`
