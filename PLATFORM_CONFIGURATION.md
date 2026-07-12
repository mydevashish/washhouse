# Platform Configuration Center

> Admin-managed business rules for DLM — no developer deployment required  
> Last updated: 2026-06-03

## Overview

The Platform Configuration Center lets admins manage **commissions**, **order limits**, **dispute windows**, **session timeouts**, and **notification channels** from the admin panel. Every change is written to `platform_settings` (or override tables) and **audited** in `audit_logs`.

```
Admin → /admin/configuration
        ├── Commission (default / laundry / partner)
        ├── Order settings
        ├── Dispute settings
        ├── Session settings
        ├── Notification toggles
        └── Audit log (last 50 changes)
```

Legacy route `/admin/settings` renders the same configuration UI.

---

## Commission settings

### Priority resolution (on new orders)

1. **Partner-specific override** (`partner_commission_overrides`)
2. **Laundry-specific override** (`laundries.commission_rate`)
3. **Platform default** (`platform_settings.default_commission_rate`)

### Default commission

| Key | Default | Description |
|-----|---------|-------------|
| `default_commission_rate` | `10` | Platform-wide % for new orders |

### Laundry-specific commission

Set per laundry via admin laundries management or:

```
PATCH /api/v1/admin/platform-config/commission/laundry/{laundry_id}
{ "rate": 8.5 }
```

Pass `"rate": null` to clear override.

### Partner-specific commission

```
PUT /api/v1/admin/platform-config/commission/partner
{ "email": "owner@laundry.in", "rate": 7.5 }
```

Stored in `partner_commission_overrides` keyed by partner `user_id`.

---

## Order settings

| Key | Default | Enforced |
|-----|---------|----------|
| `order_min_amount_inr` | `99` | Order creation |
| `order_max_amount_inr` | `50000` | Order creation |
| `pickup_radius_km` | `5` | Default for new storefronts |
| `delivery_radius_km` | `8` | Default for new storefronts |

Order min/max validation runs in `OrderService.create_order`.

---

## Dispute settings

| Key | Default | Consumed by |
|-----|---------|-------------|
| `dispute_window_hours` | `48` | Settlement eligibility after delivery |
| `refund_window_hours` | `48` | Refund policy reference |
| `dispute_sla_hours` | JSON | Dispute admin SLA badges |

### SLA JSON shape

```json
{ "low": 72, "medium": 48, "high": 24, "critical": 4 }
```

Dispute SLA calculations read live config via `PlatformConfigService.get_dispute_sla_hours()`.

Settlement dispute window uses `get_dispute_window_hours()` instead of hard-coded 48h.

---

## Session settings

| Key | Default | Description |
|-----|---------|-------------|
| `session_idle_timeout_minutes` | `30` | Log out after inactivity |
| `session_warning_timeout_minutes` | `5` | Warn before idle logout |

Public read endpoint for authenticated clients:

```
GET /api/v1/config/session
```

---

## Notification settings

| Key | Default |
|-----|---------|
| `notify_email_enabled` | `true` |
| `notify_sms_enabled` | `true` |
| `notify_push_enabled` | `true` |
| `notify_in_app_enabled` | `true` |

Notification dispatch services should call `PlatformConfigService.notifications_enabled()` before sending.

---

## Audit trail

All configuration changes log:

| Field | Value |
|-------|-------|
| `action` | `platform_config_change` |
| `resource_type` | `platform_config` |
| `metadata.category` | commission / order / dispute / session / notification |
| `metadata.key` | Setting key |
| `metadata.old_value` | Previous value |
| `metadata.new_value` | New value |
| `metadata.source` | `admin_configuration_center` |

View audit:

```
GET /api/v1/admin/platform-config/audit?limit=50
```

Also visible in **Admin → Audit logs** when filtered by action.

---

## Database schema

### Existing: `platform_settings`

Key-value store (`key` PK, `value` string up to 500 chars).

### New: `partner_commission_overrides`

| Column | Purpose |
|--------|---------|
| `user_id` | PK, FK → users (partner owner) |
| `commission_rate` | Override % |

### Enum

**`audit_action`:** added `platform_config_change`

### Migration

```
backend/alembic/versions/20260603_0022_platform_configuration.py
```

Apply:

```bash
cd backend && python -m alembic upgrade head
```

---

## API reference

Base path: `/api/v1/admin/platform-config`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Full configuration snapshot |
| `GET` | `/audit` | Configuration change audit log |
| `PUT` | `/commission/default` | Update default commission |
| `PATCH` | `/commission/laundry/{id}` | Laundry commission override |
| `PUT` | `/commission/partner` | Add/update partner override |
| `DELETE` | `/commission/partner/{user_id}` | Remove partner override |
| `PUT` | `/order` | Order limits & radii |
| `PUT` | `/dispute` | Dispute/refund windows + SLA |
| `PUT` | `/session` | Idle/warning timeouts |
| `PUT` | `/notifications` | Channel toggles |

Auth: `admin`, `super_admin`.

Legacy commission endpoints (`/admin/commission/default`) remain for backward compatibility.

---

## Frontend

| Path | Component |
|------|-----------|
| `/admin/configuration` | `AdminPlatformConfigView` |
| `/admin/settings` | Same view (alias) |
| `frontend/services/platform-config.ts` | API client |

Nav: **Configuration → Platform config**

---

## File map

| Area | Path |
|------|------|
| Keys & defaults | `backend/app/core/platform_config_keys.py` |
| Migration | `backend/alembic/versions/20260603_0022_platform_configuration.py` |
| Model | `backend/app/models/partner_commission_override.py` |
| Repository | `backend/app/repositories/platform_config.py` |
| Service | `backend/app/services/platform_config_service.py` |
| API | `backend/app/api/v1/endpoints/platform_config.py` |
| Schemas | `backend/app/schemas/platform_config.py` |
| Frontend UI | `frontend/features/admin/views/admin-platform-config-view.tsx` |
| Frontend service | `frontend/services/platform-config.ts` |

---

## Test plan

1. Log in as **admin** → open `/admin/configuration`.
2. Change **default commission** → verify audit log entry.
3. Add **partner commission** by email → create order → confirm snapshotted rate on order.
4. Set **min order** above test cart total → order creation fails with clear message.
5. Change **dispute window** to 24h → deliver order → confirm `settlement_eligible_at` uses 24h.
6. Update **SLA hours** → open dispute admin → confirm SLA badge uses new hours.
7. Toggle **SMS off** → confirm `notifications_enabled()` returns `sms: false`.
8. Change **session idle timeout** → `GET /config/session` returns new values.
9. Remove partner override → audit shows old → null.

---

## Related docs

- [SETTLEMENT_MANAGEMENT.md](./SETTLEMENT_MANAGEMENT.md) — dispute window → settlement eligibility
- [STAFF_MANAGEMENT.md](./STAFF_MANAGEMENT.md) — partner staff accounts
- [OPERATIONS_CENTER.md](./OPERATIONS_CENTER.md) — pickup/delivery operations
