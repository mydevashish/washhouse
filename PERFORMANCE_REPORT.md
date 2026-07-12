# Performance Report — DLM Platform

**Date:** 2026-06-03  
**Method:** Code/architecture review, script inventory — **no live Lighthouse or load test run** (stack not fully running)

---

## Summary

**Performance score: 62/100**

Architecture choices are sound (Next.js 15 RSC, TanStack Query caching, async FastAPI, Redis). Without measured baselines, production SLO compliance (LTTI &lt; 3s on 4G, Lighthouse ≥ 90) is **unverified**.

---

## Frontend

| Area | Assessment |
| ---- | ---------- |
| Framework | Next.js 15 App Router — good code splitting |
| Server state | TanStack Query with `STALE` config + query keys |
| Bundle | `@next/bundle-analyzer` available — not run in audit |
| Images | Next Image likely on discover — verify per page |
| 3D / R3F | Landing only per rules — dashboards avoid heavy 3D |
| Virtualization | `@tanstack/react-virtual` in dependencies |

### Risks
- Partner order list refetch every 45s — acceptable for ops, watch battery on mobile
- Admin list endpoints fetch up to 200 rows without virtual scroll on all panels
- Framer Motion on marketing pages — lazy load

### Recommendations
- Run `npm run analyze` and set bundle budget in CI
- Run `lhci autorun` against staging
- Prefetch discover on landing CTA hover

---

## Backend

| Area | Assessment |
| ---- | ---------- |
| Runtime | Async SQLAlchemy + asyncpg |
| N+1 queries | Fraud/trust list endpoints loop per entity — **N+1 risk** on admin dashboards |
| Caching | Redis cache delete on laundry approve; limited read caching |
| Pagination | Public laundry search paginated; many admin lists use fixed limit 200 |

### Hot paths
- `LaundryTrustScoreService.list_for_admin` — metrics per laundry
- `FraudDetectionService.evaluate_customer` — multiple COUNT queries
- Order detail bundles — acceptable for single request

### Recommendations
- Batch metric queries or materialized views for trust/fraud scores
- Add DB indexes on `complaints.created_at`, `orders.updated_at` for 30-day windows
- Enable `pg_stat_statements` in staging

---

## API latency (estimated)

| Endpoint type | Expected |
| ------------- | -------- |
| Health | &lt; 50ms |
| Auth login | 100–300ms (bcrypt) |
| Order create | 150–400ms |
| Admin fraud list | 200ms–2s (depends on row count) |

**Action:** Add OpenTelemetry or structlog timing middleware.

---

## Database

- UUID PKs — fine at MVP scale
- Missing composite indexes for fraud window queries (see recommendations)
- Soft delete partial indexes — verify on high-traffic tables

---

## Caching strategy gaps

| Data | Cached? |
| ---- | ------- |
| Laundry discovery list | Redis invalidation on approve |
| User session | JWT — stateless access |
| Trust scores | Computed on read — no cache |
| Static assets | CDN (Vercel) when deployed |

---

## Scalability score: 60/100

- Horizontal scaling: stateless API + Redis sessions/rate limit — OK
- Celery configured but notification tasks commented out
- WebSocket order updates — single Redis pub/sub; verify multi-instance

---

## Measurement plan (pre-production)

1. k6 load test: 100 concurrent users browsing + 20 order creates/min
2. Lighthouse mobile on `/discover`, `/login`, `/partner`, `/admin`
3. p95 API latency dashboard (Railway/Neon metrics)
4. Set budgets: JS &lt; 200KB initial, LCP &lt; 2.5s
