# Laundry Revenue Analytics — DLM Admin

**Last updated:** 2026-06-03  
**Route:** `/admin/revenue/analytics`  
**API prefix:** `/api/v1/admin/revenue-analytics`

---

## Overview

Laundry-wise revenue analytics lets admins analyze platform revenue by laundry, partner, location, commission, refunds, and disputes. Built for high-volume datasets (10,000+ orders, 1,000+ laundries) using server-side aggregation, pagination, and filtering.

---

## Navigation

| Entry point | Path |
| ----------- | ---- |
| Admin sidebar → Finance → Revenue analytics | `/admin/revenue/analytics` |
| Admin overview → Revenue (MTD) KPI | `/admin/revenue/analytics` |
| Admin overview → Top 5 laundries widget | Click row → detail |
| Revenue transactions page | Link to analytics |

---

## Calculations

### Platform revenue

```
Platform Revenue = SUM(orders.total_inr)
  WHERE status = 'delivered'
    AND deleted_at IS NULL
    AND created_at BETWEEN [period_start, period_end]
```

Revenue uses **delivered orders only**. Date filter applies to `orders.created_at` (consistent with existing admin dashboard).

### Commission

Per order (snapshot at booking):

```
Commission = order.total_inr × order.commission_rate / 100
```

`order.commission_rate` is stored on the order at creation time (from laundry override or platform default).

```
Platform Commission = SUM(commission) for delivered orders in period
Net Partner Payout = Revenue − Commission
```

### Average order value

```
AOV = Platform Revenue / COUNT(delivered orders in period)
```

### Growth %

```
Growth = ((current_period_revenue − previous_period_revenue) / previous_period_revenue) × 100
```

Previous period has the same duration as the selected period (e.g. last 30 days vs prior 30 days).

### Refunds

```
Refund Amount = SUM(total_inr) WHERE payment_status = 'refunded'
Refund Rate % = (refund_count / total_orders_in_period) × 100
```

Refund reasons grouped from `complaints.complaint_type` joined to refunded orders.

### Disputes

```
Dispute Rate % = (open + resolved disputes in period) / total_orders_in_period × 100
Open = status IN (open, investigating, escalated)
Resolved = status IN (resolved, rejected)
```

### Settlements (estimated)

No dedicated settlement table yet:

| Field | Logic |
| ----- | ----- |
| Pending settlements | Net payout for delivered orders with `payment_status` pending or pending_cod |
| Completed settlements | Net payout for delivered orders with `payment_status` paid |

---

## State / location

Laundry model has `city` only. State is derived via `CITY_STATE_MAP` in `revenue_analytics_service.py` (e.g. Bengaluru → Karnataka). State filter maps to matching cities.

---

## API endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/admin/revenue-analytics/dashboard` | Overview KPIs, insights, top 5, commission/refund/dispute blocks |
| GET | `/admin/revenue-analytics/laundries` | Paginated laundry revenue table |
| GET | `/admin/revenue-analytics/charts` | Chart datasets |
| GET | `/admin/revenue-analytics/laundries/{id}` | Laundry detail + multi-branch |
| GET | `/admin/revenue-analytics/export` | CSV / Excel-compatible / text report |

### Query parameters (shared)

| Param | Values |
| ----- | ------ |
| `period` | `today`, `yesterday`, `last_7_days`, `last_30_days`, `this_month`, `last_month`, `custom` |
| `date_from`, `date_to` | ISO datetime (required for `custom`) |
| `laundry_id`, `partner_id` | UUID filters |
| `city`, `state`, `status` | String filters |
| `revenue_min`, `revenue_max` | Decimal |
| `page`, `page_size` | Pagination (table endpoint, max 100/page) |
| `sort_by` | `revenue`, `orders`, `commission`, `name`, `rating`, `disputes` |
| `sort_dir` | `asc`, `desc` |
| `format` | `csv`, `xlsx`, `pdf` (export only) |

---

## Database queries

All queries live in `backend/app/repositories/revenue_analytics_repository.py`.

