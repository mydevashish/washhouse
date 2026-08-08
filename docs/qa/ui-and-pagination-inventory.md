# UI + Pagination Inventory (Prompt 0)

> Status: **complete** (inventory only — no production code changes)  
> Date: 2026-08-08  
> Prompt pack: [`.cursor/prompts/ui-fix-and-backend-pagination.md`](../../.cursor/prompts/ui-fix-and-backend-pagination.md)  
> Standard: [`PAGINATION_STANDARD.md`](../../PAGINATION_STANDARD.md)

## Executive summary

WashHouse already has a **platform pagination contract** (`page` / `page_size` default **10**, `PaginatedListResponse`, `useServerList`). Several high-traffic Partner surfaces **ignore it**:

| Hot spot | Reality today | Impact |
| -------- | ------------- | ------ |
| `GET /partner/orders` | Returns a **hard-capped** array (`.limit(50)`), **not** paginated | UI silently misses older orders; Overview / Audit / Reports / Notifications / Logistics “Done” derive from incomplete set |
| Partner Orders panel + ops hook | Full fetch + **client filter** + `refetchInterval` 45–60s | Slows as laundry grows; polls heavy payload |
| Partner customers CRM | `limit: 100` + **client search** | Incomplete directory; not real pages |
| Walk-in list | Hard **limit 50**, array response | Same silent truncation pattern |
| Admin laundries | **Unpaginated** API + `useDataTableState` (default page size **50**) | Full download to browser |

**Do next:** Prompt **8** (QA lock).

---

## 1) Broken / flaky UI matrix

Severity: **P0** blocks correct ops or silently loses data · **P1** major UX/perf · **P2** partial · **P3** polish.

