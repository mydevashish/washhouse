---
description: Performance budgets and rules
alwaysApply: false
---

# Performance Rules

## Budgets (must-meet)

### Frontend (Lighthouse mobile, 4G)

| Metric                       | Target  |
| ---------------------------- | ------- |
| Performance score            | ≥ 90    |
| LCP                          | ≤ 2.5 s |
| INP                          | ≤ 200 ms |
| CLS                          | ≤ 0.1   |
| TTFB                         | ≤ 800 ms |
| Total JS (first load, gz)    | ≤ 180 KB on the marketing landing, ≤ 240 KB on app shells |
| Image weight (above fold)    | ≤ 150 KB |

### Backend

| Metric                                   | Target           |
| ---------------------------------------- | ---------------- |
| p50 API latency (read)                   | ≤ 80 ms          |
| p95 API latency (read)                   | ≤ 250 ms         |
| p95 API latency (write)                  | ≤ 400 ms         |
| Background task queue lag                | ≤ 5 s            |
| Error rate (5xx)                         | ≤ 0.1%           |

CI fails when budgets regress > 10%.

## Frontend optimization rules

### Rendering

1. **Default to Server Components.** Move to client only when state/effects/events are needed.
2. **Stream what you can.** Use `loading.tsx` for above-the-fold skeletons.
3. **Suspense boundaries** at the smallest reasonable unit (cards, panels) to unblock the shell.
4. **Server Actions** for write-heavy forms where appropriate.

### Code-splitting

- Route-level splitting is free (App Router).
- Heavy client components: `dynamic(() => import(...), { ssr: false })`.
- Three.js / R3F: **always dynamic**, no SSR, behind an in-view observer.
- shadcn components: tree-shake — import individually.

### Images

- Use `next/image` always.
- Provide explicit `width`/`height` or `fill` + `sizes`.
- `priority` only for the LCP image.
- AVIF preferred, then WebP, then fallback.
- Origin images stored on Cloudflare R2 / S3; transformed via `next/image` loader.

### Fonts

- `next/font` with `display: swap`.
- Subset to Latin (and Devanagari/Tamil only if needed for that locale).
- Max 2 font families per page.

### State / data

- **TanStack Query** for all server data with `staleTime` ≥ 30 s for stable lists.
- Prefetch on hover / viewport intersection.
- Debounce search inputs (300 ms).
- Virtualize lists > 50 items (`@tanstack/react-virtual`).
- Optimistic updates for clearly safe mutations.

### Bundle hygiene

- Run `pnpm analyze` before merging large features.
- Prefer ESM, side-effect-free imports.
- No moment.js (use `date-fns` or `dayjs`).
- No lodash whole-package imports (`import debounce from 'lodash/debounce'` only).
- No big icon set imports (use per-icon imports from `lucide-react`).

### Animations

- Framer Motion is fine but: animate **transform** + **opacity** only when possible.
- Limit simultaneous motion to 3–5 elements above the fold.
- `useReducedMotion` respected for any spring / scroll effect.
- R3F **only** on landing/hero.

### Caching

- Static pages — ISR with `revalidate` per content cadence.
- API responses — `Cache-Control: private, max-age=0, must-revalidate` by default.
- Lists — `s-maxage=60, stale-while-revalidate=300` for marketing-page data.

## Backend optimization rules

### Queries

- All queries explained on creation (`EXPLAIN ANALYZE`) for hot paths.
- Index every FK and frequent filter; compound index `(user_id, status)` etc.
- Avoid N+1 with `selectinload` / `joinedload`.
- Always paginate list endpoints; refuse `page_size > 100`.

### Async / blocking

- All I/O is `async`.
- CPU-bound work → Celery.
- External HTTP calls have **timeouts** (connect 2 s, read 10 s) and **retries** with jitter.
- Long requests (> 200 ms) get a log warning; > 1 s a hard alert.

### Caching

- Redis for:
  - User session / token blacklist
  - Laundry search results (TTL 30–60 s)
  - Pricing snapshots (TTL 5 min)
  - Rate limit buckets
- Invalidate via versioned keys (`laundry:list:v1:hash`).

### Connection pools

- SQLAlchemy `pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`.
- Redis pool size matching worker count.
- Tune in `core/config.py`; do not hardcode.

### Serialization

- Pydantic v2 `model_dump(mode="json")` is fast; prefer over manual conversions.
- `ORJSONResponse` configured globally.

### Compression

- gzip via reverse proxy (Railway) for >1 KB responses.
- Brotli on Vercel for the frontend.

## Database

- Migrations reviewed for indexes.
- No long transactions (avoid holding locks > 200 ms in hot paths).
- Soft-delete with `deleted_at`; periodic vacuum + archival.
- Hot tables monitored for bloat.

## Monitoring

- **Sentry** Performance for traces.
- **Lighthouse CI** on every PR.
- **k6** load tests in `tests/perf/` for critical endpoints.
- **Railway / Vercel** built-in metrics.
- p50/p95/p99 dashboards.

## Mandatory before merge (UI changes)

- ✅ `pnpm analyze` diff acceptable
- ✅ Lighthouse mobile ≥ 90 on touched routes
- ✅ No new heavy client components
- ✅ Images sized + lazy
- ✅ R3F not introduced outside landing

## Mandatory before merge (backend changes)

- ✅ Query plans checked for new hot paths
- ✅ Indexes added where appropriate
- ✅ p95 unchanged or improved in load test
- ✅ No new sync I/O
- ✅ Cache invalidation considered
