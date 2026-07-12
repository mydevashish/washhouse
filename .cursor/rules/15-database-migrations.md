---
description: Database schema and Alembic migration rules
globs: backend/**
alwaysApply: false
---

# Database & Migrations

## Engine & tooling

- **PostgreSQL 16** (Neon in prod).
- **SQLAlchemy 2.x** async with `mapped_column` + `Mapped[]` typing.
- **Alembic** for migrations.
- **asyncpg** driver.

## Conventions

### Tables

- Plural snake_case: `users`, `orders`, `order_items`, `laundry_services`.
- One model file per aggregate (`app/models/order.py`).
- Each table has:
  - `id: UUID` (primary key, `gen_random_uuid()`)
  - `created_at: TIMESTAMPTZ` default `now()`
  - `updated_at: TIMESTAMPTZ` default `now()`, updated by trigger or ORM `onupdate`
  - Soft-deletable tables also: `deleted_at: TIMESTAMPTZ NULLABLE`

### Columns

- snake_case.
- Booleans `is_*` / `has_*`.
- Timestamps `*_at`.
- Money stored as `NUMERIC(12, 2)` with explicit currency column where multi-currency.
- Enums via Postgres native enums (`order_status`, `user_role`).
- Use `CHECK` constraints for invariants.

### Foreign keys

- `<table_singular>_id` — `user_id`, `laundry_id`.
- Always `ON DELETE` strategy explicit (CASCADE / SET NULL / RESTRICT).
- All FKs are indexed.

### Indexes

- Add for every FK.
- Add compound indexes for common filters: `(user_id, status)` for orders, `(city, is_approved)` for laundries.
- Partial indexes for hot subsets: `WHERE deleted_at IS NULL`.
- Name: `ix_<table>_<columns>`.

### Constraints

- Unique: `uq_<table>_<cols>` — `uq_users_email`.
- Check: `ck_<table>_<rule>` — `ck_orders_total_nonneg`.

## Naming for Alembic migrations

```
<UTC timestamp>_<short_snake_summary>.py
20260315T1432_create_orders_table.py
```

## Migration rules

1. **Every schema change is a migration.** Never `CREATE TABLE` by hand in prod.
2. **Migrations are reviewed.** Treat them as code.
3. **Reversible.** `downgrade()` must work unless data destruction is unavoidable — document in migration.
4. **Idempotent on retry.** Use `IF NOT EXISTS` for safety on indexes.
5. **One logical change per migration.** Big migrations are reviewed as multiple PRs.
6. **No data + schema in the same migration** for large tables; split:
   - Migration A: add nullable column + backfill task
   - Backfill job (Celery / script)
   - Migration B: enforce NOT NULL after backfill
7. **No `DROP COLUMN` on a hot table without a deprecation cycle.** Mark unused → ship → remove later.
8. **Concurrent indexes** for online migrations: `CREATE INDEX CONCURRENTLY`. In Alembic use `op.execute(...)` outside a transaction (use `op.get_context().autocommit_block()`).
9. **No long locks.** Avoid `ALTER TABLE` rewriting on > 1M rows; do online migrations.

## Example migration shape

```python
"""create orders table

Revision ID: 20260315_create_orders
Revises: 20260310_create_users
Create Date: 2026-03-15 14:32:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "20260315_create_orders"
down_revision = "20260310_create_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    order_status = sa.Enum(
        "pending", "confirmed", "picked_up", "washing", "ready",
        "out_for_delivery", "delivered", "cancelled",
        name="order_status",
    )
    order_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "orders",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True),
                  primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("laundry_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("laundries.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("status", order_status, nullable=False, server_default="pending"),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("scheduled_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True)),
        sa.CheckConstraint("total_amount >= 0", name="ck_orders_total_nonneg"),
    )
    op.create_index("ix_orders_user_id_status", "orders", ["user_id", "status"])
    op.create_index("ix_orders_laundry_id_status", "orders", ["laundry_id", "status"])
    op.create_index("ix_orders_scheduled_at", "orders", ["scheduled_at"])


def downgrade() -> None:
    op.drop_index("ix_orders_scheduled_at", table_name="orders")
    op.drop_index("ix_orders_laundry_id_status", table_name="orders")
    op.drop_index("ix_orders_user_id_status", table_name="orders")
    op.drop_table("orders")
    sa.Enum(name="order_status").drop(op.get_bind(), checkfirst=True)
```

## Seeds & fixtures

- Seed scripts in `backend/scripts/seed.py` populate idempotent demo data.
- Factories (`factory-boy`) live in `tests/fixtures/`.
- Never seed in production.

## Backups

- Neon point-in-time recovery enabled (7-day window).
- Weekly logical dump archived to S3.

## Querying rules

- Use `select(...)` with eager loading where needed (`selectinload`, `joinedload`).
- Always paginate list queries.
- Never `session.query(Model).all()` on tables that can grow > 10k rows without pagination.

## Update audit

Every schema change updates:
- `logs/implementation-log.md` (with the migration revision id)
- `logs/decisions-log.md` if an architectural choice was made
- `docs/database/schema.md` (ERD note)
