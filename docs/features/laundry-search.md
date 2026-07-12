# Laundry search (FTS)

## API

`GET /api/v1/laundries/search`

| Param | Description |
| ----- | ------------- |
| `q` | Search text (required, 1–200 chars) |
| `city` | Optional city filter (ILIKE) |
| `min_rating` | Optional minimum `avg_rating` |
| `sort` | `relevance` (default), `rating`, `name` |
| `limit` | Page size (default 20, max 100) |
| `offset` | Pagination offset |

Response: `LaundrySearchResult` with `items`, `total`, `limit`, `offset`. Pagination also in `meta.pagination`.

## Database

- `laundries.tags` — `TEXT[]` for searchable tags
- `laundries.search_vector` — weighted `tsvector` (name, description, tags, services, address)
- GIN indexes on `search_vector`, `tags`, and trigram on `name`
- Triggers keep `search_vector` in sync when laundries or services change

Migration: `20260602_0004_laundry_fulltext_search.py`

## Frontend

- Debounced 300ms via `useDebouncedValue`
- `useLaundryDiscovery` switches between list and search APIs
- Client filters (distance, price, delivery) still apply to enriched demo fields
