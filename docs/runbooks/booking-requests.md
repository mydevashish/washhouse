# Runbook — Booking requests (ops inbox)

## Purpose

Marketplace **Book Now** (no laundry selected) creates a `booking_request` in the admin inbox — not a marketing contact lead. Ops assign to an active partner; partners work assigned rows from `/partner/booking-requests`.

## Surfaces

| Who | Where |
| --- | ----- |
| Guest | Book Now dialog → `POST /api/v1/booking-requests` → confirmation `public_code` (`BR-…`) |
| Admin | `/admin/booking-requests` (Operations nav) |
| Partner | `/partner/booking-requests` (Orders → Booking requests) |

## SLA

| Badge | Age while open and not yet `contacted` |
| ----- | -------------------------------------- |
| `fresh` | &lt; 15 min |
| `aging` | 15–60 min |
| `overdue` | &gt; 60 min |

Default inbox sort is **SLA** (overdue first). Contact the customer (WhatsApp deep link or log a customer-facing response) to clear overdue pressure.

## Duplicate phones

Creating another request for the same open phone is **allowed**. Admin/partner create dialogs show a live warning after phone lookup; Book Now shows a confirmation note. Never refuse pickup intent.

## Assign

1. Open the request drawer (auto-claims `new` → `reviewing`).
2. Use **Suggested** chips (city/pincode match → rating → recently active) or the full laundry select.
3. Assign / transfer → partner gets in-app (+ email/WhatsApp stub when configured).

## Notifications (best-effort)

| Event | Channels |
| ----- | -------- |
| Public create | In-app to admins · support inbox email · WhatsApp stub log |
| Admin assign | In-app (+ email) to laundry owner · WhatsApp stub to owner phone |

Failures never roll back the saved request. SMTP unset → email skipped (see [email-smtp.md](email-smtp.md)).

## Convert → order

1. Confirm pickup (status `confirmed`), or admin **force** from `contacted`.
2. Drawer **Convert to order** → assisted form (laundry, address, services, slots).
3. Creates `assisted_admin` / `assisted_partner` order via Customer Desk factory; BR → `converted_to_order`.
4. UI navigates to Customer Desk (`?phone=` + orders tab).

## Out of scope / deferred

- Public track-by-code portal (customer OTP self-serve deferred)
- CSV export, admin overview KPI cards beyond inbox strip
- Auto-expire after 72h (Celery job pending)

## Common issues

| Symptom | Action |
| ------- | ------ |
| Book Now still looks like contact lead | Confirm FE posts `/booking-requests`; check admin inbox, not marketing contacts |
| Partner cannot see request | Confirm assign to their laundry; other partners get `404` |
| No support email on new lead | Set SMTP + `SUPPORT_EMAIL`; check logs for `booking_request.admin_email.*` |
| Suggestions empty | Need ≥1 approved laundry; city/pincode on the request improves ranking |
