# Feature: Walk-in order WhatsApp updates (India)

> Status: implemented (partner ops + Celery stub/Twilio)  
> Last updated: 2026-07-03  
> Related: [notifications-whatsapp.md](notifications-whatsapp.md), walk-in / offline booking flow

## Problem

Walk-in customers in India expect order status updates on WhatsApp. Meta requires pre-approved message templates for production; Twilio sandbox allows plain-text bodies for local development. **No customer app login** is required — the partner records the phone at walk-in and status updates trigger outbound WhatsApp.

## Partner ops flow (end-to-end)

1. Partner opens **Walk-in orders** (`/partner/walk-in-orders`) or advances from the main orders list.
2. Partner creates an order with customer phone (E.164, e.g. `+919876543210`) and line items.
3. Order is created at `confirmed`; Celery task `send_order_status_whatsapp` fires immediately.
4. Partner advances status in-shop (no pickup evidence, inventory, or delivery OTP):

   | Step | Status | Partner action | WhatsApp template |
   | ---- | ------ | -------------- | ----------------- |
   | 1 | `confirmed` | (on create) | `order_received` |
   | 2 | `washing` | Start washing | `order_in_progress` |
   | 3 | `ready` | Mark ready | `order_ready_for_pickup` |
   | 4 | `delivered` | Mark delivered | `order_delivered` |

   Walk-in flow **skips** `pickup_assigned`, `picked_up`, `ironing`, and `out_for_delivery`.

5. Customer receives WhatsApp at each step above. Online orders are unchanged (pickup evidence + inventory before `picked_up`, delivery OTP for `delivered`).

### Inventory (online pickup only)

- Online orders at `pickup_assigned`: partner must record inventory (`InventoryVerificationService`) and upload pickup evidence before `picked_up`.
- Walk-in orders: `order_service.update_status_partner` skips pickup evidence and inventory checks when `order_source = walk_in` (see `if not is_walk_in and status == OrderStatus.picked_up`).

### Partner storefront onboarding

Before phone-booked customers can reach the shop via discover/storefront, set in **Storefront builder** (`/partner/storefront`):

- `contact_phone` — shop number (E.164)
- `show_call` — show call button on public storefront
- `show_whatsapp` — show WhatsApp contact on public storefront

These fields power offline booking contact on the discover page; they are separate from walk-in order WhatsApp status notifications.

## Scope

WhatsApp notifications fire only for **walk-in** orders (`order_source = walk_in`) when status changes to:

| Order status | Template name | Customer-facing label |
| ------------ | ------------- | --------------------- |
| `confirmed` | `order_received` | received |
| `washing` | `order_in_progress` | being washed |
| `ready` | `order_ready_for_pickup` | ready for pickup |
| `delivered` | `order_delivered` | delivered |

Triggered from `OrderStatusWhatsAppNotifier.schedule` → Celery task `send_order_status_whatsapp`.

## Template variables

Use these **exact** variable names in Meta / Twilio Content Templates and in backend `content_variables`:

| Variable | Example | Source |
| -------- | ------- | ------ |
| `customer_name` | Priya | `orders.customer_name` |
| `laundry_name` | Sparkle Wash | `laundries.name` |
| `tracking_code` | DLM-A1B2C3 | `orders.tracking_code` |
| `status_label` | ready for pickup | mapped from `OrderStatus` |

## Meta approval — template names and sample bodies

Submit each template separately in Meta Business Manager (via Twilio Content Template Builder). Category: **Utility**. Language: **English (India)** or **English** as appropriate.

### `order_received`

```
Hi {{customer_name}}! We've received your laundry order {{tracking_code}} at {{laundry_name}}. Status: {{status_label}}. We'll notify you as it progresses. Thank you for choosing DLM.
```

### `order_in_progress`

```
Hi {{customer_name}}! Your order {{tracking_code}} at {{laundry_name}} is now {{status_label}}. Thank you for choosing DLM.
```

### `order_ready_for_pickup`

```
Hi {{customer_name}}! Your order {{tracking_code}} at {{laundry_name}} is {{status_label}}. Please collect it at your earliest convenience. Thank you for choosing DLM.
```

### `order_delivered`

```
Hi {{customer_name}}! Your order {{tracking_code}} at {{laundry_name}} has been {{status_label}}. Thank you for choosing DLM.
```

After Meta approval, copy each template's **Content SID** (`HX…`) into the matching env variable below.

## Environment variables

Set Twilio credentials and the WhatsApp sender. Template SIDs are optional — omit them for sandbox plain-text fallback.

```bash
# Required for any Twilio WhatsApp send
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   # sandbox default

# Production: one Content SID per approved template (HX…)
TWILIO_WA_TEMPLATE_ORDER_RECEIVED=
TWILIO_WA_TEMPLATE_ORDER_IN_PROGRESS=
TWILIO_WA_TEMPLATE_ORDER_READY=
TWILIO_WA_TEMPLATE_ORDER_DELIVERED=
```

