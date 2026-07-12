# Fraud Detection Engine

Production-ready automated fraud and abuse detection for DLM admins. The engine evaluates **customers** and **partners (laundries)** against rule-based signals, assigns a **risk level**, and **generates alerts** for admin review.

## Overview

Unlike trust scores (behavioural reputation), fraud detection focuses on **actionable abuse patterns**. When a rule fires, an alert is created in `fraud_alerts` and the subject's `fraud_risk_level` is updated on `users` or `laundries`.

Alerts deduplicate: the same signal for the same subject will not create a new open alert within **7 days**.

## Risk levels

| Level | Meaning |
| ----- | ------- |
| Low | No active fraud signals |
| Medium | One moderate signal — monitor |
| High | Serious signal or multiple moderate signals |
| Critical | Severe abuse pattern — immediate review |

Overall risk = **maximum severity** across all active signals (mapped 0→Low, 1→Medium, 2→High, 3→Critical).

## Customer signals

Evaluated over a **30-day rolling window** unless noted.

| Signal | Rule | Risk |
| ------ | ---- | ---- |
| Dispute spike | >3 disputes in 30 days | Medium (4–5), High (6), Critical (7+) |
| High refund rate | >15% of completed orders refunded | Medium (>15%), High (>25%), **Critical (>40%)** |
| Payment failures | ≥3 failed payments in 30 days | Medium (3–4), High (5+) |
| Frequent cancellations | ≥3 cancelled orders in 30 days | Medium (3–4), High (5+) |

Refund rate = `refunded delivered orders / total delivered orders`.

Payment failures sourced from `customer_trust_score_events` (`failed_payment`) and orders with `payment_status = failed`.

## Partner signals

| Signal | Rule | Risk |
| ------ | ---- | ---- |
| Excessive complaints | ≥5 complaints in 30d OR rate >10% of completed | Medium → Critical by volume/rate |
| Inventory mismatches | ≥2 records where `received_count < expected_count` or missing/damaged notes in 30d | Medium (2–4), High (5+) |
| Delivery fraud patterns | OTP/proof GPS >500m from delivery address, or missing GPS when address has coordinates | High (1–2 incidents), Critical (3+ in 30d) |

Delivery fraud uses haversine distance (`app/core/geo.py`) comparing:
- Customer address coordinates
- OTP verification GPS (`order_delivery_otps`)
- Delivery proof GPS (`delivery_proof_photos`)

## Database

**Columns:**
- `users.fraud_risk_level` — enum, default `low`
- `laundries.fraud_risk_level` — enum, default `low`

**Table:** `fraud_alerts`

```sql
CREATE TYPE fraud_risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE fraud_subject_type AS ENUM ('customer', 'partner');
CREATE TYPE fraud_signal_type AS ENUM (
  'customer_dispute_spike', 'customer_refund_rate',
  'customer_payment_failures', 'customer_cancellations',
  'partner_excessive_complaints', 'partner_inventory_mismatch',
  'partner_delivery_fraud'
);
CREATE TYPE fraud_alert_status AS ENUM ('open', 'acknowledged', 'resolved');

CREATE TABLE fraud_alerts (
  id UUID PRIMARY KEY,
  subject_type fraud_subject_type NOT NULL,
  subject_id UUID NOT NULL,
  signal_type fraud_signal_type NOT NULL,
  risk_level fraud_risk_level NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status fraud_alert_status NOT NULL DEFAULT 'open',
  reference_type VARCHAR(40),
  reference_id UUID,
  metadata JSONB,
  acknowledged_by_user_id UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by_user_id UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration:** `backend/alembic/versions/20260603_0014_fraud_detection.py`

## API (admin only)

Base path: `/api/v1/admin/fraud`

| Endpoint | Description |
| -------- | ----------- |
| `GET /alerts` | List alerts (`status`, `risk_level`, `subject_type` filters) |
| `GET /alerts/{id}` | Alert detail |
| `POST /alerts/{id}/acknowledge` | Mark acknowledged |
| `POST /alerts/{id}/resolve` | Mark resolved |
| `GET /summary` | Open alert counts by risk level |
| `POST /evaluate/customer/{user_id}` | Manual re-evaluation |
| `POST /evaluate/partner/{laundry_id}` | Manual re-evaluation |

### Alert response

```json
{
  "id": "uuid",
  "subject_type": "customer",
  "subject_id": "uuid",
  "subject_name": "Priya Sharma",
  "signal_type": "customer_dispute_spike",
  "signal_label": "Dispute spike",
  "risk_level": "high",
  "risk_label": "High",
  "title": "Customer risk: Priya Sharma — Dispute spike",
  "description": "5 disputes in the last 30 days (threshold: >3)",
  "status": "open",
  "metadata": { "disputes_30d": 5 },
  "created_at": "2026-06-03T12:00:00Z"
}
```

## Evaluation triggers

| Event | Hook location |
| ----- | ------------- |
| Dispute filed | `ComplaintService.create_dispute` |
| Dispute status updated | `ComplaintService.update_status_admin` |
| Payment failed (webhook) | `payments` Razorpay handler |
| Order cancelled | `OrderService.update_status_partner` |
| Delivery completed | `DeliveryOtpService.verify_and_complete_delivery` |
| Inventory mismatch | `PartnerService.update_inventory` |

## Frontend

| Surface | Location |
| ------- | -------- |
| Admin fraud center | `/admin/fraud` — alert list, risk summary cards, acknowledge/resolve |

### Key files

- `backend/app/services/fraud_detection_service.py`
- `backend/app/repositories/fraud_detection.py`
- `backend/app/api/v1/endpoints/fraud_detection.py`
- `frontend/services/fraud-detection.ts`
- `frontend/features/admin/admin-fraud-detection-panel.tsx`

## Visibility

| Audience | Can see |
| -------- | ------- |
| Customer | No |
| Partner | No |
| Admin | All alerts and risk levels |

## Related systems

- **Customer Trust Score** (`CUSTOMER_TRUST_SCORE.md`) — complementary reputation scoring
- **Partner Trust Score** (`PARTNER_TRUST_SCORE.md`) — operational reliability
- **Dispute Center** (`DISPUTE_CENTER.md`) — feeds dispute spike signal
- **Delivery Proof** (`DELIVERY_PROOF.md`) — GPS evidence for delivery fraud detection

## Future enhancements

- Celery scheduled batch re-evaluation (nightly sweep)
- Auto-block checkout for Critical customers
- Partner payout hold on Critical partner alerts
- Email/Slack notification on Critical alerts
