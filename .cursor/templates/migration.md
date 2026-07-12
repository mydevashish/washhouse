# Migration: <slug>

> Revision: `<YYYYMMDD_slug>`
> Author: <name>
> Date: YYYY-MM-DD

## Why

What in the application requires this schema change?

## Changes

- Add table `<name>`
- Add column `<table>.<column>`
- Add index `ix_<table>_<cols>`
- Drop column `<table>.<column>` (deprecated since <date>)

## Migration plan

1. **Forward:** `alembic upgrade head`
2. **Backward:** `alembic downgrade -1` (or: **NOT REVERSIBLE** — explain)

## Pre-checks

- [ ] Affects a hot table? If yes, use `CREATE INDEX CONCURRENTLY` outside a tx
- [ ] Backfill needed? Document the script
- [ ] Long lock risk? Plan downtime or online strategy
- [ ] ENUM change? Use ADD VALUE (Postgres ≥ 12 supports inside txn since 12, prefer outside)

## Backfill (if any)

```bash
python backend/scripts/<backfill_script>.py
```

## Risks

- ...

## Verification

- [ ] `alembic upgrade head` on a fresh DB succeeds
- [ ] `alembic downgrade -1` succeeds (or documented)
- [ ] Existing tests pass
- [ ] Query plans for changed paths reviewed

## Rollback

If we need to revert:
1. ...
2. ...
