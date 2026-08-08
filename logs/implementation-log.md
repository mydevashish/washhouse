# Implementation Log

> Append-only. Newest at the top. Use `.cursor/templates/log-entry.md`.

---

## 2026-08-08 — Pagination QA lock (Prompt 8)

- **Type:** test / docs
- **Scope:** ui-fix-and-backend-pagination
- **Files:** `docs/qa/partner-admin-pagination-matrix.md`, `test_admin_laundries_pagination.py`, `frontend/tests/e2e/partner-pagination.spec.ts`, `admin_list_params.py` (`_optional_str`), `PAGINATION_STANDARD.md` DoD gate, inventory/status/logs, feature cross-links
- **Summary:** Locked Partner/Admin pagination: matrix green for P0/P1, boundary tests (default 10 / page 2 / empty / invalid→10), Playwright Next-page smoke, zero open P0 in inventory.
- **Risks:** Public directory still concatenates pages (limit 100); notifications derived; insights segment filters cap 500; Playwright needs auth seed (`E2E_SKIP_AUTH=1` skips).
- **Next:** Dated deferrals only — no further pack prompts.
- **Refs:** `docs/qa/partner-admin-pagination-matrix.md`, `PAGINATION_STANDARD.md`

---

## 2026-08-08 — Performance hardening (Prompt 7)

- **Type:** perf
- **Scope:** ui-fix-and-backend-pagination
- **Files:** laundry trust list (no N+1), admin reviews laundry join, ops `count_pending_tasks`, customer insights SQL page, Shop Floor remove poll, reports page_size 25, customer orders limit 10, Alembic `20260808_0041`, `logs/performance-log.md`
- **Summary:** Lists/dashboards stay lean as volume grows. Indexes for `(laundry_id, status, created_at)` and laundry `trust_score`. Documented ban on `useDataTableState` for server entities.
- **Risks:** Insights segment filters still cap at 500 enriched rows; trust list shows stored score (detail recalculates).
- **Next:** Prompt 8 — QA matrix / regression / docs lock.
- **Refs:** `logs/performance-log.md`, `PAGINATION_STANDARD.md`

---

## 2026-08-08 — Broken UI sweep (Prompt 6)

- **Type:** fix / ux
- **Scope:** ui-fix-and-backend-pagination
- **Files:** notifications + action-center order deep-links; logistics `?tab=` URL sync; ops/done-today invalidate; money/settlements/logistics error≠empty; settlements `DataTablePagination`; `/partner/people` redirect; remove dead Top services panel; shell nav contrast
- **Summary:** Closed open inventory UI bugs that were not pagination features (UI-05/12/16 + UI-24–28). P0 list bugs already Fixed in Prompts 2–5. UI-13/22 confirmed already at default 10.
- **Risks:** Notifications still derived from order pages (no dedicated inbox API); full People hub tabs deferred (redirect only).
- **Next:** Prompt 7 — performance hardening.
- **Refs:** `docs/qa/ui-and-pagination-inventory.md`

---

## 2026-08-08 — Admin lists pagination + client-table purge (Prompt 5)

- **Type:** feat / perf
- **Scope:** ui-fix-and-backend-pagination
- **Files:** admin laundries (+ management) pages; announcements/reviews/laundry-trust/inventory-change `PaginatedListResponse`; disputes `total_records` FE; `useServerList` + `DataTablePagination`; e2e mocks; marketplace chain assert on `.items`
- **Summary:** Closed inventory UI-04/18–21. Admin list UIs no longer full-fetch then client-page. Defaults page_size=10; laundry option helpers capped at 100. Grep: no `useDataTableState` under `frontend/features/admin`.
- **Risks:** Laundry trust still recomputes metrics per row on the current page (ordered by stored score); owner-name search not in SQL yet.
- **Next:** Prompt 6 — broken UI sweep (non-list bugs).
- **Refs:** `docs/qa/ui-and-pagination-inventory.md`, `PAGINATION_STANDARD.md`

---

## 2026-08-08 — Partner logistics + walk-in + secondary lists (Prompt 4)

- **Type:** feat / perf
- **Scope:** ui-fix-and-backend-pagination
- **Files:** walk-in paginated list; reviews `PaginatedList`; ops queues status/date-scoped (cap 200) + `GET /operations/done-today`; logistics/audit/notifications FE; tests + docs
- **Summary:** Closed inventory UI-05/06/08/09/10. Walk-in and reviews use standard pages (default 10). Logistics boards no longer download all laundry orders; Done today is date-scoped. Audit pages real order list; notifications show loading/error and truncation honesty. Service catalog left unbounded (small) as P3.
- **Risks:** Ops boards hard-cap at 200 open/today rows — document if a laundry exceeds that; notifications still not a dedicated attention API.
- **Next:** Prompt 5 — Admin laundries + remaining admin lists.
- **Refs:** `docs/qa/ui-and-pagination-inventory.md`, `PAGINATION_STANDARD.md`

---

## 2026-08-08 — Partner People/CRM pagination (Prompt 3)

- **Type:** feat / perf
- **Scope:** ui-fix-and-backend-pagination
- **Files:** customer insights API/service/schema (`page`/`page_size`/`search`, `new_this_week`), staff activity repo count + `PaginatedListResponse`, FE `PartnerCustomersView`/`PartnerStaffView` `useServerList` + `DataTablePagination`, CRM strip uses dashboard metric, tests + docs
- **Summary:** People-pillar lists no longer dump/cap at 100/50. Customers directory searches server-side (300ms debounce via `useServerList`); staff activity pages default 10; desk order history already default 10 with prev/next. Closed inventory UI-07/11/14.
- **Risks:** Customer insights still aggregates in Python then slices (same as before) — SQL pushdown deferred; roster remains full small array by design.
- **Next:** Prompt 4 — walk-in / logistics / reviews / audit.
- **Refs:** `docs/qa/ui-and-pagination-inventory.md`, `PAGINATION_STANDARD.md`

---

## 2026-08-08 — Partner orders backend pagination (Prompt 2)

- **Type:** feat / perf
- **Scope:** ui-fix-and-backend-pagination
- **Files:** `partner_orders_list_params.py`, `partner_service.list_orders_for_partner_paginated`, `GET /partner/orders` → `PaginatedListResponse`, FE `listPartnerOrders` + `useServerList` panel/table, hub/overview/notifications/audit/reports/logistics/floor callers, tests, docs
- **Summary:** Partner order lists are server-paginated (default **10**, buckets action/active/done/all, search/sort). Overview/KPI counts prefer analytics + ops; reports warn when export is capped at 100; Shop Floor uses page_size 50. Closed inventory UI-01/02/03 for silent 50-cap.
- **Risks:** Reports/service breakdown no longer invent full-history CSV; floor boards still capped at 50 open rows until a dedicated floor API.
- **Next:** Prompt 3 — People / CRM pagination.
- **Refs:** `docs/qa/ui-and-pagination-inventory.md`, `PAGINATION_STANDARD.md`

---

## 2026-08-08 — Pagination defaults hardened to 10 (Prompt 1)

- **Type:** chore / perf contract
- **Scope:** ui-fix-and-backend-pagination
- **Files:** `backend/app/core/pagination.py` (`normalize_page_size`), `list_params.py` docstring, booking/desk/settlements/disputes/revenue/reviews/announcements/staff/insights/orders/laundries search defaults, matching FE inbox/desk/settlements/disputes/revenue/announcements defaults, unit + FE types tests, `PAGINATION_STANDARD.md`, inventory tracker, logs
- **Summary:** Default `page_size`/`limit` for standardized and partial list APIs is **10**; invalid sizes fall back to 10. FE list UIs that hard-coded 20/25/50 now default to 10 (users can still pick 25/50/100). Exceptions documented: desk typeahead limit≤20, public laundry directory page size 100, preview strips page_size 5/1. Did **not** migrate `GET /partner/orders` (Prompt 2).
- **Risks:** Clients that relied on implicit 20/25 rows without sending `page_size` now see 10 until they opt up.
- **Next:** Prompt 2 — paginate Partner Orders.
- **Refs:** `docs/qa/ui-and-pagination-inventory.md`, `PAGINATION_STANDARD.md`

---

## 2026-08-08 — UI + pagination inventory (Prompt 0)

- **Type:** docs / qa
- **Scope:** ui-fix-and-backend-pagination
- **Files:** `docs/qa/ui-and-pagination-inventory.md`, `.cursor/prompts/ui-fix-and-backend-pagination.md` (prior), `logs/implementation-log.md`
- **Summary:** Full Partner + Admin inventory of broken/flaky list UIs and pagination gaps. Confirmed platform standard exists (`DEFAULT_PAGE_SIZE=10`) but hot paths ignore it: `GET /partner/orders` + walk-in hard-capped at 50 (array), customers CRM `limit:100` + client search, admin laundries unpaginated + `useDataTableState`, booking/desk/settlements defaults 20/25. Named 5+ P0/P1 bugs (UI-01…UI-11) with repros; migration matrix + perf budget + Prompt 1→8 order.
- **Risks:** Inventory is static code analysis — runtime Lighthouse/EXPLAIN deferred to Prompt 7.
- **Next:** Prompt 1 (align defaults to 10), then Prompt 2 (paginate Partner Orders).
- **Refs:** `PAGINATION_STANDARD.md`, `.cursor/prompts/ui-fix-and-backend-pagination.md`

---

## 2026-08-08 — Partner Owner Command Center P4 (logistics board)

- **Type:** feat + ux
- **Scope:** partner-owner-command-center
- **Files:** `owner-logistics.ts` (+ test), `owner-logistics-board.tsx`, `owner-logistics-run-card.tsx`, `partner-logistics-view.tsx`, `/partner/logistics` page, pickups/deliveries wrappers, `partner-nav` Logistics hub + aliases, search-index, docs/logs
- **Summary:** Image-led Logistics hub with Needs pickup / Out for delivery / Done today. Run cards: status+icon, call, advance/accept, assign/reassign rider via operations APIs. Search + rider filter. Nav single Logistics item; legacy routes reuse board.
- **Risks:** Address line omitted (API rows lack address); Done today uses `delivery_at` day window on listed orders only.
- **Next:** Prompt 5 — Customers CRM polish.
- **Refs:** `docs/features/partner-owner-command-center.md`

---

## 2026-08-08 — Partner Owner Command Center P3 (money intelligence)

- **Type:** feat
- **Scope:** partner-owner-command-center
- **Files:** `partner_money_math.py`, `partner_service.py` analytics, `schemas/partner.py`, `test_partner_money_math.py`, `test_partner.py` money cases, FE `partner.ts`, `partner-revenue-view.tsx`, `owner-money-pulse.tsx`, `partner-revenue-chart.tsx`, `partner-settlements-view.tsx` banner, e2e mock, docs/logs
- **Summary:** Extended analytics/summary with effective commission %, snapshotted commission ₹, partner net, prior periods, null-safe growth, walk-in/doorstep gross. Money page: period tabs, net hero, explainer, chart. Overview pulse shows net + rate. Settlements links to Money.
- **Risks:** Local pytest API needs DB (password auth failed in this environment); unit helpers verified via import. Month gross still uses `created_at` (legacy); today/week use `updated_at`.
- **Next:** Prompt 4 — Logistics board.
- **Refs:** `docs/features/partner-owner-command-center.md`, `commission.md`

---

## 2026-08-08 — Partner Owner Command Center P2 (agentic Overview)

- **Type:** feat + ux
- **Scope:** partner-owner-command-center
- **Files:** `partner-overview-view.tsx`, `owner-brief.ts` (+ test), `owner-money-pulse.tsx`, `owner-floor-strip.tsx`, `owner-home-motion.tsx`, `services/partner.ts` optional money fields, docs/logs
- **Summary:** Advanced `/partner` rebuilt as one-composition Owner home: greeting + CTAs, Do-next brief (real counts, calm empty), Money pulse (gross live; %/net/growth placeholders for P3), illustrated pillars, floor strip, recent orders, shop card. Removed 8-KPI grid + status chart. Motion respects `prefers-reduced-motion`. Shop Floor via `PartnerHomeView` unchanged.
- **Risks:** Platform % / net still “—” until P3 API; greeting uses client clock after mount.
- **Next:** Prompt 3 — analytics money fields + Revenue UI.
- **Refs:** `docs/features/partner-owner-command-center.md`

---

## 2026-08-08 — Partner Owner Command Center P1 (nav + primitives)

- **Type:** feat
- **Scope:** partner-owner-command-center
- **Files:** `partner-nav.ts`, `partner-shell.tsx`, `(partner)/layout.tsx` Suspense, `features/partner/components/owner/*`, `partner-overview-view.tsx` (light demo), nav/hub/shop-floor tests, docs/logs
- **Summary:** Advanced sidebar regrouped into Today / Operations / Logistics / People / Money (+ shop + system). Owner primitives with catalog/marketing images. Customers nav highlights on `?tab=directory`. Shell subtitle “Owner command center”. Shop Floor unchanged.
- **Risks:** `useSearchParams` requires Suspense on partner layout; overview still has legacy KPI grid until P2.
- **Next:** Prompt 2 — agentic Advanced overview (replace KPI wall).
- **Refs:** `docs/features/partner-owner-command-center.md`

---

## 2026-08-08 — Partner Owner Command Center spec (Prompt 0)

- **Type:** docs
- **Scope:** partner-owner-command-center
- **Files:** `docs/features/partner-owner-command-center.md`, `docs/features/README.md`, `partner-dashboard.md`, `docs/product/traceability.md`, `logs/feature-progress.md`, `.cursor/context/current-status.md`
- **Summary:** Locked Advanced Mode Owner Command Center IA — 5 pillars (Today / Orders / Logistics / People / Money), agentic home, money model (gross · platform % · net · growth), image inventory, API gap on `analytics/summary`, P1–P7 slice map. Shop Floor explicitly out of scope.
- **Risks:** None (spec only).
- **Next:** Prompt 1 — nav regroup + `frontend/features/partner/components/owner/` primitives.
- **Refs:** `.cursor/prompts/partner-owner-command-center.md`

---

## 2026-08-08 — Shop Floor literacy polish (a11y + calm UX)

- **Type:** feat + a11y + perf
- **Scope:** partner-shop-floor
- **Files:** `walk-in-success-panel`, `floor-voice*`, `floor-coach*`, `phone-numeric-keypad`, `color-token-bar`, Cloth Wall / print tags+bill, More/Settings toggles, `catalog-garment-thumb` lazy, docs/qa + feature + logs
- **Summary:** Calm success (“Order save हो गई” + soft check); opt-in Web Speech gated by setting / reduced-motion / Sound OFF; stripe-dot patterns on color bars; huge phone keypad; sticky coach for first 3 orders; lazy catalog tiles; Shop Floor home stays chart-free (TTI ≤2.5s).
- **Risks:** Web Speech voice/lang varies by device; coach count is per-browser localStorage only.
- **Next:** Facilitator run of usability checklist; QR image; optional floor today API.
- **Refs:** `docs/features/partner-shop-floor.md`, `docs/qa/partner-shop-floor-usability.md`

---

## 2026-08-08 — Shop Floor usability checklist + journey tests

- **Type:** docs + test
- **Scope:** partner-shop-floor
- **Files:** `docs/qa/partner-shop-floor-usability.md`, `partner-shop-floor-journey.spec.ts`, Practice mode store/toggle/banner, More/Settings, `partner-shell`, logs/docs
- **Summary:** Timed partner usability checklist (create/tags/bill/wash-ready/phone reprint) with staging seed steps. Playwright happy-path journey on shop_floor; Practice mode is a localStorage training banner (no fake API layer — seed/staging data documented).
- **Risks:** Practice mode does not isolate from live APIs if someone enables it on production; facilitators must use seed accounts.
- **Next:** Run checklist with 3–5 real counter staff; optional Ready phone keypad.
- **Refs:** `docs/qa/partner-shop-floor-usability.md`, `docs/features/partner-shop-floor.md`

---

## 2026-08-08 — Shop Floor Today + Ready boards

- **Type:** feat
- **Scope:** partner-shop-floor
- **Files:** `floor-status.ts`, `use-floor-order-advance`, Today/Ready views + cards, home tile badges, empty states, Playwright advance flow, docs/logs
- **Summary:** `/partner/floor/today` card list (color/token/photos/CTA) with filters; advances Received→Washing→Ready via existing accept + PATCH (doorstep Ready chains ironing). Ready board: Give clothes + Print Bill + Call + Diya confirm → walk-in `delivered`. Home tiles show needs-attention counts; picture empty states in Hinglish.
- **Risks:** Online doorstep from `pickup_assigned` still needs evidence for `picked_up`; no dedicated floor today API yet (uses `GET /partner/orders`).
- **Next:** QR image; optional floor today DTO; Ready search keypad; laundry GSTIN.
- **Refs:** `docs/features/partner-shop-floor.md`

---

## 2026-08-08 — Partner invoice + counter bill print

- **Type:** feat
- **Scope:** partner-shop-floor
- **Files:** `invoice_service`, `order_invoice_service`, schemas + partner endpoints, FE bill/invoice print routes + `PrintOrderActions`, Ready list CTAs, globals print chrome split, tests, docs/logs
- **Summary:** `GET /partner/orders/{id}/invoice` (+ HTML `variant=bill|gst`) allocates `invoice_number` once (`WH-{year}-{tracking}`), echoes frozen GST/totals. FE thermal bill + A4 GST with garment thumbs, huge total, color token. CTAs on Success, Order detail, Ready, Print center. Reprint idempotent.
- **Risks:** Laundry GSTIN still null (shown as —); invoice number not allocated at create (first print/fetch); Diya confirm still stub.
- **Next:** Today boards + Diya; optional allocate-on-create; laundry GSTIN field; QR image.
- **Refs:** `docs/features/partner-shop-floor.md`

---

## 2026-08-08 — Shop Floor color tokens + tag print

- **Type:** feat
- **Scope:** partner-shop-floor
- **Files:** migration `20260808_0040`, `ColorToken` enum, `color_token_service`, `order_tags_service`, walk-in/partner schemas + tags endpoints, FE print route + Print center, chips on cards/detail, Playwright, docs/logs
- **Summary:** Walk-in create assigns least-used color + daily IST `token_day_number` → `token_code` (`R-42`). `GET /partner/orders/{id}/tags` (+ optional HTML print). Success → `/partner/floor/print/[orderId]/tags` with 58mm CSS + `window.print()`; reprint from Print center by phone/tracking. Bill/A4/QR image deferred.
- **Risks:** Concurrent same-laundry creates may race unique index (retry not yet wired); tracking shown as text not QR bitmap.
- **Next:** Today/Ready boards; thermal bill + A4; QR image; token reassign (P3).
- **Refs:** `docs/features/partner-shop-floor.md`

---

## 2026-08-08 — Partner Shop Floor Cloth Wall (P1 FE)

- **Type:** feat
- **Scope:** partner-shop-floor
- **Files:** `features/partner-shop-floor/**`, `catalog-garment-thumb.tsx`, `partner/new-order`, `partner/floor/new`, `walk_in_order` schema/service, `partner-walk-in-orders.ts`, Playwright `partner-shop-floor.spec.ts`, docs/logs
- **Summary:** Cloth Wall wizard (phone → photo grid → confirm → success) on `/partner/new-order` + `/partner/floor/new`; catalog `is_offered` preferred with services fallback; List mode toggle; walk-in accepts `catalog_item_id` via bridged laundry_service. Print CTAs toast P2/P3; no token columns yet.
- **Risks:** Bridged services accumulate in partner catalog; display prices are catalog but charged via synced service rows. Partners without offered price list see services wall only.
- **Next:** Token columns + assignment; today cards; print HTML.
- **Refs:** `docs/features/partner-shop-floor.md`

---

## 2026-08-08 — Partner Shop Floor Mode P0 FE shell

- **Type:** feat
- **Scope:** partner-shop-floor
- **Files:** `frontend/features/partner-shop-floor/**`, `partner-shell.tsx`, `partner/page.tsx`, `partner/floor/*/page.tsx`, `partner-settings-view.tsx`, `tokens.css`, `store-hydration.tsx`, `docs/features/partner-shop-floor.md`, logs, current-status
- **Summary:** Shipped `partner_ui_mode` (localStorage, default shop_floor): Shop Floor replaces `/partner` with 4 Hinglish tiles + 4+More nav; Advanced keeps Overview + full `PARTNER_NAV_SECTIONS`. Floor today/ready/print stubs; Cloth Wall/print deferred.
- **Risks:** New Order still Advanced form until Cloth Wall; brief mode flash before hydrate (defaults shop_floor).
- **Next:** P1 Cloth Wall + token columns + today cards.
- **Refs:** `docs/features/partner-shop-floor.md`

