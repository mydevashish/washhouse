# Feature: Customer discovery

> Status: shipped (list + detail; Slice 5 compare price hints)  
> Owner: frontend-architect + backend-architect  
> Last updated: 2026-07-17  
> Related: [partner-price-list.md](partner-price-list.md)

## Problem

Customers must find nearby laundries with ratings, price, and availability.

## UX flow

1. App requests location (or user picks city).
2. List laundries sorted by distance with filters.
3. Tap laundry → detail with services, garment price list, and reviews preview.

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/laundries` | Search/list; includes compare price hints | optional |
| GET | `/api/v1/laundries/search` | Text search; same hint fields | optional |
| GET | `/api/v1/laundries/{id}` | Detail + services | optional |
| GET | `/api/v1/laundries/{id}/price-list` | Partner garment prices | public |
| GET | `/api/v1/laundries/{id}/reviews` | Review summary | optional |

List/search items may include `wash_fold_from_*`, `shirt_dry_clean_from_*`, and `start_price_*` when the laundry has offered those catalog items — see [laundry-compare-hints.md](../api/endpoints/laundry-compare-hints.md).

## Data model

- `laundries`, `laundry_services`, `laundry_item_prices` + `platform_catalog_items`
- Indexes: `ix_laundries_city_is_approved`, lat/lng for haversine

## Frontend surface

- Route: `/stores` — marketing directory (`StoresCard`: name + city; search only; no compare filters/prices)
- Route: `/discover`, `/discover/[id]` — authenticated discovery keeps richer cards + compare hints
- `frontend/features/discover/` (list/detail); `frontend/features/marketing/stores/` (public directory)

## Acceptance criteria

- [x] Debounced search 300ms
- [x] Server pagination default 20
- [x] Only approved laundries in public list
- [x] Discover store cards show owner-set “from ₹” compare hints when published (Slice 5)
- [x] Price filter/sort on `/discover` uses real `start_price_inr` (not pseudo hash prices)
- [x] Marketing `/stores` shows name + city only (no compare / rating / price chrome)