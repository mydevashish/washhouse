# Feature: Notifications

> Status: planned  
> Last updated: 2026-06-01

## Channels

- In-app (`notifications` table)
- Email (Resend)
- SMS (Twilio fallback)

## Events

- Order status changes
- Partner approval
- Payment success/failure
- Subscription renewal

## Celery tasks

- `tasks.notifications.send_email`
- `tasks.notifications.send_sms`
