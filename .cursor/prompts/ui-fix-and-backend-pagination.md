# UI Fix + Backend Pagination — Cursor prompt pack

> Paste prompts **in order** (0 → 8). Each prompt is one focused Cursor Agent session.  
> Goal: **fix broken Partner/Admin UI**, make **every list backend-paginated** (default **10** rows), and keep WashHouse fast on low-end Android + 4G.

## How to use

1. Open a **new Agent chat** per prompt.
2. Copy the full block under that prompt (from `Act as…` to the end of acceptance criteria).
3. Do **not** skip Prompt 0 — it builds the inventory so later prompts do not guess.
4. After Prompt 8, run the QA checklist at the bottom.
5. Prefer **one PR per prompt** (or Prompt 1 alone, then Prompt 2–5 as slices).

## Product north star (read before any prompt)

| Rule | Meaning |
| ---- | ------- |
| **Server owns the list** | Search, filter, sort, page — all in SQL. Never download the full table to the browser. |
| **Default page size = 10** | Allowed: `10`, `25`, `50`, `100`. Invalid → fallback `10`. |
| **One response shape** | `PaginatedListResponse` / `PaginatedList<T>` — see `PAGINATION_STANDARD.md`. |
| **Reuse, don’t invent** | BE: `backend/app/core/pagination.py`. FE: `useServerList` + `DataTablePagination`. |
| **Shop Floor untouched** | Do not redesign `/partner/floor/*` 4-tile home. Pagination on floor boards only if a list already exists. |
| **No fake speed** | No client-side “fake pagination” over a full fetch. That still makes the app slow. |

**Canonical docs / code (already exist):**

| Layer | Path |
| ----- | ---- |
| Spec | `PAGINATION_STANDARD.md` |
| BE core | `backend/app/core/pagination.py`, `backend/app/schemas/common.py` (`PaginatedListResponse`) |
| BE helpers | `backend/app/api/utils.py` (`pagination_meta`), `*_list_params.py` patterns |
| FE types | `frontend/lib/pagination/types.ts` (`DEFAULT_PAGE_SIZE = 10`) |
| FE hook | `frontend/lib/pagination/use-server-list.ts` |
| FE UI | `frontend/components/data-table/data-table-pagination.tsx`, `server-list-toolbar.tsx`, `virtual-data-table.tsx` |
| Reference done | Admin users / orders / audit / trust scores |

**Known hot spots (fix / paginate — confirm in Prompt 0):**

| Surface | Today | Risk |
| ------- | ----- | ---- |
| `GET /partner/orders` + `PartnerOrdersPanel` / `use-partner-operations` | **Full array, no page** | App slows as order volume grows |
| Partner customers insights (`limit: 100`) | Cap, not real pages | Incomplete + heavy |
| Partner reviews / notifications / audit / service catalog | Often unpaginated | Slow Advanced Mode |
| Admin laundries | `useDataTableState` client-side | Full fetch |
| Booking requests / customer desk | Paginated but default **20** in places | Align to **10** |
| Announcements / reviews / fraud | Partial / legacy | Migrate |

---

## Prompt 0 — Inventory: broken UI + unpaginated lists (must run first)

