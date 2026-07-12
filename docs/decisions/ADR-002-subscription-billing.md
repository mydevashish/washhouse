# ADR-002: Subscription billing model

## Status

Accepted — 2026-06-01

## Context

DLM offers monthly plans (Student, Bachelor, Family, Monthly Ironing) per product docs. Need recurring revenue without blocking MVP on complex billing.

## Decision

**Primary:** Razorpay Subscriptions API for plan purchase, renewal, and cancellation webhooks.

**Fallback (if Razorpay plan setup delayed):** `subscriptions` table + Celery Beat daily job to charge via Razorpay Orders API or mark `past_due`.

**Benefits application:** Active subscription applies `%` or flat discount on `orders.subtotal` at checkout; one active subscription per user.

## Data model

- `subscription_plans` — catalog (slug, price_inr, interval, benefits JSON)
- `subscriptions` — user_id, plan_id, status, razorpay_subscription_id, current_period_end

## Consequences

- Webhook: `subscription.activated`, `subscription.charged`, `subscription.cancelled`
- Admin can CRUD plans without deploy (seed + admin UI Phase 5)
- Proration: out of scope v1

## Out of scope (v1)

- Family multi-seat plans
- Pause/resume subscription
