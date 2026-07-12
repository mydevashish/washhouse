# Admin Dashboard Root Cause Analysis

**Date:** 2026-06-03  
**Issue:** Admin Overview showed *"Could not load dashboard metrics"* with no KPI data.

---

## Summary

| Item | Detail |
| ---- | ------ |
| **Failed API** | `GET /api/v1/admin/dashboard` |
| **HTTP status** | 500 Internal Server Error |
| **Error message** | `type object 'ComplaintStatus' has no attribute 'in_review'` |
| **Root cause** | Stale enum reference after migration renamed `in_review` → `investigating` |
| **Fix** | Use `ComplaintStatus.investigating` (+ `escalated`) in `dashboard_stats()` |
| **Data issue?** | No — database had 2000 orders, 122 users, 16 laundries |

---

## Investigation steps

### Step 1 — Network (simulated via direct API test)

| Field | Value |
| ----- | ----- |
| **Request URL** | `http://localhost:8000/api/v1/admin/dashboard` |
| **Method** | GET |
| **Status (before fix)** | 500 |
| **Status (after fix)** | 200 |
| **Response (after fix)** | Valid KPI payload with orders, revenue, commission, etc. |
| **Auth** | Bearer JWT (admin role) — no 401/403 |

The overview page uses TanStack Query calling `getAdminDashboard()` → `GET /admin/dashboard`.  
Analytics (`GET /admin/analytics`) was separate and unaffected.

### Step 2 — Browser console

Expected before fix:
- React Query error on `['admin-dashboard']`
- Axios 500 response
- No hydration errors (failure was server-side)

### Step 3 — Backend logs / reproduction

Reproduced locally:

```python
await AdminService(session).dashboard_stats()
# AttributeError: type object 'ComplaintStatus' has no attribute 'in_review'
```

Traceback origin:

```
backend/app/services/admin_service.py:139
  Complaint.status.in_((ComplaintStatus.open, ComplaintStatus.in_review))
```

### Step 4 — Dashboard API mapping

| Endpoint | Powers |
| -------- | ------ |
| `GET /admin/dashboard` | **KPI cards** (laundries, customers, orders, revenue MTD, commission MTD, approvals) |
| `GET /admin/analytics` | Trend charts + top cities/laundries |
| `GET /admin/revenue-analytics/dashboard` | Revenue analytics page (separate) |

The error banner on Overview is tied exclusively to `dashboardQ.isError` → `/admin/dashboard`.

### Step 5 — Authentication

- Login as `admin@demo.dlm` succeeded (200)
- Dashboard request with valid Bearer token reached backend
- Failure was **500**, not auth-related

### Step 6 — Database queries

After fixing the enum, all aggregations succeed:

| Metric | Value (QA seed) |
| ------ | ----------------- |
| orders_total | 2000 |
| customers_total | 100 |
| laundries_approved | 14 |
| revenue_month_inr | 393447.40 |
| commission_month_inr | 39344.74 |
| complaints_open | 14 |

Tables/columns/indexes present — no schema mismatch.

### Step 7 — Seed data

Data exists; empty DB was **not** the cause. The handler crashed before returning counts.

### Step 8 — Frontend data layer

- TanStack Query correctly surfaced `isError` when API returned 500
- Axios envelope parsing was fine
- UI previously hid the real error with generic *"Refresh to try again"*

**Additional fix:** Show actual API error via `getApiErrorMessage()` in `admin-overview-view.tsx`.

### Step 9 — Environment

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1  ✓
```

Correct API base; not an env misconfiguration.

### Step 10 — Widget isolation

All KPI widgets depend on a single `/admin/dashboard` response. One backend exception broke the entire KPI grid. Charts/widget (`AdminTopLaundriesWidget`) use separate endpoints and could still load independently.

---

## Root cause (detailed)

Migration `20260603_0011_dispute_management.py` renamed PostgreSQL enum value:

```sql
ALTER TYPE complaint_status RENAME VALUE 'in_review' TO 'investigating';
```

Python enum in `app/models/enums.py` was updated:

```python
class ComplaintStatus(str, enum.Enum):
    open = "open"
    investigating = "investigating"  # was in_review
    ...
```

But `AdminService.dashboard_stats()` still referenced the removed member:

```python
ComplaintStatus.in_review  # AttributeError at runtime
```

This raised an unhandled exception → FastAPI 500 → React Query error state → error banner.

---

## Fix applied

### File: `backend/app/services/admin_service.py`

```python
# Before (broken)
Complaint.status.in_((ComplaintStatus.open, ComplaintStatus.in_review))

# After (fixed)
Complaint.status.in_(
    (ComplaintStatus.open, ComplaintStatus.investigating, ComplaintStatus.escalated),
)
```

Open complaints count now aligns with dispute analytics elsewhere in the codebase.

### File: `frontend/lib/api-error-message.ts` (new)

Utility to surface real API error messages in UI.

### File: `frontend/features/admin/views/admin-overview-view.tsx`

- Dashboard error banner shows actual message (not generic text)
- Separate banner for analytics failures

---

## Validation results

| Check | Result |
| ----- | ------ |
| `dashboard_stats()` direct call | ✅ Pass |
| `GET /admin/dashboard` HTTP | ✅ 200 |
| Revenue KPI | ✅ 393447.40 MTD |
| Orders KPI | ✅ 2000 total, 752 in progress |
| Customers KPI | ✅ 100 |
| Laundries KPI | ✅ 14 approved, 1 pending |
| Commission KPI | ✅ 39344.74 |
| Disputes (complaints_open) | ✅ 14 |
| TypeScript build | ✅ Pass |

---

## Files affected

| File | Change |
| ---- | ------ |
| `backend/app/services/admin_service.py` | Fix `ComplaintStatus` enum reference |
| `frontend/lib/api-error-message.ts` | New — expose API errors in UI |
| `frontend/features/admin/views/admin-overview-view.tsx` | Show real error messages |

---

## Prevention

- Grep for removed enum values after migrations (`in_review`)
- Add integration test for `GET /admin/dashboard` with admin auth
- Keep error banners showing server message for faster diagnosis
