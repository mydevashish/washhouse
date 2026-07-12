# Ownership & Profit Sharing Engine

> Platform-level profit allocation for ownership partners  
> Last updated: 2026-06-03

## Overview

The Profit Sharing Engine distributes **platform profit** among **ownership partners** based on configured ownership percentages. It is separate from laundry partner settlements — this tracks investors/platform co-owners, not laundry operators.

```
Admin → /admin/profit-sharing
        ├── Overview (Revenue, Expenses, Profit, Payout totals)
        ├── Ownership partners (must total 100%)
        ├── Platform expenses (by month)
        └── Payouts (pending + history)

Platform Partner → /platform-partner/earnings
        ├── Ownership % and earnings KPIs
        ├── Pending payouts
        └── Payout history
```

---

## Ownership partners

| Field | Description |
|-------|-------------|
| **Name** | Display name of the platform partner |
| **Ownership %** | Share of profit (0.01–100.00) |
| **User link** | Optional `users.id` with `platform_partner` role for earnings portal |
| **Active** | Only active partners participate in profit share |

### Rule: total ownership = 100%

Active partners' ownership percentages **must sum to exactly 100%** before a period can be finalized. Create/update operations validate this constraint.

---

## Profit calculation

Monthly profit is computed at **finalize** time:

| Metric | Formula |
|--------|---------|
| **Revenue** | Sum of platform commission on delivered orders in the calendar month: `total_inr × commission_rate / 100` where `delivered_at` falls in the month |
| **Expenses** | Sum of `platform_expenses.amount_inr` for the same year/month |
| **Profit** | `Revenue − Expenses` |

Negative profit is allowed (losses are allocated proportionally).

---

## Partner earnings

For each active ownership partner at finalize:

```
Partner Earnings = Profit × (Ownership % / 100)
```

Rounded to 2 decimal places (INR paise). Ownership % and partner name are **snapshotted** on the allocation record.

---

## Payout tracking

| Status | Meaning |
|--------|---------|
| **Pending** | Period finalized; earnings allocated but not yet paid |
| **Paid** | Admin marked payout complete with payment reference |

Admin records payment reference (UTR, bank ref, etc.) when marking paid. All payout actions are audit-logged.

### Aggregates

- **Pending payouts** — sum of pending allocation earnings (all partners)
- **Paid payouts** — sum of paid allocation earnings (lifetime)
- **Payout history** — paid allocations ordered by `paid_at` desc

---

## Platform expenses

Admins record expenses by month and category:

| Category | Use |
|----------|-----|
| `operations` | Day-to-day ops |
| `marketing` | Campaigns, ads |
| `technology` | Infra, software |
| `personnel` | Salaries, contractors |
| `other` | Miscellaneous |

Expenses cannot be added or deleted after a period is **finalized**.

---

## Period lifecycle

```
Month in progress
        ↓
Admin records expenses
        ↓
Admin clicks "Finalize & allocate earnings"
        ↓
Revenue + expenses + profit calculated
        ↓
Allocation per partner (payout_status = pending)
        ↓
Admin marks each payout paid (with reference)
```

Each `(year, month)` pair can only be finalized once.

---

## API

### Admin (`admin`, `super_admin`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/profit-sharing/overview` | Dashboard summary |
| GET | `/api/v1/admin/profit-sharing/partners` | List ownership partners |
| POST | `/api/v1/admin/profit-sharing/partners` | Create partner |
| PATCH | `/api/v1/admin/profit-sharing/partners/{id}` | Update partner |
| DELETE | `/api/v1/admin/profit-sharing/partners/{id}` | Deactivate partner |
| GET | `/api/v1/admin/profit-sharing/expenses?year=&month=` | List expenses |
| POST | `/api/v1/admin/profit-sharing/expenses` | Record expense |
| DELETE | `/api/v1/admin/profit-sharing/expenses/{id}` | Delete expense |
| GET | `/api/v1/admin/profit-sharing/periods/preview?year=&month=` | Preview revenue/expenses/profit |
| GET | `/api/v1/admin/profit-sharing/periods` | Finalized periods + allocations |
| POST | `/api/v1/admin/profit-sharing/periods/finalize` | Finalize month |
| GET | `/api/v1/admin/profit-sharing/payouts/pending` | Pending allocations |
| GET | `/api/v1/admin/profit-sharing/payouts/history` | Paid allocations |
| POST | `/api/v1/admin/profit-sharing/payouts/{id}/mark-paid` | Mark payout paid |