---

## 2026-08-08 — Partner Shop Floor Mode spec

- **Type:** docs
- **Scope:** partner-shop-floor
- **Files:** `docs/features/partner-shop-floor.md`, `docs/features/partner-dashboard.md`, `docs/features/README.md`, `docs/product/traceability.md`, `.cursor/context/current-status.md`, `logs/feature-progress.md`, `logs/decisions-log.md`
- **Summary:** Spec’d literacy-tolerant Shop Floor Mode (4 home tiles, Cloth Wall, color tokens `R-42`, Ready handoff, thermal/A4 print reusing GST fields + catalog photos). Linked as Partner Ops Phase 2+; Advanced Mode nav stays as-is. No UI implemented.
- **Risks:** Status collapse (ironing / out_for_delivery) must be orchestrated carefully when coding.
- **Next:** P1 — `/partner/floor` shell + token schema + Cloth Wall create.
- **Refs:** `docs/features/partner-shop-floor.md`

---

## 2026-08-04 — Partner Orders Hub shell (ops home parity)

- **Type:** feat
- **Scope:** orders-hub
- **Files:** `features/partner/orders-hub/*`, `partner-orders-view.tsx`, `tests/e2e/partner-orders-hub.spec.ts`, `playwright.partner.config.ts`, `docs/features/orders-hub.md`, `partner-dashboard.md`, logs, current-status
- **Summary:** Mirrored Admin hard-merge into `PartnerOrdersHub`: URL tabs mount existing desk / BR inbox / customer insights (no forks); soft-merge Today panel extracted; assigned-requests badge on header + Requests tab; Jest + Playwright smoke (tabs, nav IA, search → place-order, redirects @ 375px). Walk-in stays its own nav item with desk deep-link.
- **Risks:** Badge uses assigned-list `total` (same as sidebar); empty queue EmptyState shares page with Today strip.
- **Mitigation:** Reuse `partnerBookingRequestsBadgeCount`; Playwright asserts badge when list meta mocked.
- **Next:** Mark Orders Hub done after joint Admin/Partner QA on staging.
- **Refs:** `docs/features/orders-hub.md`

---

## 2026-08-04 — Admin Orders Hub shell (ops home)

- **Type:** feat
- **Scope:** orders-hub
- **Files:** `features/admin/orders-hub/*`, `features/orders-hub/orders-hub-tabs.tsx`, `admin-orders-view.tsx`, `tests/e2e/admin-orders-hub.spec.ts`, `playwright.admin.config.ts`, `docs/features/orders-hub.md`, logs
- **Summary:** Consolidated `/admin/orders` into `AdminOrdersHub` shell with URL tabs; soft-merge Today panel extracted; requests badge on header + Requests tab; Jest tab smoke + Playwright hub smoke @ 375px.
- **Risks:** Badge query shares list cache with inbox; zero-open state hides header chip (tab still present).
- **Mitigation:** Same `new`+`reviewing` formula as admin sidebar; Playwright asserts badge when inbox mocked.
- **Next:** Partner Playwright hub matrix; mark feature done after QA.
- **Refs:** `docs/features/orders-hub.md`

---

## 2026-08-04 — Orders Hub Prompt 2 (tabs + legacy redirects)

- **Type:** feat
- **Scope:** orders-hub
- **Files:** `lib/navigation/orders-hub.ts`, `features/orders-hub/orders-hub-tabs.tsx`, admin/partner `orders` views, legacy `customer-desk` / `booking-requests` / `customers` pages → `permanentRedirect`, desk/customers `embedded` mounts, internal Links, Jest + desk e2e, docs/logs
- **Summary:** Hard-merge hub tabs mount existing desk / BR / directory modules. Legacy ops URLs 308 to `/…/orders?tab=…` preserving `phone` / `user_id` / `status`. Soft-merge Today panel deep-links into hub tabs.
- **Risks:** Drawer-internal `tab=` values no longer written to hub URL (avoids colliding with hub tabs).
- **Mitigation:** Hub tab parser falls unknown values back to `orders`; desk/soft-merge keep drawer tab in component state.
- **Next:** Full Playwright hub matrix (all four tabs both roles); mark feature review after QA.
- **Refs:** `docs/features/orders-hub.md`

---

## 2026-08-04 — Orders Hub hard-merge nav (Admin + Partner)

- **Type:** feat
- **Scope:** orders-hub
- **Files:** `admin-nav.ts`, `partner-nav.ts`, `admin-shell` (badge via nav), `partner-shell.tsx`, `breadcrumbs.ts`, `search-index.ts`, `navbar-quick-actions.tsx`, nav unit tests, `orders-hub.md`, logs
- **Summary:** Sidebar hard-merge: Admin Operations = Laundries + Orders (`bookingRequests` badge); Partner drops Customer Desk / Booking requests / Customer insights into Orders (`orders` + `bookingRequests` summed). Legacy paths + `?tab=*` highlight Orders; search/quick actions keep old labels pointing at hub tabs.
- **Risks:** Legacy routes still render until Prompt 2 redirects — titles/active state already treat them as Orders.
- **Mitigation:** Alias maps in nav helpers; Jest covers ops IA + aliases.
- **Next:** Prompt 2 route redirects; hub tab mounting for desk/requests/directory.
- **Refs:** `docs/features/orders-hub.md`

---

## 2026-08-04 — Orders Hub soft-merge (Admin + Partner)

- **Type:** feat
- **Scope:** orders-hub
- **Files:** `docs/features/orders-hub.md`, `partner/orders-hub/*`, `admin/orders-hub/*`, `partner-orders-view.tsx`, `admin-orders-view.tsx`, desk views cross-links, Playwright/Jest, product/dashboard docs, logs
- **Summary:** Soft-merge IA: Orders pages gain Find customer (desk APIs/drawer), Waiting requests preview, Today strip (partner), and deep-links to full Desk/BR. Nav items stay. `?phone=` opens panel on Orders.
- **Risks:** Duplicate search UX on Desk vs Orders — intentional for soft merge; keep copy aligned.
- **Mitigation:** Shared desk components; Playwright covers Orders → New order without leaving page.
- **Next:** Admin Playwright hub smoke; mark feature review after QA.
- **Refs:** `docs/features/orders-hub.md`

---

## 2026-08-04 — Customer Desk gap close: pagination + search cap tests

- **Type:** fix + test
- **Scope:** customer-desk
- **Files:** admin/partner `*-orders-tab.tsx` (Prev/Next), Jest results + pagination coverage, `test_customer_desk.py` search max-20, admin/partner dashboard docs
- **Summary:** Desk API already had search (max 20), laundry-scoped history, and assisted create with IDOR. Closed FE gap where order history only loaded page 1 (hint text, no controls). Added search cap API test and results-list unit coverage.
- **Risks:** None — pagination resets when desk profile changes.
- **Mitigation:** Profile-key `useEffect` resets page to 1.
- **Next:** ops runbook polish.
- **Refs:** `docs/features/customer-desk.md` UX B (paginated orders)

---

## 2026-08-04 — Booking request convert → Customer Desk assisted order

- **Type:** feat
- **Scope:** booking-requests + customer-desk
- **Files:** `booking_request_service.py` (`_convert` → `CustomerDeskService.create_assisted`), `schemas/booking_request.py` convert payload/result, `endpoints/booking_requests.py`, FE convert dialog + admin/partner drawers, `test_booking_requests.py` (happy/invalid/already-converted/force), docs/logs
- **Summary:** Replaced `501 CONVERT_NOT_IMPLEMENTED` with real convert: validates confirmed (admin `force` from contacted), creates assisted doorstep order, sets `converted_order_id` + `converted_to_order` + `converted` event. FE enables Convert and navigates to Customer Desk on success.
- **Risks:** Convert needs catalog line items + address; incomplete BR address without body snapshot → 422.
- **Mitigation:** Convert dialog prefills BR address; tests cover status gates; idempotency key `br-convert-{id}`.
- **Next:** Expiry Celery job; Playwright convert/partner smoke.
- **Refs:** `docs/features/booking-requests.md` goal checkbox; `docs/api/endpoints/booking-requests.md`

---

## 2026-08-04 — Slice 2+5: Assisted create API + Customer Desk QA/security/perf

- **Type:** feat + test
- **Scope:** customer-desk
- **Files:** `customer_desk_service.py` (create/quote), `endpoints/customer_desk.py` create routers, schemas, migration indexes + `idempotency_key`, `test_customer_desk.py` role/IDOR/assisted matrix, `test_orders.py` partner list clarification, Playwright admin+partner, drawer a11y, docs/logs
- **Summary:** Shipped assisted doorstep create/quote for admin+partner (`assisted_*`, guest snapshot or `address_id`, audit custody/status, Idempotency-Key). Slice 5: parametrized AuthZ matrix, IDOR, guest→registered link, security checklist (PII/audit/no mass export), perf indexes + laundry_id-first queries, a11y tab keyboard + walk-in labels, Playwright smokes.
- **Risks:** Partner create forces own laundry even if client sends another `laundry_id` (by design).
- **Mitigation:** Pytest asserts forced laundry + empty cross-laundry history.
- **Next:** BR convert → same factory; ops runbook.
- **Refs:** `docs/features/customer-desk.md` Slices 2+5

---

## 2026-08-04 — Slice 4: Partner Customer Desk UI

- **Type:** feat
- **Scope:** customer-desk (partner UI)
- **Files:** `frontend/features/partner/customer-desk/**`, `frontend/app/(partner)/partner/customer-desk/page.tsx`, partner customers/orders/walk-in views, `partner-nav.ts`, `query-keys.ts`, walk-in form prefill, booking-requests `?phone=`, partner lookup `user_id`, docs/logs, RTL + Playwright smoke
- **Summary:** Shipped mobile-first `/partner/customer-desk` with big keypad phone search and primary **New order** CTA. Desk drawer shows laundry-scoped orders (explicit copy that other shops never appear), reorder→assisted form prefill, walk-in deep link, and booking-request tab. Insights **Open desk**, Orders/Walk-in **Find customer**. Partner lookup accepts `user_id` for insights deep links. Create still awaits Slice 2.
- **Risks:** Assisted create submit 404 until Slice 2; reorder matches services by `item_summary` name (fragile if catalog renamed).
- **Mitigation:** Guest stub on 404 phone lookup so counter can still create; warnings when catalog lines unavailable; walk-in path unchanged.
- **Next:** Slice 2 assisted create API; Slice 5 a11y/docs polish.
- **Refs:** `docs/features/customer-desk.md` Slice 4

---

## 2026-08-04 — Slice 3: Admin Customer Desk UI

- **Type:** feat
- **Scope:** customer-desk (admin UI)
- **Files:** `frontend/features/admin/customer-desk/**`, `frontend/app/(admin)/admin/customer-desk/page.tsx`, `admin-customers-view.tsx`, `admin-nav.ts`, `query-keys.ts`, docs/logs
- **Summary:** Shipped mobile-first `/admin/customer-desk` with E.164 phone lookup, focus-trapped desk drawer (Orders / Booking requests / Place order), Customers table “Open desk”, and Jest coverage for search + empty orders + form validation. Place-order client wires to Slice 2 create contract (backend create still pending).
- **Risks:** Assisted create submit will 404 until Slice 2 lands; ops should use booking-request handoff meanwhile.
- **Mitigation:** Form validates client-side; BR create dialog prefilled from desk; toast surfaces API errors.
- **Next:** Slice 2 assisted create API; Slice 4 partner desk UI.
- **Refs:** `docs/features/customer-desk.md` Slice 3

---

## 2026-08-04 — Slice 1: Customer Desk lookup + order history APIs

- **Type:** feat
- **Scope:** customer-desk (admin + partner)
- **Files:** `customer_desk_service.py`, `schemas/customer_desk.py`, `endpoints/customer_desk.py`, `20260804_0039_customer_desk_assisted_orders.py`, `models/order.py`, `models/enums.py`, `admin_list_params.py`, `admin_service.py`, `tests/api/test_customer_desk.py`, docs/logs
- **Summary:** Shipped phone/`user_id` lookup + paginated past-order history for admin (platform-wide) and partner (laundry-scoped). Migration adds `assisted_*` order_source values, `created_by_user_id`, guest address snapshot columns, and desk index — create API deferred to Slice 2. Admin `GET /orders` also accepts `customer_phone` / `user_id`.
- **Risks:** Path surface uses `/admin|partner/customers/*` (user Slice 1 contract) rather than planned `/customer-desk/*`; keep docs aligned. Partner guest-with-only-other-laundry → 404 on lookup.
- **Mitigation:** IDOR pytest matrix (16 tests green); guest history via `GET …/customers/orders?phone=`.
- **Next:** Slice 2 — assisted create + quote + idempotency + shared pricing factory.
- **Refs:** `docs/features/customer-desk.md` Slice 1; migration `20260804_0039`

---

## 2026-08-04 — Spec: Customer Desk (assisted lookup & create)

- **Type:** docs
- **Scope:** customer-desk (admin + partner)
- **Files:** `docs/features/customer-desk.md`, `docs/api/endpoints/customer-desk.md`, `docs/database/schema.md`, `docs/product/traceability.md`, `docs/features/README.md`, `docs/api/README.md`, `logs/feature-progress.md`, `.cursor/context/current-status.md`
- **Summary:** Specced Customer Desk so ops/partners can look up customers by phone and create real doorstep orders on their behalf (with walk-in + booking-request handoffs). Captured AuthZ, `order_source` extension, guest address snapshot, and five implementation slices — no code yet.
- **Risks:** Future implementers may conflate assisted doorstep with walk-in lifecycle or skip IDOR tests.
- **Mitigation:** Domain decisions table + API IDOR matrix + schema lifecycle note; Slice 1/5 require IDOR coverage.
- **Next:** Slice 1 — migration + lookup/history APIs.
- **Refs:** `docs/features/customer-desk.md`

---

## 2026-08-03 — Slice 6: Booking requests polish

- **Type:** feat
- **Scope:** booking_requests polish (SLA already shipped; dup banner; suggest; notify stubs)
- **Files:** `booking_request_notifier.py`, `booking_request_service.py`, schemas/endpoints/tests; admin/partner create dialogs + detail drawer suggest chips; `docs/runbooks/booking-requests.md`; feature/API/status logs
- **Summary:** Live duplicate open-request banner on admin/partner create (debounced by-phone lookup); `GET /admin/booking-requests/{id}/suggest-laundries` ranked by pincode/city → rating → recently active with assign-drawer chips; best-effort notify stubs (in-app + support email + WhatsApp stub on public create; partner in-app/email/WhatsApp stub on assign). Ops runbook added.
- **Risks:** Suggest ranking is heuristic (no customer lat/lng); notify depends on SMTP / channel flags.
- **Mitigation:** Never fail create/assign on notify errors; empty suggestions fall back to manual picker.
- **Next:** Convert-to-order; expiry Celery job; Playwright partner smoke. Deferred (not in feature doc): public track page, CSV export, admin overview KPI cards.
- **Refs:** `docs/features/booking-requests.md` Slice 6 / user task

---

## 2026-08-03 — Slice 5: Partner booking requests inbox UI

- **Type:** feat
- **Scope:** partner booking_requests FE
- **Files:** `frontend/features/partner/booking-requests/*`, `frontend/app/(partner)/partner/booking-requests/page.tsx`, `partner-nav.ts`, `partner-shell.tsx`, `query-keys.ts`, Jest status/params tests, feature docs + status
- **Summary:** Partner inbox at `/partner/booking-requests` — scoped list/detail, partner-legal status transitions, respond + internal notes, release to admin, phone timeline create-on-phone, WhatsApp/Call links, Operations nav entry + assigned badge. Client strips laundry/IDOR filters; server remains source of truth for scope.
- **Risks:** Convert-to-order still stubbed; no Playwright partner inbox smoke yet.
- **Mitigation:** Reuses admin SLA/badge presentational pieces; unit tests cover transitions + param stripping.
- **Next:** Convert-to-order; expiry job; Playwright partner smoke.
- **Refs:** `docs/features/booking-requests.md` Slice 5 / user task

---

## 2026-08-03 — Slice 3: Book Now → booking request confirmation UX

- **Type:** feat
- **Scope:** marketing Book Now / booking_requests (customer FE)
- **Files:** `frontend/lib/api/booking-requests.ts` (existing), `book-pickup-form.tsx`, `book-pickup-success.tsx`, `map-book-pickup-to-request.ts`, `book-now-dialog.tsx`, Jest + Playwright tests, `docs/features/booking-requests.md`, `docs/features/marketing-homepage.md`
- **Summary:** Book Now already POSTs `/booking-requests`; Slice 3 adds in-dialog confirmation with `public_code`, what-happens-next copy, WhatsApp/Call fallbacks (code in WhatsApp prefills), and pure form→API mapping helpers + unit tests. Dialog no longer auto-closes on submit; Done dismisses.
- **Risks:** Ops still lack admin/partner inbox UI to triage new rows.
- **Mitigation:** Public create + confirmation code give customers a quoteable reference; API already returns duplicate_warning meta.
- **Next:** Admin + partner booking-request inbox UI; expiry Celery job; convert-to-order.
- **Refs:** `docs/features/booking-requests.md` Slice 3 / user task

---

## 2026-08-03 — Slice 2: Booking Requests services + HTTP APIs

- **Type:** feat
- **Scope:** booking_requests (schemas, service, public/admin/partner endpoints, Book Now FE switch)
- **Files:** `backend/app/schemas/booking_request.py`, `backend/app/services/booking_request_service.py`, `backend/app/api/v1/endpoints/booking_requests.py`, repo release/rate-limit helpers, `frontend/lib/api/booking-requests.ts`, `book-pickup-form.tsx`, `tests/api/test_booking_requests.py`, API/feature docs
- **Summary:** Public create (rate-limited, duplicate warning meta), admin CRUD/claim/assign/release/messages/soft-delete/restore/phone timeline, partner scoped CRUD/respond/release/create, convert stub `501`. Book Now **replaces** `order-help` marketing contact; general contact form unchanged.
- **Risks:** Admin/partner inbox UI not yet built — ops still need a surface to triage. Convert-to-order intentionally stubbed.
- **Mitigation:** pytest authz/IDOR/assign/phone matrix green; WhatsApp URL + SLA badge computed server-side for when UI lands.
- **Next:** Admin + partner booking-request inbox UI; expiry Celery job; convert implementation when online booking path is ready.
- **Refs:** `docs/features/booking-requests.md` Slice 2 / user task

---

## 2026-08-03 — Slice 1: Booking Requests data layer

- **Type:** feat
- **Scope:** booking_requests (schema + repository)
- **Files:** `backend/app/models/booking_request.py`, `backend/app/models/enums.py`, `backend/app/repositories/booking_request.py`, `backend/app/utils/phone.py`, `backend/alembic/versions/20260803_0038_booking_requests.py`, unit tests, `docs/database/schema.md`
- **Summary:** Added `booking_requests` + messages/events tables, India phone E.164 helper (digits-only for search/WhatsApp), and repository CRUD (list/filter, soft-delete/restore, assign/transfer, phone timeline, messages). No API/endpoints yet.
- **Risks:** Enum value labels with hyphens (`wash-fold`) must stay aligned across Alembic + ORM `values_callable`.
- **Mitigation:** Idempotent enum create in migration; unit tests for phone helper + repository paths; schema notes single `phone_e164` CRM key (no redundant `phone_normalized` column).
- **Next:** Slice A services/endpoints — public create + admin list/assign/messages.
- **Refs:** `docs/features/booking-requests.md` Slice 1 / implementation slices A

---

## 2026-08-03 — Spec: Booking Requests workflow (docs only)

- **Type:** docs
- **Scope:** Booking requests (Book Now → admin/partner inbox)
- **Files:** `docs/features/booking-requests.md`, `docs/api/endpoints/booking-requests.md`, `docs/database/schema.md`, `logs/feature-progress.md`, `docs/features/README.md`, `docs/features/marketing-homepage.md`
- **Summary:** Planned first-class booking-request aggregate (separate from marketing contact leads) with phone CRM, SLA badges, assign/transfer, messages/events, partner scoped CRUD, and API contract. No code/migrations yet.
- **Risks:** None (docs only). Product may tweak nav placement or convert stub (`501`) before Slice A.
- **Next:** Implement Slice A — Alembic + public create + admin list/assign/messages.
- **Refs:** User request — elevate Book Now into Booking Request workflow

---

## 2026-08-03 — Pre-launch: hide fabricated KPI counts

