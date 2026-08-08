# Feature: Partner QR / barcode tracking

> Status: planned (scan-by-code shipped; QR image deferred)  
> Last updated: 2026-08-08  
> Related: [partner-shop-floor.md](partner-shop-floor.md) (human color token + tag print), [partner-inventory.md](partner-inventory.md)

## Problem

Unique tracking codes reduce mix-ups and speed status updates via scan.

## Data model

- `orders.tracking_code` (unique) — printed on Shop Floor tags
- `orders.color_token` / `token_code` — human spoken token (see shop-floor); may appear alongside QR later
- Planned: `qr_payload` URL

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/partner/orders/{id}/qr` | QR image/data | partner *(planned)* |
| POST | `/api/v1/partner/scan/{tracking_code}` | Lookup by code + status update | partner *(shipped)* |
| GET | `/api/v1/partner/orders/{id}/tags` | Tag JSON includes `tracking_code` for print | partner *(shipped — shop floor)* |

Shop Floor tags currently show **tracking code** as text (QR image endpoint still planned). Prefer encoding `tracking_code` **and** human `token_code` when QR lands.

## Acceptance criteria

- [ ] Scan idempotent for same target status
- [ ] QR image endpoint for partner print / scan UX
