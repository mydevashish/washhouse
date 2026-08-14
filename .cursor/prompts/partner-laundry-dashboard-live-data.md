# Partner Laundry Dashboard — live data on current design

> Paste prompts **in order** (0 → 8). **One new Agent chat per prompt.**  
> Goal: Keep the **current** `/partner` visual. Replace every hardcoded number with **backend data**. Make every **View all** / row / Create order control work. Never invent KPIs.

## How to use

1. Open a **new Agent chat** per prompt.
2. Copy the full block under that prompt (from `Act as…` through Acceptance).
3. After Prompt 8, run the QA matrix.

## Product north star

| Persona | Needs |
| ------- | ----- |
| Owner | Trust today / week / month / year numbers; tap through to the real queue |
| Counter | Open an order, create an order, jump to a customer |

**Hard rules:**

- **Keep** the layout in `frontend/features/partner/views/partner-laundry-dashboard-view.tsx` (6 KPI cards, 3 status cards, chart + donut + top services, recent + customers + payments, bottom stats).
- **Do not** revert to `PartnerOverviewView` / command-desk ops-visual as the home page.
- **Do not** leave `Navratan Complex`, `#ORD-1256`, or fake ₹ in the tree.
- **Do not** invent Wallet revenue (enum has no wallet).
- Lists stay server-paginated; recent table **5** rows; insights **5** customers.
- Create order must call the **same** APIs as hub create (`walk-in-orders` / `customer-desk/orders`).
- Read `docs/features/partner-laundry-dashboard-live-data.md` before coding.

**Already exists — extend, don’t duplicate:**

| Area | Location |
| ---- | -------- |
| Spec | `docs/features/partner-laundry-dashboard-live-data.md` |
| View (mock UI) | `frontend/features/partner/views/partner-laundry-dashboard-view.tsx` |
| Home route | `frontend/features/partner-shop-floor/views/partner-home-view.tsx` |
| Period helpers | `backend/app/services/partner_analytics_period.py` |
| Analytics | `GET /partner/analytics/summary`, `GET /partner/analytics/overview` |
| Orders list | `GET /partner/orders`, `frontend/services/partner.ts` |
| Top customers | `GET /partner/customer-insights/customers?list_type=top` |
| Create dialog | `PartnerCreateOrderDialog` |
| Hub hrefs | `partner-dashboard-recent-orders-filter.ts`, `partner-orders-hub-queue.ts` |

---

## Prompt 0 — Lock spec + QA matrix (no visual rewrite)

```
Act as product-manager + ui-ux-designer + frontend-architect + backend-architect for DLM.

Read first:
- AGENTS.md
- .cursor/rules/00-project-overview.md
- .cursor/rules/01-architecture.md
- .cursor/rules/16-cursor-operating-rules.md
- docs/features/partner-laundry-dashboard-live-data.md
- docs/qa/partner-laundry-dashboard-live-data-matrix.md
- frontend/features/partner/views/partner-laundry-dashboard-view.tsx

Outcome:
1) Confirm the spec matches the CURRENT visual (do not restore the older command-desk layout).
2) If the spec and the TSX disagree, update the spec to match the TSX layout — never the other way around except for dead controls.
3) Fill any missing hrefs in the QA matrix. Do not implement UI/API in this prompt.
4) Add one traceability line in docs/product/traceability.md if missing.
5) Update logs/feature-progress.md status to in-progress for this feature.
6) Update .cursor/context/current-status.md with one bullet.

Acceptance:
- Spec + matrix are the source of truth.
- No dashboard component restyle.
- No leftover sample names in the spec as “required copy”.
```

---

## Prompt 1 — Backend: `GET /api/v1/partner/analytics/dashboard`