```
Act as product-manager + qa-engineer + performance-optimizer for DLM WashHouse.

Read first:
- AGENTS.md
- .cursor/rules/00-project-overview.md, 01-architecture.md, 11-performance.md, 16-cursor-operating-rules.md
- .cursor/context/current-status.md
- PAGINATION_STANDARD.md
- backend/app/core/pagination.py
- frontend/lib/pagination/types.ts
- frontend/lib/pagination/use-server-list.ts
- docs/features/partner-owner-command-center.md
- docs/features/orders-hub.md
- docs/features/partner-dashboard.md

Outcome:
Produce an inventory document (do NOT start large refactors yet):

Write: docs/qa/ui-and-pagination-inventory.md

Must include:

1) Broken / flaky UI matrix (Partner Advanced + Admin + Customer where relevant)
   Columns: Route | Component | Symptom | Severity (P0–P3) | Repro steps | Likely cause (API / FE contract / a11y / layout) | Owner prompt later (1–7)

   Cover at least:
   - /partner (Owner home)
   - /partner/orders (+ desk, requests, directory tabs)
   - /partner/walk-in-orders
   - /partner/pickups, /partner/deliveries, /partner/logistics
   - /partner/people, /partner/staff, /partner/customers
   - /partner/revenue, /partner/settlements, /partner/reports
   - /partner/reviews, notifications, audit, settings
   - /partner/floor/* (note only — Shop Floor non-goal for redesign)
   - Admin: users, orders, laundries, booking requests, customer desk, trust scores, settlements, disputes

   How to find issues:
   - Grep for empty catch, toast.error without UI, hardcoded slice(, limit: 100, useDataTableState, list* without page_size
   - Compare FE service paths vs BE routes (contract drift)
   - Note missing loading / empty / error states
   - Note pagination UI missing when API already paginates

2) Pagination migration matrix
   Columns: Endpoint | Current response | Default size | FE consumer | Status (Done / Partial / Missing) | Priority (P0–P3) | Indexes needed?

   Explicitly flag:
   - GET /partner/orders (currently returns full list)
   - Partner customers / reviews / staff activity / notifications
   - Admin laundries (client-side table)
   - Any endpoint still using offset/limit meta instead of PaginatedListResponse
   - Any FE still using useDataTableState on server data that should be useServerList

3) Contract checklist (copy from PAGINATION_STANDARD.md)
   - Query: page, page_size (default 10), search, sort_by, sort_order + module filters
   - Response: items, page, page_size, total_records, total_pages, has_next, has_previous
   - Envelope: { data, meta }

4) Performance budget (targets)
   - List API p95 < 300ms for page_size=10 on typical partner laundry
   - Partner Orders first paint: never wait on >10 order payloads for the table
   - No list query without LIMIT
   - React Query: stable queryKeys including page + filters; no refetchInterval on huge unpaginated lists

5) Recommended execution order for Prompts 1–8 (based on severity × traffic)

Acceptance criteria:
- [ ] docs/qa/ui-and-pagination-inventory.md committed with both matrices filled
- [ ] At least 5 P0/P1 UI bugs named with repro
- [ ] Every Partner + Admin list endpoint classified Done/Partial/Missing
- [ ] Clear “do next” order for Prompt 1+
- [ ] Update logs/implementation-log.md with inventory summary
- [ ] Do NOT change production code in this prompt except docs/logs
```

---

## Prompt 1 — Harden the platform pagination contract (default 10 everywhere)

```
Act as backend-architect + frontend-architect for DLM WashHouse.

Read first:
- PAGINATION_STANDARD.md
- docs/qa/ui-and-pagination-inventory.md (from Prompt 0)
- backend/app/core/pagination.py
- backend/app/schemas/common.py
- backend/app/api/list_params.py (if present) and *_list_params.py examples
- frontend/lib/pagination/types.ts
- frontend/lib/pagination/use-server-list.ts
- frontend/components/data-table/data-table-pagination.tsx
- .cursor/rules/05-api-standards.md, 11-performance.md

Outcome:
Make the pagination contract impossible to misuse. Default page_size MUST be 10. Align partial modules without migrating every list yet.

Plan (post 3–7 steps, then implement):

1) Backend
   - Confirm DEFAULT_PAGE_SIZE = 10 and ALLOWED_PAGE_SIZES = {10,25,50,100} in core/pagination.py
   - Audit Query(default=20|25|…) on list endpoints; change defaults to 10 UNLESS inventory marks a deliberate exception (document why)
   - Ensure build_paginated_response + PaginatedListResponse are the only shapes for new/migrated lists
   - Add a short helper or docstring in list_params pattern so new endpoints copy the standard
   - Booking requests / customer desk / settlements: align default page_size to 10 (keep max 100)

2) Frontend
   - Confirm DEFAULT_PAGE_SIZE = 10
   - Grep for page_size: 20|25|50 as hard defaults in Partner/Admin list UIs → set default 10 (user can still pick 25/50/100)
   - Ensure DataTablePagination page-size options stay [10,25,50,100]
   - Export a tiny shared constant usage note in PAGINATION_STANDARD.md “Migration Status” if needed

3) Tests
   - Unit: normalizePageSize / ListQueryParams.from_query rejects 15 → 10
   - API: one existing paginated endpoint asserts default page_size=10 when omitted
   - FE: adjust tests that assumed page_size 20 defaults

4) Docs
   - Update PAGINATION_STANDARD.md Migration Status table if defaults changed
   - logs/implementation-log.md + logs/feature-progress.md

Non-goals:
- Do not migrate /partner/orders in this prompt (that is Prompt 2)
- Do not redesign Shop Floor
- Do not change business filters semantics

Acceptance criteria:
- [ ] Omitting page_size on standardized list endpoints returns 10
- [ ] Invalid page_size falls back to 10
- [ ] FE list hooks/panels that had default 20 now default to 10
- [ ] Tests green for changed defaults
- [ ] Inventory doc note: “Prompt 1 done”
```

