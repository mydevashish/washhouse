# New Migration Checklist

## Plan

- [ ] One logical change
- [ ] Reversible (or documented why not)
- [ ] No data + structural change in one migration on a hot table

## Schema specifics

- [ ] UUID PK with `gen_random_uuid()`
- [ ] `created_at`, `updated_at`, `deleted_at` columns (if applicable)
- [ ] Native Postgres enum for finite states (not Python string column)
- [ ] FK has explicit `ondelete`
- [ ] FK is indexed
- [ ] Compound indexes match query filters
- [ ] CHECK constraints for invariants

## Online safety

- [ ] No `ALTER TABLE` rewrite on > 1M rows
- [ ] `CREATE INDEX CONCURRENTLY` for hot tables
- [ ] No exclusive locks > 200 ms in hot paths
- [ ] Backfill split: add nullable → backfill → enforce

## Verify

- [ ] `alembic upgrade head` on fresh DB works
- [ ] `alembic downgrade -1` works (or documented)
- [ ] Existing tests pass
- [ ] Query plans for new hot paths reviewed (`EXPLAIN ANALYZE`)

## Docs

- [ ] `docs/database/schema.md` updated
- [ ] ERD updated in `docs/database/erd.md`
- [ ] `logs/implementation-log.md` references the revision ID
