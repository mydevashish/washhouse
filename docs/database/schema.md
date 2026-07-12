# Database Schema

> Updated on every migration. Source of truth = Alembic revisions + ORM models.

## Tables (planned)

| Table                 | Purpose                                      | Primary owner           |
| --------------------- | -------------------------------------------- | ----------------------- |
| `users`               | Customer / partner / admin accounts          | `auth`                  |
| `user_addresses`      | Customer addresses                           | `users`                 |
| `laundries`           | Partner-owned laundry businesses             | `laundries`             |
| `laundry_services`    | Services offered (wash, dry-clean, iron, …)  | `laundries`             |
| `laundry_pricing`     | Pricing per service                          | `laundries`             |
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

## Migrations

- All schema changes via Alembic
- Reversible by default
- See `.cursor/checklists/new-migration.md`
