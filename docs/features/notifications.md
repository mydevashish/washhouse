# Feature: Notifications

> Status: planned (**P2** for rich admin notification center; WhatsApp stubs shipped)  
> Last updated: 2026-07-28

Admin `/admin/notifications` currently derives alerts from dashboard data — full in-app notification product is P2 and must not fail launch falsely.

## Channels

- In-app (`notifications` table)
- Email (`EmailService` / SMTP — see `docs/runbooks/email-smtp.md`; Resend optional future)
- SMS (Twilio fallback)

## Events

- Order status changes
- Partner approval
- Payment success/failure
- Subscription renewal
- Marketing contact / franchise → support inbox (wired)
- Password reset OTP (wired when SMTP configured)

## Celery tasks

- `tasks.notifications.send_email`
- `tasks.notifications.send_sms`