| ID | Route | Component | Symptom | Sev | Repro steps | Likely cause | Owner prompt |
| -- | ----- | --------- | ------- | --- | ----------- | ------------ | ------------ |
| UI-01 | `/partner/orders` (+ hub orders tab) | `PartnerOrdersPanel` / `PartnerOrdersTable` | **Fixed (Prompt 2)** — server pages + buckets; no silent 50-cap | **P0** | … | Was API array + `.limit(50)` | **2** ✓ |
| UI-02 | `/partner/reports` | `PartnerReportsView` | **Mitigated (Prompt 2)** — export capped at 100 with warning (full export later) | **P0** | … | Was full-list illusion | **2** ✓ |
| UI-03 | `/partner` (Advanced) | `PartnerOverviewView` | **Fixed (Prompt 2)** — brief/recent use page of 10; KPIs from analytics/ops | **P0** | … | Was capped list counts | **2** ✓ |
| UI-04 | `/admin` laundries list | `AdminLaundriesList` / `admin-laundries-view` | **Fixed (Prompt 5)** — `PaginatedList` + `useServerList`; no `useDataTableState` | **P0** | … | Was full dump + client page | **5** ✓ |
| UI-05 | `/partner/notifications` | `PartnerNotificationsView` | **Fixed (Prompt 6)** — alerts deep-link to order detail; no duplicate payment rows; loading/error/truncation honest | **P1** | … | Full attention API still deferred | **4**, **6** ✓ |
| UI-06 | `/partner/audit` | `PartnerAuditView` | **Fixed (Prompt 4)** — `useServerList` on `/partner/orders`; same page on mobile/desktop | **P1** | … | Was fake slice inconsistency | **4** ✓ |
| UI-07 | `/partner/customers` | `PartnerCustomersView` | **Fixed (Prompt 3)** — server `page`/`page_size`/`search`; no `limit:100` client filter | **P1** | … | Was insights offset + FE cap | **3** ✓ |
| UI-08 | `/partner/walk-in-orders` | `PartnerWalkInOrdersView` | **Fixed (Prompt 4)** — `PaginatedList` default 10 + search UI | **P1** | … | Was repo cap 50 | **4** ✓ |
| UI-09 | `/partner/logistics` (+ pickups/deliveries) | `OwnerLogisticsBoard` | **Fixed (Prompt 4)** — queues status/date-scoped (cap 200); Done via `/operations/done-today`; phone on ops rows | **P1** | … | Was full order dump + capped done | **4** ✓ |
| UI-10 | `/partner/reviews` | `PartnerReviewsView` | **Fixed (Prompt 4)** — `PaginatedList` + `DataTablePagination` | **P1** | … | Was offset array | **4** ✓ |
| UI-11 | `/partner/staff` | `PartnerStaffView` activity panel | **Fixed (Prompt 3)** — `PaginatedListResponse` + `DataTablePagination` | **P1** | … | Was array limit/offset | **3** ✓ |
| UI-12 | `/partner/settlements` | `PartnerSettlementsView` | **Fixed (Prompt 6)** — default **10** + `DataTablePagination` (page-size select); empty gated on `!isError` | **P2** | … | Was prev/next only | **1**, **6** ✓ |
| UI-13 | `/partner/orders?tab=requests` | `PartnerBookingRequestsInbox` | **Fixed (Prompt 1)** — default page_size **10** | **P2** | … | Was 20 | **1** ✓ |
| UI-14 | Orders Hub desk / Customer Desk | desk orders tabs | **Fixed (Prompt 1+3)** — default **10**; prev/next when multi-page | **P2** | … | Was default 20 | **1**, **3** ✓ |
| UI-15 | `/partner/orders?tab=orders` today strip | `PartnerOrdersTodayPanel` | Uses `page_size: 5` for preview (OK) — ensure it stays a **preview**, not a fake full list. | **P3** | Smoke only. | Intentional small page | **2** (preserve) |
| UI-16 | `/partner/people` | people redirect | **Fixed (Prompt 6)** — redirects to directory (`?tab=staff` → `/partner/staff`) | **P3** | … | Was 404 | **6** ✓ |
| UI-17 | `/partner/floor/*` | Shop Floor | Out of redesign scope. Note: floor lists must not regress; pagination only if unbounded lists appear. | — | — | Non-goal | — |
| UI-18 | Admin announcements | `AdminAnnouncementCenterView` | **Fixed (Prompt 5)** — `page`/`page_size` + `DataTablePagination` | **P2** | … | Was offset list | **5** ✓ |
| UI-19 | Admin laundry trust scores | `AdminLaundryTrustScoresPanel` | **Fixed (Prompt 5)** — server page + search; metrics only for page | **P2** | … | Was full array | **5** ✓ |
| UI-20 | Admin inventory change requests | `AdminInventoryChangesPanel` | **Fixed (Prompt 5)** — `PaginatedList` + 30s poll on page | **P2** | … | Was full array | **5** ✓ |
| UI-21 | Admin disputes | `AdminDisputesDatatable` | **Fixed (Prompt 5)** — FE uses `total_records` via `getTotalRecords` | **P2** | … | Legacy `total` still aliased | **5** ✓ |
| UI-22 | Admin / Partner revenue analytics tables | revenue views | **Fixed (Prompt 1)** — admin laundry table default **10**. Partner Money has no dead Top services panel (removed Prompt 6). | **P2** | … | — | **1**, **6** ✓ |
| UI-24 | `/partner` Action Center | `PartnerActionCenter` | **Fixed (Prompt 6)** — “View order” opens `/partner/orders/{id}` | **P1** | … | Was hub list | **6** ✓ |
| UI-25 | `/partner/logistics?tab=` | `OwnerLogisticsBoard` | **Fixed (Prompt 6)** — tab synced to URL; soft nav + refresh keep tab | **P1** | … | Local state only | **6** ✓ |
| UI-26 | Logistics / order mutations | invalidate helpers | **Fixed (Prompt 6)** — also refresh done-today + ops dashboard | **P1** | … | Stale KPIs/Done | **6** ✓ |
| UI-27 | Money / Settlements / Logistics | empty vs error | **Fixed (Prompt 6)** — empty states only when `!isError` | **P1** | … | False “no data” on failure | **6** ✓ |
| UI-28 | Partner shell nav labels | `partner-shell` | **Fixed (Prompt 6)** — section labels use solid muted (dark contrast) | **P3** | … | `/70` opacity | **6** ✓ |
| UI-23 | Customer app `GET /orders` | customer order history | `limit` default **50** / offset — not standard `PaginatedList` (lower priority than Partner/Admin). | **P3** | Customer order list growth. | Legacy offset | later / **8** note |

