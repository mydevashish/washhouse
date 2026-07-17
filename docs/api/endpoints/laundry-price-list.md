# Public laundry price list

Customer-facing garment prices for one approved laundry.

**Auth:** public (no JWT)

**Base:** `/api/v1/laundries/{laundry_id}/price-list`

## Endpoint

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/laundries/{id}/price-list` | Active **offered** catalog items + this laundry’s prices only |

## Behaviour

- Only `is_offered=true` rows with an active catalog item are returned
- Disabled / missing overrides are omitted (no platform suggested fallback)
- Unapproved or unknown laundry → `404`
- Response headers: `Cache-Control: public, max-age=<CACHE_LAUNDRY_PRICE_LIST_TTL_SEC>` (default 120s)
- Redis key `laundries:price-list:v1:{laundry_id}` — invalidated on partner price-list writes

## Response shape

```json
{
  "laundry_id": "uuid",
  "has_published_list": true,
  "item_count": 2,
  "items": [
    {
      "catalog_item_id": "uuid",
      "slug": "men-shirt-tshirt",
      "name": "Shirt / T-shirt",
      "category": "men",
      "unit": "piece",
      "sort_order": 10,
      "currency": "INR",
      "price_mode": "dual",
      "dry_clean_inr": "75.00",
      "press_inr": "20.00",
      "price_inr": null,
      "dry_clean_paise": 7500,
      "press_paise": 2000,
      "price_paise": null
    }
  ]
}
```

**Not included:** suggested platform rates, `is_offered`, `has_override`, `allows_press`, partner ownership fields.

## Frontend

- Feature: `frontend/features/laundry-price-list/`
- Discover detail: **Prices** tab
- Storefront: Price list section above services
- Empty copy: “This store hasn’t published a full price list yet” + existing `laundry_services`

See [partner-price-list.md](../../features/partner-price-list.md) Slice C.
