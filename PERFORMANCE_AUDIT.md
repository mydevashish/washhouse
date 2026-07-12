# DLM Performance Audit

**Audit date:** 2026-06-02  
**Method:** Static code review, dependency analysis, Next.js compile timing, TypeScript validation. Lighthouse/runtime benchmarks require a running stack (`npm run dev` + API + Redis).

## Executive summary

| Area | Severity | Top issue |
| ---- | -------- | --------- |
| Frontend data fetching | **Critical** | Same laundry API fetched under 4 different React Query keys → no cache sharing |
| Backend laundry list | **High** | `selectinload(services)` on every list row → N+1-style payload bloat |
| Database | **High** | Missing composite indexes for discovery + order lists |
| Caching | **High** | No Redis response cache; rate limit opened new Redis connection per request |
| Bundle | **High** | `three`, `@react-three/fiber`, `@react-three/drei` installed but unused (~500KB+ gzip potential) |
| Lists / pagination | **Medium** | Orders list returned full line items for every row |
| Virtualization | **Medium** | `@tanstack/react-virtual` installed, never used |
| 3D / RSC | **Low** | R3F deferred; most routes are client components by design (interactivity) |

---

## Frontend performance

| Issue | Impact | Severity | Recommended fix | Status |
| ----- | ------ | -------- | ----------------- | ------ |
| Fragmented `queryKey` for `listLaundries()` (`homepage`, `listing`, `discover`, bare `laundries`) | Duplicate network + cache misses on navigation | **Critical** | Single `queryKeys.laundries()` + 5m `staleTime` | **Fixed** |
| Reviews fetched on detail mount even when tab hidden | Extra API on every detail view | **High** | `enabled: tab === 'reviews'` | **Fixed** |
| `discover-list.tsx` text-only loading | Layout shift, poor LCP perception | **Medium** | Skeleton list | **Fixed** |
| Checkout full-page `Loader2` spinner | Blank screen during load | **Medium** | `CheckoutSkeleton` | **Fixed** |
| Order tracking dual queries both poll every 30s in background | Battery + bandwidth on mobile | **Medium** | `refetchIntervalInBackground: false` + `staleTime` | **Fixed** |
| No `next/dynamic` for route-level splits beyond Next defaults | Larger initial JS on some routes | **Medium** | Dynamic-import heavy panels (admin, partner) | Open |
| `framer-motion` on marketing hero only | Acceptable; already in `optimizePackageImports` | **Low** | Keep scoped to landing | OK |
| `use client` on interactive feature modules | Expected for App Router forms/lists | **Low** | Keep; pages stay thin in `app/` | OK |
| Hero uses `next/image` + Unsplash remote | Good LCP setup with `priority` | — | Ensure `sizes` on cards | OK |
| Zustand: only `auth` + `ui` stores; auth uses selector | Low global-state risk | **Low** | No split needed | OK |
| Missing `React.memo` on list cards | Re-renders on filter change | **Low** | Memo `LaundryCard` if profiling shows cost | Open |

### Measured (build)

- **Next.js compile:** ~11s (successful) on Next 15.5.18
- **TypeScript:** `tsc --noEmit` passes after fixes
- **Production build:** Blocked by pre-existing ESLint (`partner-shell`, `card.tsx`) — not introduced by this audit

---

## API & network

| Issue | Impact | Severity | Recommended fix | Status |
| ----- | ------ | -------- | ----------------- | ------ |
| Laundry list loads all services per row | Large JSON, slow DB | **High** | Drop `selectinload` on list; services on detail only | **Fixed** |
| No HTTP caching for public laundry list | Repeated DB hits | **High** | Redis JSON cache 60s TTL | **Fixed** |
| `GET /orders` returns full `items[]` per order | Payload × orders | **High** | `OrderListItemResponse` + `noload(Order.items)` | **Fixed** |
| Orders list unpaginated | Unbounded memory/time | **Medium** | `limit`/`offset` (default 50) | **Fixed** |
| Order detail + events = 2 requests | Waterfall acceptable; polling doubles load | **Medium** | Combined endpoint or WS (deferred per roadmap) | Open |
| Axios has no request dedup beyond React Query | Duplicate if keys differ | **Critical** | Unified query keys | **Fixed** |

---

## Backend (FastAPI)

| Issue | Impact | Severity | Recommended fix | Status |
| ----- | ------ | -------- | ----------------- | ------ |
| `RateLimitMiddleware` `from_url` + `aclose` per request | Connection churn, latency | **High** | Shared `get_redis()` pool | **Fixed** |
| No response caching layer | DB pressure on homepage | **High** | `app/core/cache.py` | **Fixed** |
| Async endpoints throughout | Good baseline | — | Maintain | OK |
| `ORJSONResponse` default | Faster serialization | — | Maintain | OK |
| Partner `list_by_laundry` without `selectinload` | OK for list | — | Add pagination when lists grow | Open |

---

## Images

| Issue | Impact | Severity | Fix |
| ----- | ------ | -------- | --- |
| All imagery via Unsplash CDN + `next/image` | Good formats (AVIF/WebP) in `next.config.mjs` | — | Keep |
| No local `public/` raster assets | No accidental huge binaries | — | OK |
| Card images use remote URLs | Depends on Unsplash latency | **Medium** | Self-host or CDN cache critical heroes |

**LCP target (<2.5s):** Hero already uses `priority` + `sizes="100vw"`. Measure with Lighthouse once deployed.

---

## Loading UX

| Surface | Before | After |
| ------- | ------ | ----- |
| Homepage laundries | Skeleton grid | OK (unchanged) |
| Discover list | "Loading laundries…" text | Skeleton grid |
| Checkout | Center spinner | Structured skeleton |
| Orders / tracking | Skeletons | OK |

---

## Performance targets (gap analysis)

| Target | Current estimate | Gap |
| ------ | ---------------- | --- |
| Homepage <2s | Needs prod Lighthouse on 4G | Run `npx lighthouse http://localhost:3000` |
| API <300ms | Laundry list cached: likely <50ms hit; cold DB ~50–150ms local | Measure with `scripts/measure-api.ps1` |
| Search <200ms | Client-side filter only today | Server search + GIN index (planned in schema doc) |
| Lighthouse 90+ | Not run in CI | Add `pnpm test:e2e` + Lighthouse CI |

---

## Priority backlog (not fixed in this pass)

1. Server-side search (Postgres `tsvector` per `docs/database/schema.md`)
2. `useVirtualizer` for admin/partner long tables
3. WebSocket order tracking (replace 30s polling)
4. `next/dynamic` for admin dashboard chunks
5. Cache invalidation on partner approval / laundry mutation
6. Combined `GET /orders/{id}?include=events` endpoint

See `PERFORMANCE_FIXES.md` for implemented changes.
