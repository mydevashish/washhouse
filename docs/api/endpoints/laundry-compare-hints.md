# Laundry discovery list (compare price hints)

Public laundry list/search payloads include lightweight owner-set **compare hints** for store cards and client price filter/sort (Slice 5).

**Auth:** public (no JWT)

**Base:** `/api/v1/laundries`, `/api/v1/laundries/search`

## Extra fields on each list item

| Field | Meaning |
| ----- | ------- |
| `wash_fold_from_inr` / `_paise` | This laundry’s offered **Wash & Fold** (`kg-wash-fold`) `price_inr`, or `null` |
| `shirt_dry_clean_from_inr` / `_paise` | Offered **Shirt / T-shirt** (`men-shirt-tshirt`) `dry_clean_inr`, or `null` |
| `start_price_inr` / `_paise` | `MIN` of the two hints above when at least one is set; used for filter/sort |

Rules:

- Only **owner-set**, `is_offered=true` rows — **never** platform suggested defaults
- Disabled / missing catalog overrides → fields are `null` (cards omit “from ₹” or show “Prices on store page”)
- List/search Redis keys: `laundries:list:v2:*`, `laundries:search:v2:*` — invalidated when partner prices change or laundry is approved/rejected

## Frontend

- Discover cards (`/discover`): `frontend/features/discover/lib/compare-price-lines.ts`
- Marketing `/stores` uses slim `StoresCard` (name + city) and does **not** render compare hints
- Filter/sort on discover: `startPrice` from `start_price_inr` in `filter-laundries.ts`

See [partner-price-list.md](../../features/partner-price-list.md) Slice 5.
