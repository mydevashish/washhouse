# Enterprise Staff Management

> Production-grade partner staff accounts, roles, permissions, schedules, and activity tracking for DLM  
> Last updated: 2026-06-03

## Overview

Laundry owners create **login-enabled staff accounts** tied to their branch. Each staff member receives a `partner_staff` user role and a scoped **staff role** that controls portal permissions.

| Capability | Owner (partner user) | Staff owner role | Manager | Task agents |
|------------|---------------------|------------------|---------|-------------|
| Create / edit / deactivate staff | Yes | Yes | No | No |
| Suspend / unsuspend staff | Yes | Yes | No | No |
| Reset staff passwords | Yes | Yes | No | No |
| View staff dashboard & list | Yes | Yes | Yes | No |
| View activity logs | Yes | Yes | Yes | No |
| Pickup / delivery / processing tasks | Yes | Yes | Yes | Scoped |

---

## Roles

| Staff role | Label | Portal scope |
|------------|-------|--------------|
| `owner` | Owner | Full access (staff CRUD, orders, analytics) |
| `manager` | Manager | Operational access (orders, pickups, deliveries, processing, analytics) |
| `pickup_agent` | Pickup Agent | Pickup tasks only |
| `delivery_agent` | Delivery Agent | Delivery tasks only |
| `operator` | Laundry Operator | Laundry processing only |
| `support_staff` | Support Staff | Order view + customer view |

Legacy enum values (`pickup_only`, `delivery_only`, `inventory`, `full_access`) map automatically to the new roles.

---

## Permission matrix

Permissions are defined in `backend/app/services/staff_permissions.py`:

| Permission | Owner | Manager | Pickup | Delivery | Operator | Support |
|------------|:-----:|:-------:|:------:|:--------:|:--------:|:-------:|
| `staff:manage` | ✓ | | | | | |
| `staff:view` | ✓ | ✓ | | | | |
| `orders:all` | ✓ | ✓ | | | | |
| `orders:view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `pickups:manage` | ✓ | ✓ | ✓ | | | |
| `deliveries:manage` | ✓ | ✓ | | ✓ | | |
| `processing:manage` | ✓ | ✓ | | | ✓ | |
| `analytics:view` | ✓ | ✓ | | | | |
| `customers:view` | ✓ | ✓ | | | | ✓ |

---

## Features

### Create staff

- Creates a `users` row with role `partner_staff` and a linked `partner_staff` row.
- Email must be unique across users and staff records.
- A secure temporary password is generated unless the owner supplies one.
- Default work schedule: Mon–Sat 09:00–18:00 (Asia/Kolkata).

### Edit staff

- Update name, phone, role, branch (`laundry_id`), and work schedule.
- Only the laundry **partner user** can assign the `owner` staff role.

### Deactivate / activate staff

- Sets `is_active = false` — permanent offboarding.
- Deactivated staff cannot authenticate.

### Suspend / unsuspend staff

- **Suspend** — temporary block (`is_suspended = true`); login denied with clear message.
- **Unsuspend** — restores access without re-creating the account.
- Distinct from deactivate: suspended accounts remain active in roster but blocked from portal.

### Reset password

- Generates a new temporary password and updates the linked user hash.
- Logged as `password_reset` activity.

### Assign role, branch & schedule

| Field | Storage |
|-------|---------|
| **Role** | `partner_staff.role` enum |
| **Branch** | `partner_staff.laundry_id` (validated to actor's laundry) |
| **Work schedule** | `partner_staff.work_schedule` JSONB |

Work schedule schema:

```json
{
  "days": ["mon", "tue", "wed", "thu", "fri", "sat"],
  "start_time": "09:00",
  "end_time": "18:00",
  "timezone": "Asia/Kolkata"
}
```

---

## Dashboard KPIs

| Metric | Source |
|--------|--------|
| **Total staff** | All non-deleted `partner_staff` for laundry |
| **Active staff** | `is_active = true` |
| **Online staff** | Active + `last_active_at >= now − 15m` |
| **Inactive staff** | Total − active |

**Online staff** = active staff with recent portal activity within **15 minutes**.

---

## Activity logs

Activity is persisted in `staff_activity_logs` and surfaced on `/partner/staff`.

| Action | Trigger |
|--------|---------|
| `login` | Successful staff login |
| `logout` | Staff logout |
| `assignment` | Pickup/delivery task assigned (Operations Center) |
| `status_change` | Partner order status update by staff |
| `order_update` | Reserved for future order field edits |
| `staff_created` | New staff account |
| `staff_updated` | Staff profile/role/schedule change |
| `staff_deactivated` | Staff deactivated |
| `staff_suspended` | Staff suspended |
| `staff_unsuspended` | Staff unsuspended |
| `password_reset` | Admin password reset |

---

## Database schema

### Extended `partner_staff`

| Column | Purpose |
|--------|---------|
| `user_id` | FK → `users` (login account) |
| `email` | Staff login email |
| `is_active` | Active flag (deactivate) |
| `is_suspended` | Suspension flag |
| `suspended_at` / `suspended_reason` | Suspension metadata |
| `work_schedule` | JSONB shift schedule |
| `last_login_at` | Last successful login |
| `last_active_at` | Last activity heartbeat |
| `created_by_user_id` | Actor who created the account |

### `staff_activity_logs`

| Column | Purpose |
|--------|---------|
| `staff_id` | Staff subject |
| `laundry_id` | Branch scope |
| `actor_user_id` | User who performed the action |
| `action` | `staff_activity_action` enum |
| `resource_type` / `resource_id` | Linked entity |
| `description` | Human-readable summary |
| `metadata_json` | Structured payload |

### Migrations

- `20260603_0020_staff_management.py` — core tables + activity log
- `20260603_0025_staff_suspend_schedule.py` — suspend + work schedule

```bash
cd backend && python -m alembic upgrade head
```

---

## API

Base path: `/api/v1/partner/staff-management`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/dashboard` | KPI metrics | Partner / staff owner / manager |
| `GET` | `/` | List staff | Partner / staff owner / manager |
| `POST` | `/` | Create staff | Partner / staff owner |
| `PATCH` | `/{staff_id}` | Update staff | Partner / staff owner |
| `POST` | `/{staff_id}/deactivate` | Deactivate | Partner / staff owner |
| `POST` | `/{staff_id}/activate` | Reactivate | Partner / staff owner |
| `POST` | `/{staff_id}/suspend` | Suspend (body: `reason`) | Partner / staff owner |
| `POST` | `/{staff_id}/unsuspend` | Unsuspend | Partner / staff owner |
| `POST` | `/{staff_id}/reset-password` | Reset password | Partner / staff owner |
| `GET` | `/activity` | Activity log | Partner / staff owner / manager |