- **Type:** fix
- **Scope:** Marketing / discover / about stats bands
- **Files:** `frontend/lib/prelaunch-stats.ts`, `stats-fallback.ts`, `stats-band.tsx`, `stats-section.tsx`, `about-stats.tsx`, `use-marketing.ts`, unit + a11y tests, `docs/features/marketing-homepage.md`
- **Summary:** Replaced invented live KPIs (10000+, 98%, 150+ shops, etc.) with consistent “Coming Soon” copy behind `PRELAUNCH_STATS` / `NEXT_PUBLIC_PRELAUNCH_STATS` (default true). Count-up animation and stats API fetch disabled while the flag is on; labels unchanged.
- **Risks:** Low — flip flag to `false` at launch to restore API-backed numbers.
- **Next:** Set `NEXT_PUBLIC_PRELAUNCH_STATS=false` when production metrics are trustworthy.
- **Refs:** User request — pre-launch stats messaging

---

## 2026-08-03 — Fix Pricing Household Bath Towel missing WebP

- **Type:** fix
- **Scope:** Marketing Pricing rack photo for `household-bath-towel`
- **Files:** `frontend/public/catalog/household/towel.webp` (added), `frontend/features/marketing/pricing/lib/resolve-product-photo.test.ts`, `frontend/public/catalog/README.md` (one-line coverage note)
- **Summary:** Manifest and resolver already pointed at `/catalog/household/towel.webp`, but only `towel.png` existed on disk, so Next/Image hit `onError`. Encoded a proper 1200×900 WebP q85 from the PNG via `prepare-catalog-stock-photo.py`. Left the PNG as source; did not change the `.webp` resolver convention.
- **Risks:** None — static asset fill; ATTRIBUTION already listed `household/towel.webp`.
- **Next:** Optional — drop leftover `towel.png` once no import pipeline needs it.
- **Refs:** User bug — Bath Towel image blank on Pricing → Household

---

## 2026-08-03 — Fix `/stores` Near me missing newly approved stores

- **Type:** fix
- **Scope:** Public laundry discovery list (`/stores` Near me + `/discover`)
- **Files:** `backend/app/repositories/laundry.py`, `backend/app/services/laundry_service.py`, `backend/app/api/v1/endpoints/laundries.py`, `frontend/services/laundries.ts`, unit/API/FE tests, `docs/features/customer-discovery.md`, `docs/api/endpoints/laundry-compare-hints.md`
- **Summary:** Root cause was silent truncation: `GET /laundries` defaulted to limit 20 ordered by rating, and the FE never raised it — Near me only re-sorted that page, so new 0★ approved stores looked missing. Default limit is now 100 with pagination meta; FE pages until exhausted. Approve/reject already calls `invalidate_laundry_discovery_cache()`; list cache bumped to `v4` with `{items,total}`. Stores without lat/lng still appear (sorted after GPS rows).
- **Risks:** Directory with >100 stores costs an extra list round-trip; list cache key version change cold-starts Redis entries.
- **Next:** Optional UI “Showing all N stores” when total is large; consider lowering React Query staleTime after admin approval from the same browser.
- **Refs:** User bug — newly added store missing under Near me on `/stores`

---

## 2026-08-03 — Temp: disable store nav on all breakpoints

- **Type:** fix
- **Scope:** Marketing store cards (Home teaser, `/stores`, quick-pick)
- **Files:** `store-nav-surface.tsx`, `stores-card.tsx`, quick-pick surfaces, unit + e2e tests, `docs/features/customer-discovery.md`, `docs/features/marketing-homepage.md`
- **Summary:** Cover/name no longer navigates to `/discover/[id]` at any breakpoint. Flip `STORE_NAVIGATION_ENABLED` (or remove gate) to re-enable. Call / Message / Get Location unchanged.
- **Risks:** Users cannot open storefront from marketing cards until the flag is flipped; discover app cards (`PartnerCard` / `LaundryCard`) still navigate.
- **Next:** Re-enable store navigation when storefront UX is ready.
- **Refs:** User request — disable desktop/laptop store card navigation too

---

## 2026-07-31 — Fix `/stores` Near me race + sticky status

- **Type:** fix
- **Scope:** Marketing `/stores` Near me + Home featured teaser copy
- **Files:** `use-geolocation.ts`, `stores-near-me-control.tsx`, `stores-page-view.tsx`, `featured-stores-teaser.tsx`, geo/enrich tests, `docs/features/customer-discovery.md`, `docs/features/marketing-homepage.md`
- **Summary:** Generation-token cancel so late GPS cannot re-arm after toggle-off; granted position syncs `sort: nearest` via effect; sticky ≤1023px status/errors render full-width under the cluster; deny copy mentions browser settings; pending is cancellable; Home teaser no longer claims “near you” without GPS.
- **Risks:** `/discover` “Nearest” sort still has no geolocation control (falls back to rating when all distances are approximate).
- **Next:** Optional — wire Near me on `/discover` PartnersSection or hide Nearest without GPS.
- **Refs:** User request — Near me / nearby location on stores discovery flow

---

## 2026-07-31 — Temp: disable store nav below lg on marketing cards

- **Type:** fix
- **Scope:** Marketing store cards (Home teaser, `/stores`, quick-pick)
- **Files:** `store-nav-surface.tsx`, `stores-card.tsx`, `quick-pick-spotlight.tsx`, `quick-pick-compact-row.tsx`, unit + e2e tests, `docs/features/customer-discovery.md`, `docs/features/marketing-homepage.md`
- **Summary:** Cover/name no longer navigates to `/discover/[id]` below Tailwind `lg` (<1024px). Desktop keeps an overlay Link (`max-lg:hidden`). Flip `STORE_NAVIGATION_ENABLED_BELOW_LG` (or remove gate) to re-enable. Call / Message / Get Location unchanged. PartnerCard / LaundryCard left alone (discover app, not marketing browse).
- **Risks:** Empty overlay link relies on `aria-label`; dual-mode flag must stay documented so mobile nav is not forgotten.
- **Next:** Re-enable below-lg store navigation when storefront mobile UX is ready.
- **Refs:** User request — temporary UX gate on phone/tablet

---

## 2026-07-31 — Home hero: show 25% OFF promo on mobile banner

- **Type:** fix
- **Scope:** Marketing home hero (welcome slide)
- **Files:** `hero-carousel.tsx`, `hero-static-fallback.tsx`, `home-hero.test.tsx`, `docs/features/marketing-homepage.md`
- **Summary:** Welcome promo GlassSurface was `hidden sm:block` on the banner, so phones never saw “25% OFF / On Your FIRST THREE Orders” on the image. Overlay now shows at all breakpoints (tighter mobile sizing); empty `promo.code` is omitted; duplicate text-column mobile promo removed; static LCP fallback matched.
- **Risks:** Compact overlay on short image columns could crowd bottom-right on very small screens — verify 360px.
- **Next:** Visual smoke on phone viewport after deploy.
- **Refs:** User report — first banner promo not visible on mobile

---

## 2026-07-30 — Offline sticky CTA: Book Pickup replaces Stores + Call

- **Type:** fix
- **Scope:** Marketing mobile sticky bar (offline booking mode)
- **Files:** `mobile-sticky-cta.tsx`, `floating-contact-actions.tsx`, `offline-booking.spec.ts`, `playwright.config.ts`, docs (`marketing-homepage.md`, `customer-discovery.md`, `offline-booking-ui-map.md`)
- **Summary:** Offline sticky primary is now **Book Pickup** (`useBookNowStore` → `BookNowDialog`) with WhatsApp secondary. Removed Stores quick-pick + Call Now from the bar. Online sticky (Book nearest + WA + Call) unchanged. FAB hides WhatsApp when sticky is visible; Call hidden only in online mode so offline users still get Call + Find stores from FAB.
- **Risks:** `StoresQuickPickSheet` is no longer mounted from sticky (component retained). Prod Book Pickup still needs Render deploy for `order-help` enum fix.
- **Next:** Deploy FE to Vercel; smoke offline sticky on washhouse.vercel.app after FE ship.
- **Refs:** User report — mobile sticky should open booking form

---

## 2026-07-30 — Fix `/stores` Near me (radius wipe + null coords)

- **Type:** fix
- **Scope:** Marketing `/stores` Near me + sticky quick-pick geo
- **Files:** `filter-laundries.ts`, `stores-page-view.tsx`, `stores-near-me-control.tsx`, `stores-quick-pick-sheet.tsx`, `use-geolocation.ts`, `seed_demo.py`, tests, `docs/features/customer-discovery.md`
- **Summary:** Root cause: directory Near me set `maxDistance: 50`, so GPS far from store pins emptied the list; null laundry coords also made “nearest” sort by slug-hash km (looked like a no-op). Directory now uses `ANY_DISTANCE_KM` (sort only), skips radius on approximate distances, ranks approx by rating, shows partial “pins not published” copy, fails fast on insecure origin, and demo seed backfills lat/lng.
- **Risks:** Discover distance filter still applies to real GPS rows only — intentional. Prod partners without coords still get partial Near me until pins are published.
- **Next:** Re-seed / restart local API so demo coords land; device check Near me on HTTPS with location allowed.
- **Refs:** User report — Near me tap does nothing useful / silent geo fail

---

## 2026-07-30 — Book Pickup prod "couldn't reach servers" (enum + CORS)

- **Type:** fix
- **Scope:** Marketing Book Now / `POST /marketing/contact` + franchise inquiries
- **Files:** `backend/app/models/marketing.py`, `backend/app/main.py`, `backend/alembic/versions/20260730_0037_align_marketing_enum_values.py`, `backend/tests/api/test_marketing.py`, `backend/tests/unit/test_marketing_enum_values.py`, `frontend/lib/api-error-message.test.ts`, `logs/bug-tracker.md`
- **Summary:** Prod Book Pickup posted `subject=order-help` and got `INTERNAL_ERROR` because SQLAlchemy persisted enum *names* (`order_help`) while Alembic 0032 created *values* (`order-help`). 500 responses lacked ACAO (CORS was not outermost), so the browser surfaced `isNetworkError` copy. Fixed with `values_callable`, migration 0037 (rename name→value labels where needed), and CORS outermost.
- **Risks:** Render must redeploy backend so `AUTO_RUN_MIGRATIONS` applies 0037 (no-op on already-hyphenated prod labels) and ships `values_callable`. Franchise inquiries had the same investment_range name/value bug.
- **Next:** Deploy backend to Render; re-verify `POST .../marketing/contact` with `order-help` → 201 + ACAO from washhouse.vercel.app.
- **Refs:** BUG-2026-07-30-001; user report washhouse.vercel.app Book Pickup

---

## 2026-07-30 — StoresCard cover navigates to storefront

- **Type:** fix
- **Scope:** Marketing `/stores` directory `StoresCard`
- **Files:** `stores-card.tsx`, `stores-card.test.tsx`, `marketing-homepage.spec.ts`, `docs/features/marketing-homepage.md`, `docs/features/customer-discovery.md`
- **Summary:** Cover + name area is now a Link to `/discover/[id]` (same pattern as sticky quick-pick). Call / Message / Get Location remain the only contact actions, with `stopPropagation`. Unit + e2e + docs updated from “zero discover links” to assert the cover link.
- **Risks:** Nested interactive content a11y — link wraps media/title only; action buttons remain siblings.
- **Next:** Optional Playwright assert tap cover → storefront URL.
- **Refs:** User report — same bug as quick-pick; StoresCard was display-only

---

## 2026-07-30 — Quick-pick store cover navigates to storefront

- **Type:** fix
- **Scope:** Marketing sticky Stores Near Me quick-pick sheet
- **Files:** `quick-pick-spotlight.tsx`, `quick-pick-compact-row.tsx`, `stores-quick-pick-sheet.tsx`, `stores-quick-pick.test.tsx`, `docs/features/customer-discovery.md`
- **Summary:** Cover + name areas now link to `/discover/[id]` with keyboard/focus rings; sheet closes via optional `onNavigate` → `onOpenChange(false)`. Call / Message / Get Location stay separate with `stopPropagation`; contact gating unchanged.
- **Risks:** Nested interactive content a11y — link wraps media/title only; action buttons remain siblings.
- **Next:** Optional Playwright assert tap cover → storefront URL.
- **Refs:** User report — tapping store name/image in quick-pick did nothing

---

## 2026-07-30 — Store-card simplification finalize

- **Type:** chore
- **Scope:** Marketing `/stores` directory cards + shared contact actions a11y/copy
- **Files:** `stores-service-preview.tsx` (deleted), `use-store-contact-actions.ts`, `stores-hero.tsx`, `stores-page-view.tsx`, `stores-card.test.tsx`, `stores-quick-pick.test.tsx`, `marketing-homepage.spec.ts`, `docs/features/customer-discovery.md`, `docs/features/marketing-homepage.md`, logs
- **Summary:** Removed unused `StoresServicePreview` (no barrel export). Aligned button `aria-label`s with visible Call Store / Message Store / Get Location copy. Softened hero/section microcopy to contact/location language. Docs + e2e updated for contact-only cards (no Open store / service peek).
- **Risks:** Get Location still hidden when contact payload has no directions URL/`map_url`; action row omitted entirely when no channels resolve.
- **Next:** Optional Playwright assert for keyboard Tab across three actions; visual QA at 360px wrap.
- **Refs:** User request — finalize store-card simplification

---

## 2026-07-30 — Home: remove Services + Reviews sections

- **Type:** chore
- **Scope:** Marketing homepage `/` only
- **Files:** `marketing-homepage.tsx`, `marketing-homepage.spec.ts`, `touch-scroll-mobile.spec.ts`, `marketing-catalog-photos.spec.ts`, `docs/features/marketing-homepage.md`
- **Summary:** Dropped page-level `ServicesPreview` and `HomeTestimonials` from `MarketingHomepage`. Kept FeaturedStoresTeaser and the rest of the band stack. E2e no longer expects “Our Laundry Services” on `/`; coverage retargeted to `/services` grid, `/discover` testimonials, and `/pricing` rack touch-scroll.
- **Risks:** `ServicesPreview` component remains unused on a route (still available for reuse); Book Now service pre-select from home tiles is gone (dialog default + navbar Book Now remain).
- **Next:** Optional delete or re-home `services-preview.tsx` if unused long-term.
- **Refs:** User request — remove Services/Reviews from Home only

---

## 2026-07-30 — Quick-pick contact-only actions (no store nav)

- **Type:** feat
- **Scope:** Marketing sticky Stores Near Me quick-pick sheet
- **Files:** `quick-pick-spotlight.tsx`, `quick-pick-compact-row.tsx`, `stores-quick-pick-sheet.tsx`, `stores-quick-pick.test.tsx`, `docs/features/customer-discovery.md`
- **Summary:** Aligned Near Me sheet with directory cards: removed Open store / row Links to `/discover/[id]`; name/image/location display-only; labeled Call Store / Message Store / Get Location via `useStoreContactActions` (`source: stores_quick_pick`); sheet subtitle no longer says “open one”. RTL asserts no discover links + three actions.
- **Risks:** Compact rows are taller with three labeled buttons on narrow phones — still 44px targets; visual QA at 360px.
- **Next:** Optional Playwright assert for contact-only quick-pick (no Open store).
- **Refs:** User request — match StoresCard contact-only rule on quick-pick

---

## 2026-07-29 — /stores phone + tablet gallery polish

- **Type:** polish
- **Scope:** Marketing `/stores` directory (phone + tablet visual parity with quick-pick)
- **Files:** `stores-page-view.tsx`, `stores-hero.tsx`, `stores-card.tsx`, `stores-near-me-control.tsx`, `stores-card-skeleton.tsx`, `stores-service-preview.tsx`, `stores-card.test.tsx`, `docs/features/customer-discovery.md`
- **Summary:** Shortened phone hero; search + Near me as one sticky cluster (compact when pinned under nav on phone/tablet; `lg:static`); card actions match quick-pick (Open store primary + icon Call/WhatsApp, nowrap); md cover parallax; service peek max-height for 2-col alignment; gaps `gap-4` / `md:gap-5`. Still no discover compare filters; contact stays lazy via `useCardInView`; no debounce skeletons.
- **Risks:** Sticky filter + bottom MarketingShell CTA coexist (top vs bottom); IntersectionObserver compact toggle needs visual QA on iOS Safari.
- **Next:** Manual matrix 375 / 414 / 768 portrait+landscape, light+dark.
- **Refs:** User request — upgrade /stores for phone and tablet

---

## 2026-07-29 — Nearby stores quick-pick redesign polish

- **Type:** feat
- **Scope:** Marketing sticky Stores quick-pick Drawer
- **Files:** `stores-quick-pick-sheet.tsx`, `quick-pick-spotlight.tsx`, `quick-pick-compact-row.tsx`, `quick-pick-skeleton.tsx`, `stores-quick-pick.test.tsx`, `docs/features/customer-discovery.md`, `docs/product/offline-booking-ui-map.md`
- **Summary:** Locked the approved spotlight + compact-row layout with a layout-matched loading skeleton, geo-aware DrawerDescription, rating-only-when-present, and city·distance meta. Tablet sheet stays `max-w-lg` / `md:max-w-2xl` centered; contact still uses `stores_quick_pick` + login redirect. RTL covers spotlight/row/skeleton; e2e still asserts Nearby stores + See all stores.
- **Risks:** Featured→nearest reorder when GPS arrives can change which store is spotlight without a full remount (acceptable per spec).
- **Next:** Visual QA at 375 / 768 light+dark; optional Playwright assert for Open store on spotlight.
- **Refs:** Approved Nearby Stores quick-pick redesign

---

## 2026-07-29 — Stores redesign test lock-in + QA

- **Type:** test
- **Scope:** `/stores` marketing directory + `StoresCard` browse quality
- **Files:** `frontend/tests/e2e/marketing-homepage.spec.ts`, `frontend/features/marketing/stores/stores-card.test.tsx`, `logs/implementation-log.md`
- **Summary:** Locked the premium stores gallery with an updated Playwright describe (hero + directory/empty, name/city, Open store → `/discover/:id`, rating|cover|service signals, no discovery filter chrome, lazy Call/WhatsApp) and a lightweight RTL unit test for `StoresCard` key fields from mock `EnrichedLaundry`.
- **Risks:** E2E still depends on seeded approved laundries + contact API for channel assertions; cold Next compile can slow first `/stores` paint (hero expect now 15s).
- **Next:** Human visual pass for Near me GPS permission on device; optional LHCI spot-check.
- **Refs:** Stores gallery redesign (2026-07-29)

---

## 2026-07-29 — Stores gallery + storefront motion/perf polish

- **Type:** polish
- **Scope:** `/stores` marketing gallery + `/discover/[id]` storefront
- **Files:** `stores-card.tsx`, `stores-card-visual.ts`, `stores-page-view.tsx`, `stores-card-skeleton.tsx`, `stores-service-preview.tsx`, `featured-stores-teaser.tsx`, `laundry-storefront-view.tsx`, `storefront-contact-section.tsx`, `laundry-detail-view.tsx`, `docs/features/customer-discovery.md`, logs
- **Summary:** Premium card motion (stagger fade/slide, hover lift + image scale, verified/rating nudge) with `prefers-reduced-motion`; slug-hash cover overlays + muted fallbacks; `rounded-xl` + roomier gaps; skeletons only on true empty pending (not search debounce). Storefront CTAs → See full menu / Schedule pickup; contact GET deferred until near viewport.
- **Risks:** Framer Motion on every card — capped stagger (≤6) and transform/opacity only; low-end Android still needs a quick visual pass.
- **Next:** Optional LHCI spot-check `/stores` on prod build; visual QA 375 / 1280 light+dark.

---

## 2026-07-29 — Laundry storefront full catalogue UX

- **Type:** feat
- **Scope:** `/discover/[id]` storefront + shared service catalogue
- **Files:** `laundry-storefront-view.tsx`, `service-catalog-browser.tsx`, `service-card.tsx`, `service-category-chips.tsx`, `laundry-services-tab.tsx`, `discover/detail/lib/*`, `catalog-garment-thumb.tsx`, `docs/features/customer-discovery.md`, tests
- **Summary:** Storefront now leads with who/what/how-much/trust: immersive hero (address, hours, turnaround), grouped service catalogue with sticky scroll-spy chips, garment photos, search live region, `?category=` deep-link, and honest empty CTA to `/stores`. Booking/order-summary architecture preserved; StoresCard still prefetches `queryKeys.laundry`.
- **Risks:** Category slug normalize (`dry_clean` ↔ `dry-clean`) must stay aligned with seed data; scroll-spy sticky offset may need tweak under taller browse headers.
- **Next:** Visual QA on 375 / desktop light+dark; optional e2e assert for category chips.

