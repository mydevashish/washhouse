# Fraud Protection Report — DLM Platform

**Date:** 2026-06-03  
**Fraud protection score: 78/100**

---

## Systems inventory

| System | Status | Doc |
| ------ | ------ | --- |
| Pickup evidence photos | ✅ Immutable | `DELIVERY_PROOF.md` / pickup service |
| Inventory verification + lock | ✅ Customer confirm locks | Inventory service |
| Delivery OTP | ✅ Required for complete | `delivery_otp_service.py` |
| Delivery proof photo | ✅ Gates OTP verify | One per order, append-only |
| Chain of custody | ✅ Auto events | `CHAIN_OF_CUSTODY.md` |
| Dispute center | ✅ Photos + admin evidence bundle | `DISPUTE_CENTER.md` |
| Customer trust score | ✅ Event ledger | `CUSTOMER_TRUST_SCORE.md` |
| Partner trust score | ✅ Metric-based | `PARTNER_TRUST_SCORE.md` |
| Fraud detection engine | ✅ Rules + alerts | `FRAUD_DETECTION_ENGINE.md` |

---

## Evidence chain per order

| Artifact | Stored | Immutable | GPS |
| -------- | ------ | --------- | --- |
| Pickup photos | ✅ | ✅ No update/delete routes | ✅ In metadata |
| Pickup timestamp | ✅ custody + evidence | ✅ | ✅ |
| Inventory confirmation | ✅ locked status | ✅ after lock | — |
| Processing events | ✅ order_status + custody | ✅ append-only | — |
| Delivery OTP | ✅ | ✅ verified state terminal | ✅ verification lat/lng |
| Delivery photo | ✅ | ✅ | ✅ |
| Delivery timestamp | ✅ status event + custody | ✅ | ✅ |

**Gap:** Pickup GPS depends on client submission — not validated against address.

---

## Fraud scenario testing

| Scenario | Detection | Recording | Gap |
| -------- | --------- | --------- | --- |
| **1. Missing item claim** | Dispute + inventory records | Complaint + custody + inventory | Customer must file dispute; no auto-compare inventory vs delivery |
| **2. Fake damage claim** | Dispute + trust/fraud signals | Photos + timeline | Admin manual review; no ML |
| **3. Fake non-delivery** | Delivery proof + OTP + GPS fraud rule | Full chain | Strong if proof+GPS present; weak if address has no coordinates |
| **4. Refund abuse** | Customer trust −15; fraud refund rate | Events + alerts | Refund webhook must fire; payment.captured missing |
| **5. Partner price manipulation** | **Not detected** | Order locks line prices at create | Post-order price change on service catalog doesn't affect past orders — OK |
| **6. Inventory tampering** | Mismatch count + fraud signal | order_inventory + change requests | Partner can update before pickup complete — expected |

---

## Customer fraud rules (engine)

| Rule | Threshold | Risk |
| ---- | --------- | ---- |
| Dispute spike | &gt;3 in 30 days | Medium→Critical |
| Refund rate | &gt;40% | Critical |
| Payment failures | ≥3 in 30 days | Medium |
| Cancellations | ≥3 in 30 days | Medium |

**Hooks:** dispute filed, payment failed webhook, order cancelled.

---

## Partner fraud rules

| Rule | Threshold | Risk |
| ---- | --------- | ---- |
| Excessive complaints | ≥5 or &gt;10% rate | Medium→Critical |
| Inventory mismatch | ≥2 in 30 days | Medium |
| Delivery fraud GPS | &gt;500m from address | High |

**Hooks:** delivery complete, inventory update, dispute filed.

---

## Trust scores vs fraud engine

| | Trust score | Fraud engine |
| -- | ----------- | -------------- |
| Audience | Admin (customer); Partner+Admin (laundry) | Admin alerts |
| Model | Events (customer) / metrics (partner) | Rule thresholds |
| Auto-action | None | None — alerts only |

**Recommendation:** Link Critical fraud → block checkout or hold payout.

---

## Immutability verification

Code review: **no** `router.patch` / `router.delete` on:
- `pickup_evidence.py`
- `delivery_proof.py`
- `custody_timeline` events
- `customer_trust_score_events`

Complaints allow **status** updates (expected for workflow).

---

## Gaps & recommendations

1. **Auto-block** Critical customers at checkout (not implemented)
2. **Partner payout hold** on Critical partner fraud (not implemented)
3. **Nightly fraud sweep** — Celery job to re-evaluate all active users
4. **Chargeback** → fraud engine hook (trust score only today)
5. **Image hash** dedup to detect recycled fraud photos
6. **Device fingerprint** on dispute filing

---

## Production fraud readiness

Strong **evidence collection** and **admin investigation** tooling. Weak **automated enforcement** and **financial controls**. Suitable for pilot with manual admin oversight; not for unattended scale.
