# Feature: Partner staff management

> Status: planned  
> Last updated: 2026-06-01

## Data model

- `partner_staff`: laundry_id, user_id or name, role enum: `pickup_only` | `delivery_only` | `inventory` | `full_access`

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/partner/staff` | List | partner |
| POST | `/api/v1/partner/staff` | Add | partner |
| PATCH | `/api/v1/partner/staff/{id}` | Update role | partner |
| DELETE | `/api/v1/partner/staff/{id}` | Remove | partner |

## Acceptance criteria

- [ ] Assign staff to order on status `pickup_assigned` / `out_for_delivery`
