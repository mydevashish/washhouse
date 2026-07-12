# Feature: WhatsApp notifications

> Status: planned  
> Last updated: 2026-06-01

## Problem

India users expect OTP and order updates on WhatsApp when templates are approved.

## Provider interface

`app/services/notifications/whatsapp.py` — `WhatsAppProvider` protocol; Twilio/MessageBird implementation.

## Templates (apply in provider console)

- `otp_login`
- Walk-in order updates — see [offline-booking-whatsapp.md](offline-booking-whatsapp.md):
  `order_received`, `order_in_progress`, `order_ready_for_pickup`, `order_delivered`
- `partner_approved`

## API

Used internally from `AuthService` (OTP) and order status Celery tasks — no public HTTP.

## Fallback

SMS if WhatsApp delivery fails.
