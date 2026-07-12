# Missing Test Data — DLM Platform

**Date:** 2026-06-03  
**Context:** Gaps remaining after QA seed (`seed_qa.py`) and codebase investigation.

---

## Critical gaps (blocks E2E workflow testing)

| Gap | Impact | Workaround |
| --- | ------ | ---------- |
| **No pickup evidence on seeded orders** | Cannot test partner pickup photo flow on existing orders | Create new order; progress through pickup manually |
| **No delivery proof / OTP on seeded orders** | Cannot test delivery completion on bulk orders | Use new order through full lifecycle |
| **No inventory verification records** | Inventory admin/partner flows empty for seeded orders | Record inventory on new order |
| **No chain of custody events** (only status events) | Customer timeline missing custody detail for seeded orders | Complete new order through milestones |
| **Disputes without photos** | Admin evidence bundle missing photo gallery for seed disputes | File new dispute with photos via UI |

---

## Feature gaps (UI or backend not connected)

| Gap | Impact |
| --- | ------ |
| Forgot / reset password UI | Cannot test password recovery E2E |
| Partner notifications (real) | `/partner/notifications` shows stub data |
| Admin notifications (real) | Derived from dashboard counts, not `notifications` table |
| Loyalty points accrual | Points stay 0 after orders |
| Subscription customer UI | Plans may exist in DB; no browse/subscribe page |
| Partner payout / settlement | No financial settlement data |
| Export (CSV/PDF) on admin lists | Cannot test export features |
| Partial refund payment state | Only `refunded` (full) exists |

---

## Persona gaps

| Persona | Status | Notes |
| ------- | ------ | ----- |
| New customer | ✅ Can register | Or use low-order-count QA emails |
| VIP customer | ✅ vip@demo.dlm | |
| High risk customer | ✅ highrisk@demo.dlm | |
| Blocked customer | ⚠️ Simulated | No hard block at login/API |
| Multi-branch partner | ✅ | Koramangala + Branch 2 |
| Inactive partner | ✅ | Suspended + pending laundries |
| Super admin | ❌ | No dedicated account (use admin) |
| Delivery agent role | ❌ | Role exists in enum; no separate UI |

---

## Payment scenario gaps

| Scenario | Seeded? | Count |
| -------- | ------- | ----- |
| Successful (paid) | ✅ | 1369 |
| Failed | ✅ | 48 |
| Refunded (full) | ✅ | 30 |
| Partial refund | ❌ | 0 |
| Pending | ✅ | 289 |
| Pending COD | ✅ | 264 |
| Chargeback (payment) | ❌ | Trust event only on blocked user |

---

## Fraud scenario gaps

| Scenario | Seeded? | Notes |
| -------- | ------- | ----- |
| Fake damage claim | ⚠️ | Dispute types exist; no photos |
| Missing item claim | ⚠️ | Same |
| Fake non-delivery | ❌ | Needs delivered order without proof — create live |
| Refund abuse | ✅ | blocked@demo.dlm + 30 refunds |
| Partner complaint spike | ✅ | Fraud alert on HSR partner |
| Delivery GPS fraud | ❌ | Needs delivery with GPS mismatch — create live |

---

## Recommended next seed enhancements

1. **E2E trail orders (10–20)** — Full lifecycle with pickup photos, inventory, custody, delivery proof, OTP, review
2. **Dispute attachments** — Seed `complaint_photos` for 5 disputes
3. **Partial refund** — Add payment state or metadata if product supports
4. **Subscription UI seed** — When customer UI exists
5. **super_admin@demo.dlm** — If super_admin permissions differ

---

## How to fill gaps manually

```text
1. Login customer@demo.dlm
2. Discover → Quick Wash Koramangala → Checkout → Place order
3. Login partner.koramangala@demo.dlm
4. Accept → Upload pickup photos → Record inventory
5. Progress status → Upload delivery proof → Enter OTP
6. Login customer → File dispute with photos
7. Login admin@demo.dlm → Review dispute with full evidence
```

This creates the **gold path** test data that bulk seed intentionally skips.
