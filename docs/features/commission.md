# Feature: Commission configuration

> Status: **shipped** (default + per-laundry override; order snapshot at create)  
> Last updated: 2026-07-28

## Decision

Default platform commission **10%**; per-laundry override in admin.

## Data model

- `laundries.commission_rate` (nullable → use platform default from `platform_settings`)
- `orders.commission_rate` snapshotted at order creation

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/admin/commission/default` | Get default | admin |
| PUT | `/api/v1/admin/commission/default` | Set default | admin |
| PATCH | `/api/v1/admin/laundries/{id}/commission` | Per-partner | admin |

## Acceptance criteria

- [x] Commission stored on order snapshot at creation time
- [x] Admin management list shows effective rate after PATCH
