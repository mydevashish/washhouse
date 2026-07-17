# Feature: Notifications

> Status: planned  
> Last updated: 2026-06-01

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
