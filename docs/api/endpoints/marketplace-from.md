# Marketplace “from ₹” aggregates

Public indicative garment prices for marketing `/pricing` tables.

**Auth:** public (no JWT)

**Base:** `/api/v1/catalog/marketplace-from`

## Endpoint

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/catalog/marketplace-from` | Per-item min “from” prices (+ suggested fallback) |

### Query

| Param | Type | Notes |
| ----- | ---- | ----- |
| `category` | enum | Optional: `laundry_by_kg` \| `men` \| `women` \| `kids` \| `winter` \| `household` |

## Behaviour

- For each **active** catalog item, per money column:
  - `MIN` among **approved** laundries with `is_offered=true` and a non-null partner price
  - If no partner price for that column → use platform **suggested** default
- `source`: `aggregate` if any column used a partner MIN; otherwise `suggested`
- Deferred items (no suggested + no partner prices, e.g. curtain) are **omitted**
- Response headers: `Cache-Control: public, max-age=<CACHE_MARKETPLACE_FROM_TTL_SEC>` (default 600s)
- Redis key `catalog:marketplace-from:v1` (+ per-category variants) — invalidated on partner price-list writes

## Response shape

```json
{
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
      "source": "suggested",
      "from_dry_clean_inr": "69.00",
      "from_press_inr": "15.00",
      "from_price_inr": null,
      "from_dry_clean_paise": 6900,
      "from_press_paise": 1500,
      "from_price_paise": null
    }
  ],
  "item_count": 1
}
```

These are **indicative** marketplace floors — not checkout prices. Exact rates live on each laundry’s price list.

## Frontend

- Marketing: `frontend/features/marketing/pricing/`
- Label cells as “from ₹X”; section copy “Starting from · indicative”

See [partner-price-list.md](../../features/partner-price-list.md) Slice D.
