# Dispute Management — Enterprise DataTable Redesign

**Last updated:** 2026-06-03  
**Route:** `/admin/disputes`  
**API prefix:** `/api/v1/complaints/admin`

---

## Overview

The Dispute Management module was redesigned from a simple list/detail view into an enterprise-grade operations console inspired by Stripe, Shopify Admin, Zendesk, and Jira Service Management.

**Key capabilities:**
- Server-side pagination, sorting, filtering, and search
- KPI metrics dashboard
- Virtualized desktop table + mobile card layout
- Side drawer with evidence, timeline, internal notes, resolution actions
- Bulk escalate / close
- CSV / Excel export
- Audit logging for assignments, notes, status changes, bulk actions

---

## Architecture

```
Frontend                          Backend
─────────                         ───────
AdminDisputesDatatable     →      GET /complaints/admin/datatable
DisputeMetricsCards        →      GET /complaints/admin/metrics
DisputeFiltersBar          →      (query params)
DisputeDetailDrawer        →      GET /complaints/admin/datatable/{id}
                                  PATCH /complaints/admin/{id}/status
                                  POST  /complaints/admin/{id}/notes
                                  POST  /complaints/admin/bulk
                                  GET   /complaints/admin/export
```

### Layering

| Layer | Files |
| ----- | ----- |
| API | `backend/app/api/v1/endpoints/complaints.py` |
| Service | `backend/app/services/dispute_admin_service.py`, `complaint_service.py` |
| Repository | `backend/app/repositories/complaint.py` |
| Models | `complaint.py`, `complaint_internal_note.py`, enums |
| Migration | `20260603_0015_dispute_datatable.py` |
| Frontend | `frontend/features/admin/disputes/*` |
| Client | `frontend/services/disputes.ts` |

---

## Database schema changes

### `complaints` (extended)

| Column | Type | Notes |
| ------ | ---- | ----- |
| `priority` | `dispute_priority` enum | low, medium, high, critical |
| `assigned_to_user_id` | UUID FK → users | Nullable |
| `resolved_at` | timestamptz | Set on resolve/reject/close |

### New enum values

**complaint_status:** `awaiting_customer`, `awaiting_partner`, `closed`  
**complaint_type:** `payment_issue`, `other`  
**dispute_priority:** new type

### `complaint_internal_notes`

| Column | Purpose |
| ------ | ------- |
| author_user_id | Admin who wrote note |
| body | Note text |
| is_edited | Edit flag |
| created_at / updated_at | Timestamps |

---

## API contracts

### GET `/complaints/admin/datatable`

**Query params:**

| Param | Description |
| ----- | ----------- |
| `q` | Global search (ID, order, customer, email, phone, laundry) |
| `status`, `priority`, `complaint_type` | Exact filters |
| `resolution_status` | `open` or `resolved` |
| `date_from`, `date_to` | ISO datetime |
| `laundry_id`, `partner_id`, `customer_id`, `assigned_to` | UUID filters |
| `page`, `page_size` | Pagination (max 100) |
| `sort_by` | created_at, updated_at, status, priority, type |
| `sort_dir` | asc / desc |

**Response:** `{ items: DisputeAdminRow[], total, page, page_size, total_pages }`

### GET `/complaints/admin/metrics`

Returns: open_disputes, critical_disputes, resolved_today, pending_investigation, dispute_rate_pct, avg_resolution_hours

### POST `/complaints/admin/bulk`

```json
{
  "complaint_ids": ["uuid", "..."],
  "action": "assign|status|escalate|close|note",
  "assigned_to_user_id": "uuid?",
  "status": "investigating?",
  "priority": "high?",
  "note": "string?"
}
```

### POST `/complaints/admin/{id}/notes`

Internal note body — audit logged.

### GET `/complaints/admin/export`

Filtered CSV / Excel download.

---

## Database queries

Core search query (`ComplaintRepository.admin_search`):

- JOIN `users` (customer), `orders`, `laundries`
- Subquery for photo count
- Filter by status, priority, type, dates, resolution bucket
- ILIKE search across ID, tracking, names, email, phone, laundry
- GROUP BY not needed (one row per complaint)
- COUNT subquery for pagination total
- Secondary lookups for assignee names and partner names

Metrics query aggregates:
- Open = statuses in (open, investigating, awaiting_*, escalated)
- Critical = priority critical + open
- Resolved today = resolved/closed with resolved_at >= today
- Dispute rate = disputes / orders × 100
- Avg resolution = AVG(resolved_at - created_at) in hours

---

## Frontend components

| Component | Purpose |
| --------- | ------- |
| `admin-disputes-datatable.tsx` | Main view — table, bulk bar, mobile cards |
| `dispute-metrics-cards.tsx` | 6 KPI cards |
| `dispute-filters-bar.tsx` | Sticky filters + debounced search |
| `dispute-detail-drawer.tsx` | Dialog drawer — summary, resolution, notes, evidence |
| `dispute-badges.tsx` | Type / priority / status badges (dark mode safe) |

### Table columns

Dispute ID · Order · Customer · Laundry · Type · Priority · Status · Created · Assigned · Updated · Actions

### Performance

- **Server-side** pagination/filter/sort (10k+ disputes)
- **VirtualDataTable** + `@tanstack/react-virtual` for row virtualization within page
- **300ms debounced** search
- **Sticky** filter bar
- **Mobile:** card list with same actions via drawer

---

## User workflows

### Investigate dispute

1. Open `/admin/disputes`
2. Filter by status/priority or search order ID
3. Click **View** → drawer opens
4. Review evidence (pickup, delivery, inventory, OTP, custody)
5. Add internal note
6. Update status → audit logged

### Bulk escalate

1. Select rows via checkboxes
2. Click **Escalate** → status escalated, priority critical
3. Audit log entry for bulk action

### Export for compliance

1. Apply filters
2. Click **Export** → CSV download with current filters

---

## Audit logging

| Action | AuditAction enum |
| ------ | ---------------- |
| Assign admin | `dispute_assigned` |
| Add/edit note | `dispute_note_added` |
| Bulk action | `dispute_bulk_action` |
| Status change | `complaint_status_events` table + trust/fraud hooks |

---

## Priority defaults

| Trigger | Priority |
| ------- | -------- |
| New refund_request | high |
| New payment_issue | high |
| Bulk escalate | critical |
| Default | medium |

---

## Validation checklist

| Check | Status |
| ----- | ------ |
| Search (debounced) | ✅ |
| Filters (status, priority, type, resolution) | ✅ |
| Server pagination | ✅ |
| Server sorting | ✅ |
| Export CSV | ✅ |
| Drawer + evidence | ✅ |
| Timeline | ✅ |
| Internal notes + audit | ✅ |
| Bulk escalate/close | ✅ |
| Mobile cards | ✅ |
| Dark mode badges | ✅ |
| TypeScript build | ✅ |

---

## Future enhancements

- Column visibility toggle (localStorage)
- Resizable columns
- Assign admin dropdown populated from admin users API
- Partial refund / compensation resolution actions (payment integration)
- True PDF export
- `@tanstack/react-table` if column pinning needed

---

## Migration

```bash
cd backend
alembic upgrade head
```

Requires PostgreSQL enum autocommit for new status values (handled in migration).