```
Act as backend-architect for DLM.

Read:
- docs/features/partner-laundry-dashboard-live-data.md (API + metrics dictionary)
- .cursor/rules/05-api-standards.md, 06-error-handling.md, 09-security.md, 15-database-migrations.md (if any schema — prefer none)
- backend/app/services/partner_service.py
- backend/app/services/partner_analytics_period.py
- backend/app/api/v1/endpoints/partner.py
- backend/app/schemas/partner.py
- backend/app/models/enums.py (OrderStatus, PaymentStatus, PaymentMethod)
- backend/app/models/order.py (OrderItem.service_name)

Implement:

1) Extend IST period helper to support `year` (1 Jan IST → next 1 Jan; 12 monthly buckets; previous calendar year overlay). Keep today/week/month.

2) New endpoint:
   GET /api/v1/partner/analytics/dashboard?period=today|week|month|year
   Auth: get_current_partner
   Envelope: success_envelope
   Response fields exactly as spec (kpis with current+previous orders/revenue, status_snapshot, chart_series current+previous revenue, status_donut, top_services[4], payment_summary, bottom).

3) SQL rules:
   - Partner laundry scoped; deleted_at IS NULL
   - Orders counts: created_at in IST window
   - Revenue: status=delivered, sum total_inr, time column updated_at in IST window
   - status_snapshot GLOBAL: in_process = picked_up|washing|ironing; ready_for_delivery = ready|out_for_delivery; completed = delivered
   - status_donut PERIOD-scoped with the same three buckets
   - top_services: join order_items, group by service_name, sum quantity, period on order.created_at, top 4, share_pct vs all lines in period
   - payment_summary: cash = method cod + paid; upi = method razorpay + paid; wallet_tracked=false; pending = payment_status pending|pending_cod. Period = selected period.
   - bottom: reuse customer insights + laundry.avg_rating/review_count + operations avg_delivery minutes if cheap; otherwise compute in PartnerService without N+1
   - Empty laundry: zeros + laundry_name from user (empty_analytics_summary pattern)

4) Do NOT break GET /partner/analytics/summary or /overview.

5) Pydantic schemas. OpenAPI descriptions. Grouped SQL for chart (no N+1 per bucket).

6) Tests:
   - IST today boundary (23:30 vs 00:30)
   - year buckets length 12
   - empty laundry 200 + zeros
   - partner cannot see another laundry
   - wallet_tracked is false
   - in_process snapshot does NOT include ready

Acceptance:
- pytest for new endpoint + period helper pass
- No invented metrics
- Layering: endpoint → service → repository/SQLAlchemy in service (match existing partner_service style)
```

---

## Prompt 2 — Frontend: welcome + six KPI cards

```
Act as frontend-architect for DLM Partner UI.

Read:
- docs/features/partner-laundry-dashboard-live-data.md
- .cursor/rules/13-ui-ux.md, 19-responsive-design.md, 10-accessibility.md
- frontend/features/partner/views/partner-laundry-dashboard-view.tsx
- frontend/services/partner.ts
- frontend/features/partner/hooks/use-partner-operations.ts
- frontend/lib/api.ts

Implement:

1) Add getPartnerAnalyticsDashboard(period) in frontend/services/partner.ts + TS types matching the API.
2) Hook usePartnerAnalyticsDashboard(period) — enabled only when mounted + accessToken (usePartnerQueriesEnabled).
3) Replace hardcoded summaryCards + revenueCards with API kpis. Keep the same card chrome (rounded-[20px], comparison row, % badge).
4) Welcome: “Welcome, {laundry_name}” from API. Fallback skeleton, then user full_name, never “Navratan Complex”.
5) Growth: if previous is 0, show “—” not +0% or fake 100%.
6) Loading: skeleton cards. Error: QueryErrorState retry. Success with zeros is valid.
7) formatInr / en-IN. Do not change card layout.
8) Remove unused mock constants for these six cards.
9) Unit test: mapper from API → card view-model (delta, labels).

Acceptance:
- npm test for the new mapper
- No Navratan / 7500 / 1750 left in those cards
- Visual unchanged aside from live numbers
```

---

