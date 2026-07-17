# Database Schema

> Updated on every migration. Source of truth = Alembic revisions + ORM models.

## Tables (planned)

| Table                 | Purpose                                      | Primary owner           |
| --------------------- | -------------------------------------------- | ----------------------- |
| `users`               | Customer / partner / admin accounts          | `auth`                  |
| `user_addresses`      | Customer addresses                           | `users`                 |
| `laundries`           | Partner-owned laundry businesses             | `laundries`             |
| `laundry_services`    | Coarse services offered (wash, dry-clean, …) | `laundries`             |
| `platform_catalog_items` | Platform master garment/kg catalog (WashHouse suggested defaults) | `laundries` / admin |
| `laundry_item_prices` | Per-laundry prices + `is_offered` for catalog items | `laundries`      |
| `laundry_pricing`     | *(superseded)* use `laundry_item_prices` — see [partner-price-list.md](../features/partner-price-list.md) | `laundries` |
| `orders`              | Customer orders                              | `orders`                |
| `order_items`         | Line items per order                         | `orders`                |
| `order_status_events` | Append-only state changes                    | `orders`                |
| `pickup_evidence_photos` | Immutable pickup photo records          | `orders`                |
| `order_inventory_verifications` | Item inventory at pickup (locked after confirm) | `orders`        |
| `order_inventory_items` | Per-category quantities per verification | `orders`                |
| `order_inventory_history` | Append-only inventory audit trail     | `orders`                |
| `order_inventory_change_requests` | Admin-gated change proposals    | `orders`                |
| `order_delivery_otps` | Delivery handoff OTP records              | `orders`                |
| `delivery_proof_photos` | Immutable delivery photo (one per order) | `orders`                |
| `order_custody_events` | Append-only chain-of-custody audit trail   | `orders`                |
| `complaint_photos` | Dispute attachment photos                     | `complaints`            |
| `complaint_status_events` | Dispute status change history          | `complaints`            |
| `customer_trust_score_events` | Append-only customer trust adjustments | `users`             |
| `laundries.trust_score` | Partner Laundry Trust Score (0–100, default 70)   | `laundries`         |
| `fraud_alerts`        | Fraud detection alerts (customer + partner)      | `admin / security`  |
| `users.fraud_risk_level` / `laundries.fraud_risk_level` | Low/Medium/High/Critical | `users`, `laundries` |
| `payments`            | Order payments + refunds                     | `payments`              |
| `reviews`             | Customer ratings + reviews                   | `reviews`               |
| `subscriptions`       | Customer monthly plans                       | `subscriptions`         |
| `notifications`       | In-app notifications                         | `notifications`         |
| `audit_logs`          | Sensitive operation trail                    | `admin / security`      |
| `feature_flags`       | Feature flag table                           | `infra`                 |
| `refresh_tokens`      | Refresh token bookkeeping (jti + used)       | `auth`                  |
| `marketing_contact_submissions` | Public marketing contact form leads   | `marketing`             |
| `marketing_franchise_inquiries` | Franchise partnership applications    | `marketing`             |
| `marketing_site_stats` | Singleton curated stat overrides            | `marketing`             |
| `marketing_testimonials` | Curated featured testimonials for marketing | `marketing`         |

## Conventions

- UUID PK + `gen_random_uuid()`
- `created_at`, `updated_at`, optional `deleted_at`
- Money: `NUMERIC(12,2)` with `currency` column (default `INR`)
- Native Postgres enums for finite states
- Foreign keys indexed + explicit `ON DELETE`
- Soft delete via `deleted_at` (partial index: `WHERE deleted_at IS NULL`)

See `.cursor/rules/15-database-migrations.md`.

## ERD

See [`erd.md`](erd.md).

## Indexes (high-level)

| Table              | Index                                       | Purpose                            |
| ------------------ | ------------------------------------------- | ---------------------------------- |
| `users`            | `uq_users_email`                            | unique email                       |
| `orders`           | `ix_orders_user_id_status`                  | customer list by status            |
| `orders`           | `ix_orders_laundry_id_status`               | partner list by status             |
| `orders`           | `ix_orders_scheduled_at`                    | calendar / dispatch                |
| `laundries`        | `ix_laundries_city_is_approved`             | discovery + admin                  |
| `laundries`        | GIN on `(name, city)` tsvector              | search                             |
| `reviews`          | `ix_reviews_laundry_id_created_at`          | latest reviews                     |
| `platform_catalog_items` | `uq_platform_catalog_items_slug`      | stable seed key                    |
| `platform_catalog_items` | `ix_platform_catalog_items_category_sort` (partial, active) | category tables      |
| `laundry_item_prices` | `uq_laundry_item_prices_laundry_catalog_active` (partial unique) | one override per item |
| `laundry_item_prices` | `ix_laundry_item_prices_laundry_id` / `ix_laundry_item_prices_catalog_item_id` | FK lookups |
| `marketing_contact_submissions` | `ix_marketing_contact_submissions_phone_created_at` | contact rate limiting   |
| `marketing_franchise_inquiries` | `ix_marketing_franchise_inquiries_client_ip_created_at` | franchise rate limiting |
| `marketing_testimonials` | `ix_marketing_testimonials_featured_active_sort` | featured homepage list |

## Platform catalog price shape (chosen)

Money is always `NUMERIC(12,2)` + `currency` (`INR`). Two mutually exclusive modes per row
(`ck_*_price_shape`); all money columns may be null for deferred items (e.g. curtain).

| Mode | Columns | Used for |
| ---- | ------- | -------- |
| **Dual process** | `dry_clean_inr` + `press_inr` (`press` nullable when N/A / “—”) | `men`, `women`, `kids`, `winter`, and household rows with a press split (e.g. bedsheet) |
| **Single rate** | `price_inr` only (`dry_clean`/`press` null) | `laundry_by_kg` (per-kg), and household items without a press column (blanket, shoes, …) |

On `platform_catalog_items` the same shape uses `suggested_*` prefixes. Suggested defaults are
**not** live partner prices — partners start with **no** `laundry_item_prices` rows until they
explicitly apply/edit (see [partner-price-list.md](../features/partner-price-list.md)).

Categories enum: `laundry_by_kg` \| `men` \| `women` \| `kids` \| `winter` \| `household`.  
Units enum: `piece` \| `kg` \| `panel` \| `set` \| `pair`.

Seed: `python scripts/seed_washhouse_catalog.py` (idempotent by `slug`).

### Compatibility with `laundry_services` / order line items (Slice E plan)

`laundry_services` remains the booking / walk-in catalog. Partner garment price-list APIs
(`GET|PUT|PATCH /partner/price-list`, `POST .../apply-suggested`) only read/write
`platform_catalog_items` + `laundry_item_prices`.

| Phase | Approach |
| ----- | -------- |
| **Now (B–D)** | No dual-write. Display + partner editor only. |
| **Slice E (when product requires booking from this list)** | Prefer dual-write or `catalog_item_id` FK on `laundry_services` / order lines — **do not** silently replace existing services. Map `laundry_by_kg` rows first if online booking needs kg rates from the shared catalog. |

Until Slice E ships, regression: walk-in + `/partner/services` paths must stay green.

## Migrations

- All schema changes via Alembic
- Reversible by default
- Latest catalog migration: `20260717_0034_platform_catalog_and_laundry_item_prices`
- See `.cursor/checklists/new-migration.md`
