# Performance Checklist

Run when touching hot paths.

## Frontend

- [ ] Lighthouse mobile ≥ 90 on touched routes
- [ ] LCP image has `priority`
- [ ] No new unscoped client components
- [ ] `dynamic` import for heavy widgets (3D / charts / editors)
- [ ] `next/image` with explicit `sizes`
- [ ] Fonts via `next/font` (display swap)
- [ ] No moment.js; no full lodash imports
- [ ] Tailwind purge in place
- [ ] List virtualization for > 50 items

## Backend

- [ ] No N+1 (use `selectinload` / `joinedload`)
- [ ] Indexes match new filter / sort combos
- [ ] `EXPLAIN ANALYZE` reviewed for new hot query
- [ ] p95 unchanged or improved (k6 smoke)
- [ ] No new sync I/O in async paths
- [ ] Long work moved to Celery

## Caching

- [ ] Cache only where measured (not preemptive)
- [ ] TTL set
- [ ] Invalidation paths documented in the service

## Data

- [ ] Pagination on every list (default 20, max 100)
- [ ] Debounced search (300 ms)
- [ ] Optimistic UI for clearly safe mutations

## Bundle (frontend)

- [ ] `pnpm analyze` diff acceptable
- [ ] First-load JS within budget (180/240 KB gz)

## Logs

- [ ] `logs/performance-log.md` updated with before/after numbers