---

## 2026-07-29 — Premium marketing stores gallery cards

- **Type:** feat
- **Scope:** `/stores` marketing directory UI
- **Files:** `frontend/features/marketing/stores/stores-card.tsx`, `stores-card-skeleton.tsx`, `stores-page-view.tsx`, `stores-service-preview.tsx`, `use-card-in-view.ts`, `frontend/features/marketing/home/featured-stores-teaser.tsx`, `frontend/tests/e2e/marketing-homepage.spec.ts`, `logs/implementation-log.md`
- **Summary:** Redesigned store cards as a photo-led gallery (cover, verified, rating, delivery, service peek, Open store) with md 2-col grid. Contact GETs are lazy via IntersectionObserver when the card nears the viewport to avoid N+1 storms. E2e now asserts gallery signals while still forbidding discovery filter/compare chrome.
- **Risks:** Homepage featured teaser shares the taller card; contact buttons appear slightly later until the card is in view.
- **Next:** Optional visual QA pass on mobile 375 / desktop 1280 / dark mode.

---

## 2026-07-29 — QA diagnose re-run: stores/discover · GET /laundries

- **Type:** qa
- **Scope:** `.cursor/prompts/diagnose-api-errors.md` (local); pages `/stores`, `/discover`
- **Files:** `logs/bug-tracker.md` (diagnostic run section)
- **Summary:** Captured status/body/traceback for `GET /api/v1/laundries`. Live result **200**, 14 items, envelope OK, CORS ACAO for `:3002`, migrations at head. No request 500/traceback. Classified **no live A–H**; prior A + H fixes already in place. Re-verified `test_laundry_list_public_cache.py` (2 passed). No additional code fix applied.
- **Risks:** None for this endpoint while API stays up and approved seed present.
- **Next:** Commit pending H hardenings when ready; no further diagnose phase needed unless UI regresses.
- **Refs:** BUG-2026-07-29-001, BUG-2026-07-29-002

---

## 2026-07-29 — Harden empty public laundry list (discovery)

- **Type:** fix
- **Scope:** `list_public` cache + demo seed repair; QA verification of `/stores` `/discover`
- **Files:** `backend/app/services/laundry_service.py`, `backend/app/db/seed_demo.py`, `backend/tests/unit/test_laundry_list_public_cache.py`, `logs/bug-tracker.md`
- **Summary:** Investigated empty `GET /laundries` checklist. Live local DB already had 14 approved rows and correct `{data:[]}` envelope; Redis/cache off. Hardened against sticky empty Redis cache and demo status drift (re-approve + invalidate discovery cache on seed repair).
- **Risks:** Empty list still returned when genuinely no approved laundries (correct); search empty results still cached.
- **Next:** Optional enable Redis locally with `CACHE_ENABLED=true` smoke; keep `AUTO_SEED_DEMO=true` for local.
- **Refs:** BUG-2026-07-29-002

---

## 2026-07-29 — Restore local API connectivity (laundries / stores)

- **Type:** infra
- **Scope:** local backend bring-up, CORS, migrations
- **Files:** `backend/.env` (`CORS_ALLOW_ORIGINS`), `backend/scripts/run_dev.ps1` (started), `logs/bug-tracker.md`
- **Summary:** Port 8000 was not listening so discover/stores hit connection refused. Started uvicorn via `run_dev.ps1`; auto-migrations applied through `20260729_0036`; added `http://localhost:3002` to CORS for Next alt port.
- **Risks:** CORS allow-list must stay in sync when Next binds a non-3000 port; `.env` edits need API restart (reloader does not watch env).
- **Next:** Keep `backend/scripts/run_dev.ps1` in local pre-flight; optional Redis when enabling rate limit/cache.
- **Refs:** BUG-2026-07-29-001; `.cursor/prompts/fix-api-connectivity-env.md`

---

## 2026-07-29 — Marketing navbar desktop Stores CTA

- **Type:** feat
- **Scope:** Marketing navbar — first-class Stores access on laptop/desktop
- **Files:** `marketing-nav.ts`, `marketing-nav.test.ts`, `marketing-navbar.tsx`, `docs/features/marketing-homepage.md`
- **Summary:** Added **Stores** to `MARKETING_NAV_LINKS` (after Pricing) and a desktop CTA between Book Now and Call Now linking to `MARKETING_STORES_HREF` (`/stores`). Overflow polish: Staff label shortens below `xl`; Call shows icon-only from `lg` with full label at `xl`. Mobile sticky Stores quick-pick unchanged; hamburger picks up Stores via nav links only (no duplicate CTA).
- **Risks:** Seven centered nav links may feel tight on mid-width laptops; CTA row still prioritizes Stores over Call text.
- **Next:** Optional Playwright assert for desktop Stores CTA → `/stores`.
- **Refs:** User request — laptop/desktop Stores next to Book + Call

---

## 2026-07-29 — Marketing homepage FadeIn visibility fix

- **Type:** fix
- **Scope:** Marketing `/` section bodies stuck at Framer `opacity: 0`
- **Files:** `fade-in.tsx`, `fade-in.test.tsx`, `delivery-options-band.tsx`, `app-promo-section.tsx`, `featured-stores-teaser.tsx`, `franchise-teaser.tsx`, `final-cta-band.tsx`, `services-preview.tsx`, `docs/features/marketing-homepage.md`
- **Summary:** Hardened shared `FadeIn`/`FadeInItem`/`FadeInStagger` with soft viewport + 700ms force-visible fallback and reduced-motion plain markup. Removed `FadeInItem` (and Final CTA nested opacity motion) around focusable home CTAs so Book Now / links cannot stay invisible (WCAG 2.4.7).
- **Risks:** Entrance stagger is lighter on CTA sections; timeout still animates other `FadeInItem` consumers if IO fails.
- **Next:** Spot-check `/` light+dark on phone/desktop after deploy.
- **Refs:** User report — blank bands under marketing section headers

---

## 2026-07-29 — Storefront Directions when coords exist

- **Type:** feat
- **Scope:** Laundry detail / storefront contact — optional Directions
- **Files:** `enums.py`, `20260729_0036_directions_click_engagement.py`, `customer_experience_service.py`, `customer_experience.py` (schemas), `geo.ts`, `offline-booking-contact-panel.tsx`, `storefront-contact-section.tsx`, `laundry-information-tab.tsx`, contact API tests, docs
- **Summary:** Contact API exposes `show_directions` + Google/Apple/`geo` URLs when laundry lat/lng present (partner toggle deferred; default on). Inline/sidebar contact panels and storefront section open platform-picked directions; mobile sticky bar and marketing CTAs unchanged. Tracks `directions_click` for signed-in customers (`engagement_event_type` enum extended).
- **Risks:** Directions only appear for laundries with seeded coordinates; address-only shops keep Maps search fallback.
- **Next:** Optional partner `show_directions` storefront toggle; engagement analytics counter.
- **Refs:** User request — Directions on contact panel; not global sticky

---

## 2026-07-29 — Marketing CTAs respect online/offline booking mode

- **Type:** feat
- **Scope:** Marketing sticky CTA + final CTA band — booking-mode hierarchy
- **Files:** `use-marketing-booking-cta-mode.ts`, `mobile-sticky-cta.tsx`, `final-cta-band.tsx`, `marketing-nav.ts`, `marketing-homepage.spec.ts`, `offline-booking.spec.ts`, `docs/features/marketing-homepage.md`, `docs/product/offline-booking-ui-map.md`
- **Summary:** Sticky and final CTA bands now follow `useOnlineBookingEnabled` / `GET /config` `online_booking_enabled`. Online: primary **Book nearest** → `/discover`, WhatsApp/Call secondary. Offline: WhatsApp-primary + Stores quick-pick + Call (unchanged). Playwright covers both modes via default `:3000` and `offline-booking` `:3001`.
- **Risks:** Brief hierarchy depends on FE env + API flag alignment; optimistic env while `/config` loads avoids WhatsApp-primary flash on online defaults.
- **Next:** Optional FAB hierarchy polish to match sticky emphasis when online.
- **Refs:** User request — marketing contact CTAs online vs offline

---

## 2026-07-29 — Stores Near me + sticky quick-pick sheet

- **Type:** feat
- **Scope:** Marketing `/stores` geolocation + sticky CTA quick-pick Drawer
- **Files:** `laundry.py` (schema), `laundry_service.py`, `lib/geo.ts`, `hooks/use-geolocation.ts`, `laundry-meta.ts`, `use-laundry-discovery.ts`, `stores-near-me-control.tsx`, `stores-quick-pick-sheet.tsx`, `stores-page-view.tsx`, `mobile-sticky-cta.tsx`, `use-final-cta-visible.ts`, tests, `docs/product/offline-booking-ui-map.md`, `docs/features/customer-discovery.md`, `docs/features/marketing-homepage.md`
- **Summary:** Exposed optional laundry lat/lng on existing list/search payloads (cache v3). `/stores` gained a Near me control (graceful deny → area search) sorting via client haversine. Sticky Stores opens a deferred vaul Drawer with up to 3 nearest/featured rows (View / Call / WhatsApp + See all stores) — no maps SDK.
- **Risks:** Near-me quality depends on partners having lat/lng seeded; without coords, sort falls back to approximate distances after real GPS rows. Sticky Stores is now a button (sheet) not a direct `/stores` link — FABs/footer still navigate.
- **Next:** Seed missing laundry coordinates; optional distance label on directory cards when GPS is active.
- **Refs:** User request — Near me + sticky quick-pick sheet

---

## 2026-07-29 — Stores directory card Call / WhatsApp actions

- **Type:** feat
- **Scope:** Marketing `/stores` directory — compact contact + view actions
- **Files:** `stores-card.tsx`, `stores-card-skeleton.tsx`, `marketing-homepage.spec.ts`, `docs/features/customer-discovery.md`, `docs/features/marketing-homepage.md`, `docs/product/offline-booking-ui-map.md`, `docs/product/offline-booking-customer-experience.md`, `logs/implementation-log.md`
- **Summary:** Each store card keeps name + city and adds a lean action row: primary View store → `/discover/[id]`, plus Call / WhatsApp icons driven by `GET /laundries/{id}/contact` (`show_call` / `show_whatsapp` / `requires_login`) with `trackContactEvent` source `stores_directory`. Guests never get hardcoded `tel:` / `wa.me` hrefs when online booking requires login.
- **Risks:** One contact GET per visible card (React Query cache key shared with storefront); acceptable for small directory lists.
- **Next:** Optional unit test for requires_login redirect path.
- **Refs:** User request — stores card contact actions; BUG-2026-07-14-004 guest contact rules

---

## 2026-07-29 — Marketing contact actions: Find stores

- **Type:** feat
- **Scope:** Marketing conversion chrome — sticky CTA, FABs, final CTA band
- **Files:** `mobile-sticky-cta.tsx`, `floating-contact-actions.tsx`, `final-cta-band.tsx`, `marketing-homepage.spec.ts`, `docs/features/marketing-homepage.md`, `logs/implementation-log.md`
- **Summary:** Added a third contact action linking to `/stores` (MapPin / “Stores” / “Find stores”) beside WhatsApp and Call across mobile sticky bar, floating FABs (incl. footer inline), and the homepage final CTA band. Copy treats self-serve store browse as equal to chat/call; Playwright asserts the sticky stores link.
- **Risks:** Three sticky actions are tighter on ~360px widths — short “Stores” label + `min-h-12` / `min-w-11` keep tap targets ≥44px.
- **Next:** Optional smoke for FAB + final CTA stores link in Playwright.
- **Refs:** User request — Find stores next to Call/WhatsApp

---

## 2026-07-29 — Fix `/partner/storefront` prerender `hasHydrated` crash

- **Type:** fix
- **Scope:** Zustand persist SSR — `store.persist` missing when `localStorage` throws under Node
- **Files:** `frontend/lib/ssr-safe-storage.ts`, `frontend/lib/ssr-safe-storage.test.ts`, `frontend/store/auth.store.ts`, `frontend/store/nav-notifications.store.ts`, `frontend/lib/hooks/use-store-hydrated.ts`, `frontend/components/providers/store-hydration.tsx`, `frontend/features/marketing/pricing/pricing-category-rack.tsx`, `logs/implementation-log.md`
- **Summary:** Default Zustand `createJSONStorage(() => localStorage)` returns `undefined` on the server, so persist middleware never attaches `api.persist` and `useStoreHydrated` crashes during static generation (`Cannot read properties of undefined (reading 'hasHydrated')`). Added SSR-safe storage for auth/nav stores, optional-chained the hydration hook + `StoreHydration`, removed a leftover pricing-rack `console.log`.
- **Risks:** Server path uses no-op storage (expected with `skipHydration`); client still rehydrates via `StoreHydration`.
- **Next:** Re-run `next build` to confirm `/partner/storefront` prerenders.
- **Refs:** Prerender error on `/partner/storefront`

---

## 2026-07-29 — Unblock `next build` static generation hangs

- **Type:** fix
- **Scope:** Build-time SSR fetches that could stall at “Generating static pages (0/N)” when the API is down or firewalled
- **Files:** `frontend/lib/abort-signal-after.ts`, `frontend/lib/online-booking.ts`, `frontend/features/marketing/pricing/api/marketplace-from.ts`, `frontend/app/(app)/checkout/[laundryId]/page.tsx`, matching Jest tests, `logs/implementation-log.md`
- **Summary:** Added 5s abort timeouts on `/config` and `/catalog/marketplace-from` server fetches via portable `abortSignalAfter` (fail open to existing fallbacks). Marked checkout `force-dynamic` so it is not prerendered against a live config flag.
- **Risks:** Very slow APIs (>5s) will use fallbacks during SSR/build — acceptable for marketing pricing; checkout resolves at request time.
- **Next:** None required for this hang.
- **Refs:** Production build stall at static page generation

---

## 2026-07-29 — Register page matches login + marketing standards

- **Type:** ui / fix
- **Scope:** Auth `/register` parity with `/login` + MarketingShell
- **Files:** `frontend/app/register/page.tsx`, `frontend/app/login/page.tsx`, `frontend/tests/e2e/marketing-homepage.spec.ts`, `frontend/tests/e2e/auth-session.spec.ts`, `logs/implementation-log.md`
- **Summary:** Customer-only register keeps email/password/name; document title `Create account · WashHouse`; Sign in footer preserves safe `next`; “Laundry or admin?” → `/staff` under the card (no partner/admin signup confusion). Login “Create account” also forwards `next`. Playwright asserts chrome, title, staff link, and next-aware Sign in.
- **Risks:** Staff link could be mistapped by customers — copy is intentionally soft (“Laundry or admin?”) and does not advertise register for partners.
- **Next:** Optional sticky-CTA hide on auth routes (from prior MarketingShell note).
- **Refs:** Prompt 2 after MarketingShell auth; `docs/features/auth.md`

---

## 2026-07-29 — BUG-001: Forgot + reset password UI

- **Type:** feature / fix
- **Scope:** Ship `/forgot-password` + `/reset-password` under MarketingShell; wire login “Forgot password?” link; close BUG-001 launch gate
- **Files (new):**
  - `frontend/app/forgot-password/{layout,page}.tsx`
  - `frontend/app/reset-password/{layout,page}.tsx`
  - `frontend/features/auth/components/{forgot,reset}-password-form.tsx`
  - `frontend/features/auth/schemas/{forgot,reset}-password.schema.ts`
  - `frontend/features/auth/schemas/password-reset.schema.test.ts`
- **Files (updated):** `frontend/services/auth.ts` (`forgotPassword` / `resetPassword`), `frontend/app/login/page.tsx`, `frontend/tests/e2e/smoke.spec.ts`, `BUG_LIST.md`, `logs/bug-tracker.md`, `docs/features/auth.md`
- **Summary:** Forgot form posts email to `POST /auth/password/forgot` and always shows generic success (no email-existence leak). Reset form takes email + code (`?code=` or `?token=`) + new/confirm password (min 8) → `POST /auth/password/reset`. Audience query preserved from login. Errors via `getApiErrorMessage` (no stack traces). Jest schema tests + Playwright smoke (mocked forgot + reset prefills).
- **Risks:** Reset requires email delivery (or `OTP_DEBUG` / `otp_debug` toast in local). SMTP still required in non-debug staging.
- **Next:** Optional full E2E with seeded mailbox; soft-recheck production-readiness GO after health probes.
- **Refs:** BUG-001; `docs/features/auth.md`; production-readiness-2026-07-28

---

## 2026-07-29 — Auth pages use MarketingShell chrome

- **Type:** ui / fix
- **Scope:** Align `/login` + `/register` with marketing navbar/footer; remove duplicate logo/back chrome
- **Files (new):** `frontend/app/login/layout.tsx`, `frontend/app/register/layout.tsx`
- **Files (updated):** `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`, `frontend/components/auth/auth-form-card.tsx`, `frontend/lib/auth-login-audience.ts`, `frontend/lib/auth-login-audience.test.ts`, `frontend/tests/e2e/marketing-homepage.spec.ts`
- **Summary:** Client auth pages wrap via route layouts → `MarketingShell` (RSC-safe). Dropped in-page WashHouse logo + ArrowLeft back row; partner/admin keep Staff portal text under the card. `AuthFormCard` no longer uses full-viewport `min-h` under sticky nav + mobile sticky CTA. Playwright asserts MarketingNavbar on auth routes + mobile submit clears sticky CTA.
- **Risks:** Sticky CTA still present on auth (by design); padding relies on MarketingShell `main` pb.
- **Next:** Optional — hide sticky CTA on auth-only routes if product prefers quieter chrome.
- **Refs:** MarketingNavbar / MarketingShell; auth audience `?audience=partner|admin`

---

## 2026-07-28 — API integration test matrix (Phase 5 / qa-engineer)

- **Type:** test
- **Scope:** Lock Phases 2–7 P0/P1 fixes with pytest + Playwright; role header fixtures; flake-proof E2E scripts
- **Files (new):**
  - `backend/tests/api/test_users.py` — profile + address CRUD / IDOR / default-delete guard
  - `backend/tests/api/test_admin.py` — dashboard RBAC, paginated list envelope (BUG-014-002), platform-config, `/config`
  - `backend/tests/unit/test_laundry_repository.py` — multi-laundry `get_by_owner` / `list_by_owner` (BUG-015-001)
  - `backend/tests/unit/test_whatsapp_notifier_nonblocking.py` — schedule must not block (BUG-020)
  - `frontend/features/checkout/lib/navigate.test.ts` — `goToCheckout` no env re-gate (BUG-013)
  - `frontend/playwright.smoke.config.ts` — smoke without dual webServer (BUG-009 workaround)
- **Files (updated):**
  - `backend/tests/conftest.py` — `customer_headers` / `partner_headers` / `admin_headers` (+ users/laundry)
  - `backend/tests/api/test_orders.py` — create+GST, empty items 422, cancel after pickup, list auth
  - `backend/tests/api/test_partner.py` — multi-laundry orders list regression + fixture smoke
  - `backend/tests/api/test_walk_in_orders.py` — non-blocking Celery hang regression; WhatsApp provider session patch
  - `backend/app/schemas/marketing.py` — `from_attributes=True` on testimonials (suite unblocker)
  - `frontend/tests/e2e/smoke.spec.ts` — discover resolves cards/empty (not infinite skeleton)
  - `frontend/tests/e2e/helpers/{auth,partner-orders}.ts` — assert login 200; resolve partner laundry dynamically
  - `frontend/tests/e2e/partner-journey.spec.ts` — Accept accessible-name match (`Accept order <code>`)
  - `frontend/package.json` — `test:e2e` → smoke config; `test:e2e:{smoke,customer,partner,admin,auth,journeys,all}`
- **Summary:** `pytest tests/api/` **125 passed ×3**. `npm run test:e2e` (smoke) **2/2 ×3**. Customer/partner/admin journeys + smoke **green ×2**. Coverage exercised on order/partner/user/admin services + laundry/address repos + WhatsApp notifier.
- **Risks:** Default `playwright.config.ts` dual-webServer still hangs on unhealthy :3000 (use role configs). Local pytest still needs `DATABASE_URL` override when `dlm` role missing (BUG-002).
- **Next:** Phase 6 payments hardening leftovers; fold smoke into main Playwright when BUG-009 fixed.
- **Refs:** `.cursor/prompts/api-integration-test-matrix.md`, `write-tests.md`; BUG-011/012/013/020/021/014-002/015-001

---

## 2026-07-28 — Perf + a11y review (performance-optimizer + accessibility-reviewer)

