# Settlement & Payout Management

> Production-grade partner settlement system for DLM  
> Last updated: 2026-06-03

## Overview

DLM collects customer payments per order. Each completed order splits into:

| Component | Calculation |
|-----------|-------------|
| **Customer payment** | `orders.total_inr` (paid to platform) |
| **Platform commission** | `total_inr × commission_rate / 100` (snapshotted on order) |
| **Partner revenue (net)** | `total_inr − commission − refunds + adjustments` |

Settlements batch eligible orders per laundry/partner, flow through admin approval, and release as payouts.

---

## Business rules

1. Customer pays the **platform** (Razorpay / COD recorded on order).
2. Platform retains **commission** per order (`commission_rate` snapshotted at booking).
3. Remaining **net amount** belongs to the laundry partner.
4. Refunds reduce partner net on the linked order line.
5. Manual **adjustments** (+/−) apply at settlement batch level before payout.

---

## Settlement lifecycle

```
Order delivered (OTP verified)
        ↓
48-hour dispute window (pending_window)
        ↓
No open disputes → settlement eligible
        ↓
Settlement batch created (pending)
        ↓
Admin approves (approved)
        ↓
Mark processing (processing)
        ↓
Payout released (paid)
```

**Dispute hold:** If a complaint is filed while an order is in `pending_window` or `eligible`, eligibility moves to `held_dispute` until resolved and the dispute window has passed.

**Admin hold:** Any settlement in `pending`, `approved`, or `processing` can be moved to `on_hold` (fraud review, bank verification). Release hold restores the previous status.

---

## Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Settlement created, awaiting admin approval |
| `approved` | Approved, ready for payout processing |
| `processing` | Payout initiated with bank/UPI provider |
| `paid` | Payout confirmed; partner earnings released |
| `failed` | Payout attempt failed |
| `cancelled` | Rejected/cancelled; orders released back to eligible pool |
| `on_hold` | Admin-held; payout blocked until released |

---

## Database schema

### Tables

| Table | Purpose |
|-------|---------|
| `settlements` | Settlement batch header (amounts, status, payout ref, hold fields) |
| `settlement_orders` | Line items linking orders to a batch |
| `settlement_adjustments` | Manual admin adjustments (+/− INR) |

### Order columns

| Column | Purpose |
|--------|---------|
| `delivered_at` | Timestamp when order was delivered |
| `settlement_eligible_at` | `delivered_at + dispute_window_hours` |
| `settlement_eligibility` | Lifecycle enum (see below) |
| `settlement_id` | FK to active/completed settlement batch |

### Settlement hold columns

| Column | Purpose |
|--------|---------|
| `held_at` | When admin placed hold |
| `held_reason` | Hold reason |
| `status_before_hold` | Status restored on release |

### Enums

**`settlement_status`:** pending, approved, processing, paid, failed, cancelled, on_hold

**`settlement_eligibility`:** pending_window, eligible, in_settlement, settled, held_dispute

### Migrations

- `20260603_0018_settlement_management.py` — tables + order columns + backfill
- `20260603_0019_settlement_audit_actions.py` — audit enum values
- `20260603_0024_settlement_on_hold.py` — on_hold status + hold audit actions

---

## API reference

### Admin (`/api/v1/admin/settlements`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | KPI cards (pending, paid, on hold, today/monthly payouts, commission) |
| GET | `/analytics` | Status breakdown, monthly payouts, top partners |
| GET | `/audit` | Settlement audit log (optional `settlement_id` filter) |
| GET | `/` | Paginated settlement table |
| POST | `/run` | Scan eligibility + create settlement batches |
| GET | `/export?format=csv\|xlsx\|pdf` | Export settlements |
| GET | `/{id}` | Settlement detail + line items + adjustments |
| POST | `/{id}/approve` | Approve pending settlement |
| POST | `/{id}/reject` | Cancel/reject with reason |
| POST | `/{id}/hold` | Place settlement on hold |
| POST | `/{id}/release-hold` | Release from hold |
| POST | `/{id}/process` | Move to processing |
| POST | `/{id}/release` | Mark paid + payout reference |
| POST | `/{id}/fail` | Mark payout failed |
| POST | `/{id}/adjustments` | Manual adjustment |

### Partner (`/api/v1/partner/settlements`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Earnings summary + settlement history |
| GET | `/export?format=csv\|xlsx\|pdf` | Download statement |
| GET | `/{id}` | Own settlement detail (authz scoped) |

### Partner earnings buckets

| Bucket | Includes |
|--------|----------|
| **Pending earnings** | Orders in dispute window or held by open complaint |
| **Available earnings** | Eligible orders not yet batched + approved settlements |
| **Released earnings** | Paid settlement batches |

---

## Settlement table columns

| Column | Source |
|--------|--------|
| Settlement ID | `settlement_code` |
| Partner | `users.full_name` |
| Laundry | `laundries.name` |
| Orders Count | `orders_count` |
| Gross Revenue | `gross_revenue_inr` |
| Commission | `commission_inr` |
| Refunds | `refund_inr` |
| Net Amount | `net_amount_inr` |
| Status | `status` |
| Created Date | `created_at` |
| Paid Date | `paid_at` |