## Prompt 3 — Status cards + donut + View all links

```
Act as frontend-architect for DLM Partner UI.

Read:
- docs/features/partner-laundry-dashboard-live-data.md (status snapshot + donut + hrefs)
- frontend/features/partner/views/partner-laundry-dashboard-view.tsx
- frontend/features/partner/dashboard/partner-dashboard-recent-orders-filter.ts
- frontend/features/partner/orders-hub/partner-orders-hub-queue.ts

Implement:

1) Status cards use status_snapshot (in_process, ready_for_delivery, completed).
2) Each “View all” is a Next.js Link (min 44px hit target on mobile):
   - In Process → hub processing/active (use existing queue helper; add helper if missing)
   - Ready for Delivery → status=ready (or ready_today chip if that is the hub equivalent)
   - Completed → status=delivered
3) Donut uses status_donut for the selected chart period. Total = sum of three slices. Empty → “No orders in this period” not a full fake pie.
4) Remove decorative “This Month” chevron on the donut unless it is wired to the same period as the chart. Prefer showing the live period_label_ist.
5) Tests for href helpers.

Acceptance:
- No <button> View all without navigation
- Snapshot buckets match spec (ready not inside In Process)
```

---

## Prompt 4 — Revenue chart live (Today / Week / Month / Year)

```
Act as frontend-architect for DLM Partner UI.

Read:
- docs/features/partner-laundry-dashboard-live-data.md (chart)
- frontend/features/partner/views/partner-laundry-dashboard-view.tsx
- Partner dashboard period context if present (partner-dashboard-period.tsx)

Implement:

1) Chart period state: today | week | month | year. Default week. Changing period refetches GET .../analytics/dashboard?period=
2) Replace revenueChartData mock. Map chart_series → { label, current, previous } numbers.
3) Keep Recharts two-line comparison. Totals and “vs last period” come from summed series or KPI fields — not client-invented.
4) Remove the dead “Revenue” metric toggle if it still has only one option (keep a static “Revenue” label).
5) Loading skeleton for the chart height (h-72). Empty series: keep axes, show empty copy.
6) Year works (12 points).
7) Keep visual (chips, colors #4f46e5 / #94a3b8).

Acceptance:
- Clicking Week vs Today changes data via API
- No hardcoded 42000 / 81000 series left
```

---

## Prompt 5 — Top services + payment summary

```
Act as frontend-architect for DLM Partner UI.

Read:
- docs/features/partner-laundry-dashboard-live-data.md (top services + payment summary)

Implement:

1) Top Services from dashboard.top_services. Bar width from share_pct. Empty state + link to /partner/services.
2) Period label matches chart period (no fake dropdown). If you add a period control, it must be the same state as Prompt 4.
3) Payment Summary:
   - Cash ← cash_paid_inr
   - UPI ← upi_paid_inr
   - Wallet ← em dash + “Not tracked” (wallet_tracked is false). Never ₹ 5,930.
   - Pending Payments ← pending_inr
4) Payment “View all” → /partner/revenue (Link).
5) Tests: wallet row renderer never formats a number when wallet_tracked is false.

Acceptance:
- No Wash & Fold 235 / fake payment ₹ left
```

---

## Prompt 6 — Recent orders + top customers (clickable)

```
Act as frontend-architect for DLM Partner UI.

Read:
- docs/features/partner-laundry-dashboard-live-data.md
- frontend/services/partner.ts (listPartnerOrders)
- frontend/services/customer-insights.ts
- frontend/features/partner/lib/partner-status.ts (pill map in spec)

Implement:

1) Recent Orders: listPartnerOrders({ page: 1, page_size: 5, sort_by: 'created_at', sort_order: 'desc' }).
2) Columns stay: Order ID (tracking_code), Customer, Service (first item name or “{n} items”), Amount (formatInr), Status pill (spec map).
3) Row is a link to /partner/orders/{id}. Keyboard accessible.
4) “View all” → /partner/orders (Link).
5) Empty: Owner-style empty copy + Create order / View orders — no Rahul Sharma.
6) Top Customers: listPartnerCustomerInsights({ list_type: 'top', page: 1, page_size: 5 }).
7) Customer “View all” → /partner/customers. Row click → /partner/customers or desk lookup with phone if present.
8) Loading skeletons for 5 rows.

Acceptance:
- RTL: renders tracking codes from mock list; View all href=/partner/orders
- No #ORD-1256 sample rows
```

