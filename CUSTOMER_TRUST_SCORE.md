# Customer Trust Score System

Production-ready internal customer risk scoring for DLM admins. Scores are **not visible to customers**.

## Overview

Every customer starts at **100 points**. An append-only event ledger adjusts the score based on behaviour. The current score maps to a trust **level** used for admin triage.

## Levels

| Level | Score range | Label |
| ----- | ----------- | ----- |
| Gold | 85–100 | Low risk, trusted customer |
| Silver | 70–84 | Normal standing |
| Bronze | 50–69 | Elevated caution |
| High Risk | 0–49 | Manual review recommended |

## Score adjustments

| Event | Delta | Trigger |
| ----- | ----- | ------- |
| Refund request dispute | −15 | Dispute filed with type `refund_request` |
| Dispute filed | −10 | Any dispute created |
| Chargeback | −30 | Razorpay dispute webhook |
| Failed payment | −5 | Razorpay `payment.failed` webhook |
| Fake claim | −25 | Admin rejects dispute |
| Successful order | +2 | Order delivered (OTP verified) |
| Positive review | +3 | Review rating ≥ 4 |
| Long history | +5 | Account ≥ 90 days AND ≥ 5 delivered orders (once) |

Score is clamped to **0–100**. Each event is idempotent per `(user_id, event_type, reference_id)`.

## Database

**Column:** `users.trust_score` — integer, default `100`

**Table:** `customer_trust_score_events`

```sql
CREATE TYPE trust_score_event_type AS ENUM (
  'refund_request', 'dispute_filed', 'chargeback', 'failed_payment',
  'fake_claim', 'successful_order', 'positive_review', 'long_history'
);

CREATE TABLE customer_trust_score_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type trust_score_event_type NOT NULL,
  delta INTEGER NOT NULL,
  score_before INTEGER NOT NULL,
  score_after INTEGER NOT NULL,
  reference_type VARCHAR(40),
  reference_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Migration:** `backend/alembic/versions/20260603_0012_customer_trust_score.py`

## API (admin only)

Base path: `/api/v1`

| Endpoint | Description |
| -------- | ----------- |
| `GET /admin/trust-scores` | List customers sorted by score (ascending) |
| `GET /admin/trust-scores/{user_id}` | Detail with full event history |

### Response summary

```json
{
  "user_id": "uuid",
  "full_name": "Priya Sharma",
  "email": "priya@example.com",
  "trust_score": 78,
  "level": "silver",
  "level_label": "Silver",
  "delivered_orders": 12,
  "dispute_count": 1,
  "created_at": "2026-01-15T..."
}
```

## Automatic hooks

| Service | Event |
| ------- | ----- |
| `ComplaintService.create_dispute` | `dispute_filed` (+ `refund_request` if applicable) |
| `ComplaintService.update_status_admin` (rejected) | `fake_claim` |
| `DeliveryOtpService.verify_and_complete_delivery` | `successful_order` + long history check |
| `ReviewService.create` (rating ≥ 4) | `positive_review` |
| `payments` Razorpay webhook | `failed_payment`, `chargeback` |

## Frontend (admin only)

| Surface | Route |
| ------- | ----- |
| Trust scores panel | `/admin/trust-scores` |

**Components:** `AdminTrustScoresPanel`, `TrustScoreBadge`

**Service:** `frontend/services/trust-score.ts`

Customers do **not** see trust score in the app UI.

## Security

- Admin JWT required on all trust score endpoints
- Immutable event ledger — no delete/update APIs
- Score changes auditable via `customer_trust_score_events`

## Local development

```bash
cd backend
alembic upgrade head
uvicorn app.main:app --reload
```

## Tests

```bash
cd backend
pytest tests/api/test_trust_scores.py -v
```

## Related docs

- [DISPUTE_CENTER.md](./DISPUTE_CENTER.md) — dispute filing affects score
- [DELIVERY_OTP.md](./DELIVERY_OTP.md) — delivery completion awards points

## Future enhancements (out of scope)

- Auto-flag High Risk customers at checkout
- Partner-visible trust tier (never full score)
- Admin manual score adjustment UI
- ML-based fraud scoring overlay