Query params for activity: `staff_id`, `limit` (1–200), `offset`.

### Create request example

```json
{
  "name": "Ravi Kumar",
  "email": "ravi@sparklelaundry.in",
  "phone": "+919876543210",
  "role": "pickup_agent",
  "work_schedule": {
    "days": ["mon", "tue", "wed", "thu", "fri", "sat"],
    "start_time": "09:00",
    "end_time": "18:00",
    "timezone": "Asia/Kolkata"
  }
}
```

---

## Frontend

| Path | Component |
|------|-----------|
| `/partner/staff` | `PartnerStaffView` |
| `frontend/services/staff-management.ts` | API client |
| `frontend/lib/partner-roles.ts` | Portal role guard |

The staff page includes:

- KPI cards (total, active, online, inactive)
- Create form with role + work schedule
- Team list with edit, suspend, deactivate, reset password
- Activity log panel

---

## Auth hooks

| Event | Handler |
|-------|---------|
| Login | `AuthService.login` — blocks inactive/suspended staff |
| Login success | `StaffManagementService.record_login` |
| Logout | `StaffManagementService.record_logout` |
| Order status change | `OrderService` → `record_order_status_change` |
| Task assignment | `OperationsService` → assignment activity log |

---

## Security notes

1. **Owner role assignment** restricted to laundry partner user only.
2. **Suspended / inactive staff** cannot authenticate.
3. **Temporary passwords** are high-entropy (12 chars).
4. **Email uniqueness** enforced on users + partner_staff.
5. **Activity logs** scoped to actor's laundry.

---

## File map

| Area | Path |
|------|------|
| Migrations | `20260603_0020_staff_management.py`, `20260603_0025_staff_suspend_schedule.py` |
| Models | `partner_staff.py`, `staff_activity_log.py` |
| Permissions | `staff_permissions.py` |
| Service | `staff_management_service.py` |
| API | `staff_management.py` |
| Frontend | `partner-staff-view.tsx`, `staff-management.ts` |

---

## Test plan

1. Log in as **partner** → open `/partner/staff`.
2. Create a **pickup agent** with schedule → copy temp password.
3. Log in as new staff → confirm portal access.
4. **Suspend** staff → confirm login blocked.
5. **Unsuspend** → login works.
6. **Deactivate** → login blocked permanently until reactivated.
7. **Reset password** → log in with new temp password.
8. Assign pickup in Operations Center → verify **assignment** in activity log.
9. Update order status as staff → verify **status_change** in log.
10. Confirm dashboard KPIs (total, active, online, inactive).

---

## Related docs

- `docs/features/partner-staff.md` — feature spec
- `OPERATIONS_CENTER.md` — task assignment integration