---

## Prompt 7 — Bottom stats + Create order + leftover dead controls

```
Act as frontend-architect for DLM Partner UI.

Read:
- docs/features/partner-laundry-dashboard-live-data.md (bottom stats + Create order)
- frontend/features/partner/components/partner-create-order-dialog.tsx
- frontend/features/partner/orders-hub/workspace/partner-hub-create-order.tsx

Implement:

1) Bottom six tiles from dashboard.bottom. Avg delivery: minutes → “X.X hrs” or “—”. Rating: “4.7 / 5” + review_count as subtitle. Do NOT show fake +18.35% unless API provides a real delta (it should not — omit green fake deltas).
2) Header: primary “Create order” button opening existing PartnerCreateOrderDialog (same walk-in/assisted APIs). After success, invalidate dashboard + partner-orders queries.
3) Audit partner-laundry-dashboard-view.tsx: every remaining <button> that is not a period chip must navigate or open a dialog. Remove unused lucide imports (Bell, Search, etc. if unused).
4) Remove leftover mock arrays (customers, paymentSummary, bottomStats, topServices, recentOrders, revenueChartData, idxLabel).
5) idxLabel dead helper must be deleted if unused.

Acceptance:
- Create order opens dialog and can submit against existing APIs (reuse composer)
- No dead View all
- No hardcoded bottom stats
```

---

## Prompt 8 — Polish, a11y, tests, docs

```
Act as frontend-architect + qa-engineer + documentation-writer for DLM.

Read:
- docs/features/partner-laundry-dashboard-live-data.md
- docs/qa/partner-laundry-dashboard-live-data-matrix.md
- .cursor/rules/10-accessibility.md, 13-ui-ux.md, 19-responsive-design.md
- frontend/tests/e2e (existing partner-laundry-dashboard.spec.ts if present)

Implement:

1) Loading / error / empty for the whole page. Dark mode: keep layout; replace hardcoded #f3f6fb page bg with tokens so dark theme is readable. Do not redesign cards.
2) a11y: h1 welcome, period chips aria-pressed, tables have captions or aria-label, links have discernible names (“View all in-process orders”).
3) Playwright smoke: login partner → /partner → heading contains laundry name from API (mock or seed) → click Recent View all → URL /partner/orders. Status View all ready → orders filter.
4) Jest: dashboard view with mocked hooks (one happy path, one empty, one error).
5) Update docs/features/partner-laundry-dashboard-live-data.md checkboxes, logs/implementation-log.md, logs/feature-progress.md, .cursor/context/current-status.md.
6) Run lint + relevant unit tests.

Acceptance:
- Matrix rows for 375 and 1280 marked with what was automated
- Zero remaining mock constants in partner-laundry-dashboard-view.tsx
- QA checklist at bottom of this pack signed off in the log
```

---

## QA checklist (after Prompt 8)

- [ ] Light + dark, 375 and 1280
- [ ] Partner with no orders: zeros + empty, not sample names
- [ ] Partner with orders: KPIs match API (spot-check Network tab)
- [ ] Year chip returns 12 points
- [ ] Wallet is — / Not tracked
- [ ] Every View all lands on the right page
- [ ] Order row opens detail
- [ ] Create order succeeds (walk-in) and dashboard refreshes
- [ ] Customer / wrong role cannot load `/partner/analytics/dashboard` (403)
- [ ] No console errors; Lighthouse not required this pack but TTI still no 3D
