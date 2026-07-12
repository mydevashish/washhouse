# Runbook: Razorpay webhook failures

## Symptoms

- Orders stuck `pending` after client payment.
- Webhook 4xx/5xx in Railway logs.

## Steps

1. Check `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard.
2. Inspect `POST /api/v1/payments/webhooks/razorpay` logs (signature verification).
3. Reconcile manually in Razorpay dashboard; update `orders.payment_status` if paid.
4. Idempotent replay: safe to resend webhook from Razorpay after fix.
