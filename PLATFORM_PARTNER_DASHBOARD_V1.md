# Platform Partner Dashboard V1

> Read-only marketplace overview for external platform partners  
> Last updated: 2026-06-03

## Overview

The Platform Partner Dashboard gives **PLATFORM_PARTNER** users a consolidated, **view-only** snapshot of DLM marketplace performance — revenue, commission, network size, growth, trends, and rankings — without access to admin tools, partner operations, or payout/settlement data.

```
Platform Partner → /platform-partner
                   ├── Read-only banner
                   ├── Core metrics (6 KPIs)
                   ├── Trend charts (4 tabs)
                   └── Ranking tables (3 tables)
```

Post-login redirect for `platform_partner` role: **`/platform-partner`**.

Admins (`admin`, `super_admin`) may also open this route for preview/support; they retain full admin access elsewhere.

---

## Role & access

| Property | Value |
|----------|-------|
| **Role** | `platform_partner` |
| **Access** | Read-only |
| **Auth dependency** | `get_current_platform_partner` |
| **Allowed roles** | `platform_partner`, `admin`, `super_admin` |
| **Mutations** | None — single GET endpoint |
| **Payouts / settlements** | **Not exposed** (by design) |
| **Configuration** | **Not exposed** |

Platform partners see announcement banners (if targeted) but cannot create, edit, or moderate content.

---

## Core metrics

| KPI | Calculation |
|-----|-------------|
| **Total revenue** | Sum of `total_inr` for all **delivered** orders (lifetime) |
| **Platform commission** | Sum of `total_inr × commission_rate / 100` for delivered orders |
| **Active customers** | Distinct customers with orders in last **90 days** |
| **Active laundries** | Approved laundries with orders in last **90 days** |
| **Orders** | Total order count (all statuses, non-deleted) |
| **Revenue growth %** | MoM delivered revenue: `(current_month − prev_month) / prev_month × 100` |
| **Orders growth %** | MoM order count (same formula) |

Growth percentages appear on the **Total revenue** and **Orders** KPI cards. A dedicated **Revenue growth** KPI shows the MoM percentage explicitly.

Active customer/laundry cards show a **90-day window** subtitle (not MoM growth).

---

## Trend charts

Interactive tabbed charts (Recharts), auto-refreshed with the dashboard:

| Chart | Series | Window |
|-------|--------|--------|
| **Revenue trend** | Daily delivered revenue (`total_inr`) | **14 days** |
| **Orders trend** | Daily order count (created) | **14 days** |
| **Customer growth** | New customer signups per month | **6 months** |
| **Laundry growth** | New laundry registrations per month | **6 months** |

Charts are display-only — no drill-down, export, or date-range picker in V1.

---

## Ranking tables

Top **10** rows each, sorted by delivered revenue (services by line revenue):

| Table | Columns | Source |
|-------|---------|--------|
| **Top laundries** | Laundry, City, Revenue, Orders | `laundries` ⋈ delivered `orders` |
| **Top cities** | City, Revenue, Orders | Aggregated by `laundries.city` |
| **Top services** | Service, Revenue, Qty | `order_items.service_name`, `line_total_inr`, `quantity` |

All revenue figures use **INR** with standard Indian formatting in the UI.

---

## API

```
GET /api/v1/platform-partner/dashboard
```

Auth: Bearer token — `platform_partner`, `admin`, or `super_admin`.

### Response shape

```json
{
  "data": {
    "metrics": {
      "total_revenue_inr": "1250000.00",
      "platform_commission_inr": "187500.00",
      "active_customers": 890,
      "active_laundries": 28,
      "orders_total": 4520,
      "revenue_growth_pct": 12.5,
      "orders_growth_pct": 8.2
    },
    "charts": {
      "revenue_trend": [{ "date": "2026-05-20", "value": 12500.0, "label": null }],
      "orders_trend": [{ "date": "2026-05-20", "value": 14.0, "label": null }],
      "customer_growth": [{ "month": "2026-01", "count": 32 }],
      "laundry_growth": [{ "month": "2026-01", "count": 4 }]
    },
    "tables": {
      "top_laundries": [
        { "name": "Sparkle Clean", "city": "Bengaluru", "revenue_inr": "85000.00", "orders": 120 }
      ],
      "top_cities": [
        { "city": "Bengaluru", "revenue_inr": "320000.00", "orders": 890 }
      ],
      "top_services": [
        { "service_name": "Wash & Fold", "revenue_inr": "45000.00", "quantity": 320 }
      ]
    },
    "generated_at": "2026-06-03T12:00:00+00:00"
  }
}
```