### Already healthy (reference — do not break)

| Surface | Notes |
| ------- | ----- |
| Admin users / orders / audit / customer trust scores | `useServerList` + `PaginatedListResponse` |
| Booking requests (admin + partner) | Server pages; **align default to 10** only |
| Customer desk order history | Server pages; default **10** |
| Partner settlements | Has pages; align default + toolbar |

---

## 2) Pagination migration matrix

Legend: **Done** = standard shape + FE server list · **Partial** = pages exist but wrong default / legacy meta / incomplete FE · **Missing** = array or hard limit / client table.

| Endpoint | Current response | Default size | FE consumer | Status | Priority | Indexes needed? |
| -------- | ---------------- | ------------ | ----------- | ------ | -------- | --------------- |
| `GET /partner/orders` | `PaginatedListResponse` | **10** | `listPartnerOrders`, panel/table/hub/floor | **Done** | — | Existing `(laundry_id, created_at)` |
| `GET /partner/walk-in-orders` | `PaginatedListResponse` | **10** | `PartnerWalkInOrdersView` | **Done** | — | Same order indexes |
| `GET /partner/review-management/reviews` | `PaginatedListResponse` | **10** | `PartnerReviewsView` | **Done** | — | `(laundry_id, created_at)` |
| `GET /partner/operations/pickups|deliveries` | bucket board (status/date scoped, cap **200**) | board | `OwnerLogisticsBoard` | **Done*** | — | status filters |
| `GET /partner/operations/done-today` | `{ orders, total, capped }` | cap **200** | Logistics Done tab | **Done** | — | `delivered_at` |
| `GET /partner/customers` | `PartnerCustomerSummary[]` unbounded aggregate | all | legacy; CRM prefers insights | **Missing** | **P1** | Group-by on orders — review plan |
| `GET /partner/customer-insights/customers` | `PaginatedListResponse` | **10** | `PartnerCustomersView` (`useServerList`) | **Done*** | — | *Directory SQL-paged (Prompt 7); segment filters capped 500 |
| `GET /partner/staff` (via staff mgmt list) | staff array (bounded roster) | all staff | `PartnerStaffView` | **Partial** | **P2** | Roster usually small; OK if documented cap |
| `GET …/staff-management/activity` | `PaginatedListResponse` | **10** | `PartnerStaffView` activity | **Done** | — | activity `(laundry_id, created_at)` |
| `GET /partner/settlements` | paginated summary | **25** | `getPartnerSettlements(page, 25)` | **Partial** | **P1** | existing settlement indexes |
| Booking requests admin/partner list | paginated (+ legacy `PaginationMeta` envelope mix) | **20** | inboxes default 20 | **Partial** | **P1** | existing |
| Customer desk `…/orders` | `PaginatedListResponse` | **10** | desk hooks + prev/next UI | **Done** | — | existing |
| Ops pickup/delivery queues | status/date scoped + hard cap **200** | board | logistics / operations | **Done*** | — | Don’t reload full laundry history |
| `GET /admin/orders` | `PaginatedListResponse` | **10** (trust pattern) | `useServerList` | **Done** | — | existing |
| `GET /admin/users` | `PaginatedListResponse` | **10** | `useServerList` | **Done** | — | existing |
| `GET /admin/audit-logs` | `PaginatedListResponse` | **10** | `useServerList` | **Done** | — | existing |
| `GET /admin/trust-scores` | `PaginatedListResponse` | **10** | `useServerList` | **Done** | — | existing |
| `GET /admin/laundries` | `PaginatedListResponse` | **10** | `useServerList` | **Done** | — | status/city/name |
| `GET /admin/laundries/management` | `PaginatedListResponse` | **10** | `useServerList` | **Done** | — | same |
| `GET /admin/announcements` | `PaginatedListResponse` | **10** | announcements + pagination | **Done** | — | created_at |
| Admin review management list | `PaginatedListResponse` | **10** | `useServerList` | **Done** | — | — |
| Admin laundry trust scores | `PaginatedListResponse` | **10** | `useServerList` | **Done** | — | trust_score |
| Admin inventory change requests | `PaginatedListResponse` | **10** | `useServerList` (30s poll) | **Done** | — | created_at |
| Admin/partner disputes datatable | `total_records` (+ legacy `total`) | **10** | disputes table | **Done** | — | — |
| Revenue analytics laundry table | page/page_size | **25** | admin revenue view | **Partial** | **P2** | — |
| Public/admin laundry discovery lists | limit/offset `pagination_meta` | 20 | discover / legacy | **Partial** | **P3** | existing |
| `GET /orders` (customer) | limit/offset | **50** | customer history | **Partial** | **P3** | existing |
| Partner service catalog | full catalog array | all | catalog / new-order | **Done*** | **P3** | Catalog bounded by design (*confirm upper bound) |

