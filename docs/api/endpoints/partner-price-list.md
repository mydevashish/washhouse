# Partner price list

Partner-owned garment prices against the platform WashHouse catalog.

**Auth:** `partner` (JWT). Laundry is resolved from the token subject — never from a client-supplied `laundry_id`.

**Base:** `/api/v1/partner/price-list`

## Endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/partner/price-list` | Active catalog joined with this laundry’s overrides (suggested + current). Optional `?category=` |
| `PUT` | `/partner/price-list` | Bulk upsert prices + `is_offered` |
| `PATCH` | `/partner/price-list/{catalog_item_id}` | Partial update one item |
| `POST` | `/partner/price-list/apply-suggested` | Copy suggested → overrides for **missing** rows only (idempotent) |

## Money

- DB: `NUMERIC(12,2)` INR
- API: `*_inr` string decimals **and** `*_paise` integers
- Validation: `>= 0`, max `99999.99` per field
- Shape: dual (`dry_clean_inr` / `press_inr`) XOR single (`price_inr`)
- Cannot set `press_inr` when catalog item has no press suggested (e.g. Cap “—”)
- `is_offered=true` requires at least one price column
- Empty offered list is allowed (recommended but not hard-blocked)

## Partner UI

- Route: `/partner/pricing` (nav: **Your shop → Garment prices**)
- Feature: `frontend/features/partner-price-list/`
- Uses GET/PUT + POST apply-suggested; bulk save of dirty rows only

## Compatibility with `laundry_services`

Slice B does **not** dual-write or map into `LaundryService` / order line items. Booking and walk-in keep using `/partner/services` until Slice E.

See [partner-price-list.md](../features/partner-price-list.md) — Delivery slice E and the compatibility note in `docs/database/schema.md`.

## Example — bulk PUT

```json
{
  "items": [
    {
      "catalog_item_id": "…",
      "dry_clean_inr": "75.00",
      "press_inr": "20.00",
      "is_offered": true
    }
  ]
}
```

## Errors

| Code | When |
| ---- | ---- |
| `AUTH_FAILED` | Missing / invalid bearer |
| `FORBIDDEN` | Non-partner role |
| `NOT_FOUND` | No laundry for partner, or unknown catalog item |
| `VALIDATION_FAILED` | Bad money shape, press not allowed, offered without price |
