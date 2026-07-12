# Platform Configuration Center

> Admin-managed business rules for DLM — no developer deployment required  
> Last updated: 2026-06-03

## Overview

The **Platform Configuration Center** lets admins configure marketplace behavior from the admin panel: **commissions**, **order limits**, **dispute rules**, **session timeouts**, and **notification channels**. Every change persists to the database and is **audited** in `audit_logs`.

```
Admin → /admin/configuration
        ├── Commission (default / laundry / partner)
        ├── Order settings
        ├── Dispute settings + SLA rules
        ├── Session settings
        ├── Notification toggles
        └── Audit log (last 50 changes)
```

Legacy alias: `/admin/settings` renders the same UI.

---

## Commission settings

### Priority resolution (on new orders)

1. **Partner-specific override** (`partner_commission_overrides`)
2. **Laundry-specific override** (`laundries.commission_rate`)
3. **Platform default** (`platform_settings.default_commission_rate`)

Resolved in `PlatformConfigService.resolve_commission_rate()` and snapshotted on order creation.

### Default commission

| Setting | Default | Description |
|---------|---------|-------------|
| `default_commission_rate` | `10` | Platform-wide % for new orders |

### Laundry-specific commission

Per-laundry override stored on `laundries.commission_rate`. Set from Configuration Center (search + override) or Admin → Laundries.

```
PATCH /api/v1/admin/platform-config/commission/laundry/{laundry_id}
{ "rate": 8.5 }
```

Pass `"rate": null` to clear override and fall back to default.

### Partner-specific commission

Owner-level override in `partner_commission_overrides` (keyed by partner `user_id`).

```
PUT /api/v1/admin/platform-config/commission/partner
{ "email": "owner@laundry.in", "rate": 7.5 }
```

```
DELETE /api/v1/admin/platform-config/commission/partner/{user_id}
```

---

## Order settings

| Key | Default | Enforced |
|-----|---------|----------|
| `order_min_amount_inr` | `99` | `OrderService.create_order` |
| `order_max_amount_inr` | `50000` | `OrderService.create_order` |
| `pickup_radius_km` | `5` | Default for new storefronts |
| `delivery_radius_km` | `8` | Default for new storefronts |

Validation rejects orders outside min/max with a clear client error.

---

## Dispute settings

| Key | Default | Consumed by |
|-----|---------|-------------|
| `dispute_window_hours` | `48` | Settlement eligibility after delivery |
| `refund_window_hours` | `48` | Refund policy reference |
| `dispute_sla_hours` | JSON | Dispute admin SLA badges |

### SLA rules (JSON)

```json
{ "low": 72, "medium": 48, "high": 24, "critical": 4 }
```

Hours to first response/resolution target by dispute priority. Read live via `PlatformConfigService.get_dispute_sla_hours()` in dispute admin views.

Settlement dispute window uses `get_dispute_window_hours()` instead of hard-coded values.

---

## Session settings

| Key | Default | Description |
|-----|---------|-------------|
| `session_idle_timeout_minutes` | `30` | Log out after inactivity |
| `session_warning_timeout_minutes` | `5` | Warn before idle logout |

Public read for authenticated clients:

```
GET /api/v1/config/session
```

---

## Notification settings

| Key | Default | Channel |
|-----|---------|---------|
| `notify_email_enabled` | `true` | Email |
| `notify_sms_enabled` | `true` | SMS |
| `notify_push_enabled` | `true` | Push |
| `notify_in_app_enabled` | `true` | In-app |

Dispatch code should call `PlatformConfigService.notifications_enabled()` or `is_channel_enabled(session, channel)` before sending non-critical alerts.

**Note:** Auth OTP SMS bypasses toggles (security-critical).

---

## Audit trail

Every configuration change writes an audit log entry:

| Field | Value |
|-------|-------|
| `action` | `platform_config_change` |
| `resource_type` | `platform_config` |
| `metadata.category` | `commission` / `order` / `dispute` / `session` / `notification` |
| `metadata.key` | Setting key |
| `metadata.old_value` | Previous value |
| `metadata.new_value` | New value |
| `metadata.source` | `admin_configuration_center` |

View in Configuration Center → **Audit log** tab, or:

```
GET /api/v1/admin/platform-config/audit?limit=50
```

Also visible in **Admin → Audit logs** when filtered by action.

---

## Database schema

### `platform_settings`

Key-value store (`key` PK, `value` string up to 500 chars).

### `partner_commission_overrides`

| Column | Purpose |
|--------|---------|
| `user_id` | PK, FK → users (partner owner) |
| `commission_rate` | Override % |

### Enum

**`audit_action`:** includes `platform_config_change`

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
Auth: `admin`, `super_admin`

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

Public:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/config/session` | Session timeouts for clients |

Legacy commission endpoints (`/admin/commission/default`) remain for backward compatibility.

---

## Frontend

| Path | Component |
|------|-----------|
| `/admin/configuration` | `AdminPlatformConfigView` |
| `/admin/settings` | Same view (alias) |
| `frontend/features/admin/platform-config/platform-config-commission-section.tsx` | Commission panel |
| `frontend/services/platform-config.ts` | API client + types |

Nav: **Configuration → Configuration Center**

---

## File map

| Area | Path |
|------|------|
| Keys & defaults | `backend/app/core/platform_config_keys.py` |
| Migration | `backend/alembic/versions/20260603_0022_platform_configuration.py` |
| Model | `backend/app/models/partner_commission_override.py` |
| Repository | `backend/app/repositories/platform_config.py` |
| Service | `backend/app/services/platform_config_service.py` |
| Notification gate | `backend/app/services/notifications/dispatch.py` |
| API | `backend/app/api/v1/endpoints/platform_config.py` |
| Schemas | `backend/app/schemas/platform_config.py` |
| Frontend UI | `frontend/features/admin/views/admin-platform-config-view.tsx` |
| Commission UI | `frontend/features/admin/platform-config/platform-config-commission-section.tsx` |
| Frontend service | `frontend/services/platform-config.ts` |

---

## Runtime integration

| Consumer | Config used |
|----------|-------------|
| `OrderService.create_order` | Min/max order, commission resolution |
| `SettlementService` | Dispute window hours |
| `DisputeAdminService` | SLA hours by priority |
| Client session manager | `GET /config/session` |
| Notification dispatch | `notifications_enabled()` / `is_channel_enabled()` |

---

## Test plan

1. Log in as **admin** → open `/admin/configuration`.
2. **Commission tab** — change default rate → verify audit log entry.
3. Search laundry → set override → create order → confirm snapshotted rate.
4. Add partner override by email → verify in list → remove → audit shows null.
5. **Orders tab** — set min above cart total → order creation fails with clear message.
6. **Disputes tab** — change window to 24h → deliver order → confirm settlement eligibility uses 24h.
7. Update SLA hours → open dispute admin → confirm SLA badge uses new hours.
8. **Notifications tab** — toggle SMS off → `notifications_enabled()` returns `sms: false`.
9. **Session tab** — change idle timeout → `GET /config/session` returns new values.
10. **Audit tab** — every save above appears with old → new values.

---

## Related docs

- [SETTLEMENT_MANAGEMENT.md](./SETTLEMENT_MANAGEMENT.md) — dispute window → settlement eligibility
- [BUSINESS_HEALTH_DASHBOARD.md](./BUSINESS_HEALTH_DASHBOARD.md) — executive metrics
- [PLATFORM_CONFIGURATION.md](./PLATFORM_CONFIGURATION.md) — earlier doc (superseded by this file)
