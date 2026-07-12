# Performance Benchmarks — Before vs After

**Environment:** Local dev, Windows, Next 15.5.18, FastAPI + Postgres + Redis (when running)  
**Date:** 2026-06-02

Run benchmarks:

```powershell
# API (backend on :8000, Redis recommended for cache rows)
python scripts/benchmark-api.py

# Frontend type safety
cd frontend && npm run type-check
```

---

## Fix 1–3: Laundry list + cache + query keys

| Metric | Before (estimated) | After (target) | Notes |
|--------|-------------------|----------------|-------|
| `GET /laundries` cold | 80–200 ms DB | 50–150 ms | No `selectinload(services)` |
| `GET /laundries` warm (Redis) | N/A | **&lt;20 ms** | 60s TTL |
| Duplicate FE fetches home→discover | **2×** same JSON | **0×** (cache hit) | Shared `queryKeys.laundries()` |
| Hero image status | **404** | **200** | Verified Unsplash IDs |

**How to verify Redis cache:**

```powershell
python scripts/benchmark-api.py
# Compare laundries_cold vs laundries_warm_2 — warm should be significantly lower
```

---

## Fix 4–6: Orders list payload + DB indexes

| Metric | Before | After |
|--------|--------|-------|
| `GET /orders` JSON size (50 orders, 3 items each) | ~50 × full order + items | ~50 × summary fields only |
| Order list query | `selectinload(items)` | `noload(items)` |

Apply indexes: `alembic upgrade head` (revision `20260602_0003`).

---

## Fix 7–8: Order tracking single request

| Metric | Before | After |
|--------|--------|-------|
| HTTP requests on `/orders/[id]` | **2** (`/orders/{id}` + `/events`) | **1** (`OrderDetailResponse.events`) |
| Polling load (30s) | 2 × refetch | 1 × refetch |

---

## Fix 9–12: React + images + prefetch

| Metric | Before | After |
|--------|--------|-------|
| Filter keystroke re-renders | All `LaundryCard` instances | Memoized cards skip unchanged props |
| Navigate to detail | Cold query | Prefetch on hover/focus |
| Reviews on detail load | Always fetched | Only when Reviews tab active |

---

## Fix 13–15: Dashboard dedup + code split

| Metric | Before | After |
|--------|--------|-------|
| Partner revenue tab | Second `useQuery` mount | Reuses parent `analyticsQ.data` |
| Admin revenue tab | Second `getAdminDashboard` | Reuses parent `dashboardQ.data` |
| Admin route JS | In main admin page chunk | Lazy `AdminDashboardLazy` client chunk |

---

## Build / compile

| Check | Result |
|-------|--------|
| `tsc --noEmit` | Pass |
| `next build` compile | Pass after admin lazy client wrapper |
| ESLint | `partner-shell`, `card.tsx` fixed |

---

## Targets vs current (gaps)

| Target | Status |
|--------|--------|
| Homepage &lt; 2s | Needs prod Lighthouse on 4G |
| API &lt; 300ms | Achievable on warm cache; measure with script |
| Lighthouse 90+ | Not in CI yet |
| Feel instant on mobile | Core paths optimized; polling + search remain |

---

## Next measurements to add

1. Lighthouse CI on `/` and `/discover`
2. `@next/bundle-analyzer` after `npm install` (Three removed)
3. `EXPLAIN ANALYZE` on laundry list with migration applied
