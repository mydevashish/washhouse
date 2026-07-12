# Test Data Audit — DLM Platform

**Audit date:** 2026-06-03  
**Database:** Local PostgreSQL (`dlm_db`)  
**Method:** Direct SQL counts + seed file inventory + post-seed verification

---

## Seed file inventory

| Source | Path | What it creates | Auto on startup? |
| ------ | ---- | --------------- | ---------------- |
| Admin seed | `backend/app/db/seed_admin.py` | 1 admin (`SEED_ADMIN_EMAIL`) | ✅ Yes |
| Demo seed | `backend/app/db/seed_demo.py` | 3 partners, 3 laundries, 1 customer | ✅ Yes (`AUTO_SEED_DEMO`) |
| Storefront seed | `backend/app/db/seed_storefront.py` | 1 rich storefront (Koramangala) | ✅ Yes |
| Dev seed script | `backend/scripts/seed.py` | Admin + calls demo seed | Manual |
| Marketplace seed | `scripts/seed_marketplace.py` | 1 laundry + subscription plans | Manual |
| **QA seed** | `backend/scripts/seed_qa.py` | Full QA dataset | **Manual** (`python scripts/seed_qa.py`) |
| Pytest fixtures | `backend/tests/conftest.py` | Empty schema per test | Tests only |
| Frontend mocks | `nav-notifications.store.ts`, perf mocks | UI-only fake data | Not in DB |

---

## BEFORE QA seed (investigation result)

| Entity | Count | Notes |
| ------ | ----- | ----- |
| Users (total) | 5 | 1 admin, 3 partners, 1 customer |
| Customers | 1 | `customer@demo.dlm` |
| Partners | 3 | koramangala, indiranagar, hsr |
| Admins | 1 | `admin@yopmail.com` (from config) |
| Laundries | 3 | All approved demo laundries |
| Orders | **0** | None |
| Reviews | **0** | Laundry `review_count` was fake/static on model |
| Disputes | **0** | None |
| Refunded orders | **0** | None |
| Trust score events | **0** | None |
| Fraud alerts | **0** | None |
| Audit logs | 53 | From auth activity only |
| Notifications | **0** | None |
| Pickup evidence | **0** | None |
| Delivery proof | **0** | None |
| Chain of custody events | **0** | None |
| Subscription plans | 0–3 | Depends if `seed_marketplace.py` was run |

**Verdict before seed:** Insufficient for QA — only auth + browse worked; no order/dispute/fraud testing possible.

---

## AFTER QA seed (current state)

Run: `python backend/scripts/seed_qa.py`  
Verify: `python backend/scripts/qa_counts.py`

| Entity | Count | Target | Status |
| ------ | ----- | ------ | ------ |
| Users (total) | 122 | 121+ | ✅ |
| Customers | 100 | 100 | ✅ |
| Partners | 20 | 20 | ✅ |
| Admins | 2 | 1+ | ✅ (`admin@yopmail.com` + `admin@demo.dlm`) |
| Laundries | 16 | 15+ | ✅ (includes multi-branch) |
| — Approved | 14 | — | ✅ |
| — Pending approval | 1 | Inactive partner scenario | ✅ |
| — Suspended | 1 | Inactive partner scenario | ✅ |
| Orders | 2000 | 2000 | ✅ |
| Reviews | 50 | 50 | ✅ |
| Disputes | 20 | 20 | ✅ |
| Refunded orders | 30 | 30 | ✅ |
| Failed payments (orders) | 48 | — | ✅ |
| Trust score events | 5 | — | ✅ (special accounts) |
| Fraud alerts | 3 | — | ✅ |
| Audit logs | 153 | 100+ | ✅ |
| Notifications | 150 | — | ✅ |

### Orders by status

| Status | Count |
| ------ | ----- |
| delivered | 1152 |
| confirmed | 162 |
| pickup_assigned | 127 |
| out_for_delivery | 105 |
| picked_up | 105 |
| cancelled | 96 |
| ready | 92 |
| washing | 86 |
| ironing | 75 |

### Payments by status

| Status | Count |
| ------ | ----- |
| paid | 1369 |
| pending | 289 |
| pending_cod | 264 |
| failed | 48 |
| refunded | 30 |

### Disputes by status

| Status | Count |
| ------ | ----- |
| open | 5 |
| investigating | 5 |
| resolved | 1 |
| rejected | 5 |
| escalated | 4 |

---

## Scenario coverage matrix

| Persona | Exists? | Account / how to find |
| ------- | ------- | --------------------- |
| New customer | ✅ | Register or `customer99.*@demo.dlm` (few orders) |
| Returning customer | ✅ | `customer@demo.dlm` |
| VIP customer | ✅ | `vip@demo.dlm` (trust 92) |
| High risk customer | ✅ | `highrisk@demo.dlm` (trust 38, fraud critical) |
| Blocked customer | ✅ | `blocked@demo.dlm` (trust 0, fraud critical) |
| Partner | ✅ | `partner.koramangala@demo.dlm` |
| Multi-branch partner | ✅ | Same owner → 2 laundries (Koramangala + Branch 2) |
| Inactive partner | ✅ | `qa-laundry-15` suspended OR pending laundry |
| Admin | ✅ | `admin@demo.dlm` or `admin@yopmail.com` |

| Order scenario | Covered? | Count |
| -------------- | -------- | ----- |
| All lifecycle statuses | ✅ | See table above |
| Refunded | ✅ | 30 |
| Disputed | ✅ | 20 complaints linked to orders |
| Failed payment | ✅ | 48 |

| Fraud scenario | Covered? | How |
| ---------------- | -------- | --- |
| Fake damage claim | ⚠️ | Disputes with `damaged_item` type exist; no photos on seed disputes |
| Missing item claim | ⚠️ | Dispute types seeded; file new dispute for E2E |
| Refund abuse | ✅ | `blocked@demo.dlm` + refunded orders |
| High risk customer | ✅ | `highrisk@demo.dlm` |
| Partner complaints | ✅ | Fraud alert on HSR partner |
| Chargeback | ✅ | Trust event on blocked customer |

---

## Still missing in database (see MISSING_TEST_DATA.md)

- Pickup evidence photos on seeded orders
- Delivery proof photos + OTP records
- Full chain of custody events (only status events seeded)
- Inventory verification records
- Dispute photo attachments
- Partial refund payment state (only full refunded)
- Customer UI for subscriptions

---

## How to reset / re-seed

```bash
# Full QA dataset (idempotent — skips if already run)
cd backend
python scripts/seed_qa.py

# Force re-seed (clears marker only — does NOT delete existing rows)
python scripts/seed_qa.py --force

# Minimal dev seed only
python scripts/seed.py
```

To fully reset: drop database, `alembic upgrade head`, run `seed.py` then `seed_qa.py`.
