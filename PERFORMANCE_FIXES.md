# Performance Fixes Applied

**Date:** 2026-06-02

## Critical / High (implemented)

### 1. Unified React Query cache for laundries

- **Files:** `frontend/lib/query-keys.ts`, `frontend/lib/query-config.ts`
- **Updated:** `marketplace-homepage.tsx`, `laundry-listing.tsx`, `partners-section.tsx`, `discover-list.tsx`, `laundry-detail-view.tsx`, `checkout-view.tsx`, `orders-list.tsx`, `order-tracking.tsx`
- **Effect:** Navigating home → discover → listing reuses cached laundry list for 5 minutes.

### 2. Laundry list API — lighter DB + Redis cache

- **Files:** `backend/app/repositories/laundry.py`, `backend/app/services/laundry_service.py`, `backend/app/core/cache.py`, `backend/app/core/redis_client.py`, `backend/app/core/config.py`
- **Changes:** Removed `selectinload(services)` on list; cache serialized `LaundryListItem` for 60s.
- **Config:** `CACHE_ENABLED`, `CACHE_LAUNDRIES_LIST_TTL_SEC`

### 3. Redis connection pooling

- **Files:** `backend/app/core/redis_client.py`, `backend/app/middleware/rate_limit.py`, `backend/app/main.py`
- **Effect:** Rate limiter reuses pool; closes on app shutdown.

### 4. Orders list — pagination + slim payload

- **Files:** `backend/app/schemas/order.py` (`OrderListItemResponse`), `backend/app/repositories/order.py`, `backend/app/api/v1/endpoints/orders.py`, `frontend/services/orders.ts`
- **Effect:** List endpoint skips line items; default `limit=50`.

### 5. Database indexes

- **File:** `backend/alembic/versions/20260602_0003_performance_indexes.py`
- **Run:** `alembic upgrade head`

### 6. Bundle — remove unused Three.js stack

- **File:** `frontend/package.json`
- **Removed:** `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`

### 7. Reviews lazy-loaded on detail tab

- **File:** `laundry-detail-view.tsx` — `enabled: tab === 'reviews'`

### 8. Loading UX

- **Files:** `discover-list.tsx` (skeleton), `checkout-skeleton.tsx` + `checkout-view.tsx`

### 9. Order tracking polling

- **File:** `order-tracking.tsx` — `refetchIntervalInBackground: false`

### 10. Next.js import optimization

- **File:** `next.config.mjs` — Radix packages added to `optimizePackageImports`

### 11. Hero / card images (LCP)

- **File:** `frontend/features/discover/marketplace/laundry-images.ts`
- **Issue:** Legacy Unsplash URLs returned **404** in dev (broken `next/image` optimization → layout delay).
- **Fix:** Replaced with verified photo IDs.

---

## Validation performed

| Check | Result |
| ----- | ------ |
| `npm run type-check` | Pass |
| `python -m compileall app` | Pass |
| `next build` compile | Pass (~11s); **lint step fails** on pre-existing issues |

---

## How to measure improvements

### API (with Redis + Postgres running)

```powershell
# Cold / warm laundry list
Measure-Command { Invoke-RestMethod "http://localhost:8000/api/v1/laundries" }
```

Second call within 60s should be faster (Redis cache hit).

### Frontend

```bash
cd frontend
npm install
npm run analyze
```

### Database

```sql
EXPLAIN ANALYZE SELECT id FROM laundries
WHERE deleted_at IS NULL AND status = 'approved'
ORDER BY avg_rating DESC LIMIT 20;
```

---

## Round 2 (Staff pass — 2026-06-02)

| Fix | Impact |
|-----|--------|
| `OrderDetailResponse` — events embedded in `GET /orders/{id}` | −1 HTTP round-trip on tracking |
| Redis cache bust on admin approve/reject/create laundry | Fresh discovery list after approval |
| `React.memo` + hover prefetch on `LaundryCard` | Faster filter UX + instant detail |
| Partner/Admin revenue panels use parent query data | −2 duplicate dashboard fetches |
| `AdminDashboardLazy` (`next/dynamic`) | Admin route **1.48 kB** page JS (was ~15kB+ inline) |
| Unified `queryKeys` for admin/partner/account | Consistent cache + invalidation |
| Partner orders `limit(50)` + no background poll | Bounded DB + battery |
| ESLint blockers (`partner-shell`, `CardTitle`) | **Production build passes** |

### Measured: production build (after)

| Route | First Load JS |
|-------|----------------|
| `/` | 103 kB |
| `/discover` | 176 kB |
| `/discover/[id]` | 201 kB |
| `/admin` | **157 kB** (lazy chunk) |
| `/orders/[id]` | 178 kB |

---

## Remaining (medium / low)

- Virtualize long admin/partner tables (`@tanstack/react-virtual`)
- `next/dynamic` for admin/partner routes
- Postgres full-text search index
- Cache invalidation on laundry CRUD / approval
- Fix ESLint blockers for clean production build
- Lighthouse CI gate in GitHub Actions
