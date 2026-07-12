# Dispute Analytics Dashboard — Root Cause Analysis

**Date:** 2026-06-03  
**Status:** Fixed and validated

---

## Summary

The Dispute Analytics Dashboard partially loaded (KPI cards and tables worked) but showed **"Could not load dispute analytics"** because the **charts API returned HTTP 500**. The root cause was a **PostgreSQL `GroupingError`** in the `monthly_trend()` refund aggregation query.

---

## Exact Error

### Network (failed request)

| Field | Value |
|-------|-------|
| **Request URL** | `GET http://localhost:8000/api/v1/admin/dispute-analytics/charts?period=last_30_days` |
| **Status code** | **500** |
| **Response payload** | `{"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred","details":[]},"meta":{"request_id":"","timestamp":"2026-06-03T08:34:18.307576+00:00"}}` |

### Backend (underlying exception)

```
sqlalchemy.exc.ProgrammingError: (asyncpg.exceptions.GroupingError)
column "complaints.created_at" must appear in the GROUP BY clause or be used in an aggregate function
```

**Generated SQL (broken):**

```sql
SELECT date_trunc($1::VARCHAR, complaints.created_at) AS m,
       coalesce(sum(orders.total_inr), $2::INTEGER) AS coalesce_1
FROM complaints
JOIN orders ON orders.id = complaints.order_id
WHERE complaints.created_at >= $3 AND complaints.created_at <= $4
  AND orders.payment_status = $5
GROUP BY date_trunc($6::VARCHAR, complaints.created_at)
ORDER BY date_trunc($7::VARCHAR, complaints.created_at)
```

PostgreSQL treats `$1`, `$6`, and `$7` as **distinct expressions** even though all are `date_trunc('month', complaints.created_at)`. That violates `GROUP BY` rules.

### Browser console

No JavaScript runtime errors in chart components. The UI failure was driven by the failed charts fetch:

- React Query sets `chartsQ.isError = true`
- `admin-dispute-analytics-view.tsx` renders destructive `InfoBanner`: **"Could not load dispute analytics"**
- `DisputeAnalyticsCharts` receives `data = undefined` after error and returns `null` (charts panel empty)

**Note:** When testing on `http://127.0.0.1:3001` (port 3000 in use), CORS blocked API calls because backend CORS allows `localhost` origins only. Use `http://localhost:3000` for browser testing. This is an environment issue, not the analytics bug.

---

## Failing File

`backend/app/repositories/dispute_analytics_repository.py`  
**Method:** `monthly_trend()` — refund sub-query (lines ~342–354 before fix)

---

## Failing Query

Refund amount by month inside `monthly_trend()`:

```python
# BEFORE (broken) — separate date_trunc() calls create different bind parameters
select(
    func.date_trunc("month", Complaint.created_at).label("m"),
    func.coalesce(func.sum(Order.total_inr), 0),
)
.group_by(func.date_trunc("month", Complaint.created_at))
.order_by(func.date_trunc("month", Complaint.created_at))
```

Other chart queries in the same endpoint **succeeded**:

| Query | Result |
|-------|--------|
| `chart_by_laundry` | OK (10 rows) |
| `chart_by_customer` | OK (10 rows) |
| `chart_by_type` | OK (8 rows) |
| `chart_by_region` | OK (3 rows) |
| `monthly_trend` | **FAIL** → entire `/charts` endpoint 500 |

---

## Root Cause

1. The `/charts` endpoint runs all five aggregations sequentially.
2. The first four queries succeed.
3. `monthly_trend()` fails on the **refund-by-month** query because SQLAlchemy emits **separate bind parameters** for each `func.date_trunc("month", Complaint.created_at)` call in SELECT, GROUP BY, and ORDER BY.
4. PostgreSQL requires GROUP BY expressions to match SELECT expressions exactly.
5. The unhandled exception becomes a generic **500 INTERNAL_ERROR**.
6. Frontend treats any charts failure as a dashboard error and hides the chart panel.

The **dashboard endpoint** (`/admin/dispute-analytics/dashboard`) was unaffected because it does not call `monthly_trend()`.

---

## Fix Applied

### 1. Reuse single `month_expr` for refund aggregation

**File:** `backend/app/repositories/dispute_analytics_repository.py`

```python
# AFTER (fixed)
month_expr = func.date_trunc("month", Complaint.created_at)

refund_rows = await self._session.execute(
    select(
        month_expr.label("m"),
        func.coalesce(func.sum(Order.total_inr), 0),
    )
    .select_from(Complaint)
    .join(Order, Order.id == Complaint.order_id)
    .where(
        _complaint_in_range(start, end),
        Order.payment_status == PaymentStatus.refunded,
    )
    .group_by(month_expr)
    .order_by(month_expr),
)
```

