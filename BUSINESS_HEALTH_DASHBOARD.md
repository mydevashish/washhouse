# Executive Business Health Dashboard

> At-a-glance marketplace performance for DLM admins  
> Last updated: 2026-06-03

## Overview

The Business Health Dashboard gives executives an instant read on **revenue**, **orders**, **customers**, **laundry network health**, **operations**, **trends**, and **risk alerts** without drilling into individual modules.

```
Admin → /admin/business-health
        ├── Executive alerts (4 primary + delayed orders)
        ├── Core metrics (15 KPIs)
        ├── Trend charts (5 tabs)
        ├── Operational metrics (6 counters)
        └── Growth metrics (MoM %)
```

Also linked from **Admin → Overview** via the **Business health** button.

---

## Core metrics

| KPI | Calculation |
|-----|-------------|
| **Revenue today** | Sum of `total_inr` for orders `delivered` with `delivered_at` ≥ today (UTC) |
| **Revenue this month** | Delivered revenue since 1st of current UTC month |
| **Revenue growth %** | `(revenue_month − revenue_prev_month) / revenue_prev_month × 100` |
| **Orders today** | Orders created today |
| **Orders this month** | Orders created since month start |
| **Order growth %** | `(orders_month − orders_prev_month) / orders_prev_month × 100` |
| **Average order value** | `revenue_month / delivered_orders_month` |
| **Active customers** | Distinct customers with orders in last **90 days** |
| **New customers** | Customer signups since month start |
| **Returning customers** | Customers with **2+ orders** in last **90 days** |
| **Active laundries** | Approved laundries with orders in last **90 days** |
| **Top laundry** | Approved laundry with highest delivered revenue MTD |
| **Lowest performing laundry** | Approved laundry with lowest delivered revenue MTD (min 1 order) |

Totals for customers/laundries shown as secondary context on KPI cards.

---

## Operational metrics

| Metric | Source |
|--------|--------|
| **Open disputes** | Complaints in open/investigating/awaiting/escalated |
| **Pending refunds** | Open `refund_request` disputes |
| **Pending settlements** | Settlements in `pending`, `approved`, or `processing` |
| **Failed deliveries** | Delivery task assignments marked `failed` (MTD) |
| **Delayed orders** | Past `pickup_at` or `delivery_at` without completion |
| **Delayed settlements** | Pending/approved settlements older than **7 days** |

Each tile links to the relevant admin module.

---

## Growth metrics

Month-over-month (current calendar month vs previous):

| Metric | Comparison |
|--------|------------|
| **Customer growth** | New customer signups |
| **Laundry growth** | New laundry registrations |
| **Order growth** | Order count |
| **Revenue growth** | Delivered revenue |

Also shows raw counts: new customers / laundries this month.

---

## Trend charts

Interactive tabbed charts (Recharts), 14-day daily series unless noted:

| Chart | Data |
|-------|------|
| **Revenue trend** | Daily delivered revenue (`total_inr`) |
| **Orders trend** | Daily order count (created) |
| **Customer growth** | New customer signups per month (6 months) |
| **Laundry growth** | New laundry registrations per month (6 months) |
| **Commission trend** | Daily platform commission (`total_inr × commission_rate / 100`) |

---

## Executive alerts

Auto-generated from live thresholds:

| Alert | Trigger | Severity |
|-------|---------|----------|
| **High refund rate** | Refunded orders / delivered (30d) ≥ **5%** | warning / critical (≥10%) |
| **High dispute rate** | New disputes / orders (30d) ≥ **3%** | warning / critical (≥6%) |
| **Settlement delays** | Pending settlements ≥ 5 OR any > 7 days old | warning / critical |
| **Revenue drop** | MoM revenue growth ≤ **−10%** | warning / critical (≤−20%) |
| **Delayed orders** | Any orders past schedule | warning |

Alerts include deep links (`/admin/disputes`, `/admin/settlements`, etc.).

When no alerts fire, a green **All clear** banner is shown.

---

## API

```
GET /api/v1/admin/business-health
```

Auth: `admin`, `super_admin`.

### Response shape