### FE anti-pattern flags (must clear in Prompts 2–5)

| Pattern | Where | Replace with |
| ------- | ----- | ------------ |
| `listPartnerOrders()` → `T[]` | `frontend/services/partner.ts` | `PaginatedList<PartnerOrder>` |
| `useDataTableState` on server dump | ~~admin laundries~~ (cleared Prompt 5) | `useServerList` |
| Client `.filter` as only paging | `PartnerOrdersPanel`, `PartnerCustomersView` | server `status` / `search` |
| Hard `limit: 100` | customers view | `page_size=10` |
| `refetchInterval` on unbounded/capped full list | `usePartnerOrders`, `PartnerOrdersPanel` | page-1 action queue or analytics only |
| Fake audit/notifications from orders | audit + notifications views | dedicated APIs or paginated attention endpoint |

---

## 3) Contract checklist (canonical)

From `PAGINATION_STANDARD.md` — every migrated list must accept:

| Query | Type | Default |
| ----- | ---- | ------- |
| `page` | int ≥ 1 | `1` |
| `page_size` | int ∈ {10, 25, 50, 100} | **`10`** (invalid → 10) |
| `search` | string | optional |
| `sort_by` | string | module default |
| `sort_order` | `asc` \| `desc` | module default |
| + filters | module-specific | — |

Response body (`data`):

```json
{
  "items": [],
  "page": 1,
  "page_size": 10,
  "total_records": 0,
  "total_pages": 1,
  "has_next": false,
  "has_previous": false
}
```

Envelope: `{ "data": { … }, "meta": { … } }`.

Reuse:

- BE: `backend/app/core/pagination.py` (`ListQueryParams`, `build_paginated_response`, `paginate_select`)
- FE: `frontend/lib/pagination/types.ts` (`DEFAULT_PAGE_SIZE = 10`), `use-server-list.ts`, `DataTablePagination`

---

## 4) Performance budget

| Budget | Target |
| ------ | ------ |
| List API p95 | **&lt; 300ms** for `page_size=10` on a typical partner laundry |
| Partner Orders first paint | Table body waits on **≤10** order payloads (not 50+) |
| SQL | Every list query has **LIMIT**; COUNT via efficient subquery/estimate strategy |
| React Query | `queryKey` includes `page`, `page_size`, filters, sort; **no** `refetchInterval` on heavy full lists |
| Dashboard KPIs | Aggregate endpoints only (`/partner/analytics/summary`, ops dashboard) — **never** sum client-side from full order download |
| Mobile | Pagination + toolbar usable at 375px; touch targets ≥44px |

### Current violations (evidence)