---

## Admin UI

**Route:** `/admin/settlements`

| Section | Features |
|---------|----------|
| **Dashboard** | Pending/paid/on-hold KPIs, today's & monthly payouts, commission |
| **Analytics** | Status breakdown, monthly payout trend, top partners |
| **Table** | Full column set, sort/filter, quick actions |
| **Detail drawer** | Approve, reject, hold, release hold, process, release payout, adjustments |
| **Audit log** | All settlement actions with actor and timestamps |

---

## Partner UI

**Route:** `/partner/settlements`

| Feature | Description |
|---------|-------------|
| Pending earnings | Orders still in dispute window |
| Available earnings | Cleared for payout |
| Released earnings | Historical paid batches |
| Settlement history | Paginated table with status |
| Download statements | CSV, Excel, PDF report |

---

## Exports

| Format | Content | Admin | Partner |
|--------|---------|-------|---------|
| **CSV** | Full table rows | `/admin/settlements/export?format=csv` | `/partner/settlements/export?format=csv` |
| **Excel** | UTF-8 BOM CSV (`.xls`) | `format=xlsx` | Same |
| **PDF** | Structured text report with summary + rows | `format=pdf` | Same |

---

## Audit logs

All settlement actions write to `audit_logs`:

| Action | When |
|--------|------|
| `settlement_created` | Batch created |
| `settlement_approved` | Admin approval |
| `settlement_rejected` | Admin rejection |
| `settlement_held` | Placed on hold |
| `settlement_released_from_hold` | Hold released |
| `settlement_payout_released` | Payout marked paid |
| `settlement_adjustment` | Manual adjustment added |
| `settlement_status_change` | Status transitions (process, fail) |

Filter: `resource_type=settlement`, `resource_id={settlement_uuid}`

---

## Automation

### Celery beat

| Task | Schedule | Action |
|------|----------|--------|
| `settlements.process_eligible` | Every hour | Scan eligibility + create batches |

### Hooks

| Event | Handler |
|-------|---------|
| Order delivered (OTP verified) | `SettlementService.on_order_delivered()` |
| Complaint filed | `SettlementService.on_complaint_opened()` |

Dispute window hours are configurable via Platform Configuration Center.

---

## File map

### Backend

| Path | Role |
|------|------|
| `app/models/settlement.py` | ORM models |
| `app/models/enums.py` | SettlementStatus, SettlementEligibility, AuditAction |
| `app/repositories/settlement.py` | Queries + analytics |
| `app/services/settlement_service.py` | Business logic |
| `app/services/settlement_calculator.py` | Amount math |
| `app/schemas/settlement.py` | Pydantic schemas |
| `app/api/v1/endpoints/settlements.py` | Admin API |
| `app/api/v1/endpoints/partner_settlements.py` | Partner API |
| `app/tasks/settlements.py` | Celery task |

### Frontend

| Path | Role |
|------|------|
| `services/settlements.ts` | API client |
| `features/admin/settlements/*` | Dashboard, analytics, table, drawer, audit |
| `features/admin/views/admin-settlements-view.tsx` | Admin page |
| `features/partner/views/partner-settlements-view.tsx` | Partner page |

---

## Operations runbook

### Create settlements

1. Admin → Settlements → **Run settlement batch**
2. Or `POST /api/v1/admin/settlements/run`

### Approve and pay out

1. Review pending settlement
2. **Approve** → **Mark processing** → **Release payout** (enter bank/UPI reference)
3. Orders move to `settled` eligibility on payout release

### Hold settlement

Use **Hold** when fraud review or missing KYC blocks payout. **Release hold** restores prior status.

### Reject settlement

**Reject** releases all linked orders back to `eligible` for re-batching.

---

## Production checklist

- [x] 48-hour dispute window enforced
- [x] Open dispute hold
- [x] Commission snapshotted from order
- [x] Refund deduction on refunded orders
- [x] Status machine with audit trail
- [x] On hold / release hold
- [x] Admin dashboard + analytics + audit log
- [x] Partner pending / available / released earnings
- [x] CSV / Excel / PDF export
- [x] Hourly Celery automation
- [ ] Live Razorpay payout API integration (future)
- [ ] Email notification to partner on payout release (future)

---

## Testing

```bash
cd backend && python -m alembic upgrade head

# Scan + create
python -c "
import asyncio
from app.db.session import AsyncSessionLocal
from app.services.settlement_service import SettlementService
async def main():
    async with AsyncSessionLocal() as s:
        svc = SettlementService(s)
        print(await svc.scan_eligibility())
        print(await svc.create_settlements_from_eligible())
        await s.commit()
asyncio.run(main())
"

# API
GET  /api/v1/admin/settlements/dashboard
GET  /api/v1/admin/settlements/analytics
GET  /api/v1/admin/settlements/audit
POST /api/v1/admin/settlements/run
```

**Note:** Orders delivered within the last 48 hours remain in `pending_window` until the dispute window expires.