```json
{
  "data": {
    "metrics": {
      "revenue_today_inr": "12500.00",
      "revenue_month_inr": "450000.00",
      "revenue_growth_pct": 12.5,
      "orders_today": 14,
      "orders_month": 320,
      "order_growth_pct": 8.2,
      "active_customers": 890,
      "new_customers": 45,
      "returning_customers": 210,
      "active_laundries": 28,
      "top_laundry_name": "Sparkle Clean",
      "top_laundry_revenue_inr": "85000.00",
      "lowest_laundry_name": "Quick Wash",
      "lowest_laundry_revenue_inr": "3200.00",
      "...": "..."
    },
    "operational": { "open_disputes": 3, "pending_refunds": 1, "pending_settlements": 4, "...": "..." },
    "growth": { "customer_growth_pct": 8.0, "laundry_growth_pct": 5.0, "...": "..." },
    "alerts": [{ "id": "high_refund_rate", "severity": "warning", "title": "High refund rate", "...": "..." }],
    "trend": [{ "date": "2026-06-01", "revenue_inr": "12500.00", "orders": 14 }],
    "charts": {
      "revenue_trend": [{ "date": "2026-06-01", "value": 12500.0 }],
      "orders_trend": [{ "date": "2026-06-01", "value": 14.0 }],
      "customer_growth": [{ "month": "2026-01", "count": 32 }],
      "laundry_growth": [{ "month": "2026-01", "count": 4 }],
      "commission_trend": [{ "date": "2026-06-01", "value": 1875.0 }]
    },
    "generated_at": "2026-06-03T12:00:00+00:00"
  }
}
```

Frontend auto-refreshes every **60 seconds**.

---

## Frontend

| Path | Component |
|------|-----------|
| `/admin/business-health` | `AdminBusinessHealthView` |
| `frontend/features/admin/business-health/business-health-charts.tsx` | Trend charts |
| `frontend/services/business-health.ts` | API client + types |

Nav: **Dashboard → Business health**

---

## File map

| Area | Path |
|------|------|
| Repository | `backend/app/repositories/business_health.py` |
| Service | `backend/app/services/business_health_service.py` |
| Schemas | `backend/app/schemas/business_health.py` |
| API | `backend/app/api/v1/endpoints/business_health.py` |
| Frontend UI | `frontend/features/admin/views/admin-business-health-view.tsx` |
| Frontend charts | `frontend/features/admin/business-health/business-health-charts.tsx` |
| Frontend service | `frontend/services/business-health.ts` |

---

## Thresholds (service defaults)

| Constant | Value | Used for |
|----------|-------|----------|
| `REFUND_RATE_WARN` | 5% | High refund rate alert |
| `DISPUTE_RATE_WARN` | 3% | High dispute rate alert |
| `REVENUE_DROP_WARN` | −10% | Revenue drop alert |
| `SETTLEMENT_DELAY_DAYS` | 7 | Delayed settlement count |
| `ACTIVE_WINDOW_DAYS` | 90 | Active customers/laundries, returning customers |
| `TREND_DAYS` | 14 | Daily trend series length |

---

## Test plan

1. Log in as **admin** → open `/admin/business-health`.
2. Confirm all 15 core KPIs render with real or zero data.
3. Verify **Top laundry** and **Lowest performing laundry** show MTD revenue.
4. Switch through all 5 trend chart tabs — data loads without error.
5. Verify operational tiles link to disputes, settlements, orders.
6. Confirm growth percentages update when seed data spans two months.
7. Create open dispute → **Open disputes** increments.
8. Simulate high refund volume → **High refund rate** alert appears.
9. Confirm overview page **Business health** button navigates correctly.
10. Wait 60s → dashboard refetches without error.

---

## Related docs

- [PLATFORM_CONFIGURATION.md](./PLATFORM_CONFIGURATION.md) — configurable dispute/settlement windows
- [SETTLEMENT_MANAGEMENT.md](./SETTLEMENT_MANAGEMENT.md) — settlement lifecycle
- [OPERATIONS_CENTER.md](./OPERATIONS_CENTER.md) — partner delayed orders
- [CUSTOMER_INSIGHTS.md](./CUSTOMER_INSIGHTS.md) — partner customer analytics
