# Feature: Partner inventory

> Status: planned (API shipped for counts; Shop Floor tags are separate)  
> Last updated: 2026-08-08  
> Related: [partner-shop-floor.md](partner-shop-floor.md) (bag/item **tags** + color tokens), [partner-qr-tracking.md](partner-qr-tracking.md)

## Problem

Partners track cloth count and flag missing/damaged items per order.

## Data model

- `order_inventory`: order_id, expected_count, received_count, missing_notes, damaged_notes

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/partner/orders/{id}/inventory` | Get | partner |
| PUT | `/api/v1/partner/orders/{id}/inventory` | Update | partner |

## Relation to Shop Floor tags

Physical bag/garment **tags** (color token `R-42`, thermal print) live under [partner-shop-floor.md](partner-shop-floor.md) — `GET /partner/orders/{id}/tags` — not this inventory count API. Inventory remains expected vs received piece counts at pickup.
