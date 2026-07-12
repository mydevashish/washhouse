# Feature: Commission configuration

> Status: planned  
> Last updated: 2026-06-01

## Decision

Default platform commission **10%**; per-laundry override in admin.

## Data model

- `laundries.commission_rate` (nullable → use platform default from `platform_settings`)

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/admin/commission/default` | Get default | admin |
| PUT | `/api/v1/admin/commission/default` | Set default | admin |
| PATCH | `/api/v1/admin/laundries/{id}/commission` | Per-partner | admin |

## Acceptance criteria

- [ ] Commission stored on order snapshot at creation time
