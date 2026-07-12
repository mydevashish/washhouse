# Feature: Order placement

> Status: planned  
> Owner: backend-architect  
> Last updated: 2026-06-01

## Problem

Customers book services with pickup/delivery windows and see transparent pricing including GST.

## UX flow

1. Select services + quantity on laundry detail.
2. Choose address, pickup slot, delivery slot, notes.
3. Review summary (subtotal, delivery, CGST/SGST).
4. Confirm → order `confirmed` (payment in Phase 5).

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| POST | `/api/v1/orders` | Create order | customer |
| GET | `/api/v1/orders/{id}` | Order detail | customer/owner |
| POST | `/api/v1/orders/{id}/cancel` | Cancel in window | customer |

## Data model

- `orders`, `order_items`
- GST: `gst_rate`, `cgst`, `sgst`, `invoice_number`
- Money: `NUMERIC(12,2)`, currency `INR`

## Acceptance criteria

- [ ] Cannot book unapproved laundry
- [ ] Cancellation only before `picked_up`
- [ ] Idempotent create with `Idempotency-Key` header
