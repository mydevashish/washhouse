# Neon — Database Hosting

## Projects

- **dlm-prod** — production
- **dlm-staging** — staging
- **dlm-preview-***   — per-PR branches

## Connection strings

Two per env:

- `DATABASE_URL` — PgBouncer / pooled (for app)
- `DATABASE_URL_DIRECT` — direct (for migrations)

## Branching

- Create a branch for each preview PR
- Auto-cleaned after 7 days of inactivity

## Backups

- Point-in-time recovery: **7 day** window enabled
- Weekly logical dump archived to S3

## Compute scaling

- Prod: dedicated, autoscale on
- Staging: dedicated, smaller
- Preview: shared, small

## Migrations

- Run via Railway release command
- Never manually on prod
- Use `CREATE INDEX CONCURRENTLY` for hot table indexes

## Monitoring

- Neon dashboard metrics
- Slow query log enabled
- Alert thresholds:
  - p95 query > 250 ms
  - Connection saturation > 80%
  - Disk > 80%