- **Type:** perf / a11y / fix
- **Scope:** Lighthouse mobile on `/, /discover, /partner, /admin`; axe on login/discover/checkout/partner orders/admin; keyboard login→discover→laundry; touch targets
- **Files:** `frontend/.lighthouserc.json`, `frontend/styles/tokens.css`, `frontend/components/ui/button.tsx`, `frontend/app/(admin)/admin/page.tsx`, `frontend/features/admin/**`, `frontend/features/partner/**`, `frontend/features/orders/order-tracking.tsx`, `frontend/features/discover/marketplace/how-it-works.tsx`, pickup/delivery/dispute file inputs, `frontend/tests/e2e/critical-a11y.spec.ts`, `playwright.a11y.config.ts`, docs + `logs/performance-log.md`
- **Summary:** P0 a11y fixed (contrast tokens, list+motion, file-input `aria-hidden`, Recharts sparkline focusables, toast `richColors`). Dashboards leaner via unused `AdminDashboardLazy` + dynamic charts. Touch ≥44px on mobile `sm` buttons + order actions. Playwright critical-a11y **7/7** (`logs/playwright-critical-a11y.txt`). `/` mobile LCP **2.4s**, CLS **0.01**; CLS OK on all four routes. Perf score still warn-level — accepted pending prod remasure.
- **Risks:** Brand blue darkened slightly for AA; Sonner without `richColors` looks less “semantic”.
- **Next:** Remasure Lighthouse on `next start`; flip LHCI performance warn→error when ≥90.
- **Refs:** `.cursor/prompts/performance-review.md`, `accessibility-review.md`; `logs/lighthouse-2026-07-28/`

---

## 2026-07-28 — Admin marketplace chain (Anita QA + BE architect)

- **Type:** test / fix
- **Scope:** admin journey — KPIs, approvals, commission, complaints, RBAC 403, approval→order chain
- **Files:** `backend/tests/api/test_admin_marketplace_chain.py`, `backend/app/services/admin_service.py`, `backend/app/api/v1/endpoints/admin.py`, `backend/app/api/v1/endpoints/partner.py`, `backend/app/models/enums.py`, `backend/alembic/versions/20260728_0035_laundry_approval_audit_actions.py`, `frontend/features/admin/admin-approval-queue.tsx`, `frontend/features/admin/disputes/dispute-detail-drawer.tsx`, `frontend/features/admin/components/confirm-action-dialog.tsx`, `frontend/tests/e2e/admin-marketplace-chain.spec.ts`, `frontend/playwright.admin.config.ts`, feature specs + logs
- **Summary:** Pytest **2/2** (register→approve→order→accept→complete + 403 on all core admin routes). Playwright Anita **5/5** (`logs/playwright-admin-marketplace-chain-1.txt`). Fixed partner register MissingGreenlet on `services`; admin orders outerjoin so walk-ins appear; approve/reject audit + confirm dialogs. P2 gaps filed on subscriptions/notifications/loyalty.
- **Risks:** Run alembic `20260728_0035` on app DB before approve audit writes in non-test envs.
- **Next:** Optional second Playwright re-run; fold admin config into main suite when dual-webServer (BUG-009) is fixed.
- **Refs:** specs admin-dashboard, admin-approvals, commission, complaints

---

## 2026-07-28 — Partner journey (Mahesh QA + FE architect)

- **Type:** test / fix
- **Scope:** partner happy path E2E + IDOR pytest; close P0 partner bugs
- **Files:** `frontend/tests/e2e/partner-journey.spec.ts`, `frontend/tests/e2e/helpers/{auth,partner-orders}.ts`, `frontend/playwright.partner.config.ts`, `frontend/app/(admin)/layout.tsx`, `frontend/app/(partner)/layout.tsx`, `backend/app/services/notifications/order_status_whatsapp_notifier.py`, `backend/app/tasks/celery_app.py`, `backend/tests/api/test_partner.py`, logs
- **Summary:** Full partner journey Playwright (10/10) against seed partner: KPIs, accept order (API-seeded incoming), inventory/QR surfaces, staff CRUD, catalog/pricing, walk-in create+advance, settlements/ops/reviews, `/admin` deny without shell leak, mobile primary actions, customer blocked from `/partner`. Pytest `test_partner.py` 9/9 (accept/status/staff + cross-laundry IDOR). Fixed walk-in hang when Redis down; gated admin/partner shells at layout RoleGuard.
- **Risks:** Nested page+layout RoleGuard double-checks `/me`; Celery WhatsApp still best-effort without Redis.
- **Next:** Optional start Redis for real WhatsApp enqueue; fold partner webServer into main Playwright config if dual-server hang (BUG-009) remains.
- **Refs:** BUG-2026-07-28-020, BUG-2026-07-28-021; specs partner-*; `logs/playwright-partner-journey-24.txt`

---

## 2026-07-28 — Auth session verify (customer / partner / admin)

- **Type:** test / fix
- **Scope:** auth — API RBAC + Playwright role login smoke
- **Files:** `backend/tests/api/test_auth.py`, `backend/tests/conftest.py`, `backend/pyproject.toml`, `frontend/tests/e2e/helpers/auth.ts`, `frontend/tests/e2e/auth-session.spec.ts`, `frontend/playwright.auth.config.ts`, `logs/bug-tracker.md`
- **Summary:** Extended API auth coverage for login/refresh/logout per role, wrong password, expired/missing token (401), and cross-role / partner-mutation IDOR (403). Added Playwright helpers `loginAsCustomer` / `loginAsPartner` / `loginAsAdmin` + smoke spec. Fixed Windows asyncpg loop coupling by using function-scoped NullPool engines + sync schema bootstrap.
- **Risks:** Default Playwright config still dual-webServer (BUG-009); local pytest still needs `DATABASE_URL` override when `dlm` user missing (BUG-002 mitigated).
- **Mitigation:** Auth smoke via `playwright.auth.config.ts`; document env overrides in bug tracker.
- **Next:** Optional — fold auth webServer fix into main Playwright config; seed CI `dlm_test` creds.
- **Refs:** `fix-api-auth-session.md`, `docs/features/auth.md`; BUG-002 (mitigated), BUG-009 (open)

---

## 2026-07-28 — Pre-flight local stack (devops + qa)

- **Type:** ops / qa
- **Scope:** Verify local stack before role testing; fix P0 connectivity only
- **Files:** `frontend/.env.local` (API URL override); `logs/bug-tracker.md`; `logs/deployment-log.md`; this entry
- **Summary:** Brought local API up (`uvicorn :8000`). Health **200**, migrations at `20260717_0034`, CORS OK, admin login **200**. Fixed P0: `.env.local` now sets `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1` (was falling through to Render via `frontend/.env`). Playwright smoke **2/2 green**. Pytest **84 errors** (test DB password) + FE type-check/unit feature fails **logged, deferred**. Redis down but rate-limit off. Staging Render health still times out.
- **Risks:** Role testing against Render if someone runs FE without `.env.local`; pytest not green locally until `dlm_test` credentials aligned.
- **Next:** Role testing (auth-session / CRUD prompts); triage BUG-2026-07-28-002…008; optional health/db+redis endpoints.
- **Refs:** BUG-2026-07-28-001 (resolved), `-002`…`-008` (open); `fix-api-connectivity-env.md`

---

## 2026-07-28 — Production readiness audit (all roles)

- **Type:** docs
- **Scope:** product-manager + qa-engineer — production readiness matrix + execution plan (no code fixes)
- **Files:** `logs/implementation-log.md` (this entry); sources: `current-status.md`, `docs/product/INDEX.md`, `docs/features/*`, `DEMO_ACCOUNTS.md`, `backend/tests/**`, `frontend/tests/e2e/**`, `.cursor/prompts/api-production-ready.md`, `.cursor/checklists/post-deploy.md`
- **Summary:** Audited existing pytest/Jest/Playwright coverage, QA seed accounts, and health probes against customer/partner/admin critical paths. App is **not production-ready**: health readiness probes missing (`/health/db`, `/health/redis`), forgot-password UI absent (BUG-001), no Playwright role journeys (login→order→partner→admin), payments/subscriptions/loyalty thin or stubbed, staging health + CI remote still Phase-6 blockers.
- **Risks:** Shipping without the phased API-production-ready prompts risks silent CRUD/contract failures across roles; Razorpay Checkout.js + webhook idempotency remain launch risks.
- **Mitigation:** Run Cursor phases below in order; gate deploy on matrix P0 rows green + post-deploy checklist.
- **Next:** Execute phases 0→5 from `.cursor/prompts/api-production-ready.md`, then P0 product gaps (forgot-password UI, health/db+redis, E2E critical flows, Razorpay), then `.cursor/prompts/deploy.md` + post-deploy checklist.
- **Refs:** `docs/deployment/production-readiness-v0.1.0.md` (DO NOT DEPLOY); BUG-001, BUG-010, BUG-012, BUG-016

### Inventory (2026-07-28)

| Area | What exists |
| ---- | ----------- |
| Backend pytest | 31 files under `backend/tests/` — strong on marketing, price-list, offline/walk-in, auth happy path; many partner/admin/order/payment areas are **auth-gate only** (401), not CRUD happy paths |
| Frontend unit | ~29 Jest files — mostly marketing/discovery/nav/price-list helpers; thin on orders/partner/admin |
| E2E Playwright | 10 specs — smoke home+discover, marketing, discover, price-list, offline/online booking contact; **no** login / place-order / partner-accept / admin-approve |
| Seed users | `DEMO_ACCOUNTS.md` + `seed_qa.py` — admin@demo.dlm, partner.koramangala@demo.dlm, customer@demo.dlm, vip/highrisk/blocked, platform-partner, support, ops; password conventions documented |
| Health | `GET /api/v1/health` liveness only + `test_health.py`; **missing** `/health/db` and `/health/redis` required by post-deploy checklist |

### Ordered Cursor phases (run next)

1. **Phase 0 — Diagnose** → `.cursor/prompts/diagnose-api-errors.md` (bug list → `logs/bug-tracker.md`)
2. **Phase 1 — Connectivity/env** → `.cursor/prompts/fix-api-connectivity-env.md` (incl. health/db+redis gap)
3. **Phase 2 — Auth/session** → `.cursor/prompts/fix-api-auth-session.md` + BUG-001 forgot-password UI via `.cursor/prompts/fix-bug.md` / `add-page.md`
4. **Phase 3 — FE↔BE contracts** → `.cursor/prompts/fix-api-frontend-contracts.md`
5. **Phase 4 — CRUD by role** → `.cursor/prompts/fix-api-crud-by-role.md` (customer → partner → admin)
6. **Phase 5 — Test matrix** → `.cursor/prompts/api-integration-test-matrix.md` + `.cursor/prompts/write-tests.md` (pytest happy paths + Playwright critical flows from `08-testing.md`)
7. **Phase 6 — Payments hardening** → Razorpay Checkout.js + webhook idempotency (BUG-012); COD confirmation; ADR-001; optional `generate-adr.md` if contract break
8. **Phase 7 — Planned/stub features gate** → subscriptions/loyalty/notifications: ship minimal or explicitly defer with feature flags; `start-feature.md` only if launch-blocking
9. **Phase 8 — Deploy gate** → `.cursor/prompts/deploy.md` + `.cursor/checklists/post-deploy.md`; confirm staging health + CI green (current-status Phase-6 blockers)
10. **Optional polish** → `.cursor/prompts/marketing-production-ready.md`, `security-review.md`, `accessibility-review.md`, `performance-review.md`

### PRODUCTION READINESS MATRIX (summary)

P0 gaps: forgot-password UI; health/db+redis; auth/order/partner/admin E2E; order-create + payment API tests; staging health; Razorpay live checkout + webhook reconciliation; order idempotency (BUG-016).  
P1 gaps: complaints/disputes happy-path tests; partner ops (inventory/QR/staff/settlements) CRUD tests; subscriptions cancel/me; notifications beyond stubs.  
P2 gaps: loyalty/referrals full product; Google OAuth; WhatsApp templates live; marketing Lighthouse perf.

Full matrix published in chat for this audit (Feature | Role | Spec | Routes | API | Tests | Gap | Priority).

---

## 2026-07-27 — Frontend npm audit: 17 → 0 vulnerabilities

- **Type:** fix
- **Scope:** `frontend` dependency security
- **Files:** `frontend/package.json`, `frontend/package-lock.json`
- **Summary:** Ran `npm audit fix` (not `--force`, which would downgrade Next to 9.3.3 / LHCI to 0.1.0). Bumped `axios` to `^1.18.1`, `postcss` to `^8.5.23`, `@lhci/cli` to `^0.15.1`. Added `overrides` for `postcss`, `sharp`, `brace-expansion`, `cookie`, `uuid`, `tmp` so nested Next/LHCI/eslint trees pick up patched versions. `npm audit` now reports 0 vulnerabilities.
- **Risks:** `sharp@0.35` override may differ from Next’s bundled expectation for image optimization; LHCI 0.15 is a minor bump.
- **Next:** Smoke `next build` / image optimization if image pipelines change; avoid `npm audit fix --force`.

---

## 2026-07-27 — Book-now dialog, login logo/titles, franchise PDF status

- **Type:** fix
- **Scope:** Marketing book-now dialog, auth login chrome, franchise brochure
- **Files:** `dialog.tsx`, `select.tsx`, `book-now-dialog.tsx`, `book-pickup-form.tsx`, `washhouse-logo.tsx`, `login/page.tsx`, `register/page.tsx`, `public-shell.tsx`, `customer-title.ts`, `auth-login-audience.ts`, `public/brochures/README.md`, unit + e2e tests, `logs/bug-tracker.md`
- **Summary:** Fixed book-now layout (Dialog `flex` not `grid`, full-width fields, preferred-time room, notes hint below textarea). Enlarged auth WashHouse wordmark. Audience-aware login navbar titles (partner/admin/customer) instead of “DLM”. Franchise PDF CTA unchanged; README notes official PDF still missing.
- **Risks:** Shared Dialog layout change could affect other modals visually (flex vs grid stacking). Official brochure still placeholder until asset is dropped.
- **Next:** Drop official `washhouse-franchise.pdf` in place; smoke `?book=1` + `/login?audience=partner|admin` + `/franchise` brochure download.

---

## 2026-07-21 — Catalog tiles: sample import scale fix + mapping docs

- **Type:** fix
- **Scope:** Marketing catalog product photos (`/pricing` racks, homepage services/special-care)
- **Files:** `frontend/scripts/catalog_photo_utils.py`, `frontend/scripts/optimize-catalog-imports.py`, `frontend/public/sample/MAPPING.md`, `frontend/public/sample/SKIPPED.md`, `frontend/public/catalog/README.md`, `frontend/public/catalog/ATTRIBUTION.md`, `frontend/features/marketing/catalog/washhouse-catalog-photos.ts`, re-encoded `public/catalog/**/*.webp` from `_imports`
- **Summary:** Sample Amazon `_SL360_` sources were fitted onto 1200×900 white canvases but subjects stayed ~25–35% frame height because PIL `thumbnail()` never upscales. Fixed `fit_on_tile_canvas` to crop alpha bbox then resize (up or down) to ~82% fill; always re-fit in `save_catalog_webp`. Re-ran `npm run catalog:optimize -- --force`. Restored `MAPPING.md`/`SKIPPED.md`. Pointed `pillow` → `household/pillow-cover`, `trolley` → `accessories/trolley-m`. Verified `/pricing` + homepage resolve only `/catalog/**` laundry tiles with care-context alts (no Unsplash).
- **Risks:** A few office samples are e-commerce illustrations (shirt/hoodie) rather than photos; lifestyle Unsplash swaps break the single-garment white-tile look so samples were kept.
- **Mitigation:** Prefer photo samples when re-dropping; style guide P0 custom shoot for ethnic wear remains.
- **Next:** Optional rembg pass for stubborn backgrounds; replace remaining illustration samples with photo shoots.

---

## 2026-07-17 — SEV2: Wire SMTP EmailService (contact / franchise / forgot-password)

- **Type:** fix
- **Scope:** Backend outbound email
- **Files:** `email_service.py`, `notifications/email.py`, `marketing_service.py`, `auth_service.py`, `announcement_service.py`, `config.py`, `exceptions.py`, `requirements/base.txt`, `.env.example`, `docs/runbooks/email-smtp.md`, `docs/deployment/railway.md`, `tests/unit/test_email_service.py`, `logs/bug-tracker.md`
- **Summary:** Diagnosed silent no-send (no EmailService; marketing DB-only; forgot-password OTP never mailed). Implemented `EmailService` via `aiosmtplib`, clear 503/502 domain errors, SMTP port/TLS/FROM/auth validation, support notify on contact/franchise (persist first), password-reset email when SMTP configured. Announcement email remains stub with clearer logs.
- **Risks:** Local without SMTP still accepts contact (best-effort); staging forgot-password requires SMTP or returns 503. Operators must set SMTP on Railway.
- **Mitigation:** Runbook + structured logs (masked recipients, no password); unit tests for missing SMTP and mocked success.
- **Next:** Optional Mailtrap smoke on staging; bulk announcement email sender.

---

## 2026-07-17 — Remove compare-stores UX from marketing /stores

- **Type:** feat
- **Scope:** Marketing stores directory + pricing/services copy
- **Files:** `stores-page-view.tsx`, `stores-card.tsx`, `stores-hero.tsx`, `featured-stores-teaser.tsx`, `pricing-cta.tsx`, `pricing-variety-note.tsx`, `pricing-data.ts`, `pricing-hero.tsx`, `services-cta.tsx`, `services-hero.tsx`, `testimonials-fallback.ts`, `marketing-homepage.spec.ts`, `docs/features/*`, `docs/api/endpoints/laundry-compare-hints.md`, `logs/feature-progress.md`
- **Summary:** Marketing `/stores` is now a slim name+city directory (`StoresCard`) with search only — no rating/price/compare filters or LaundryCard chrome. Pricing/services/home copy no longer promises per-store comparison; authenticated `/discover` still uses compare hints.
- **Risks:** Featured homepage teaser is slimmer (less visual weight than PartnerCard). List API still lacks `address_line` so city stands in for address.
- **Mitigation:** Playwright asserts no compare chrome on `/stores` and updated pricing hero; discovery cards untouched.
- **Next:** Optional: expose `address_line` on laundry list for fuller directory rows.

---

## 2026-07-17 — Marketing Book Now opens pickup dialog

- **Type:** feat
- **Scope:** Marketing CTAs / lead capture
- **Files:** `frontend/features/marketing/book-now/*`, `marketing-shell-overlays.tsx`, `marketing-navbar.tsx`, `home-hero.tsx`, `services-preview.tsx`, `delivery-options-band.tsx`, `contact-page-view.tsx`, `marketing-glass-card.tsx`, `marketing-nav.ts`, `hero-carousel.tsx`, `marketing-homepage.spec.ts`, `docs/features/marketing-homepage.md`, `logs/feature-progress.md`
- **Summary:** Book Now / Book pickup CTAs open a shared Radix Dialog (`BookPickupForm`) instead of navigating to `/stores`. Form POSTs to existing `POST /marketing/contact` with subject `order-help` (service + preferred time + notes in message). Deep link `?book=1` opens the same modal. `/stores` kept for Find a store / browse CTAs.
- **Risks:** Slight marketing client JS increase (dialog + form). Contact rate limits apply to book leads.
- **Mitigation:** Playwright covers dialog open, deep link, and mocked submit happy path; reuse contact schemas/API.
- **Next:** Smoke on phone — full-screen dialog, Esc close, focus restore.

---

## 2026-07-17 — Home More Services CTA → /services

- **Type:** fix
- **Scope:** Marketing homepage services preview
- **Files:** `services-preview.tsx`, `marketing-homepage.spec.ts`, `docs/features/marketing-homepage.md`, `logs/implementation-log.md`
- **Summary:** More Services (`more-services`) no longer shows Book Now; single “View services” link goes to `/services`. Other service cards keep Book Now → `/stores`. One CTA link per card (no nested whole-card + link).
- **Risks:** Low — CTA label/href branch only.
- **Mitigation:** Playwright asserts More Services → `/services` and Wash & Fold Book Now → `/stores`.
- **Next:** None.

---

## 2026-07-17 — Fix services preview mobile horizontal scroll (SEV2)

