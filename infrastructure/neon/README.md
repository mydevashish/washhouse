# Neon

Managed Postgres.

## Projects

| Project       | Purpose       | Compute       |
| ------------- | ------------- | ------------- |
| `dlm-prod`    | Production    | Dedicated     |
| `dlm-staging` | Staging       | Dedicated S   |
| `dlm-preview` | PR branches   | Shared        |

## Branching

- One Neon branch per PR (auto-created via Neon × GitHub integration)
- Auto-clean after 7 days inactive
- Branch from `prod` for staging clones; never the other way around

## Connection strings

Each service uses two:

- `DATABASE_URL` — PgBouncer (pooled, transaction mode) — for app
- `DATABASE_URL_DIRECT` — direct — for Alembic + admin

## Backups

- PITR window: 7 days
- Weekly logical dump (`pg_dump`) → S3 (private, encrypted)

## Extensions enabled

- `uuid-ossp`
- `pg_trgm` (for fuzzy search)
- `pgcrypto`
- `citext` (case-insensitive email/usernames)
