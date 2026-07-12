# Feature: Partner QR / barcode tracking

> Status: planned  
> Last updated: 2026-06-01

## Problem

Unique tracking codes reduce mix-ups and speed status updates via scan.

## Data model

- `orders.tracking_code` (unique), `qr_payload` URL

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/partner/orders/{id}/qr` | QR image/data | partner |
| POST | `/api/v1/partner/scan` | Lookup by code + advance status | partner |

## Acceptance criteria

- [ ] Scan idempotent for same target status