- **Type:** fix
- **Scope:** Marketing homepage services carousel
- **Files:** `services-preview.tsx`, `horizontal-scroll-touch.ts`, `globals.css`, `touch-scroll-mobile.spec.ts`, `19-responsive-design.md`, `logs/bug-tracker.md`
- **Summary:** Native `overflow-x-auto` strip was using Embla’s `horizontal-scroll-touch` (`touch-action: pan-y`), which blocked horizontal swipe. Added `HORIZONTAL_SCROLL_NATIVE_CLASS` (`manipulation`) for CSS carousels; desktop/tablet grids unchanged. E2E asserts overflow + scrollLeft + vertical wheel.
- **Risks:** Other `overflow-x-auto` callers still on pan-y class may have the same latent bug (admin tabs, partner chips).
- **Next:** Audit remaining `HORIZONTAL_SCROLL_TOUCH_CLASS` + `overflow-x-auto` pairs; optional real-device swipe QA at 390×844.

---

## 2026-07-17 — Request brochure CTAs download PDF

- **Type:** feat
- **Scope:** Marketing franchise brochure CTAs
- **Files:** `franchise-constants.ts`, `franchise-teaser.tsx`, `franchise-page-view.tsx`, `hero-slides.ts`, `hero-carousel.tsx`, `contact-constants.ts`, `contact/index.ts`, `franchise/index.ts`, `frontend/public/brochures/*`, `marketing-homepage.spec.ts`, `docs/features/marketing-homepage.md`
- **Summary:** Replaced `CONTACT_FRANCHISE_BROCHURE_HREF` (Contact subject=franchise) with shared `FRANCHISE_BROCHURE_PDF_HREF` (`/brochures/washhouse-franchise.pdf`). All Request brochure links (home teaser, franchise page, hero slide) use `download`. Placeholder PDF + README document where to drop the official asset; Contact form/`?subject=franchise` deep links unchanged.
- **Risks:** Placeholder PDF ships until marketing replaces the file in place (same path).
- **Next:** Drop official brochure into `frontend/public/brochures/washhouse-franchise.pdf`; smoke e2e brochure download tests.

---

## 2026-07-17 — `/pricing` neighbor product-photo prefetch

- **Type:** perf / ui
- **Scope:** Marketing pricing category racks
- **Files:** `pricing-category-rack.tsx`, `pricing-category-photo.tsx`, `use-prefetch-rack-photos.ts`, `lib/prefetch-pricing-product-image.ts`, `lib/neighbor-rack-indexes.ts`, `docs/features/marketing-pricing.md`
- **Summary:** Prefetch next/image optimizer URLs for `activeIndex ± 1` so dual-buffer crossfades do not flash empty muted; page-wide concurrency capped at 2; skip when `prefers-reduced-motion` or the rack section is off-screen. Shared `sizes` constant keeps prefetch candidates aligned with the visible frame.
- **Risks:** Extra bandwidth while scrolling an in-view rack; wrong srcSet width still possible on extreme viewports.
- **Mitigation:** Cap + IO/reduced-motion gates; prefer ≥1080w srcSet candidate matching the photo slot.
- **Next:** Thumb through Men/Women rails on mid Android and confirm no empty-frame flash.

## 2026-07-17 — `/pricing` regression review fixes

- **Type:** fix / ui / perf
- **Scope:** Marketing pricing tickets + women/kids ambient
- **Files:** `pricing-atelier.css`, `pricing-category-photo.tsx`, `pricing-category-ambient.tsx`
- **Summary:** Strengthened ticket stub-band fill so the top band reads as a laundry stub (not empty padding); biased rich women/kids veils toward the rates column and slightly dialed ambient opacity so “from ₹” stays crisp; dropped non-default `next/image` quality props and tightened ambient `sizes` to avoid oversized blurred downloads / Next quality warnings.
- **Risks:** Stub band may read slightly heavier on very light tickets; rich ambient slightly softer than uniqueness-pass peak.
- **Mitigation:** Verified stub luminance delta ~0.18, mobile photo-above-rates, no page overflow-x, reduced-motion static tables, focusable tags + aria-labels still present.
- **Next:** None for this pass.

## 2026-07-17 — `/pricing` visual uniqueness pass

- **Type:** ui
- **Scope:** Marketing pricing page atmosphere + tickets
- **Files:** `pricing-atelier.css`, `pricing-hero.tsx`, `pricing-how-it-works.tsx`, `pricing-price-guide.tsx`, `pricing-price-tag.tsx`, `docs/features/marketing-pricing.md`
- **Summary:** Tightened brand-forward hero steam/fabric wash; denser screw-hook tickets (larger type, compressed stub); stronger women/kids ambient depth; stations→guide handoff rail+drop with reduced gallery gap. Refined existing spindle/rail/ambient motions only — no new motion systems.
- **Risks:** Richer ambient opacity could soften ticket contrast in dark mode on low-end screens.
- **Mitigation:** Veil still biases toward rates column; prices use `--atelier-price`; reduced-motion path unchanged (static photo + table).
- **Next:** Visual QA light/dark at 375 / 768 / 1280; confirm women/kids depth vs men/household.

## 2026-07-17 — `/pricing` rate-card photo + peg layout

- **Type:** feat / ui
- **Scope:** Marketing pricing price guide redesign
- **Files:** `pricing-category-images.ts`, `pricing-category-photo.tsx`, `pricing-category-rack.tsx`, `pricing-atelier-guide.tsx`, `pricing-price-guide.tsx`, `pricing-atelier.css`, `docs/features/marketing-pricing.md`
- **Summary:** Each category is a full-bleed rate card: Unsplash editorial photo (next/image) + peg-rail tags. Desktop 12-col (5+7) alternating L↔R, section max-width 1280px; tablet/mobile stack photo above rates with horizontal tag scroller. Reduced-motion keeps tables with matching photos above. Atmosphere/`data-atmosphere` + marketplace-from grouping unchanged.
- **Risks:** Extra Unsplash image weight on `/pricing`; mid-Android scroll with photos + tag 3D.
- **Mitigation:** Lazy-load after first category; accurate `sizes`; transform/opacity motion only; photo height capped 280–420px on desktop.
- **Next:** Visual QA at 375 / 768 / 1280; confirm dark atelier tokens + reduced-motion path.

## 2026-07-17 — Fix marketing FAB webpack `.call` crash

- **Type:** fix
- **Scope:** Marketing shell chrome / contact FAB overlays
- **Files:** `marketing-shell-chrome.tsx`, `marketing-footer-contact-actions.tsx`, `marketing-shell-overlays.tsx`, `floating-contact-actions.tsx`
- **Summary:** Replaced `next/dynamic` + `ssr: false` for FAB/sticky contact overlays with static client imports. Async chunks were failing to resolve `lucide-react` modules under `optimizePackageImports` (`Cannot read properties of undefined (reading 'call')` on `/pricing`). Parents are already `'use client'`; IntersectionObserver stays in `useEffect`.
- **Risks:** Slightly larger initial marketing client JS (tiny icon + contact UI already used elsewhere).
- **Next:** Hard-refresh open tabs after pull; watch for same pattern on other lucide + dynamic chunks.

## 2026-07-17 — `/pricing` screw-hook conveyor metaphor

- **Type:** feat / perf
- **Scope:** Marketing pricing atelier visual metaphor
- **Files:** `pricing-peg-rail.tsx`, `pricing-price-tag.tsx`, `pricing-category-rack.tsx`, `pricing-atelier-guide.tsx`, `pricing-atelier.css`, `docs/features/marketing-pricing.md`
- **Summary:** Pushed hanging tags to commercial laundry conveyor: Phillips screw heads + short wire hooks, stronger `rotateY` spindle flip, alternating rod-slide between categories. CSS 3D only (no audio, no Three.js); data model + a11y path unchanged.
- **Risks:** Stronger perspective/`rotateY` on mid Android; decorative rail screw pattern + extra transforms.
- **Mitigation:** Transform/opacity only; no blend modes on rail accents; motion budget + `useInView` pause; reduced-motion still uses tables.
- **Next:** Device FPS check on mid Android; simplify further to static hooks if scroll scrub janks.

## 2026-07-17 — `/pricing` hanging-tag hardening

- **Type:** fix / a11y / perf
- **Scope:** Marketing pricing atelier UX hardening
- **Files:** `use-pricing-section-active.ts`, `pricing-atelier.css`, `pricing-price-tag.tsx`, `pricing-category-rack.tsx`, `pricing-category-table.tsx`, `pricing-atelier-guide.tsx`, `pricing-price-guide.tsx`, `pricing-hero.tsx`, `pricing-how-it-works.tsx`, `pricing-variety-note.tsx`, `pricing-cta.tsx`, `pricing-rail-reveal.tsx`, `api/marketplace-from.ts`, e2e `marketing-homepage.spec.ts`, `docs/features/marketing-pricing.md` (removed unused `pricing-accessible-list.tsx`)
- **Summary:** Viewport-pause steam/wave/mist via `data-atmosphere`; tags keyboard-focusable with aria-labels + focus scroll-into-view; reduced-motion tables use atelier tokens; mobile overflow-x clip + tag max-width; logo/tag CLS reserves; API fallback clarified; e2e selectors extended without weakening coverage.
- **Risks:** Long tab sequences on large categories; partial live API payloads still replace full fallback (fail/empty only).
- **Next:** Device QA at 375px + reduced-motion; optional skip-link past price racks.

## 2026-07-17 — `/pricing` hanging screw-peg atelier

- **Type:** feat
- **Scope:** Marketing pricing price guide UX
- **Files:** `frontend/features/marketing/pricing/pricing-atelier.css`, `pricing-atelier-guide.tsx`, `pricing-atelier-atmosphere.tsx`, `pricing-category-rack.tsx`, `pricing-price-tag.tsx`, `pricing-peg-rail.tsx`, `pricing-accessible-list.tsx`, `pricing-motion-budget.tsx`, `pricing-price-guide.tsx`, `pricing-hero.tsx`, `lib/tag-price-lines.ts` (+ test), `docs/features/marketing-pricing.md`
- **Summary:** Replaced plain category tables with laundry atelier: horizontal screw-peg rails, scroll-scrubbed tag tumble/settle, capped idle sway, mist atmosphere. `prefers-reduced-motion` keeps `PricingCategoryTable`; sr-only list for screen readers. Data/formatters unchanged.
- **Risks:** Many tags + scroll listeners on low-end phones — mitigated by motion budget + `useInView` pause.
- **Next:** Visual QA on real devices; optional hero polish if product wants stronger atelier cue above the fold.

## 2026-07-17 — Slice 5: discovery compare price hints

- **Type:** feat
- **Scope:** Partner garment price list (Slice 5) + customer discovery cards
- **Files:** `backend/app/schemas/laundry.py`, `repositories/catalog.py` (`compare_price_hints_for_laundries`), `services/laundry_service.py` (list/search v2 cache + hints), `partner_price_list_service.py` + `admin.py` (invalidate discovery cache), `tests/unit/test_compare_price_hints.py`, `tests/api/test_laundry_compare_hints.py`, `docs/api/endpoints/laundry-compare-hints.md`; `frontend/services/laundries.ts`, `features/discover/lib/{laundry-meta,compare-price-lines}.ts`, listing card + filters, marketplace `partner-card`, pricing CTA; docs/features + logs
- **Summary:** Public laundry list/search now return owner-set Wash & Fold + shirt dry-clean “from” hints (no suggested invent). `/stores` and discover cards show those lines when present; price filter/sort uses real `start_price_inr` (unpriced last). Pricing CTA copy “See prices near you” → `/stores`. No comparison matrix.
- **Risks:** Cards stay empty-priced until partners offer those two SKUs; distance/delivery still pseudo until geo.
- **Next:** Slice E booking bridge (optional); geo distance when product prioritizes it.

## 2026-07-17 — Slice D: marketplace-from + `/pricing` category tables

- **Type:** feat
- **Scope:** Partner garment price list (Slice D) + marketing pricing upgrade
- **Files:** `backend/app/schemas/marketplace_from.py`, `services/marketplace_from_service.py`, `repositories/catalog.py` (MIN aggregate), `api/v1/endpoints/catalog.py`, `router.py`, `partner_price_list_service.py` (cache invalidate), `tests/unit/test_marketplace_from.py`, `tests/api/test_marketplace_from.py`, `docs/api/endpoints/marketplace-from.md`; `frontend/features/marketing/pricing/*` (hero, how-it-works + compare, price guide tables, variety note, WashHouse fallback), `app/pricing/page.tsx`, e2e heading assertions, `docs/features/marketing-pricing.md`, `partner-price-list.md`
- **Summary:** Public `GET /catalog/marketplace-from` returns per-item MIN across approved offered prices with suggested fallback (`source` aggregate|suggested; deferred omitted). Marketing `/pricing` upgraded to FebriWash-style WashHouse category tables labeled “Starting from · indicative” + brand hero CTA → `/stores`. Static WashHouse suggested mirror used when API empty/unavailable.
- **Risks:** Local API tests need Postgres; empty partner pricing still shows suggested guide (honestly labeled).
- **Next:** Slice E booking bridge (optional); production catalog seed if not already applied.

## 2026-07-17 — Slice C: public laundry price-list + store detail

- **Type:** feat
- **Scope:** Partner garment price list (Slice C — public API + customer UI)
- **Files:** `backend/app/schemas/laundry_price_list.py`, `services/laundry_price_list_service.py`, `repositories/catalog.py`, `api/v1/endpoints/laundries.py`, `services/partner_price_list_service.py` (cache invalidate), `tests/api/test_laundry_price_list.py`, `frontend/features/laundry-price-list/`, discover Prices tab + storefront section, `tests/e2e/laundry-price-list.spec.ts`, `docs/api/endpoints/laundry-price-list.md`, docs/logs
- **Summary:** Public `GET /laundries/{id}/price-list` returns offered partner prices only (no suggested/partner fields). Redis + `Cache-Control`. FE FebriWash category tables with hidden empty columns, empty state + `laundry_services` fallback, Book/Schedule CTA. Playwright smoke for category headings + ₹ prices.
- **Risks:** Empty until partner applies suggested/edits prices; booking still uses `laundry_services` until Slice E.
- **Next:** Slice D — marketplace-from aggregates + marketing `/pricing` tables.

## 2026-07-17 — Slice B FE: partner price-list editor UI

- **Type:** feat
- **Scope:** Partner garment price list (Slice B — frontend editor)
- **Files:** `frontend/features/partner-price-list/` (api, schemas, components, tests), `app/(partner)/partner/pricing/page.tsx`, `features/partner/lib/partner-nav.ts`, `lib/query-keys.ts`, `docs/features/partner-price-list.md`, `docs/features/README.md`, logs
- **Summary:** FebriWash-style partner editor at `/partner/pricing` with category tabs (Wash rates / Men / Women / Kids / Winter / Household), inline INR edits + offered toggle, sticky save bar, confirm dialog for apply-suggested WashHouse prices. Wired to Slice B partner APIs. Jest covers row validation + save/apply success toasts.
- **Risks:** Dual catalogs vs service offerings until Slice E; partners must apply suggested or enter prices before public list shows items (Slice C).
- **Next:** Slice C — public laundry price-list + store-detail tables.

## 2026-07-17 — Slice B: partner price-list APIs

- **Type:** feat
- **Scope:** Partner price list (Slice B — API only; FE editor still pending)
- **Files:** `backend/app/schemas/partner_price_list.py`, `utils/money.py`, `repositories/catalog.py`, `services/partner_price_list_service.py`, `api/v1/endpoints/partner_price_list.py`, `router.py`, `tests/api/test_partner_price_list.py`, `tests/unit/test_money.py`, `docs/api/endpoints/partner-price-list.md`, `docs/database/schema.md` (compatibility note), `docs/features/partner-price-list.md`, logs
- **Summary:** Partner GET/PUT/PATCH price-list + idempotent apply-suggested. Laundry scoped from JWT owner (IDOR-safe). Validation: ≥0, max 99999.99, press only when catalog allows, offered requires a price. No dual-write to `laundry_services`.
- **Risks:** Dual catalogs until Slice E; partners with zero offered items still allowed.
- **Next:** Partner pricing editor UI; Slice C public laundry price-list.

## 2026-07-17 — Slice A: platform catalog + laundry_item_prices (DB)

- **Type:** feat
- **Scope:** Partner price list / platform catalog (Slice A — DB only)
- **Files:** `backend/app/models/catalog.py`, `enums.py`, `repositories/catalog.py`, `db/seed_washhouse_catalog.py`, `scripts/seed_washhouse_catalog.py`, `alembic/versions/20260717_0034_platform_catalog_and_laundry_item_prices.py`, `tests/unit/test_catalog_prices.py`, `docs/database/schema.md`, `erd.md`, `docs/features/partner-price-list.md`, `logs/decisions-log.md`, `logs/feature-progress.md`
- **Summary:** Added `platform_catalog_items` + `laundry_item_prices` (dual XOR `price_inr`, soft-delete, partial unique override). WashHouse seed is suggested-only; partners start empty (Apply suggested deferred to Slice B). Migration `20260717_0034` is reversible.
- **Risks:** Tests need Postgres (`dlm_test`); create_all must pick up new enums. Dual systems with `laundry_services` until Slice E.
- **Next:** Slice B — partner price-list API + Apply suggested + editor UI.

## 2026-07-17 — Spec partner garment price-list system

- **Type:** docs
- **Scope:** Partner price list / platform catalog (marketplace)
- **Files:** `docs/features/partner-price-list.md`, `docs/features/README.md`, `logs/feature-progress.md`
- **Summary:** Drafted feature spec for platform-owned WashHouse catalog + per-laundry prices, public “from ₹X” aggregates, partner editor, and store tables. Chose new `platform_catalog_items` / `laundry_item_prices` over extending `laundry_services`; booking bridge deferred.
- **Risks:** Dual catalogs until Slice E; partners may need clear UI copy distinguishing garment list vs service offerings.
- **Next:** Slice A — models, migration, WashHouse seed (no production UI yet).

## 2026-07-17 — Update public support phone & email

- **Type:** chore
- **Scope:** Marketing contact config (footer, contact page, Call/WhatsApp CTAs)
- **Files:** `frontend/features/marketing/contact/contact-constants.ts`, `frontend/.env.example`, `frontend/.env.local`, `infrastructure/vercel/env.md`
- **Summary:** Set default/public support email to `thewashhousesolutions@gmail.com` and phone/WhatsApp to `+91 99777 51122` (`9977751122`). All `CONTACT_CONFIG` consumers pick this up.
- **Risks:** Vercel/production must set matching `NEXT_PUBLIC_SUPPORT_*` / `NEXT_PUBLIC_WHATSAPP_NUMBER` if env overrides are already configured there.
- **Next:** Restart frontend dev server; update Vercel env if deployed.

---

## 2026-07-17 — Fix marketing Contact/Franchise form network errors

- **Type:** fix
- **Scope:** Marketing contact + franchise submit UX / local API connectivity
- **Files:** `frontend/lib/api-error-message.ts`, `frontend/lib/api-error-message.test.ts`, `frontend/features/marketing/lib/marketing-form-errors.ts`, `contact-form.tsx`, `franchise-application-form.tsx`, `logs/bug-tracker.md`
- **Summary:** Root cause was Category A — backend not running (env/CORS/contracts already correct; Alembic at `20260714_0033`). Started local API; POST `/marketing/contact` and `/marketing/franchise-inquiries` return 201. Stopped leaking axios bare “Network Error”; marketing forms now show actionable unavailable copy vs validation/rate-limit messages. Rate limits and auth unchanged.
- **Risks:** Forms still fail if uvicorn is down — now with clearer messaging. Local debug: keep `RATE_LIMIT_ENABLED=false` only in local `.env`.
- **Next:** Keep backend running alongside `npm run dev` when testing marketing submits.

---

## 2026-07-17 — Dedicated marketing Pricing page

- **Type:** feat
- **Scope:** Marketing `/pricing` + nav/footer
- **Files:** `frontend/app/pricing/page.tsx`, `frontend/features/marketing/pricing/*`, `frontend/features/marketing/services/services-pricing.tsx`, `services-data.ts`, `frontend/lib/navigation/marketing-nav.ts`, `marketing-footer.ts`, nav/e2e tests, `docs/features/marketing-pricing.md`
- **Summary:** Added a MarketingShell Pricing page (how it works, indicative rates from services data, CTA to `/stores`). Nav/footer Pricing now points to `/pricing`; Services keeps a short `#pricing` teaser. No GST claim; checkout tax math untouched.
- **Risks:** Old `/services#pricing` bookmarks still land on the teaser. Discover/partner Pricing nav unchanged.
- **Next:** Smoke `/pricing`, header/footer Pricing, Services teaser, mobile FAB/footer.

---

## 2026-07-17 — Remove GST marketing claim from Services pricing