1. `PartnerService.list_orders_for_partner` — `.limit(50)` + `selectinload(Order.items)` → heavy rows, still incomplete.
2. `usePartnerOrders` — `refetchInterval: 45_000` on that payload; Overview + Logistics + Notifications share it.
3. `PartnerOrdersPanel` — additional `refetchInterval: 60_000`.
4. Admin laundries — unbounded download + client virtualize/page.

---

## 5) Recommended execution order (Prompts 1–8)

| Order | Prompt | Why this next |
| ----- | ------ | ------------- |
| 1 | **Prompt 1** — Harden defaults to **10** | Low risk; booking desk/settlements/revenue defaults; stops new drift |
| 2 | **Prompt 2** — Partner Orders pagination + FE | Closes UI-01/02/03; unblocks Overview/Reports correctness |
| 3 | **Prompt 3** — People / CRM / desk / staff activity | Closes UI-07/11/14 |
| 4 | **Prompt 4** — Walk-in, logistics Done, reviews, audit | Closes UI-06/08/09/10 |
| 5 | **Prompt 5** — Admin laundries + remaining admin | Closes UI-04/18–21 |
| 6 | **Prompt 6** — Broken UI sweep | Loading/error states, export warnings, `/people` redirect |
| 7 | **Prompt 7** — Perf hardening | Indexes, kill refetch on fat lists, KPI purity |
| 8 | **Prompt 8** — QA matrix + tests + docs lock | Regression gate |

### Suggested PR slicing

1. `chore(pagination): default page_size 10` (Prompt 1)  
2. `feat(partner): paginate GET /partner/orders` (Prompt 2)  
3. `feat(partner): paginate people + desk defaults` (Prompt 3)  
4. `feat(partner): paginate walk-in/reviews/activity` (Prompt 4)  
5. `feat(admin): paginate laundries + leftovers` (Prompt 5)  
6. `fix(ui): partner/admin list UX sweep` (Prompt 6)  
7. `perf: list indexes + query hygiene` (Prompt 7)  
8. `test/docs: pagination matrix` (Prompt 8)

---

## 6) Prompt status tracker

| Prompt | Status |
| ------ | ------ |
| 0 Inventory | **Done** |
| 1 Defaults = 10 | **Done** (2026-08-08) |
| 2 Partner Orders | **Done** (2026-08-08) |
| 3 People / CRM | **Done** (2026-08-08) |
| 4 Logistics / walk-in / reviews | **Done** (2026-08-08) |
| 5 Admin lists | **Done** (2026-08-08) |
| 6 UI sweep | **Done** (2026-08-08) |
| 7 Perf | **Done** (2026-08-08) |
| 8 QA lock | **Done** (2026-08-08) |

---

## 7) Notes for implementers

- **Silent caps are worse than slow full fetches** — UI-01/02 treat “50 rows” as “all orders”. Prefer explicit pagination + `total_records`.
- When paginating `/partner/orders`, **split consumers**:
  - Lists → paginated API
  - Overview brief → analytics + booking badge + ops counts (already partially available)
  - Notifications → small “attention” endpoint or `page_size=10` + status filter
  - Reports export → dedicated export job/stream (do not pretend page-1 CSV is complete)
- Shop Floor Mode: **do not redesign**; only fix if a floor list is unbounded.
- Keep `PartnerOrdersTodayPanel` at `page_size: 5` as a **preview strip**.

---

## Related

- [`docs/qa/partner-admin-pagination-matrix.md`](./partner-admin-pagination-matrix.md)
- [`PAGINATION_STANDARD.md`](../../PAGINATION_STANDARD.md)
- [`.cursor/prompts/ui-fix-and-backend-pagination.md`](../../.cursor/prompts/ui-fix-and-backend-pagination.md)
- [`docs/features/orders-hub.md`](../features/orders-hub.md)
- [`docs/features/partner-owner-command-center.md`](../features/partner-owner-command-center.md)
- [`logs/implementation-log.md`](../../logs/implementation-log.md)
