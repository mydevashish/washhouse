# Migrations

## Tooling

- **Alembic** with async engine
- Naming: `<YYYYMMDDhhmm>_<short_snake_summary>.py`
- Config: `backend/alembic.ini` + `backend/alembic/env.py`

## Commands

```bash
# Generate from ORM changes
alembic revision --autogenerate -m "add orders.notes column"

# Empty migration (manual SQL or hand-crafted)
alembic revision -m "online add index on orders.scheduled_at"

# Apply
alembic upgrade head

# Roll back
alembic downgrade -1
```

## Conventions

- One logical change per migration
- Reversible by default; document if not
- For hot tables: use `CREATE INDEX CONCURRENTLY` outside a transaction
- For NOT NULL adds: 3-step process — add nullable → backfill → enforce
- Idempotent index creation with `IF NOT EXISTS`

## Review checklist

See `.cursor/checklists/new-migration.md`.

## Online migration recipe

```python
# Concurrent index creation (Postgres)
with op.get_context().autocommit_block():
    op.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_orders_scheduled_at ON orders (scheduled_at)")
```

## Tracking

- Latest revision: see `alembic/versions/`
- Applied per env: visible via `alembic current` against that env's DB
- Production migrations run via Railway release command — never manually