- **Type:** fix
- **Scope:** Marketing Services pricing + soft marketing copy (footer/home meta)
- **Files:** `frontend/features/marketing/services/services-data.ts`, `services-pricing.tsx`, `frontend/components/layout/marketing-footer.tsx`, `frontend/app/page.tsx`
- **Summary:** Removed the “GST on every order” pricing card from `/services#pricing`. Remaining points (delivery, UPI, COD) keep a balanced 1/2/3-column grid. Softened footer tagline and Home meta description that claimed GST on every order. Legal/About pages and checkout GST calculation unchanged.
- **Risks:** None for booking/auth/checkout tax math — marketing copy only.
- **Next:** Smoke `/services#pricing` (no GST card); footer + Home meta; confirm checkout still shows tax if applicable.

---

## 2026-07-17 — Marketing browse/book CTAs → `/stores`

- **Type:** fix
- **Scope:** Marketing Services + Book Now CTAs; Discover→Stores directory links
- **Files:** `frontend/features/marketing/services/services-grid.tsx`, `services-data.ts`, `services-cta.tsx`, `frontend/lib/navigation/marketing-nav.ts`, `contact-page-view.tsx`, `featured-stores-teaser.tsx`, `frontend/app/error.tsx`, `frontend/app/not-found.tsx`, `docs/features/marketing-homepage.md`
- **Summary:** Customer-facing marketing “browse laundries / browse plans / book pickup / Book Now” CTAs now target `/stores` instead of `/discover`. FAQ copy updated Discover→Stores. Authenticated app `/discover`, laundry detail `/discover/[id]`, checkout, partner, and admin routes untouched.
- **Risks:** None for booking/auth/checkout pricing. Public error/404 recovery links now go to Stores (marketing-aligned).
- **Next:** Smoke Services card + bottom CTA, Home Book Now, Contact “Book a pickup”, featured stores empty-state; confirm laundry cards still open `/discover/[id]`.

---

## 2026-07-17 — Fix mobile footer social covered by FAB/sticky CTA

- **Type:** fix
- **Scope:** Marketing footer + floating contact FABs
- **Files:** `frontend/components/layout/marketing-footer.tsx`, `frontend/components/marketing/floating-contact-actions.tsx`, `docs/features/marketing-homepage.md`
- **Summary:** Footer now has mobile-only bottom safe padding so copyright/social clear the sticky WhatsApp/Call bar. FABs also yield (`inert` + fade) when `[data-marketing-footer-social]` enters the sticky/FAB zone, matching existing bottom-CTA overlap behavior. Desktop inline footer contact actions unchanged.
- **Risks:** None for booking/auth/checkout; shell chrome only. If IntersectionObserver fails, padding still keeps social above the sticky CTA.
- **Next:** Smoke 360–414px: scroll to footer → social tappable; FABs still work mid-page; sticky CTA WhatsApp/Call still work at bottom.

---

## 2026-07-17 — Marketing footer link groups side-by-side earlier

- **Type:** ui
- **Scope:** Marketing footer column layout
- **Files:** `frontend/components/layout/marketing-footer.tsx`
- **Summary:** Link groups (Quick Links / Our Services / Support / Partners & Staff + Contact) now use `grid-cols-2` from the base breakpoint, `md:grid-cols-3`, and `lg:grid-cols-5` so columns sit side-by-side on phone landscape/tablet sooner. Added `min-w-0` + word-break on Contact fields to avoid horizontal overflow. Brand blurb, copyright/social row, hrefs, and labeled `<nav>` groups unchanged. Tap targets still `min-h-11` on mobile.
- **Risks:** None for booking/auth/checkout; layout-only.
- **Next:** Smoke footer on 375 / landscape phone / 768 / 1280; confirm no page overflow.

---

## 2026-07-17 — Fix Home Franchise teaser invisible content

- **Type:** fix
- **Scope:** Marketing homepage Franchise teaser stacking
- **Files:** `frontend/features/marketing/home/franchise-teaser.tsx`
- **Summary:** Absolute photo + gradient painted over the glass panel because the content wrapper lacked `position: relative` (unlike Franchise page hero and Final CTA band). Added `relative` to the marketing container so eyebrow, title, benefits, and CTAs sit above the background. Links unchanged: Apply → `/franchise#apply`, brochure → `/contact?subject=franchise#contact-form`.
- **Risks:** None for booking/auth/checkout; stacking-only change.
- **Next:** Smoke Home Franchise section in light + dark; confirm mobile FAB still clear of teaser CTAs.

---

## 2026-07-17 — Fix `/services` page scroll lock

- **Type:** fix
- **Scope:** Marketing shell scroll + mobile nav body lock
- **Files:** `marketing-shell.tsx`, `marketing-navbar.tsx`, `services-grid.tsx`, `services-cta.tsx`
- **Summary:** Root causes: (1) `overflow-x-hidden` on MarketingShell forced `overflow-y: auto` (scrollport that could eat wheel/touch); switched to `overflow-x-clip` so vertical document scroll stays `visible`. (2) Mobile menu set `body.style.overflow = hidden` but cross-page nav links did not always close/clear the lock — now always close on navigate, clear overflow on pathname change, Escape closes menu. (3) ServicesGrid `Button asChild`+`Link` hydration mismatch could open the Next.js error overlay (dev scroll lock) — CTAs use `Link` + `buttonVariants` instead. Services copy unchanged.
- **Risks:** `overflow-x-clip` unsupported only on very old browsers (falls back gracefully). Body unlock is intentional and stronger than restoring prior inline overflow.
- **Next:** Hard-refresh `/services` on mobile + desktop; confirm menu open/close still locks/unlocks; smoke Home/Stores/Franchise/Contact.

---

## 2026-07-17 — Make Request brochure CTAs reliable

- **Type:** fix
- **Scope:** Marketing franchise brochure → contact
- **Files:** `contact-constants.ts`, `contact-form.tsx`, `contact-page-view.tsx`, `franchise-teaser.tsx`, `franchise-page-view.tsx`, `hero-slides.ts`, `marketing-homepage.spec.ts`, `docs/features/marketing-homepage.md`
- **Summary:** Centralized `CONTACT_FRANCHISE_BROCHURE_HREF` (`/contact?subject=franchise#contact-form`). Hardened ContactForm to remount/sync Franchise subject from searchParams and scroll to the form. All Request brochure CTAs (home teaser, franchise page, hero slide) use the shared href.
- **Risks:** None for booking/auth; contact submit unchanged. No PDF asset in repo — brochure remains a contact request.
- **Next:** Smoke Home/Franchise → Contact subject=franchise; run marketing e2e brochure tests.

---

## 2026-07-15 — Fix API CRUD by role (dashboard states + verification)

- **Type:** fix
- **Scope:** Role CRUD QA per `fix-api-crud-by-role.md`
- **Files:** Partner views (`partner-overview-view`, `partner-operations-view`, `partner-staff-view`, `partner-service-catalog-view`, `partner-settlements-view`, `partner-customers-view`), admin views (`admin-overview-view`, `admin-orders-table`, `admin-users-table`, `admin-approval-queue`), `discover-list.tsx`, `backend/scripts/verify_crud_by_role.py`
- **Summary:** Verified customer/partner/admin read + customer profile/address CRUD via API (all 200/201). Added `QueryErrorState` with retry to partner/admin dashboard views that lacked error UI; added loading skeletons and `EmptyState` where missing. Prior contract fixes (admin lists, partner multi-laundry orders) unblocked paginated admin CRUD and partner order queue.
- **Tests:** `python scripts/verify_crud_by_role.py` → 0 failures; `pytest tests/unit/test_list_query_params.py` → 4 passed.

---

## 2026-07-15 — Fix API frontend↔backend contracts (list params + partner orders)

- **Type:** fix
- **Scope:** FE/BE contract audit (`fix-api-frontend-contracts.md`)
- **Files:** `backend/app/api/admin_list_params.py`, `backend/app/api/trust_score_list_params.py`, `backend/app/repositories/laundry.py`, `backend/app/services/partner_service.py`, `backend/tests/unit/test_list_query_params.py`, `logs/bug-tracker.md`
- **Summary:** Audited all `frontend/services/*.ts` paths against backend routers — no path/method mismatches. Fixed runtime 500s blocking admin paginated lists: list-param subclasses now use `@dataclass(frozen=True)` so filter fields (`status`, `role`, `resource_type`, trust-score filters) construct correctly. Fixed partner `GET /partner/orders` for multi-laundry QA seed via `list_by_owner` + `laundry_id.in_()` aggregation. FE types (`PaginatedList`, `ApiEnvelope`) already matched backend `{ items, page, page_size, total_records, ... }`.
- **Risks:** Partner analytics/staff still use primary (oldest) laundry when multiple exist — intentional minimal scope; orders/customers now span all laundries.
- **Tests:** `pytest tests/unit/test_list_query_params.py` → 4 passed; manual API: admin list endpoints + partner orders → 200.

---

## 2026-07-15 — Fix API auth & session (401/403, refresh)

- **Type:** fix
- **Scope:** Auth session / role-guarded routes
- **Files:** `frontend/lib/api.ts`, `frontend/components/auth/role-guard.tsx`, `frontend/app/(admin)/layout.tsx`, `frontend/features/admin/hooks/use-admin-queries.ts`, `frontend/features/admin/views/admin-overview-view.tsx`, `backend/tests/api/test_auth.py`, `logs/bug-tracker.md`
- **Summary:** Added axios interceptor to refresh on `AUTH_TOKEN_EXPIRED`/`AUTH_FAILED` and retry once; RoleGuard retries `fetchMe` after refresh on failure; admin layout restores sessions via `OptionalAuthRefresh` and gates dashboard queries on `accessToken`. Ran `seed_qa.py` so `admin@demo.dlm` works. Added API tests for missing token (401) and wrong role (403).
- **Risks:** Concurrent 401s share one refresh promise — intentional dedup.
- **Tests:** Manual API login sweep customer/partner/admin → 200 on login + `/users/me`; pytest `test_auth.py` blocked on local test DB credentials (`dlm` password).

---

- **Type:** fix
- **Scope:** Local dev infrastructure / env parity
- **Files:** `backend/.env`, `frontend/.env.local` (verified, no code changes)
- **Summary:** Ran `fix-api-connectivity-env.md` checklist. Confirmed env alignment: `PORT=8000`, `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `CORS_ALLOW_ORIGINS=http://localhost:3000`. `alembic upgrade head` → `20260714_0033 (head)`. Backend listening on `:8000`; `GET /api/v1/health` → 200; `GET /api/v1/laundries` → 200 (3 demo laundries). `RATE_LIMIT_ENABLED=false` while Redis is offline (acceptable for local debug). Marked BUG-2026-07-14-001 resolved.
- **Risks:** Redis not running locally — re-enable `RATE_LIMIT_ENABLED` after `docker compose up -d redis`.
- **Tests:** Manual `Invoke-WebRequest` health + laundries; `alembic current`; pytest health test blocked on test DB credentials (`dlm` user) — separate from runtime API.
- **Next:** `fix-api-auth-session.md` for BUG-2026-07-14-003; backend patch for BUG-2026-07-14-002.

---

## 2026-07-13 — Finalize marketing homepage v2

- **Type:** docs · test
- **Scope:** Marketing homepage `/` + contact form `/contact`
- **Files:** `frontend/tests/e2e/marketing-homepage.spec.ts`, `frontend/tests/e2e/smoke.spec.ts`, `frontend/components/layout/marketing-shell.tsx`, `frontend/components/layout/marketing-shell-overlays.tsx`, `frontend/components/layout/marketing-footer.tsx`, `frontend/features/marketing/contact/contact-constants.ts`, `frontend/app/contact/page.tsx`, `docs/features/marketing-homepage.md`, `docs/features/README.md`, `logs/feature-progress.md`, `logs/performance-log.md`
- **Summary:** Added Playwright smoke suite — homepage load, hero carousel navigation, contact form client validation, mobile sticky CTA visibility/hide-on-scroll, console-error and dark-mode checks. Fixed stale smoke heading assertion. Fixed production build blockers (`ssr:false` in RSC shell, contact `CONTACT_SUBJECTS` server import, footer a11y lint). Documented section map, API contracts, automated tests, and manual QA checklist (phone/tablet/desktop).
- **Risks:** Lighthouse mobile **performance 53** on production build (target ≥ 90) — LCP 3.7 s, TBT 1.6 s; `/` first-load JS 237 kB (57 kB over budget).
- **Tests:** `npm run test:e2e -- marketing-homepage`, `npm run test:e2e -- smoke`, `npm run test:e2e -- marketing-a11y`
- **Next:** Slim marketing Providers shell; wire or remove `SpecialCareSection`; add Lighthouse mobile to CI on staging URL.

---

## 2026-07-13 — Fix /discover "0 laundries nearby" with API data

- **Type:** fix
- **Scope:** Discover listing / client filters
- **Files:** `frontend/features/discover/listing/filter-laundries.ts`, `frontend/features/discover/hooks/use-laundry-discovery.ts`, `frontend/services/laundries.ts`, tests + `tests/e2e/discover-laundries.spec.ts`
- **Summary:** `applyClientFilters` now normalizes filter caps (guards against `0` / `NaN` / empty string) and skips sentinel "any" delivery/price values. `listLaundries` unwraps array or search-shaped payloads. Hook keeps loading state until enriched rows exist. Added Jest + Playwright regression tests.
- **Risks:** None — stricter filters still work when caps are intentionally set.
- **Tests:** `filter-laundries.test.ts`, `laundries.test.ts`, `use-laundry-discovery.test.tsx`, `discover-laundries.spec.ts`; full `npm test`, `npm run type-check`, `npm run lint`.
- **Next:** None.

---

## 2026-07-13 — Fix hero sticky CTA overlap on mobile

- **Type:** fix
- **Scope:** Marketing homepage hero
- **Files:** `frontend/features/marketing/home/home-hero.tsx`, `frontend/features/marketing/home/hero-carousel.tsx`, `frontend/features/marketing/home/hero-static-fallback.tsx`, `frontend/features/marketing/home/home-hero.test.tsx`
- **Summary:** Moved mobile sticky CTAs ("Book pickup", "Become a partner") out of an absolute overlay into document flow below the carousel (`sm:hidden`). Removed slide `pb-24`/`pb-28` reserved for overlay clearance and reset dot indicators to `bottom-4`/`sm:bottom-6`. Desktop keeps per-slide CTAs inside `GlassSurface`; no duplicate global CTAs on `sm+`.
- **Risks:** `FloatingContactActions` FAB overlap observer still targets `[data-marketing-sticky-cta]` — works when CTAs scroll into view below carousel.
- **Tests:** `home-hero.test.tsx` asserts sticky CTA block is not absolutely positioned; `npm run test`, `npm run type-check`, `npm run lint`.
- **Next:** None.

---

## 2026-07-12 — Sitewide marketing footer navigation

- **Type:** feat
- **Scope:** Public marketing layout / navigation
- **Files:** `frontend/components/layout/marketing-footer.tsx`, `frontend/lib/navigation/marketing-footer.ts`, `frontend/lib/navigation/search-index.ts`, `frontend/lib/navigation/index.ts`
- **Summary:** Rebuilt `MarketingFooter` with grouped link columns — Company (Home, About, Services, Stores), Partner (Franchise), Legal (Terms, Privacy), Support (Contact). Mobile stacks columns; `lg:` uses a 4-column grid. WashhouseLogo, India/UPI/COD/GST tagline, and dynamic copyright year. Links meet 44px tap targets with visible focus rings. Shared `MARKETING_FOOTER_GROUPS` constant feeds customer search index. `PublicShell` / `MarketingShell` unchanged — footer already integrated; GlobalNavbar "Back to Discover" unaffected.
- **Risks:** None — presentational layout refactor; no route or auth changes.
- **Tests:** `npm run type-check` pass; E2E smoke tests unchanged (no prior footer link assertions).
- **Next:** None for footer v1.

---

## 2026-07-12 — Contact Us page at `/contact`

- **Type:** feat
- **Scope:** Public marketing / support
- **Files:** `frontend/app/contact/page.tsx`, `frontend/features/marketing/contact/*`, `frontend/components/layout/marketing-footer.tsx`, `frontend/lib/navigation/customer-title.ts`, `frontend/features/marketing/services/services-faq.tsx`, `frontend/.env.example`
- **Summary:** Added Contact Us page with `PublicShell` — hero ("We're here to help"), env-driven contact channels (email, phone, WhatsApp, IST hours), React Hook Form + Zod message form (name, phone, optional email, subject dropdown, message) with client validation, a11y labels/error announcements, success toast on stub submit (v2: backend `/api/v1/contact`), quick links (FAQ, track order, franchise), and placeholder office address. Footer nav + navbar title wired; `id="faq"` on services FAQ for `/services#faq` anchor.
- **Risks:** Form submit is a v1 stub — messages are not persisted until backend contact API ships; contact details use placeholder defaults until `NEXT_PUBLIC_*` env vars are set in production.
- **Tests:** `npm run type-check` pass; no new unit/E2E tests (presentational marketing route + client form stub).
- **Next:** Ship backend contact endpoint + email/CRM integration; replace placeholder office address.

---

## 2026-07-12 — Privacy Policy page at `/privacy`

- **Type:** feat
- **Scope:** Public marketing / legal
- **Files:** `frontend/app/privacy/page.tsx`, `frontend/features/marketing/legal/privacy-content.tsx`, `frontend/features/marketing/legal/legal-constants.ts`, `frontend/features/marketing/legal/legal-section.tsx`, `frontend/features/marketing/legal/terms-content.tsx`, `frontend/features/marketing/legal/index.ts`, `frontend/components/layout/marketing-footer.tsx`, `frontend/lib/navigation/customer-title.ts`
- **Summary:** Added Privacy Policy page with `PublicShell` — lawyer-review banner, shared `LEGAL_LAST_UPDATED` constant and `LegalSection` component (extracted from terms), sticky TOC with anchor links, 12 India-focused sections (data controller, collection, purposes, IT Act/DPDP basis, Razorpay/Vercel/Railway/Neon/SMS/Resend processors, retention, user rights via `/contact`, cookies/PWA, security, children, grievance officer placeholders), template footer disclaimer. Footer nav + navbar title wired for `/privacy`.
- **Risks:** Copy is a template — requires qualified legal review before production; placeholder company address and grievance officer details; `/contact` route not yet implemented.
- **Tests:** `npm run type-check` pass; no new unit/E2E tests (static legal content page).
- **Next:** Build `/contact`; replace template copy and placeholders after counsel review.

---

## 2026-07-12 — Terms & Conditions page at `/terms`

- **Type:** feat
- **Scope:** Public marketing / legal
- **Files:** `frontend/app/terms/page.tsx`, `frontend/features/marketing/legal/*`, `frontend/components/layout/marketing-footer.tsx`, `frontend/lib/navigation/customer-title.ts`
- **Summary:** Added Terms & Conditions page with `PublicShell` — lawyer-review banner, `LEGAL_LAST_UPDATED` constant, sticky table of contents with anchor links, 14 plain-English sections (India: UPI/COD/Razorpay, GST, OTP, marketplace intermediary role, governing law), readable legal typography, page footer template disclaimer, and contact link to `/contact`. Footer nav + navbar title wired for `/terms`. Metadata indexable (no `noindex`).
- **Risks:** Copy is a template — requires qualified legal review before production; `/contact` route not yet implemented.
- **Tests:** `npm run type-check` pass; no new unit/E2E tests (static legal content page).
- **Next:** Build `/contact` and `/privacy`; replace template copy after counsel review.

---

## 2026-07-12 — Stores page at `/stores`

- **Type:** feat
- **Scope:** Public marketing / partner store directory
- **Files:** `frontend/app/stores/page.tsx`, `frontend/features/marketing/stores/*`
- **Summary:** Replaced `/stores` redirect with a dedicated marketing page using `PublicShell` — hero ("Find a WashHouse store near you"), `HomeSearchBar` + `LaundryFiltersBar`, `LaundryCard` grid powered by `useLaundryDiscovery`, empty/error/loading states (same patterns as discover homepage), and bottom CTA to `/contact`. Cards link to `/discover/[id]`. No duplicated API logic.
- **Risks:** `/contact` route not yet implemented (CTA links there per spec); store list depends on laundries API availability.
- **Tests:** `npm run type-check` pass; no new unit/E2E tests (presentational marketing route composing existing discover components).
- **Next:** Build `/contact` page; optional map/list toggle v2.

---

## 2026-07-12 — Services page at `/services`

