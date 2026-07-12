# Runbook: Database restore (Neon)

1. Open Neon console → point-in-time restore or branch from backup.
2. Update `DATABASE_URL` on Railway to restored branch.
3. Run `alembic current` to verify revision.
4. Smoke test: health, login, list laundries.