### Laundry aggregate (core)

Single grouped query per page:

- `LEFT JOIN orders` with date range
- Subquery for dispute counts via `complaints` → `orders`
- `SUM(CASE WHEN delivered THEN total_inr)` for revenue
- `SUM(CASE WHEN delivered THEN total_inr * commission_rate / 100)` for commission
- `SUM(CASE WHEN refunded THEN total_inr)` for refunds
- `GROUP BY laundry.id`
- Server-side `LIMIT/OFFSET` pagination
- `HAVING` for revenue range filters

### Performance notes

- Indexes used: `orders.laundry_id`, `orders.status`, `orders.created_at`, `laundries.city`, `laundries.owner_user_id`
- No N+1 on table page (growth % computed per row in service — acceptable for page_size ≤ 100)
- Export capped at 10,000 rows per request
- Chart queries `LIMIT 10` laundries

---

## Frontend components

| Component | Path |
| --------- | ---- |
| Main view | `frontend/features/admin/views/admin-revenue-analytics-view.tsx` |
| Overview KPI cards | `revenue-analytics/revenue-overview-cards.tsx` |
| Filters + export | `revenue-analytics/revenue-analytics-filters.tsx` |
| Laundry table | `revenue-analytics/laundry-revenue-table.tsx` |
| Leaderboard | `revenue-analytics/top-laundries-leaderboard.tsx` |
| Charts (Recharts) | `revenue-analytics/revenue-analytics-charts.tsx` |
| Commission/refund/dispute panels | `revenue-analytics/revenue-analytics-sub-panels.tsx` |
| Laundry detail dialog | `revenue-analytics/laundry-revenue-detail-sheet.tsx` |
| Overview widget | `revenue-analytics/admin-top-laundries-widget.tsx` |
| API client | `frontend/services/revenue-analytics.ts` |

### UI features

- Compact tables, responsive charts
- Dark/light mode via CSS variables (`hsl(var(--primary))`, `--border`, etc.)
- Server-side pagination and filtering
- CSV / Excel (UTF-8 BOM) / text report export with current filters

---

## Multi-branch partners

When a partner owns multiple laundries (`owner_user_id` shared):

- Laundry detail shows **Partner branch summary**
- Table: branch name, city, revenue, orders, growth
- Partner totals aggregated across branches

Example: `partner.koramangala@demo.dlm` → Quick Wash Koramangala + Branch 2.

---

## KPI insights (auto-generated)

Generated in `RevenueAnalyticsService._build_insights()`:

1. Top laundry share of platform revenue (%)
2. Laundries with ≥10% revenue growth vs previous period
3. Highest dispute rate laundries (≥5%)

---

## Validation checklist

| Check | How |
| ----- | --- |
| Revenue matches orders | Compare dashboard total to `SUM(total_inr)` delivered in DB |
| Commission accurate | Verify `total_inr × commission_rate / 100` per order |
| Refunds accurate | Match `payment_status = refunded` sum |
| Filters | Change period/city/status; table and KPIs update |
| Charts | Top 10 laundries match table sort |
| Export | Download CSV; row count matches filtered table |
| Multi-branch | Open Koramangala partner detail; 2 branches shown |
| Dark mode | Toggle theme; charts and tables readable |
| Mobile | Horizontal scroll on table; stacked KPI grid |

---

## Files added

### Backend

- `app/schemas/revenue_analytics.py`
- `app/repositories/revenue_analytics_repository.py`
- `app/services/revenue_analytics_service.py`
- `app/api/v1/endpoints/revenue_analytics.py`

### Frontend

- `app/(admin)/admin/revenue/analytics/page.tsx`
- `features/admin/revenue-analytics/*`
- `services/revenue-analytics.ts`

---

## Future enhancements

- Dedicated `settlements` table for real payout tracking
- `state` column on `laundries` (avoid city→state mapping)
- True PDF generation (ReportLab / WeasyPrint)
- Materialized views for 100k+ order scale
- Partner filter dropdown populated from API