### Platform partner (`platform_partner`, admin preview)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/platform-partner/profit-sharing/summary` | Own earnings, pending, history |

Requires ownership partner record linked via `user_id`.

---

## Database

| Table | Purpose |
|-------|---------|
| `platform_ownership_partners` | Name, ownership %, user link |
| `platform_expenses` | Monthly expense line items |
| `profit_share_periods` | Finalized month snapshots |
| `profit_share_allocations` | Per-partner earnings + payout status |

Migration: `20260603_0028_profit_sharing_engine.py`

```bash
cd backend && python -m alembic upgrade head
```

---

## Audit actions

| Action | When |
|--------|------|
| `ownership_partner_created` | Partner added |
| `ownership_partner_updated` | Partner updated |
| `ownership_partner_deactivated` | Partner deactivated |
| `platform_expense_recorded` | Expense added |
| `platform_expense_deleted` | Expense removed |
| `profit_share_finalized` | Period finalized |
| `profit_share_payout_released` | Payout marked paid |

---

## Frontend

| Path | Component |
|------|-----------|
| `/admin/profit-sharing` | `AdminProfitSharingView` |
| `/platform-partner/earnings` | `PlatformPartnerEarningsView` |
| `frontend/services/profit-sharing.ts` | API client |

Nav: **Admin → Finance → Profit sharing**

---

## File map

| Area | Path |
|------|------|
| Models | `backend/app/models/profit_sharing.py` |
| Enums | `backend/app/models/enums.py` |
| Repository | `backend/app/repositories/profit_sharing.py` |
| Service | `backend/app/services/profit_sharing_service.py` |
| Schemas | `backend/app/schemas/profit_sharing.py` |
| Admin API | `backend/app/api/v1/endpoints/admin_profit_sharing.py` |
| Partner API | `backend/app/api/v1/endpoints/platform_partner_profit_sharing.py` |
| Admin UI | `frontend/features/admin/views/admin-profit-sharing-view.tsx` |
| Partner UI | `frontend/features/platform-partner/views/platform-partner-earnings-view.tsx` |

---

## Test plan

1. Run migration `20260603_0028`.
2. Admin → Profit sharing → add 3 partners totaling **100%** (e.g. 50, 30, 20).
3. Confirm ownership validation rejects totals ≠ 100%.
4. Record expenses for current month.
5. Overview shows Revenue, Expenses, Profit and projected earnings.
6. **Finalize & allocate** → allocations created with `pending` status.
7. Confirm expenses cannot be added/deleted for finalized month.
8. Mark payout paid with reference → status becomes `paid`.
9. Log in as linked `platform_partner` → `/platform-partner/earnings` shows pending + history.
10. Unlinked platform partner user sees "Account not linked" banner.
11. Verify audit log entries for finalize and payout actions.

---

## Related docs

- [PLATFORM_PARTNER_DASHBOARD_V1.md](./PLATFORM_PARTNER_DASHBOARD_V1.md) — read-only marketplace dashboard
- [SETTLEMENT_MANAGEMENT.md](./SETTLEMENT_MANAGEMENT.md) — laundry partner settlements (separate system)
- [docs/business/commission-model.md](./docs/business/commission-model.md) — commission basis for revenue

---

## Explicit scope

- **In scope:** Ownership registry, monthly profit calc, proportional allocation, manual payout tracking
- **Out of scope (future):** Automated bank/UPI disbursement, tax withholding, multi-currency, partner self-service expense submission