- **Type:** feat
- **Scope:** Public marketing / platform services explainer
- **Files:** `frontend/app/services/page.tsx`, `frontend/features/marketing/services/*`, `frontend/components/ui/accordion.tsx`, `frontend/components/ui/index.ts`, `frontend/tailwind.config.ts`, `frontend/package.json`
- **Summary:** Rebuilt Services page with `PublicShell` — hero, 6-category service grid (wash & fold, dry clean, steam press, shoe/bag care, express, subscription) with indicative pricing, turnaround, and per-card CTAs to `/discover`; "How pricing works" (GST, delivery, UPI, COD); FAQ accordion (6 items); final CTA. Added shadcn-style `Accordion` (Radix) + tailwind accordion animations.
- **Risks:** Indicative prices are copy-only until partner pricing API is surfaced; subscription flow links to Discover until dedicated subscribe marketing route exists.
- **Tests:** `npm run type-check` pass; no new unit/E2E tests (presentational marketing route).
- **Next:** Wire live partner price ranges when catalog API supports platform aggregates.

---

## 2026-07-12 — About Us page at `/about`

- **Type:** feat
- **Scope:** Public marketing / brand story
- **Files:** `frontend/app/about/page.tsx`, `frontend/features/marketing/about/*`, `frontend/components/layout/marketing-footer.tsx`, `frontend/lib/navigation/customer-title.ts`
- **Summary:** Added About Us marketing page with `PublicShell` — hero story, placeholder stats row, mission prose, differentiators (verified partners, tracking, GST, UPI/COD), values grid, journey timeline, and CTA to `/stores` and `/contact`. Footer nav + navbar title wired for `/about`.
- **Risks:** `/contact` route not yet implemented; stats are placeholder until analytics API exists.
- **Tests:** `npm run type-check` pass; no new unit/E2E tests (presentational marketing route).
- **Next:** Build `/contact` page; replace placeholder stats with live KPIs when available.

---

## 2026-07-12 — Marketing Home page at `/`

- **Type:** feat
- **Scope:** Public marketing / brand landing
- **Files:** `frontend/app/page.tsx`, `frontend/app/services/page.tsx`, `frontend/app/stores/page.tsx`, `frontend/app/franchise/page.tsx`, `frontend/components/layout/marketing-shell.tsx`, `frontend/components/layout/marketing-footer.tsx`, `frontend/components/layout/public-shell.tsx`, `frontend/components/layout/global-navbar/global-navbar.tsx`, `frontend/lib/navigation/customer-title.ts`, `frontend/features/marketing/home/*`
- **Summary:** Replaced root redirect with a brand marketing Home using `MarketingShell` — hero, trust strip, booking steps, services preview, featured stores teaser, testimonials, and final CTA. `/discover` stays the booking/discovery page. Footer nav links wired across marketing + auth shells; logo now routes to `/`.
- **Risks:** Featured stores teaser depends on laundries API; `/stores` redirects to `/discover#laundries`.
- **Tests:** `npm run type-check` pass; no new unit/E2E tests (presentational marketing route).
- **Next:** Optional dedicated `/stores` listing page; expand `/services` with partner-specific pricing.

---

## 2026-07-09 — QA fix WashHouse loading layout/a11y

- **Type:** fix
- **Scope:** Loading UI (WashhouseLoader, PageSpinner, route/auth overlays)
- **Files:** `frontend/app/globals.css`, `frontend/components/brand/washhouse-loader.tsx`, `frontend/components/feedback/page-spinner.tsx`, `frontend/app/loading.tsx`, `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`
- **Summary:** Shipped washhouse pulse/breathe/ring keyframes in `globals.css` (Next CSS bundle was missing them). Clipped opaque icon PNG to a circle; PageSpinner fills partner/admin mains (`h-full` + taller min-h); loader gets `aria-atomic`; route loading vertically centered. PageSpinner API unchanged.
- **Risks:** `will-change-transform` only while animating; reduced-motion still zeros via existing global + `motion-reduce:animate-none`.
- **Tests:** Playwright matrix — viewports 375/414/768/1280/1920 × light/dark × reduced-motion; `/orders` auth guard, `/login` submit overlay, `/partner`+`/admin` RoleGuard fill=1, a11y role/live/busy.
- **Next:** Optional transparent icon asset so circle clip is unnecessary.

---

## 2026-07-09 — Auth pages branded submit loading overlay

- **Type:** chore (visual only)
- **Scope:** Auth UI (login / register)
- **Files:** `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`
- **Summary:** When existing `loading` is true, show a non-modal full-viewport scrim with centered `WashhouseLoader` (`size="md"`, `label="Please wait…"`). Page wrapper gets `aria-busy`; submit handlers, toasts, and button disabled/label text unchanged.
- **Risks:** Scrim blocks pointer clicks but is not a modal (no focus trap); form stays mounted so focus/values persist; double-submit still prevented by existing `disabled={loading}`.
- **Tests:** None — presentational only; a11y via `aria-busy` + loader `role="status"`.
- **Next:** None.

---

## 2026-07-09 — Root route loading UI uses WashHouse branding

- **Type:** chore (visual only)
- **Scope:** Next.js App Router `loading.tsx`
- **Files:** `frontend/app/loading.tsx`
- **Summary:** Replaced dense skeleton grid with centered `WashhouseLoader` (`size="lg"`, `label="Loading…"`) plus three fixed-height hint bars. Loader owns `role="status"` / `aria-live`; bars are `aria-hidden` with `motion-reduce:animate-none`. No new route-group loaders; no page/data changes.
- **Risks:** Root loading shell is lighter than before (fewer placeholders); CLS when swapping to heavy pages is unchanged by design.
- **Tests:** None — presentational swap only; a11y/motion covered by existing `WashhouseLoader` behavior.
- **Next:** None.

---

## 2026-07-09 — PageSpinner uses WashHouse branded loader

- **Type:** refactor
- **Scope:** UI brand / loading feedback
- **Files:** `frontend/components/feedback/page-spinner.tsx`
- **Summary:** `PageSpinner` now composes `WashhouseLoader` (`size="md"`) instead of Lucide `Loader2`. Public API (`label`, `className`) and `min-h-[40vh]` centered layout unchanged; auth/role guards keep working with no logic changes.
- **Risks:** Nested a11y avoided by letting `WashhouseLoader` own `role="status"`; visual size differs slightly from prior 8×8 spinner.
- **Next:** None.

---

## 2026-07-09 — WashHouse branded loader component

- **Type:** feat
- **Scope:** UI brand / loading feedback
- **Files:** `frontend/components/brand/washhouse-loader.tsx`, `frontend/components/brand/washhouse-logo.tsx`, `frontend/tailwind.config.ts`
- **Summary:** Added reusable `WashhouseLoader` (pulse / breathe / ring) using shared `WASHHOUSE_ICON_SRC`; CSS keyframes only; a11y status + reduced-motion static icon. `PageSpinner` left unchanged for existing consumers.
- **Risks:** Soft white pad for dark-mode contrast may look slightly boxed in dense inline contexts.
- **Next:** Optionally swap `PageSpinner` to compose `WashhouseLoader` in a follow-up.

---

## 2026-07-09 — Align design tokens with WashHouse logo blues/teals

- **Type:** chore (visual tokens only)
- **Scope:** design system CSS variables + Tailwind sky mapping
- **Files:** `frontend/styles/tokens.css`, `frontend/tailwind.config.ts`, `docs/ui-ux/design-system.md`
- **Summary:** Shifted `--brand-*` toward logo navy/royal (`#1d4ed8` / `#1e3a8a`) and `--sky-*` toward cyan/teal (`#06b6d4`). Dark `--primary` set to `#2563eb` so white button text stays AA. Wired `sky` scale in Tailwind to CSS vars (was previously unused defaults).
- **Risks:** Components using default Tailwind `sky-200/300/700/900` still resolve to stock sky; only 100/400/500/600 are tokenized.
- **Mitigation:** Those steps remain in the same cyan family; no class-name or logic changes.
- **Next:** Optional full sky scale tokenization if badge/status chips need exact logo teal.

---

## 2026-07-09 — WashHouse logo on login / register / discover hero

- **Type:** feat (visual only)
- **Scope:** public marketing / auth UI brand
- **Files:** `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`, `frontend/features/discover/marketplace/discover-hero.tsx`
- **Summary:** Centered `WashhouseLogo` above auth cards (scaled down on narrow screens); subtle icon logo above discover hero badge. No form, OTP, redirect, CTA, or copy changes.
- **Risks:** Auth pages already show logo in `GlobalNavbar` / footer via `PublicShell` — stacked brand may feel redundant.
- **Mitigation:** Auth mark is page-level above the card; hero uses `variant="icon"` so it stays secondary to the H1.
- **Next:** None required for this pass.

---

## 2026-07-09 — Customer navbar WashHouse logo

- **Type:** feat
- **Scope:** customer UI brand / GlobalNavbar
- **Files:** `frontend/components/layout/global-navbar/global-navbar.tsx`, `frontend/components/layout/public-shell.tsx`
- **Summary:** Show `WashhouseLogo` on the left of customer `GlobalNavbar` (links to `/discover`) and in `PublicShell` footer. Partner/admin shells unchanged via `app === 'customer'` gate; dark mode uses a light pad so the navy wordmark stays readable.
- **Risks:** Narrow phones could feel tighter with logo + back + title + actions.
- **Mitigation:** Existing responsive logo (icon &lt; sm, wordmark sm+) plus `truncate` on page title; logo is `shrink-0` so title yields first.
- **Next:** Optional partner/admin brand pass; dark-mode wordmark asset if pad looks off-brand.

---

## 2026-07-03 — India call-to-book flow (phase-1) verification

- **Type:** test + docs
- **Scope:** offline booking mode, walk-in orders, guest contact, QA docs
- **Files:** `docs/testing/offline-booking-qa.md`, `docs/testing/QA_TESTING_GUIDE_2A_snippet.md`, `backend/tests/api/test_offline_booking.py`, `frontend/lib/online-booking.test.ts`, `frontend/lib/hooks/use-online-booking-enabled.test.ts`, `frontend/features/partner/lib/partner-status.test.ts`, `frontend/tests/e2e/offline-booking.spec.ts`
- **Summary:** Audited existing call-to-book implementation (flags, `OfflineBookingContactPanel`, browse-only discover, walk-in partner UI, WhatsApp notifier). Replaced stale “Coming soon” QA copy with **Book by phone or WhatsApp**. Added API gate test for `POST /orders` when offline, Jest helpers for walk-in status + env flag, and E2E browse-only assertion.
- **Risks:** Online checkout regression if flags flip to `true` while FE env stays `false`.
- **Mitigation:** `useOnlineBookingEnabled()` requires both env + `/config`; existing contact tests cover online vs offline guest paths.
- **Next:** Run `pnpm test` + `pytest test_offline_booking.py` with Postgres up; E2E via `pnpm test:e2e --project=offline-booking`.

---

- **Type:** test + docs
- **Scope:** offline booking mode, walk-in orders, guest contact
- **Files:** `docs/testing/offline-booking-qa.md`, `UI_FEATURE_MAP.md`, `CUSTOMER_EXPERIENCE_ENHANCEMENT.md`, `logs/feature-progress.md`
- **Summary:** Full QA pass for call-to-book launch. Fixed manual QA doc step that incorrectly implied guests must sign in to unlock contact in offline mode. Documented guest-no-login contact in UI feature map and customer experience Part 3/4 tables.
- **Manual QA:** §2A.1 guest contact **PASS** (API: `offline_booking_mode=true`, `requires_login=false`, Call/WhatsApp enabled after `ensure_demo_storefronts`). §2A.2/§2A.3 walk-in flows validated via API after `python scripts/seed.py` + storefront seed.
- **Automated:** E2E blocked locally (Playwright browsers installed; dev server on :3001 not stable in session). `pytest test_walk_in_orders.py`: 1/8 pass on Windows — session-scoped async engine event-loop conflict (CI/Linux unaffected). Contact tests in `test_customer_experience_contact.py` cover offline guest path.
- **Risks:** Online-mode contact gating unchanged; offline path must stay behind `FEATURE_ONLINE_BOOKING=false`.
- **Mitigation:** E2E asserts no “Sign in to call”; contact API tests in `test_customer_experience_contact.py`. Walk-in pytest mocks Celery WhatsApp task.
- **Next:** Merge `docs/product/offline-booking-*.md` into root `UI_FEATURE_MAP.md` / `CUSTOMER_EXPERIENCE_ENHANCEMENT.md` when files are writable. Start Redis before live walk-in API QA. Run E2E with `pnpm` on PATH + `npx playwright install`.

---

## 2026-07-03 — Guest browse / call-to-book polish

- **Type:** feat
- **Scope:** discover detail, storefront, offline booking UX
- **Files:** `frontend/features/discover/detail/laundry-detail-view.tsx`, `frontend/features/storefront/laundry-storefront-view.tsx`, `frontend/components/marketplace/offline-booking-contact-panel.tsx`, `frontend/lib/hooks/use-online-booking-enabled.ts`, `frontend/features/discover/detail/service-card.tsx`, `frontend/features/discover/detail/laundry-services-tab.tsx`, `frontend/features/discover/detail/service-catalog-browser.tsx`
- **Summary:** When `FEATURE_ONLINE_BOOKING=false`, services tabs show browse-only price lists (INR + unit) without cart actions; checkout CTAs are hidden. Replaced temporary “coming soon” copy with permanent call-to-book messaging and a prominent Call/WhatsApp sidebar + mobile sticky bar.
- **Risks:** Online checkout regression if `browseOnly` leaks when booking is enabled.
- **Mitigation:** `browseOnly` tied to `useOnlineBookingEnabled()`; online path unchanged when flag true.
- **Next:** None.

---

## 2026-06-03 — Fraud Detection Engine

- **Type:** feat
- **Scope:** rule-based customer/partner fraud signals, risk levels Low–Critical, admin alerts
- **Summary:** Added `fraud_alerts`, `users.fraud_risk_level`, `laundries.fraud_risk_level`; evaluation on disputes, payments, cancellations, delivery GPS, inventory mismatches; admin UI at `/admin/fraud`. See `FRAUD_DETECTION_ENGINE.md`.
- **Next:** Nightly batch sweep; Critical auto-actions.

---

## 2026-06-03 — Laundry Trust Score (Partner)

- **Type:** feat
- **Scope:** partner reliability scoring 0–100 from on-time delivery, complaint/refund/dispute rates, rating, volume
- **Summary:** Added `laundries.trust_score`; `LaundryTrustScoreService` with metric recalculation; partner API + admin list/detail; partner dashboard card and admin Partner trust tab. See `PARTNER_TRUST_SCORE.md`.
- **Next:** Customer-facing trust badge on discover; manual admin override.

---

## 2026-06-03 — Customer Trust Score System

- **Type:** feat
- **Scope:** admin-only customer risk scoring — 100 baseline, event ledger, Gold/Silver/Bronze/High Risk levels
- **Summary:** Added `users.trust_score`, `customer_trust_score_events`; hooks on disputes, delivery, reviews, payment webhooks; admin UI at `/admin/trust-scores`. See `CUSTOMER_TRUST_SCORE.md`.
- **Next:** Auto-flag high-risk at checkout; admin manual adjustments.

---

- **Type:** feat
- **Scope:** customer dispute filing with photos, admin investigation with full evidence bundle
- **Summary:** Extended complaint types/statuses; `complaint_photos` + `complaint_status_events`; multipart upload; admin detail with custody, pickup, delivery, inventory, OTP; customer + admin UI. See `DISPUTE_CENTER.md`.
- **Next:** Notifications on status change; partner dispute visibility.

---

- **Type:** feat
- **Scope:** append-only custody events with actor, role, metadata; auto-recorded on all order milestones
- **Summary:** Added `order_custody_events` table; `CustodyEventService` hooks in order, pickup, inventory, delivery proof, and OTP flows; timeline APIs for customer/partner/admin; `ChainOfCustodyTimeline` UI. See `CHAIN_OF_CUSTODY.md`.
- **Next:** WebSocket push on new custody events; backfill from legacy status events.

---

- **Type:** feat
- **Scope:** mandatory delivery photo before OTP completion — GPS, device info, immutable record
- **Summary:** Added `delivery_proof_photos` table and migration; partner single-photo upload when `out_for_delivery`; gate on `delivery/verify`; customer timeline + gallery; admin dialog; dispute center detail. See `DELIVERY_PROOF.md`.
- **Next:** Object storage adapter; integration tests with seeded orders.

---

- **Type:** feat
- **Scope:** 6-digit delivery OTP, agent GPS handoff, failed attempt lockout, audit logs
- **Summary:** OTP auto-generated on `out_for_delivery`; customer in-app code; partner verify endpoint gates delivery; Fernet-encrypted storage; agent account lockout; audit trail. See `DELIVERY_OTP.md`.
- **Next:** SMS/WhatsApp delivery of OTP to customer phone; integration tests with seeded orders.

---

- **Type:** feat
- **Scope:** pickup item counts by category, customer confirm/lock, admin change approval, dispute center
- **Summary:** Added verification tables + Alembic migration; partner record API; customer confirm locks inventory; change requests with admin approve/reject; append-only history; order detail + dispute center UI; gate on `picked_up`. See `INVENTORY_VERIFICATION.md`.
- **Next:** Badge count for pending admin inventory changes; integration tests with seeded orders.

---

## 2026-06-03 — Pickup Evidence System

- **Type:** feat
- **Scope:** pickup photos at collection — DB, API, partner upload UI, customer/admin gallery
- **Summary:** Added `pickup_evidence_photos` table and Alembic migration; partner multipart upload (1–10 photos, GPS, original + compressed storage); JWT-protected image delivery; timeline note "Pickup photos uploaded"; gate on `picked_up` status; FE upload + gallery on partner/customer/admin surfaces. See `PICKUP_EVIDENCE.md`.
- **Next:** Object storage adapter for production media; expand integration tests with seeded orders.

---

- **Type:** feat
- **Scope:** reviews, order events, partner inventory/staff/analytics, admin commission, customer booking UI, partner/admin dashboards
- **Summary:** Added review service and laundry review routes; order `/events` timeline; partner inventory/staff/accept-reject/analytics APIs; admin commission settings; Razorpay httpx integration when keys set; `create_admin` script; FE discover detail + booking, orders list/tracking with 30s polling, account addresses, partner and admin dashboards.
- **Next:** WebSocket live tracking, production Razorpay checkout.js, seed demo laundries, expand integration tests.

---

## 2026-06-01 — Production roadmap implementation (Phases 0–6)

- **Type:** feat · docs · infra
- **Scope:** full platform scaffold
- **Summary:** Consolidated product docs into `docs/product/` and 19 feature specs; added marketplace migration and APIs (laundries, orders, partner, admin, payments, subscriptions, complaints, loyalty); hardened auth with httpOnly refresh cookies and WhatsApp/SMS OTP stubs; FE discover list, theme toggle, partner/admin shells, landing hero, PWA icons, runbooks, E2E smoke tests.
- **Next:** Wire Razorpay live keys, partner/admin FE flows, WebSocket tracking, review endpoints, inventory/staff CRUD, production deploy sign-off.

---

## 2026-05-25 — Workspace bootstrap

- **Type:** infra · docs
- **Scope:** workspace
- **Files:**
  - `.cursor/rules/` — 21 rule files
  - `.cursor/agents/` — 14 specialized agents
  - `.cursor/sub-agents/` — frontend, backend, QA sub-agents
  - `.cursor/templates/` — code + doc templates
  - `.cursor/checklists/` — pre-flight, post-flight, security, perf, a11y
  - `.cursor/prompts/` — ready-to-paste kick-off prompts
  - `.cursor/workflows/` — feature, bug-fix, refactor, deploy, daily
  - `.cursor/context/` — product, tech stack, glossary, environment
  - `.cursor/logs/` — Cursor session notes / handoffs / questions / learnings
  - `backend/` — FastAPI scaffold (app, alembic, tests, requirements, Dockerfile)
  - `frontend/` — Next.js 15 scaffold (App Router, tokens, providers, store)
  - `docs/` — architecture, api, database, ui-ux, security, business, testing, deployment, features, decisions, roadmap
  - `logs/` — implementation, feature, bug, deploy, perf, security, refactor, decisions
  - `infrastructure/` — provider configs
  - `docker/` — docker overrides
  - `.github/` — workflows + templates
  - `scripts/` — dev/ops helpers
  - Root: `README.md`, `.gitignore`, `docker-compose.yml`
- **Summary:** Set up the complete production-grade Cursor workspace, monorepo skeleton, and supporting tooling for Doorstep Laundry Marketplace.
- **Risks:** None — no runtime impact yet.
- **Mitigation:** Folder-only scaffolding; first feature PR will exercise real code paths.
- **Next:** Phase 1 — Foundations (auth, users, base UI shell, CI gates).
- **Refs:** —
