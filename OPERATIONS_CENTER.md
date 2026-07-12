# Pickup & Delivery Operations Center

> Production-grade partner logistics hub for DLM  
> Last updated: 2026-06-03

## Overview

The Operations Center gives laundry partners a unified view of **pickup queues**, **delivery queues**, **driver assignment**, and **live operations metrics**. It builds on order statuses and staff accounts from [STAFF_MANAGEMENT.md](./STAFF_MANAGEMENT.md).

```
Partner dashboard (/partner)
        ↓
Operations center (/partner/operations)
        ├── Operations dashboard KPIs
        ├── Pickup queue (5 buckets)
        ├── Delivery queue (6 buckets)
        └── Driver workload & capacity
```

---

## Partner dashboard KPIs

The partner overview (`/partner`) surfaces operations metrics:

| KPI | Description |
|-----|-------------|
| **Today's Pickups** | Orders with `pickup_at` scheduled for today |
| **Today's Deliveries** | Orders with `delivery_at` scheduled for today |
| **Delayed Orders** | Past pickup/delivery window without completion |
| **Pending Assignments** | Orders needing a driver assignment |
| **Active Drivers** | Staff with active pickup/delivery tasks |

Link: **Operations center** button → full queue management.

---

## Pickup queue

| Bucket | Order status | Assignment |
|--------|--------------|------------|
| **Scheduled** | `confirmed` | No active pickup assignment |
| **Assigned** | `pickup_assigned` | Driver assigned, not started |
| **In Progress** | `pickup_assigned` | Assignment `in_progress` |
| **Completed** | `picked_up` → `ready` | Pickup phase done |
| **Cancelled** | `cancelled` | — |

Assigning a pickup driver on a `confirmed` order advances the order to `pickup_assigned`.

---

## Delivery queue

| Bucket | Order status | Assignment |
|--------|--------------|------------|
| **Ready** | `ready` | No delivery driver assigned |
| **Assigned** | `ready` | Driver assigned, not yet dispatched |
| **Out For Delivery** | `out_for_delivery` | Driver en route |
| **Delivered** | `delivered` | OTP verified |
| **Failed** | — | Assignment marked `failed` |
| **Returned** | `ready` (reverted) | Assignment marked `returned` |

Starting a delivery assignment moves a `ready` order to `out_for_delivery` and triggers delivery OTP generation.

---

## Driver management

### Assign driver

```
POST /api/v1/partner/operations/assignments
{
  "order_id": "...",
  "staff_id": "...",
  "task_type": "pickup" | "delivery"
}
```

- Validates staff role (pickup agents for pickup, delivery agents for delivery; owners/managers for both)
- Enforces **daily capacity** per driver (`partner_staff.daily_capacity`, default 8)
- Cancels any previous active assignment of the same type on the order
- Logs `assignment` activity in staff activity logs

### Reassign driver

```
PATCH /api/v1/partner/operations/assignments/{id}/reassign
{ "staff_id": "..." }
```

### Track workload & capacity

Each driver shows:

| Field | Purpose |
|-------|---------|
| `daily_capacity` | Max concurrent tasks (default 8) |
| `active_tasks` | Assignments in `scheduled`, `assigned`, or `in_progress` |
| `workload_pct` | `active_tasks / daily_capacity × 100` |
| `available` | `active_tasks < daily_capacity` |
| `completed_today` | Tasks completed today |

The **Drivers** tab shows workload bars with capacity warnings.

### Update assignment status

```
PATCH /api/v1/partner/operations/assignments/{id}/status
{ "status": "in_progress" | "failed" | "returned" | ... }
```

| Status | Effect |
|--------|--------|
| `in_progress` | Delivery: order → `out_for_delivery` |
| `failed` | Marks delivery attempt failed |
| `returned` | Order reverts to `ready` |
| `completed` | Auto-set when order reaches `picked_up` or `delivered` |

---

## Operations dashboard

Endpoint: `GET /api/v1/partner/operations/dashboard`

| Metric | Calculation |
|--------|-------------|
| **Pickups today** | Orders with today's `pickup_at`, not cancelled |
| **Deliveries today** | Orders with today's `delivery_at`, not cancelled |
| **Average delivery time** | Mean minutes from `out_for_delivery` event to `delivered_at` (today) |
| **Delayed orders** | Past `pickup_at` (confirmed/pickup_assigned) or past `delivery_at` (ready/out_for_delivery) |
| **Failed deliveries** | Delivery assignments marked `failed` today |
| **Pending assignments** | Unassigned confirmed + pickup_assigned + ready orders |
| **Active drivers** | Distinct staff with active assignments |