Frontend auto-refreshes every **60 seconds** (`refetchInterval: 60_000`).

---

## Frontend

| Path | Component |
|------|-----------|
| `/platform-partner` | `PlatformPartnerDashboardView` |
| `(platform-partner)/layout.tsx` | `PlatformPartnerShell` — minimal header, sign-out, announcements |
| `frontend/features/platform-partner/platform-partner-charts.tsx` | Trend charts |
| `frontend/services/platform-partner-dashboard.ts` | API client + types |

### Auth wiring

| File | Change |
|------|--------|
| `frontend/types/user.ts` | `UserRole` includes `platform_partner` |
| `frontend/lib/auth-routing.ts` | Post-login → `/platform-partner` |
| `frontend/components/auth/role-guard.tsx` | Denied-state home link for platform partners |
| `frontend/lib/query-keys.ts` | `platformPartnerDashboard()` |

Shell footer note: **View-only · No payout calculations**.

---

## Backend

| Area | Path |
|------|------|
| Migration | `backend/alembic/versions/20260603_0027_platform_partner_role.py` |
| Enum | `UserRole.platform_partner` in `backend/app/models/enums.py` |
| Dependency | `get_current_platform_partner` in `backend/app/api/v1/deps.py` |
| Repository | `backend/app/repositories/platform_partner_dashboard.py` |
| Service | `backend/app/services/platform_partner_dashboard_service.py` |
| Schemas | `backend/app/schemas/platform_partner_dashboard.py` |
| API | `backend/app/api/v1/endpoints/platform_partner_dashboard.py` |

Reuses `BusinessHealthRepository` for daily trends and active-user counts. Does **not** call settlement, payout, or configuration services.

---

## Database

Migration adds `platform_partner` to PostgreSQL `user_role` enum:

```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'platform_partner';
```

Apply:

```bash
cd backend && python -m alembic upgrade head
```

---

## QA seed user (optional)

Add a platform partner test account in `backend/app/db/seed_qa.py`:

| Email | Password | Role |
|-------|----------|------|
| `platform-partner@demo.dlm` | (same as other QA users) | `platform_partner` |

---

## Explicit non-goals (V1)

- No CRUD on laundries, orders, users, or configuration
- No settlement balances, payout schedules, or bank details
- No partner-level drill-down or impersonation
- No CSV/PDF export
- No custom date-range filters
- No write APIs under `/platform-partner/*`

---

## Test plan

1. Run migration `20260603_0027` → confirm `platform_partner` exists in `user_role`.
2. Create or seed a user with role `platform_partner`.
3. Log in → confirm redirect to `/platform-partner`.
4. Verify all **6 KPI cards** render (values or em-dash when empty).
5. Switch through all **4 chart tabs** — no console or API errors.
6. Confirm **Top laundries**, **Top cities**, **Top services** tables populate from delivered orders.
7. Confirm **no edit buttons**, forms, or admin nav links appear.
8. Call `GET /platform-partner/dashboard` as `customer` or `partner` → **403**.
9. Call as `platform_partner` → **200** with full payload.
10. Confirm response contains **no** settlement/payout fields.
11. Wait 60s → dashboard refetches without error.
12. Sign out from shell header → redirects to `/login`.

---

## Related docs

- [BUSINESS_HEALTH_DASHBOARD.md](./BUSINESS_HEALTH_DASHBOARD.md) — admin executive dashboard (superset)
- [CUSTOMER_INSIGHTS.md](./CUSTOMER_INSIGHTS.md) — partner-scoped customer analytics
- [PLATFORM_CONFIGURATION_CENTER.md](./PLATFORM_CONFIGURATION_CENTER.md) — admin-only configuration
- [ANNOUNCEMENT_CENTER.md](./ANNOUNCEMENT_CENTER.md) — targeted banners (read-only for partners)
