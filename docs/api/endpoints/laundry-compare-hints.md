# Laundry discovery list (compare price hints)

Public laundry list/search payloads include lightweight owner-set **compare hints** for store cards and client price filter/sort (Slice 5).

**Auth:** public (no JWT)

**Base:** `/api/v1/laundries`, `/api/v1/laundries/search`

## List pagination

| Param | Default | Max | Notes |
| ----- | ------- | --- | ----- |
| `limit` | **100** | 100 | Raised from 20 so directory / Near me does not drop newly approved low-rated stores |
| `offset` | 0 | — | Use with `meta.pagination.has_next` / `total` for further pages |

`data` remains a **JSON array** of list items (backward compatible). Totals live on `meta.pagination`.

Redis list keys: `laundries:list:v4:{city}:{limit}:{offset}` (payload `{items, total}`). Invalidate via `invalidate_laundry_discovery_cache()` on approve / reject / price changes (also clears legacy v1–v3 prefixes).

## Extra fields on each list item

| Field | Meaning |
| ----- | ------- |
| `wash_fold_from_inr` / `_paise` | This laundry’s offered **Wash & Fold** (`kg-wash-fold`) `price_inr`, or `null` |
| `shirt_dry_clean_from_inr` / `_paise` | Offered **Shirt / T-shirt** (`men-shirt-tshirt`) `dry_clean_inr`, or `null` |
| `start_price_inr` / `_paise` | `MIN` of the two hints above when at least one is set; used for filter/sort |

Rules:

- Only **owner-set**, `is_offered=true` rows — **never** platform suggested defaults
- Disabled / missing catalog overrides → fields are `null` (cards omit “from ₹” or show “Prices on store page”)
- List/search Redis keys: `laundries:list:v4:*` (+ legacy v1–v3 cleared on invalidate), `laundries:search:v3:*` — invalidated when partner prices change or laundry is approved/rejected

## Frontend

- Discover cards (`/discover`): `frontend/features/discover/lib/compare-price-lines.ts`
- Marketing `/stores` uses slim `StoresCard` (name + city) and does **not** render compare hints
- Filter/sort on discover: `startPrice` from `start_price_inr` in `filter-laundries.ts`

See [partner-price-list.md](../../features/partner-price-list.md) Slice 5.
