# Laundry Trust Score (Partner Trust Score)

Production-ready partner reliability scoring for DLM. Scores are **visible to partners** on their dashboard and to **admins** for oversight.

## Overview

Each laundry partner receives a **Laundry Trust Score** from **0–100**, computed from operational metrics. Unlike the customer trust score (event-based ledger), the partner score is **recalculated from live metrics** whenever relevant order, dispute, review, or refund activity occurs.

New partners with no completed orders start at **70** (Trusted baseline).

## Levels

| Level | Score range | Label |
| ----- | ----------- | ----- |
| Premium | 85–100 | Top-performing partner |
| Trusted | 70–84 | Good standing |
| Verified | 50–69 | Meets minimum bar |
| Under Review | 0–49 | Needs improvement / admin attention |

## Metrics

All rates are expressed **per 100 completed (delivered) orders**, except on-time delivery (% of completed orders) and customer rating (1–5 stars).

| Metric | Source | Description |
| ------ | ------ | ----------- |
| On-time delivery | `orders` + `order_status_events` | % delivered on or before scheduled `delivery_at` |
| Complaint rate | `complaints` → `orders.laundry_id` | All disputes filed against the laundry |
| Refund rate | `orders.payment_status = refunded` | Refunded completed orders |
| Dispute rate | Active complaints (`open`, `investigating`, `escalated`) | Open dispute load |
| Customer rating | `laundries.avg_rating` / `review_count` | Average star rating |
| Completed orders | `orders.status = delivered` | Volume signal |

## Score formula

Each metric maps to a sub-score (0–100). Rates that should be low are inverted (higher raw rate → lower sub-score).

| Sub-score | Weight | Calculation |
| --------- | ------ | ----------- |
| On-time delivery | 25% | On-time % (0–100) |
| Complaint rate | 20% | `max(0, 100 − complaint_rate × 10)` |
| Refund rate | 15% | `max(0, 100 − refund_rate × 20)` |
| Dispute rate | 10% | `max(0, 100 − dispute_rate × 25)` |
| Customer rating | 20% | `(avg_rating / 5) × 100`, or 70 if no reviews |
| Completed orders | 10% | `min(100, completed × 2)` |

**Final score** = weighted sum, rounded and clamped to 0–100.

If `completed_orders = 0`, score defaults to **70**.

## Database

**Column:** `laundries.trust_score` — integer, default `70`

**Migration:** `backend/alembic/versions/20260603_0013_laundry_trust_score.py`

No event ledger table — score is derived from operational data and persisted on `laundries.trust_score` for fast reads.

## API

Base path: `/api/v1`

### Partner

| Endpoint | Auth | Description |
| -------- | ---- | ----------- |
| `GET /partner/trust-score` | Partner JWT | Current laundry score, level, and metrics |

### Admin

| Endpoint | Auth | Description |
| -------- | ---- | ----------- |
| `GET /admin/laundry-trust-scores` | Admin JWT | List all laundries sorted by score (ascending) |
| `GET /admin/laundry-trust-scores/{laundry_id}` | Admin JWT | Detail with metric breakdown |

### Response summary

```json
{
  "laundry_id": "uuid",
  "laundry_name": "Sparkle Wash",
  "city": "Bangalore",
  "owner_name": "Raj Kumar",
  "trust_score": 82,
  "level": "trusted",
  "level_label": "Trusted",
  "metrics": {
    "on_time_delivery_pct": 94.5,
    "complaint_rate_pct": 1.2,
    "refund_rate_pct": 0.5,
    "dispute_rate_pct": 0.8,
    "avg_rating": 4.6,
    "review_count": 48,
    "completed_orders": 120
  },
  "calculated_at": "2026-06-03T12:00:00Z"
}
```

## Recalculation triggers

| Event | Service |
| ----- | ------- |
| Order delivered (OTP verified) | `DeliveryOtpService` |
| Dispute filed | `ComplaintService.create_dispute` |
| Dispute status updated | `ComplaintService.update_status_admin` |
| Review submitted | `ReviewService.create` |
| Razorpay `refund.processed` webhook | `payments` webhook handler |

## Frontend

| Surface | Location |
| ------- | -------- |
| Partner dashboard | `LaundryTrustScoreCard` on `/partner` overview |
| Admin dashboard | **Partner trust** tab on `/admin/trust-scores` |

### Key files

- `backend/app/services/laundry_trust_score_service.py`
- `backend/app/repositories/laundry_trust_score.py`
- `backend/app/api/v1/endpoints/laundry_trust_scores.py`
- `frontend/services/laundry-trust-score.ts`
- `frontend/features/partner/components/laundry-trust-score-card.tsx`
- `frontend/features/admin/admin-laundry-trust-scores-panel.tsx`

## Visibility

| Audience | Can see score? |
| -------- | -------------- |
| Customer | No (future: badge on discover) |
| Partner | Yes — own laundry only |
| Admin | Yes — all laundries |

## Related

- Customer Trust Score: `CUSTOMER_TRUST_SCORE.md`
- Disputes feed complaint/dispute metrics: `DISPUTE_CENTER.md`
- On-time delivery uses custody/delivery events: `CHAIN_OF_CUSTODY.md`