---

## Prompt 2 — P0: Partner Orders backend pagination + FE wiring

```
Act as backend-architect + frontend-architect for DLM WashHouse.

Read first:
- docs/qa/ui-and-pagination-inventory.md
- PAGINATION_STANDARD.md
- backend/app/api/v1/endpoints/partner.py (GET /partner/orders)
- backend/app/services/partner_service.py (list_orders_for_partner)
- frontend/services/partner.ts (listPartnerOrders)
- frontend/features/partner/partner-orders-panel.tsx
- frontend/features/partner/hooks/use-partner-operations.ts
- frontend/features/partner/orders-hub/** (today panel, hub tabs)
- frontend/lib/pagination/use-server-list.ts
- Reference: backend trust_score / admin list_orders_paginated pattern

Outcome:
Replace unpaginated partner order lists with backend-driven pagination (default 10). Fix any broken order-list UI discovered in inventory for this surface.

Plan:

1) Backend
   - Add PartnerOrdersListParams (page, page_size=10, search, sort_by, sort_order, status/filter bucket if needed)
   - Repository/service: count + LIMIT/OFFSET; apply search (order id / customer name / phone) and sort in SQL
   - GET /partner/orders returns PaginatedListResponse[PartnerOrder…] inside success_envelope
   - Preserve authz: partner only sees own laundry orders
   - Indexes: verify orders(laundry_id, created_at) / status composites; add migration only if EXPLAIN needs it
   - Keep detail/mutation routes unchanged

2) Compatibility
   - Prefer clean break to paginated shape (update all FE callers in this PR)
   - Grep listPartnerOrders / partnerOrders queryKeys — update every caller
   - Operations center / logistics derived views: either request filtered pages OR use dedicated summary endpoints — NEVER re-fetch all orders

3) Frontend
   - listPartnerOrders(params: ListQueryState & filters) → PaginatedList<PartnerOrder>
   - PartnerOrdersPanel + Orders Hub lists: useServerList (or equivalent) + DataTablePagination
   - Default page_size 10; show total_records; loading/empty/error
   - Filter tabs (action/active/done/all): server filter, reset page to 1 on change
   - use-partner-operations: stop depending on full order array; use analytics/summary + paginated slices as needed
   - Mobile: pagination stacks; touch targets ≥44px

4) UI bugfixes (orders surface only)
   - Fix inventory P0/P1 bugs on /partner/orders (broken buttons, missing states, wrong empty copy, layout overflow)

5) Tests
   - pytest: page 1 returns ≤10; total_records accurate; search/filter; unauthorized laundry isolation
   - FE unit/RTL or Playwright smoke: pagination controls change page; filter resets page
   - Update any mocks that returned PartnerOrder[]

6) Docs
   - Update PAGINATION_STANDARD.md Migration Status: Partner orders = Done
   - docs/features/orders-hub.md note on server pagination
   - logs/*

Non-goals:
- Shop Floor redesign
- Invoice/tags feature work
- Admin orders (already done unless broken)

Acceptance criteria:
- [ ] Network tab: /partner/orders?page=1&page_size=10 returns ≤10 items
- [ ] Changing page/size/search hits the API (no client-only slice of full list)
- [ ] Partner with 50+ orders: UI stays responsive
- [ ] All previous listPartnerOrders callers compile and behave
- [ ] P0/P1 order-list UI bugs from inventory closed
- [ ] Tests pass
```

