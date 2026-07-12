# Customer Insights Dashboard

> Partner customer intelligence for DLM  
> Last updated: 2026-06-03

## Overview

The Customer Insights Dashboard helps partners understand who orders from their laundry — ranked by value, segmented by lifecycle, and flagged for risk. Metrics are computed from **non-cancelled orders** at the partner's laundry only.

```
Partner → /partner/customers
API     → /api/v1/partner/customer-insights/*
```

No new database tables — insights are derived from `orders`, `users`, and `complaints`.

---

## Partner customer lists

| List | Description |
|------|-------------|
| **Top customers** | Highest lifetime spend (top 10) |
| **VIP customers** | High spend + frequency threshold |
| **Repeat customers** | 2+ orders |
| **Inactive customers** | No order in 91+ days |
| **High risk customers** | Elevated platform risk or 2+ disputes |

Each list is available as a tab filter on the dashboard. Counts appear in dashboard KPIs.

---

## Metrics (per customer)

| Metric | Field | Calculation |
|--------|-------|-------------|
| **Lifetime spend** | `lifetime_spend_inr` | Sum of `orders.total_inr` (non-cancelled) |
| **Orders count** | `order_count` | Count of non-cancelled orders |
| **Average order value** | `avg_order_value_inr` | Lifetime spend ÷ order count |
| **Last order date** | `last_order_at` | Most recent order timestamp |
| **Retention score** | `retention_score` | RFM-style composite 0–100 (see below) |

### Dashboard aggregates

| KPI | Description |
|-----|-------------|
| Total customers | Distinct customers with orders |
| Avg lifetime spend | Mean spend across all customers |
| Avg order value | Total spend ÷ total orders |
| Avg retention score | Mean retention score |
| VIP count | Customers in VIP segment |
| High risk count | Customers flagged high risk |

### Retention score formula

| Component | Weight | Logic |
|-----------|--------|-------|
| Recency | 40% | `100 − (days_since_last_order × 100 / 180)`, clamped 0–100 |
| Frequency | 35% | `min(100, order_count × 15)` |
| Monetary | 25% | Spend vs partner P90 spend, clamped 0–100 |

Displayed as a progress bar (0–100) in the customer table.

---

## Segments

Each customer receives **one primary segment**:

| Segment | Label | Criteria |
|---------|-------|----------|
| **New** | New | Single order, first order within 30 days |
| **Active** | Active | Last order within 30 days (non-VIP) |
| **VIP** | VIP | Last order within 30 days AND (≥5 orders + ₹5,000 spend OR top 10% spend) |
| **At risk** | At risk | 2+ orders, last order 31–90 days ago |
| **Inactive** | Inactive | Last order 91+ days ago |

Segment priority: New → VIP → Active → At risk → Inactive.

Segment cards on the dashboard are clickable — they filter the customer table.

---

## High risk detection

A customer is flagged **high risk** when any of:

- Platform `fraud_risk_level` is `high` or `critical`
- Platform `trust_score` < 50 (partners see risk label only, not raw score)
- 2+ disputes on orders at this laundry

Risk labels shown to partners: **Low**, **Medium**, **High**, **Critical**.

> Raw trust scores are admin-only per product policy.

---

## API

Base: `/api/v1/partner/customer-insights`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard` | KPIs, segment counts, list counts |
| `GET` | `/customers` | Paginated customer rows with filters |

### Query params — `/customers`

| Param | Values |
|-------|--------|
| `list_type` | `top`, `repeat`, `vip`, `inactive`, `high_risk` |
| `segment` | `new`, `active`, `vip`, `at_risk`, `inactive` |
| `limit` | 1–100 (default 50) |
| `offset` | Pagination offset |

### Dashboard response

```json
{
  "total_customers": 42,
  "segments": { "new": 5, "active": 18, "vip": 8, "at_risk": 6, "inactive": 5 },
  "lists": { "top": 10, "repeat": 25, "vip": 8, "inactive": 5, "high_risk": 3 },
  "avg_retention_score": "72.5",
  "avg_lifetime_spend_inr": "3240.00",
  "avg_order_value_inr": "680.00"
}
```

### Customer row

```json
{
  "user_id": "uuid",
  "name": "Priya Sharma",
  "lifetime_spend_inr": "12450.00",
  "order_count": 14,
  "avg_order_value_inr": "889.29",
  "last_order_at": "2026-05-28T12:00:00+00:00",
  "first_order_at": "2025-11-02T10:00:00+00:00",
  "retention_score": 84,
  "segment": "vip",
  "segment_label": "VIP",
  "is_high_risk": false,
  "dispute_count": 0,
  "risk_label": "Low"
}
```

---

## Authorization

| Role | Access |
|------|--------|
| `partner` | Full access to own laundry customers |
| `partner_staff` | Requires `customers:view` permission |
| `admin` / `super_admin` | Allowed (for support) |

---

## Frontend

| Surface | Route | Component |
|---------|-------|-----------|
| Customer Insights Dashboard | `/partner/customers` | `PartnerCustomersView` |
| API client | — | `frontend/services/customer-insights.ts` |

Nav: **Operations → Customer insights**

### UI sections

1. **KPI strip** — totals, averages, VIP & high-risk counts
2. **Segment cards** — New / Active / VIP / At risk / Inactive (click to filter)
3. **List tabs** — All / Top / Repeat / VIP / Inactive / High risk
4. **Segment dropdown** — secondary filter
5. **Customer table** — spend, orders, AOV, last order, retention bar, risk badge

---

## File map

| Area | Path |
|------|------|
| Repository | `backend/app/repositories/customer_insights.py` |
| Service | `backend/app/services/customer_insights_service.py` |
| Schemas | `backend/app/schemas/customer_insights.py` |
| API | `backend/app/api/v1/endpoints/partner_customer_insights.py` |
| Frontend service | `frontend/services/customer-insights.ts` |
| Frontend UI | `frontend/features/partner/views/partner-customers-view.tsx` |
| Page route | `frontend/app/(partner)/partner/customers/page.tsx` |

Legacy `GET /partner/customers` remains for backward compatibility.

---

## Test plan

1. Partner with orders sees dashboard KPIs and segment counts at `/partner/customers`.
2. **Top customers** tab shows highest lifetime spend (max 10).
3. **Repeat** filter shows only customers with 2+ orders.
4. **VIP** tab matches spend/frequency rules.
5. **Inactive** filter shows customers with 91+ day gap since last order.
6. **High risk** list shows disputed or low-trust customers.
7. Click a **segment card** → table filters to that segment.
8. Customer table shows lifetime spend, order count, AOV, last order date, retention score.
9. Staff without `customers:view` permission gets 403.
10. Empty laundry shows zero state with helpful message.

---

## Related docs

- [REVIEW_MANAGEMENT.md](./REVIEW_MANAGEMENT.md) — customer feedback
- [STAFF_MANAGEMENT.md](./STAFF_MANAGEMENT.md) — staff `customers:view` permission
- [docs/features/reviews.md](./docs/features/reviews.md) — public reviews
