# Database Optimization — DLM

**Audit date:** 2026-06-02

## Schema baseline

Source: `backend/alembic/versions/`, `backend/app/models/`, `docs/database/schema.md`.

---

## Issues found

| Issue | Impact | Severity | Recommendation | Status |
| ----- | ------ | -------- | -------------- | ------ |
| Laundry list filters `status = approved` + optional `city ILIKE` but only `ix_laundries_city` | Seq scan on status filter at scale | **High** | Composite `(status, city)` partial index | **Fixed** — migration `20260602_0003` |
| Orders listed by `user_id ORDER BY created_at DESC` with only single-column indexes | Sort + filter cost grows with orders | **High** | `(user_id, created_at)` partial index | **Fixed** |
| Partner orders by `laundry_id` + `created_at` | Same | **High** | `(laundry_id, created_at)` partial index | **Fixed** |
| Reviews by laundry latest-first | Seq scan | **Medium** | `(laundry_id, created_at)` | **Fixed** |
| `list_approved` used `selectinload(Laundry.services)` | Extra query + wide rows for list API | **Critical** | Remove eager load on list | **Fixed** |
| `list_by_user` used `selectinload(Order.items)` | Large payloads for order history | **High** | `noload(Order.items)` on list | **Fixed** |
| `city ILIKE '%foo%'` | Cannot use btree index efficiently | **Medium** | Trigram/GIN or exact city match API | Open |
| Full-text search on name/city documented but not migrated | Slow search at scale | **Medium** | Add GIN `tsvector` per schema doc | Open |
| `get_by_tracking_code` no events preload | Extra query on tracking page | **Low** | `selectinload(Order.events)` when needed | Open |

---

## Query patterns (after optimization)

### Laundry discovery (`LaundryRepository.list_approved`)

```sql
SELECT * FROM laundries
WHERE deleted_at IS NULL AND status = 'approved'
  [AND city ILIKE :city]
ORDER BY avg_rating DESC, name ASC
LIMIT :limit OFFSET :offset;
```

- **No** `laundry_services` join on list.
- Uses `ix_laundries_status_city_active` (partial, `deleted_at IS NULL`).

### Customer orders (`OrderRepository.list_by_user`)

```sql
SELECT * FROM orders
WHERE user_id = :uid AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
```

- `noload(order_items)` — items only on `GET /orders/{id}`.

### Reviews (`ReviewRepository.list_by_laundry`)

- Already paginated (`limit`/`offset`).
- New index supports `ORDER BY created_at DESC`.

---

## N+1 analysis

| Path | Risk | Mitigation |
| ---- | ---- | ---------- |
| Laundry detail | `selectinload(services)` — 1 extra query | Acceptable for single entity |
| Order detail | `items` + `events` selectinload | Acceptable |
| Partner order list | No items loaded | OK |
| Review create → avg_rating | 2 queries + update | OK |

---

## Migration applied

**File:** `backend/alembic/versions/20260602_0003_performance_indexes.py`

| Index | Columns | Partial WHERE |
| ----- | ------- | ------------- |
| `ix_laundries_status_city_active` | `status`, `city` | `deleted_at IS NULL` |
| `ix_orders_user_id_created_at` | `user_id`, `created_at` | `deleted_at IS NULL` |
| `ix_orders_laundry_id_created_at` | `laundry_id`, `created_at` | `deleted_at IS NULL` |
| `ix_reviews_laundry_id_created_at` | `laundry_id`, `created_at` | — |

**Apply:** `alembic upgrade head` (or `AUTO_RUN_MIGRATIONS=true` on startup).

---

## Redis query cache

- Key: `laundries:list:v1:{city}:{limit}:{offset}`
- TTL: `CACHE_LAUNDRIES_LIST_TTL_SEC` (default 60)
- Invalidate on laundry approval/update: **not yet wired** (add `cache_delete_pattern("laundries:list:")` in admin approve flow).

---

## Recommended next indexes

| Table | Index | When |
| ----- | ----- | ---- |
| `laundries` | GIN `to_tsvector('english', name \|\| ' ' \|\| city)` | Server-side search shipped |
| `orders` | `(status, laundry_id)` | Partner queue filters by status |
| `otp_codes` | `(phone, created_at DESC)` | High OTP volume |

---

## EXPLAIN checklist (ops)

```sql
EXPLAIN ANALYZE
SELECT * FROM laundries
WHERE deleted_at IS NULL AND status = 'approved'
ORDER BY avg_rating DESC
LIMIT 20;
```

Expect: **Index Scan** or **Bitmap Index Scan** on `ix_laundries_status_city_active` at scale.