---

## Database schema

### Table: `order_task_assignments`

| Column | Purpose |
|--------|---------|
| `order_id` | FK → orders |
| `laundry_id` | Branch scope |
| `task_type` | `pickup` \| `delivery` |
| `staff_id` | FK → partner_staff (driver) |
| `status` | Assignment lifecycle |
| `assigned_by_user_id` | Manager/owner who assigned |
| `assigned_at` | Assignment timestamp |
| `started_at` | Task start |
| `completed_at` | Task completion |
| `notes` | Optional notes |

### Extended: `partner_staff`

| Column | Purpose |
|--------|---------|
| `daily_capacity` | Max concurrent tasks (default 8) |

### Enums

- **`task_assignment_type`:** pickup, delivery
- **`task_assignment_status`:** scheduled, assigned, in_progress, completed, cancelled, failed, returned

### Migration

```
backend/alembic/versions/20260603_0021_operations_center.py
```

Apply:

```bash
cd backend && python -m alembic upgrade head
```

---

## API reference

Base path: `/api/v1/partner/operations`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard` | Operations KPIs |
| `GET` | `/pickups` | Pickup queue buckets |
| `GET` | `/deliveries` | Delivery queue buckets |
| `GET` | `/drivers` | Driver capacity & workload |
| `POST` | `/assignments` | Assign driver |
| `PATCH` | `/assignments/{id}/reassign` | Reassign driver |
| `PATCH` | `/assignments/{id}/status` | Update assignment status |

Auth: `partner`, `partner_staff`, `admin`, `super_admin`.

---

## Frontend

| Path | Component |
|------|-----------|
| `/partner/operations` | `PartnerOperationsView` |
| `/partner` | Overview with operations KPIs |
| `frontend/services/operations.ts` | API client |

Nav: **Operations → Operations center** in partner sidebar.

Tabs:

1. **Dashboard** — Pickups/deliveries today, avg delivery time, delayed, failed, pending, active drivers
2. **Pickup queue** — Scheduled / Assigned / In Progress / Completed / Cancelled
3. **Delivery queue** — Ready / Assigned / Out For Delivery / Delivered / Failed / Returned
4. **Drivers** — Workload bars and capacity

---

## Integration hooks

| Event | Handler |
|-------|---------|
| Order → `picked_up` | Completes active pickup assignment |
| Delivery OTP verified → `delivered` | Completes active delivery assignment |
| Assign pickup on `confirmed` | Order → `pickup_assigned` + WebSocket event |
| Start delivery assignment | Order → `out_for_delivery` + OTP generation |
| Return delivery | Order → `ready` |

Activity logged via `StaffActivityAction.assignment` in staff activity logs.

---

## File map

| Area | Path |
|------|------|
| Migration | `backend/alembic/versions/20260603_0021_operations_center.py` |
| Model | `backend/app/models/order_task_assignment.py` |
| Enums | `backend/app/models/enums.py` |
| Repository | `backend/app/repositories/operations.py` |
| Service | `backend/app/services/operations_service.py` |
| API | `backend/app/api/v1/endpoints/operations_center.py` |
| Schemas | `backend/app/schemas/operations.py` |
| Frontend service | `frontend/services/operations.ts` |
| Frontend UI | `frontend/features/partner/views/partner-operations-view.tsx` |
| Partner overview | `frontend/features/partner/views/partner-overview-view.tsx` |

---

## Test plan

1. Log in as **partner** → open `/partner/operations`.
2. Confirm dashboard KPIs: pickups, deliveries, avg time, delayed, failed, pending, active drivers.
3. Create/accept an order → **Pickup queue → Scheduled**.
4. **Assign** pickup agent → **Assigned**, order `pickup_assigned`.
5. **Start** task → **In Progress**.
6. Mark order picked up → **Completed**.
7. Process to **ready** → **Delivery queue → Ready**.
8. Assign delivery agent → **Assigned** bucket.
9. **Start** → **Out For Delivery**, OTP generated.
10. Complete via OTP → **Delivered**.
11. Test **Failed** and **Returned** on active delivery.
12. Verify driver **workload** and **capacity** limits.
13. Confirm `/partner` overview shows the five operations KPIs.

---

## Related docs

- [STAFF_MANAGEMENT.md](./STAFF_MANAGEMENT.md) — driver roles and accounts
- [PICKUP_EVIDENCE.md](./PICKUP_EVIDENCE.md) — pickup photo requirements
- [DELIVERY_PROOF.md](./DELIVERY_PROOF.md) — delivery OTP and proof
