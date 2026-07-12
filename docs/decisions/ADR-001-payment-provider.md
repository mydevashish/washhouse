# ADR-001: Payment provider (India launch)

## Status

Accepted — 2026-05-29

## Context

DLM launches in India. Docs conflicted: some references used Stripe; product docs specify Razorpay (UPI, wallets, Indian compliance).

## Decision

- **Primary provider:** Razorpay (orders, payments, refunds, webhooks).
- **COD:** First-class `pending_cod` status; partner confirms collection on delivery.
- **Abstraction:** `app/services/payments/provider.py` defines `PaymentProvider` protocol; `RazorpayProvider` is the default implementation.

## Consequences

- Replace `STRIPE_*` env vars with `RAZORPAY_*` in backend config and `.env.example`.
- Stripe may be added later via a second provider for international expansion.
- Webhook endpoint: `POST /api/v1/payments/webhooks/razorpay` with signature verification.

## Out of scope (v1)

- Razorpay Route automated partner payouts (manual CSV + UPI in v1).