---

## Prompt 3 — Partner People + CRM lists (customers, staff activity, desk)

```
Act as backend-architect + frontend-architect for DLM WashHouse.

Read first:
- docs/qa/ui-and-pagination-inventory.md
- docs/features/partner-owner-command-center.md (People pillar)
- docs/features/customer-desk.md (if present)
- backend customer insights / customer desk endpoints
- frontend/features/partner/views/partner-customers-view.tsx (limit: 100 hot spot)
- frontend/features/partner/customer-desk/**
- frontend/features/partner/people/** or staff views
- PAGINATION_STANDARD.md

Outcome:
All People-pillar lists are backend-paginated (default 10). Fix broken CRM/desk UI from inventory.

Must migrate / align:
1) Partner customer directory / insights lists — replace limit:100 full dumps with page + page_size=10 (+ search)
2) Customer desk order history — default page_size 10; ensure pagination UI always visible when total_pages > 1
3) Staff roster if returning unbounded arrays — paginate or confirm small bounded set; activity logs MUST paginate
4) Fix inventory UI bugs on /partner/people, desk, directory (empty states, tab state, broken links)

Rules:
- useServerList + DataTablePagination (or mobile prev/next that uses same API params)
- Search debounced 300ms server-side
- No invented customer metrics
- Keep Shop Floor intake flows unchanged

Tests + docs + logs required.

Acceptance criteria:
- [ ] No Partner People list fetches > page_size records for table body
- [ ] Default 10; selector 10/25/50/100
- [ ] Desk/directory pagination works on mobile
- [ ] Inventory People bugs P0/P1 fixed
```

---

## Prompt 4 — Partner Logistics + Walk-in + secondary lists

```
Act as backend-architect + frontend-architect for DLM WashHouse.

Read first:
- docs/qa/ui-and-pagination-inventory.md
- docs/features/partner-owner-command-center.md (Logistics)
- Pickups/deliveries/logistics views + APIs
- Walk-in orders list API + FE
- Partner reviews, notifications, audit views
- Service catalog list (if unbounded)

Outcome:
Paginate every remaining Partner Advanced list that can grow without bound. Fix related broken UI.

Priority order (adjust if inventory differs):
1) Walk-in orders list
2) Pickups / deliveries boards or tables (if they load full order sets — switch to paginated or date-scoped server queries)
3) Reviews list
4) Notifications list
5) Audit / recent activity tables (partner-audit-view slice(0,20) → real pages)
6) Any other inventory “Missing” Partner endpoint

For board UIs (kanban): prefer date-scoped + status-filtered server queries with a max cap OR paginated columns — document the choice in the inventory. Do not silently load all open orders forever.

UI fixes:
- Broken filters, sticky headers, horizontal scroll, empty illustrations, error retry on these routes

Tests: API page boundaries + one Playwright smoke per major list.
Docs: PAGINATION_STANDARD Migration Status + logs.

Acceptance criteria:
- [ ] No Partner Advanced list endpoint returns unbounded arrays for UI tables
- [ ] Default page_size 10
- [ ] Logistics/walk-in remain usable on phone
- [ ] Inventory P0/P1 for these routes closed
```

---

## Prompt 5 — Admin remaining lists + client-side table purge