### 2. Register missing ORM model (preventive)

**File:** `backend/app/models/__init__.py`  
Added `ComplaintInternalNote` import so SQLAlchemy mapper configuration is complete when models are loaded outside the full app context.

---

## API Endpoint Verification

Endpoints listed in the investigation brief **do not exist** in this codebase:

| Checked path | Status |
|--------------|--------|
| `/api/v1/analytics/disputes` | **404 Not Found** |
| `/api/v1/reports/disputes` | **404 Not Found** |
| `/api/v1/dashboard/disputes` | **404 Not Found** |

**Actual implemented endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/admin/dispute-analytics/dashboard` | KPIs, top types, high-risk entities |
| GET | `/api/v1/admin/dispute-analytics/charts` | Bar/line chart data + monthly trend |
| GET | `/api/v1/admin/dispute-analytics/export` | CSV / Excel / report download |

---

## Database Verification

There is **no `disputes` table**. Disputes are stored in **`complaints`**.

| Logical entity | Physical table | Key columns |
|----------------|----------------|-------------|
| Disputes | `complaints` | `status`, `complaint_type`, `created_at`, `resolved_at`, `user_id`, `order_id` |
| Orders | `orders` | `status`, `created_at`, `total_inr`, `payment_status`, `laundry_id`, `user_id` |
| Customers | `users` | `role`, `fraud_risk_level`, `trust_score` |
| Laundries | `laundries` | `city`, `fraud_risk_level`, `trust_score` |
| Refunds | `orders` (not separate table) | `payment_status = 'refunded'`, `total_inr` |

| Required column | Present | Location |
|-----------------|---------|----------|
| `status` | Yes | `complaints.status`, `orders.status` |
| `dispute_type` | Yes (as `complaint_type`) | `complaints.complaint_type` |
| `created_at` | Yes | `complaints`, `orders`, `users`, `laundries` |
| `resolved_at` | Yes | `complaints.resolved_at` |
| `refund_amount` | Yes (as order total) | `orders.total_inr` where `payment_status = refunded` |

---

## Aggregation Query Verification (post-fix)

Period: `last_30_days` (demo seed data)

| Aggregation | Status | Sample result |
|-------------|--------|---------------|
| Open disputes count | OK | 14 |
| Resolved disputes (period) | OK | 6 |
| Avg resolution time | OK | 0.0 hours |
| Dispute rate | OK | 1.00% (20 disputes / 2000 orders) |
| Refund amount | OK | ₹3036.14 |
| Disputes by laundry | OK | 10 rows |
| Disputes by customer | OK | 10 rows |
| Disputes by type | OK | 8 rows |
| Disputes by region | OK | 3 rows |
| Monthly trend | OK | May 2026: 20 disputes, 6 resolved, ₹3036.14 refunds |

---

## Frontend Chart Components

| Component | Issue found | Action |
|-----------|-------------|--------|
| `dispute-analytics-charts.tsx` | No mapping/null bugs; fails when API returns error | No code change needed |
| `dispute-overview-cards.tsx` | Works from dashboard endpoint | No change |
| `dispute-analytics-panels.tsx` | Works from dashboard endpoint | No change |
| `admin-dispute-analytics-view.tsx` | Shows error banner when `chartsQ.isError` | Correct behavior; resolves when charts API returns 200 |

Chart data mapping expects `{ label, value, orders }` for bar charts and `{ month, disputes, resolved, refund_amount_inr }` for monthly trend — matches backend schema.

---

## Validation Results

### API (after fix + backend reload)

```
GET /admin/dispute-analytics/dashboard?period=last_30_days  → 200 OK
GET /admin/dispute-analytics/charts?period=last_30_days     → 200 OK
```

Charts response keys:

```json
{
  "disputes_by_laundry": 10,
  "disputes_by_customer": 10,
  "disputes_by_type": 8,
  "disputes_by_region": 3,
  "monthly_trend": 1
}
```

### Browser

- Page route `/admin/disputes/analytics` renders correctly when authenticated on **`http://localhost:3000`**
- Prior failure symptom: KPI cards visible, red error banner, empty charts panel
- After fix: both dashboard and charts requests succeed; error banner should not appear

### Restart required

Restart the backend (or rely on `--reload`) after pulling the fix so the updated repository code is loaded.

---

## Files Changed

1. `backend/app/repositories/dispute_analytics_repository.py` — fix `monthly_trend()` GROUP BY
2. `backend/app/models/__init__.py` — import `ComplaintInternalNote`