| Env variable | Template name |
| ------------ | ------------- |
| `TWILIO_WA_TEMPLATE_ORDER_RECEIVED` | `order_received` |
| `TWILIO_WA_TEMPLATE_ORDER_IN_PROGRESS` | `order_in_progress` |
| `TWILIO_WA_TEMPLATE_ORDER_READY` | `order_ready_for_pickup` |
| `TWILIO_WA_TEMPLATE_ORDER_DELIVERED` | `order_delivered` |

Implementation: `backend/app/services/notifications/whatsapp.py` — when a SID is set for the template, Twilio sends with `ContentSid` + `content_variables`; otherwise a plain `body` is used (sandbox-friendly).

## Sandbox vs production

### Sandbox (local / dev)

1. Create a [Twilio account](https://www.twilio.com/try-twilio) and open **Messaging → Try it out → Send a WhatsApp message**.
2. Note the sandbox number (default `+1 415 523 8886`) and join keyword.
3. From your phone, send `join <keyword>` to that number on WhatsApp.
4. In `backend/.env`:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM=whatsapp:+14155238886`
   - Leave all `TWILIO_WA_TEMPLATE_*` empty.
5. Use a walk-in order with `customer_phone` set to your joined number (E.164, e.g. `+919876543210`).
6. Advance order status — messages send as **plain text** (no template approval needed).
7. Ensure Celery worker is running and the `sms` notification channel is enabled (Admin → platform config). Without Celery, enqueue is logged but the task does not run.

### Production (India)

1. Register a WhatsApp Business Account and complete Meta business verification.
2. In Twilio, connect your WABA and request a **production WhatsApp sender** (not sandbox).
3. Create four Content Templates in Twilio using the sample bodies above; variable names must match the table in [Template variables](#template-variables).
4. Submit for Meta approval (typically 24–48 hours for utility templates).
5. After approval, set `TWILIO_WHATSAPP_FROM` to your approved sender (e.g. `whatsapp:+91XXXXXXXXXX`).
6. Paste each approved template's Content SID into the matching `TWILIO_WA_TEMPLATE_*` env var.
7. Deploy with `APP_ENV=production`. Outbound messages use `ContentSid` + JSON `content_variables`.
8. Monitor Twilio message logs for delivery failures; SMS fallback is planned in [notifications-whatsapp.md](notifications-whatsapp.md).

## Code map

| Piece | Location |
| ----- | -------- |
| Provider (ContentSid / plain body) | `backend/app/services/notifications/whatsapp.py` |
| Status → template mapping | `backend/app/services/notifications/order_status_whatsapp_notifier.py` |
| Celery send task | `backend/app/tasks/order_notifications.py` |
| Walk-in create + confirmed WhatsApp | `backend/app/services/walk_in_order_service.py` |
| Walk-in status transitions (skip pickup/inventory) | `backend/app/services/order_service.py` (`WALK_IN_NEXT_STATUS`) |
| Partner walk-in UI | `frontend/features/partner/views/partner-walk-in-orders-view.tsx` |
| Partner orders UI (walk-in aware) | `frontend/features/partner/partner-order-card.tsx` |
| Online pickup inventory UI | `frontend/features/partner/partner-order-card.tsx` (hidden for walk-in) |

## Gaps / notes (resolved in this pass)

| Gap | Resolution |
| --- | ---------- |
| Walk-in status path included `ironing` | Aligned to `confirmed → washing → ready → delivered` (backend + FE) |
| Main orders list showed Accept/Reject for walk-in `confirmed` | `isOrderNeedsAction` excludes `order_source = walk_in` |
| `PartnerOrderCard` used online pickup/inventory/OTP UI for walk-in | Walk-in branch hides pickup evidence, inventory, delivery OTP |
| Ironing had no WhatsApp template | N/A — ironing removed from walk-in path |

## Acceptance criteria

- [x] Four templates documented and sample bodies ready for Meta approval
- [ ] Env SIDs wired in staging/production (ops)
- [x] Walk-in customer receives WhatsApp on confirmed, washing, ready, delivered
- [x] Sandbox works without template SIDs (plain body / stub log)
- [ ] Production uses approved Content Templates only (ops)
- [x] No customer app login in walk-in partner ops flow
- [x] Automated: `backend/tests/api/test_walk_in_orders.py`

## Manual verification checklist

1. Start API + Celery worker.
2. Log in as partner; ensure storefront has `contact_phone`, `show_call`, `show_whatsapp`.
3. Create walk-in order with phone `+919876543210`.
4. Advance: washing → ready → delivered.
5. Confirm Celery logs `order.whatsapp_notify_scheduled` or Twilio/stub `whatsapp.template_stub` for each status.
6. Confirm customer was never prompted to log in.