```
Act as backend-architect + frontend-architect for DLM WashHouse.

Read first:
- docs/qa/ui-and-pagination-inventory.md
- PAGINATION_STANDARD.md Migration Status
- frontend admin laundries (useDataTableState)
- Announcements, reviews, fraud, laundry trust scores, disputes legacy total
- Reference: admin-users-table.tsx + useServerList

Outcome:
Eliminate client-side full-fetch tables in Admin. Align legacy pagination meta to PaginatedListResponse.

Must do:
1) Admin laundries: backend page/search/sort + useServerList; remove useDataTableState for server data
2) Announcements: migrate offset → standard page/page_size response if still legacy
3) Disputes: finish total → total_records alignment; FE uses standard types
4) Any inventory Missing Admin list

UI fixes for Admin list pages from inventory (toolbar, pagination, empty, error).

Non-goals: redesign Admin IA; Partner work (done in 2–4).

Acceptance criteria:
- [ ] Grep frontend/features/admin: no useDataTableState on data that came from an unpaginated list API
- [ ] Defaults page_size=10
- [ ] PAGINATION_STANDARD Migration Status updated
- [ ] Tests pass
```

---

## Prompt 6 — Broken UI sweep (layout, contracts, states) — non-list bugs

```
Act as frontend-architect + ui-ux-designer + qa-engineer for DLM WashHouse.

Read first:
- docs/qa/ui-and-pagination-inventory.md (UI matrix — all open bugs not closed by Prompts 2–5)
- .cursor/rules/13-ui-ux.md, 10-accessibility.md, 19-responsive-design.md
- docs/features/partner-owner-command-center.md
- Partner shell/nav, Owner home, Money, Logistics

Outcome:
Fix remaining broken UI that is NOT a missing pagination feature: layout overflow, dead buttons, wrong empty states, dark-mode contrast, tab deep-links, stale queryKeys after mutations, form validation, modal traps, etc.

Rules:
- Smallest diffs; match existing design tokens (tokens.css)
- Mobile-first; verify light + dark
- No purple-gradient / cream-terracotta AI aesthetics
- Do not touch Shop Floor 4-tile composition unless inventory marks a true functional bug
- After each fix: loading + empty + error + success paths still work
- Prefer fixing root cause (API contract / query invalidation) over cosmetic patches

Deliver:
- Checklist in docs/qa/ui-and-pagination-inventory.md marking each bug Fixed / Won’t fix (with reason)
- logs/implementation-log.md
- Screenshot notes or Playwright assertions for P0 bugs

Acceptance criteria:
- [ ] All inventory P0 UI bugs Fixed
- [ ] All P1 Fixed or explicitly deferred with ticket note
- [ ] No new a11y regressions on touched pages (labels, focus, contrast)
- [ ] Partner Advanced + Admin smoke paths work manually
```

---

## Prompt 7 — Performance hardening (keep the app from ever getting slow)

```
Act as performance-optimizer + backend-architect + frontend-architect for DLM WashHouse.

Read first:
- .cursor/rules/11-performance.md
- .cursor/agents/performance-optimizer.md
- .cursor/checklists/performance.md
- docs/qa/ui-and-pagination-inventory.md
- PAGINATION_STANDARD.md
- Partner overview / analytics endpoints (ensure dashboards don’t pull full order lists)
- React Query usage: refetchInterval on list queries

Outcome:
Hardening pass so lists and dashboards stay fast as data grows.

Must:
1) Grep FE for list* fetchers that ignore page_size or request page_size=100 unnecessarily — fix
2) Ban pattern: fetch all then .slice / useDataTableState on server entities — fail CI note or eslint comment in PR if easy; at least fix remaining instances
3) Analytics/KPI endpoints must be aggregate SQL — never “load orders and sum in Python/TS”
4) React Query:
   - staleTime sensible for lists
   - refetchInterval only on small payloads (or page 1 action queue), never on unbounded lists
   - queryKeys include page, page_size, filters, sort
5) Backend:
   - EXPLAIN ANALYZE on Partner orders + top 3 list queries; add indexes via Alembic if needed (reversible)
   - Ensure COUNT + page query are efficient (avoid N+1; use joinedload sparingly)
6) Optional: VirtualDataTable only when page_size is large; default UI can be simple table + DataTablePagination
7) Record before/after in logs/performance-log.md

Acceptance criteria:
- [ ] No production list UI depends on full-table download
- [ ] Partner orders + admin laundries + people lists verified page_size=10 in network panel
- [ ] Indexes added if seq scans found
- [ ] performance-log.md updated
- [ ] App feels snappy with seeded 200+ orders for one laundry (script or factory in tests)
```

