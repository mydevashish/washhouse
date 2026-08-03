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
| `booking_requests` | Marketplace Book Now / phone CRM booking leads (admin + partner inbox) | `booking_requests` |
| `booking_request_messages` | Customer-facing responses + internal notes timeline | `booking_requests` |
| `booking_request_events` | Append-only audit (assign/status/transfer/…) | `booking_requests` |

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
| `booking_requests` | `uq_booking_requests_public_code` | human-facing code |
| `booking_requests` | `ix_booking_requests_phone_e164_created_at` | CRM timeline + rate limit |
| `booking_requests` | `ix_booking_requests_status_created_at` (partial `deleted_at IS NULL`) | admin inbox |
| `booking_requests` | `ix_booking_requests_assigned_laundry_id_status` (partial active) | partner queue |
| `booking_request_messages` | `ix_booking_request_messages_request_id_created_at` | timeline |
| `booking_request_events` | `ix_booking_request_events_request_id_created_at` | audit trail |

## Booking requests

> Spec: [booking-requests.md](../features/booking-requests.md) · API: [booking-requests.md](../api/endpoints/booking-requests.md)  
> Migrated: Alembic `20260803_0038` — models in `backend/app/models/booking_request.py`.

### `booking_requests`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `UUID` PK | `gen_random_uuid()` |
| `public_code` | `VARCHAR(16)` UK | e.g. `BR-K7M2QX` |
| `customer_name` | `VARCHAR(100)` | required |
| `phone_e164` | `VARCHAR(20)` | canonical `+91XXXXXXXXXX`; **indexed, not unique** |
| `service_type` | enum `booking_request_service_type` | wash-fold, dry-clean, … |
| `preferred_time_window` | enum `booking_request_preferred_time` | morning / afternoon / evening / flexible |
| `address_text` | `VARCHAR(500)` NULL | landmark / free text |
| `city` | `VARCHAR(100)` NULL | |
| `pincode` | `VARCHAR(10)` NULL | |
| `notes` | `TEXT` NULL | |
| `source` | enum `booking_request_source` | marketing_home, stores, services, deep_link, admin_created, partner_created |
| `status` | enum `booking_request_status` | new → … → converted_to_order \| declined \| expired \| cancelled |
| `priority` | enum `booking_request_priority` | normal / high / urgent; default normal |
| `assigned_laundry_id` | `UUID` NULL FK → `laundries.id` | `ON DELETE SET NULL` |
| `assigned_at` | `TIMESTAMPTZ` NULL | |
| `assigned_by_user_id` | `UUID` NULL FK → `users.id` | `ON DELETE SET NULL` |
| `converted_order_id` | `UUID` NULL FK → `orders.id` | `ON DELETE SET NULL` |
| `created_by_role` | enum `booking_request_created_by_role` | public / admin / partner |
| `created_by_user_id` | `UUID` NULL FK → `users.id` | null for public |
| `client_ip` | `VARCHAR(45)` NULL | public abuse review |
| `last_response_at` | `TIMESTAMPTZ` NULL | last customer-facing message |
| `closed_at` | `TIMESTAMPTZ` NULL | set on terminal statuses |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | TimestampMixin |
| `deleted_at` | `TIMESTAMPTZ` NULL | soft delete (admin) |

**Design note:** Do **not** add a separate `phone_normalized` column — E.164 from shared `normalize_phone` / `validate_indian_phone` is the CRM key. Partial unique on open phone is intentionally **avoided** so duplicates can exist with API warnings.

### `booking_request_messages`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `UUID` PK | |
| `booking_request_id` | `UUID` FK → `booking_requests.id` | `ON DELETE CASCADE` |
| `author_user_id` | `UUID` NULL FK → `users.id` | null only if system |
| `author_role` | enum | admin / partner / system |
| `visibility` | enum `booking_request_message_visibility` | `customer_facing` \| `internal` |
| `body` | `TEXT` | max 4000 enforced in schema |
| `created_at` | `TIMESTAMPTZ` | immutable; no updates |

### `booking_request_events`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `UUID` PK | |
| `booking_request_id` | `UUID` FK → `booking_requests.id` | `ON DELETE CASCADE` |
| `event_type` | enum `booking_request_event_type` | created, assigned, transferred, … |
| `actor_user_id` | `UUID` NULL FK → `users.id` | |
| `from_status` | enum NULL | |
| `to_status` | enum NULL | |
| `from_laundry_id` | `UUID` NULL | transfer audit |
| `to_laundry_id` | `UUID` NULL | |
| `payload` | `JSONB` NULL | small structured extras |
| `created_at` | `TIMESTAMPTZ` | append-only |

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
