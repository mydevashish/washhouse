# Top 20 Performance Bottlenecks — DLM

**Ranked by user-perceived impact** (mobile + desktop)  
**Last updated:** 2026-06-02

| # | Bottleneck | Category | Severity | Status |
|---|------------|----------|----------|--------|
| 1 | Fragmented React Query keys → duplicate `GET /laundries` on every route | Caching / Network | **Critical** | Fixed |
| 2 | Laundry list eager-loaded all `services` per row | Database | **Critical** | Fixed |
| 3 | Broken Unsplash hero/card URLs (404) → failed `next/image` optimization | Images / LCP | **Critical** | Fixed |
| 4 | No Redis response cache for public laundry list | Caching / API | **High** | Fixed |
| 5 | Rate limiter opened new Redis connection per request | API / Infra | **High** | Fixed |
| 6 | Missing composite DB indexes (laundries, orders, reviews) | Database | **High** | Fixed (migration) |
| 7 | `GET /orders` returned full line items for every list row | API payload | **High** | Fixed |
| 8 | Order tracking used 2 HTTP requests (order + events) | Network | **High** | Fixed |
| 9 | Stale laundry cache after admin approval | Caching | **High** | Fixed |
| 10 | Unused Three.js / R3F in `package.json` (~500KB dep tree) | Bundle | **High** | Fixed |
| 11 | `LaundryCard` re-rendered entire grid on filter keystroke | React | **High** | Fixed (`memo`) |
| 12 | No prefetch on laundry card hover → cold detail navigation | Network | **High** | Fixed |
| 13 | Partner + admin revenue panels duplicated dashboard queries | React / Network | **High** | Fixed (props) |
| 14 | Reviews fetched on every laundry detail mount | Network | **High** | Fixed (tab `enabled`) |
| 15 | Admin dashboard loaded synchronously in main bundle | Bundle | **High** | Fixed (`dynamic`) |
| 16 | Client-side filter/sort on full laundry array (no server search) | API / Scale | **Medium** | Open |
| 17 | Partner orders unbounded + heavy `items` payload | Database / API | **Medium** | Partial (limit 50) |
| 18 | Order tracking 30s polling (no WebSocket) | Network | **Medium** | Open |
| 19 | Admin/partner tables not virtualized | React | **Medium** | Open |
| 20 | Production build blocked by ESLint + no Lighthouse CI | Tooling | **Medium** | Partial (lint fixes) |

---

## Severity definitions

- **Critical** — Directly breaks perceived speed or wastes full duplicate loads on core paths (home → discover).
- **High** — Measurable latency, payload, or battery impact on common flows.
- **Medium** — Matters at scale or on low-end devices; acceptable for MVP traffic.
- **Low** — Micro-optimizations; profile before investing.

---

## Measurement

See [PERFORMANCE_BENCHMARKS.md](PERFORMANCE_BENCHMARKS.md) for before/after numbers and [PERFORMANCE_FIXES.md](PERFORMANCE_FIXES.md) for change log.