---

## Prompt 8 — QA matrix, regression tests, docs lock

```
Act as qa-engineer + documentation-writer for DLM WashHouse.

Read first:
- docs/qa/ui-and-pagination-inventory.md
- PAGINATION_STANDARD.md
- .cursor/checklists/new-feature.md, post-flight.md
- docs/testing/strategy.md
- Existing Playwright partner/admin specs

Outcome:
Prove pagination + UI fixes and lock the standard so future features don’t regress.

Deliver:

1) docs/qa/partner-admin-pagination-matrix.md
   Rows: each migrated list
   Columns: API default 10 | search | sort | filter | FE pagination UI | mobile | empty | error | test file

2) Automated tests
   - Backend: parametrize page_size defaults + boundary (page 2, empty page, invalid size → 10)
   - Playwright: Partner Orders page size + next page; Admin one list; Customer desk if applicable
   - Assert response has total_records and items.length ≤ page_size

3) Update
   - PAGINATION_STANDARD.md Migration Status → all critical modules Done or dated deferrals
   - .cursor/context/current-status.md — note “list pagination standard enforced (default 10)”
   - docs/features/orders-hub.md / partner-dashboard.md cross-links
   - logs/feature-progress.md, implementation-log.md

4) Definition of Done gate (copy into PAGINATION_STANDARD.md):
   “New list endpoint without PaginatedListResponse + useServerList is incomplete.”

Acceptance criteria:
- [ ] Matrix green for all P0/P1 lists
- [ ] CI tests added/updated and passing locally
- [ ] Inventory shows zero open P0 bugs
- [ ] Short PR summary: what was fixed, how to verify, residual risks
```

---

## Master paste (optional) — run only if you want one mega-session

Use only when you can supervise a long Agent run. Prefer Prompts 0→8 separately.

```
Act as the DLM WashHouse team (PM + backend-architect + frontend-architect + qa + performance-optimizer).

Execute the full program in .cursor/prompts/ui-fix-and-backend-pagination.md from Prompt 0 through Prompt 8.

Hard rules:
- Backend-driven pagination only; default page_size=10; allowed 10/25/50/100
- Follow PAGINATION_STANDARD.md; reuse core/pagination.py and useServerList
- Fix broken UI from the inventory; do not redesign Shop Floor
- Never fake-paginate a full client fetch
- Update docs/qa inventory, PAGINATION_STANDARD Migration Status, logs/*, tests
- Stop after each prompt’s acceptance criteria and summarize before continuing
```

---

## Final QA checklist (human + Agent)

After Prompt 8:

- [ ] Partner Orders: only 10 rows load by default; Next loads page 2 from API
- [ ] Partner People / desk / walk-in / reviews: same
- [ ] Admin laundries: server pagination (not client filter of all)
- [ ] Booking requests / desk defaults are 10
- [ ] Broken UI inventory P0 = 0 open
- [ ] Dark + light, mobile 375px and desktop
- [ ] Network waterfall: no multi-thousand-row JSON on dashboard open
- [ ] pytest + Playwright green for pagination specs
- [ ] `PAGINATION_STANDARD.md` reflects reality

## Anti-patterns (reject in code review)

1. `listPartnerOrders()` with no params returning `T[]`
2. `useDataTableState` on a full API dump
3. `limit: 100` “because pagination is hard”
4. Default `page_size=20` or `25` without documenting an exception
5. Client `.filter` / `.sort` / `.slice` as the only pagination
6. Dashboard computing KPIs by downloading all orders
7. Silent empty UI on API error (must show retry)

## Related prompts

- [`partner-owner-command-center.md`](partner-owner-command-center.md) — Owner UX (separate; don’t conflict)
- [`fix-bug.md`](fix-bug.md) — single bug
- [`performance-review.md`](performance-review.md) — measure one hotspot
- [`api-production-ready.md`](api-production-ready.md) — API connectivity master
- [`fix-api-frontend-contracts.md`](fix-api-frontend-contracts.md) — contract drift
