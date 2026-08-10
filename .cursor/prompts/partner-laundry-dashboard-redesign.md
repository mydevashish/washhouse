# Partner Laundry Dashboard Redesign — Cursor prompt pack

> Paste prompts **in order** (0 → 8). One Agent chat per prompt.  
> Goal: Redesign **`/partner`** as the laundry owner’s **command desk**: period-filtered Quick Overview + switchable chart + top-10 orders table + **90% create-order modal** (phone-linked customers, garments/tags, coupons, print, WhatsApp) — **reuse** existing APIs and hub brains; do not fork a second product.

## How to use

1. Open a **new Agent chat** per prompt.
2. Copy the full block under that prompt (from `Act as…` through acceptance criteria).
3. Read `AGENTS.md` + `.cursor/context/current-status.md` first in Prompt 0 only.
4. After Prompt 8, run the QA checklist at the bottom.

## Product north star

| Persona | Needs on `/partner` |
| ------- | ------------------- |
| **Laundry owner** | Today / week / month pulse: orders, pending work, revenue, unpaid ₹, customers — one chart, recent queue, create without leaving home |
| **Counter staff** | Fast create by phone, color token tags, print immediately, find order again by phone or token |

**Design thesis:** Real metrics only · INR + GST · India timezone for “today” · mobile-first · `PartnerOpsSurface` visual language · no invented KPIs.

**Already exists — extend, don’t duplicate:**

| Area | Location |
| ---- | -------- |
| Dashboard shell | `frontend/features/partner/views/partner-laundry-dashboard-view.tsx`, `partner-overview-view.tsx` |
| Walk-in create brain | `use-partner-walk-in-order-composer.ts`, `PartnerOrderDemoLiveComposer`, hub `?tab=create` |
| Customer by phone | Customer Desk lookup, `getPartnerCustomerInsightsDashboard` |
| Coupons | `docs/features/partner-coupons.md`, validate API |
| Print tags / invoice | `PrintOrderActions`, `buildPartnerPrintPath`, shop-floor print routes |
| Table actions | `partner-order-table-actions-menu.tsx`, `partner-orders-table.tsx` |
| Analytics (partial) | `GET /api/v1/partner/analytics/summary`, `partner_service.analytics_summary` |
| WhatsApp walk-in | `docs/features/offline-booking-whatsapp.md`, Celery `send_order_status_whatsapp` |
| IA rules | `docs/features/partner-owner-command-center.md`, `partner-customers-orders-hub.md` |

**Hard rules:**

- **Do not** remove `/partner/orders` hub; dashboard **deep-links** there for full queue.
- **Do not** reintroduce Shop Floor display mode.
- Create flow on dashboard must call the **same** create/validate endpoints as hub create tab.
- Default list page size stays **10** (pagination standard).

---

## Prompt 0 — Spec, metrics dictionary & IA (PM + UX + architects)

```
Act as product-manager + ui-ux-designer + frontend-architect + backend-architect for DLM WashHouse.

Read first:
- AGENTS.md, .cursor/rules/00-project-overview.md, 01-architecture.md, 13-ui-ux.md, 16-cursor-operating-rules.md
- .cursor/context/current-status.md
- docs/features/partner-owner-command-center.md
- docs/features/partner-customers-orders-hub.md
- docs/features/partner-coupons.md
- docs/features/offline-booking-whatsapp.md
- docs/features/partner-shop-floor.md (tokens + print only)
- frontend/features/partner/views/partner-laundry-dashboard-view.tsx
- backend/app/services/partner_service.py (analytics_summary)

Outcome:
Write docs/features/partner-laundry-dashboard-redesign.md from .cursor/templates/feature-spec.md

Must define:

1) Problem: Owner opens /partner and needs period-aware pulse + create + recent queue in ONE viewport — without duplicating Orders Hub.

2) Layout (desktop + mobile stack order):
   - Row A: **Quick Overview** (left) | **Analytics chart** (right) — shared period filter: Today | This week | This month (IST boundaries documented).
   - Row B: **Recent orders** — Create order CTA + status filter + top 10 table + row actions menu.

3) **Metrics dictionary** (each KPI: SQL rule, timezone, status set, payment field):
   - Total orders (created in period)
   - Pending orders (non-terminal statuses — list enum mapping)
   - Revenue (delivered gross vs collected — pick ONE primary label; show net/commission as secondary for owner)
   - Pending payment (unpaid orders count + optional ₹ outstanding)
   - Customers (distinct customers with orders in period vs all-time — specify both if needed)

4) Chart: default series tied to period filter; document bucket granularity (today=hourly optional / week=day / month=day or week).

5) Create-order modal (90vw×90vh): fields, validation, phone→existing customer auto-link, garment line items + color token, coupons, pickup/delivery, optional email, post-success print tags + WhatsApp body fields.

6) Laundry-owner extras (product backlog in spec — prioritize P1 vs P2):
   - Color bag token (R-42) auto-assign
   - Express vs standard + promised ready datetime
   - Payment method at intake (Cash/UPI/Unpaid/Partial)
   - Stain/special instructions + internal staff note
   - GST invoice requested (B2B)
   - Rush pin, reprint tags, open in hub, copy tracking link
   - WhatsApp message on create (rich summary) + existing status templates on advance

7) Non-goals: new payment provider, Bluetooth thermal SDK, Admin dashboard, fake demo data.

8) Phased delivery map Prompts 1–8 below.

Acceptance:
- Spec merged with traceability link in docs/product/traceability.md (one line).
- No code in this prompt.
```

---

## Prompt 1 — Backend: period overview + chart series API

```
Act as backend-architect for DLM.

Read:
- docs/features/partner-laundry-dashboard-redesign.md (from Prompt 0)
- backend/app/services/partner_service.py
- backend/app/api/v1/endpoints/partner*.py (analytics routes)
- docs/database/schema.md (orders, payments)

Implement:

1) New endpoint (name per API standards), e.g.:
   GET /api/v1/partner/analytics/overview?period=today|week|month

   Response includes:
   - period bounds (ISO UTC + display IST label)
   - orders_count, pending_orders_count, revenue_gross_inr, revenue_net_inr (after commission snapshot), pending_payment_count, pending_payment_inr, customers_count (define per spec)
   - chart_series: [{ bucket_label, orders, revenue_gross, revenue_net }] length appropriate to period

2) Reuse laundry scoping + deleted_at filters; align revenue rules with existing analytics_summary (document any intentional difference in spec appendix).

3) Pydantic schemas + OpenAPI; partner auth only.

4) Unit tests for period boundary math (IST today) and empty laundry.

Acceptance:
- Tests pass; no N+1 queries on chart buckets (prefer grouped SQL).
- Existing GET analytics/summary unchanged (backward compatible).
```

---

## Prompt 2 — Frontend: Quick Overview + shared period filter

```
Act as frontend-architect for DLM Partner UI.

Read:
- docs/features/partner-laundry-dashboard-redesign.md
- .cursor/rules/13-ui-ux.md, 19-responsive-design.md, 10-accessibility.md
- frontend/features/partner/components/ops-visual/*
- frontend/features/partner/views/partner-laundry-dashboard-view.tsx

Implement:

1) `PartnerDashboardPeriod` type + context or lifted state on `/partner` (today | week | month).

2) Component `PartnerQuickOverview`:
   - Segmented control for period (keyboard + aria-pressed)
   - 5–6 KPI tiles: orders, pending, revenue (gross + subtle net line), pending payment, customers
   - Loading skeletons, QueryErrorState + retry
   - Hook `usePartnerAnalyticsOverview(period)` wired to Prompt 1 API

3) Replace or refactor the static KPI grid in partner-laundry-dashboard-view so Quick Overview is the single source of truth for period metrics (remove duplicate conflicting counts).

4) Mobile: period control full-width; KPI grid 2 columns.

Acceptance:
- No invented numbers; switching period refetches once.
- Uses formatInr, design tokens, PartnerOpsSurface.
```

---

## Prompt 3 — Frontend: switchable chart (bar / line / pie / area)

```
Act as frontend-architect + ui-ux-designer.

Read:
- PartnerQuickOverview period state from Prompt 2
- frontend/features/partner/components/partner-revenue-chart.tsx
- frontend/features/partner/components/partner-status-overview-chart.tsx

Implement `PartnerDashboardAnalyticsChart`:

1) Reads same period + overview chart_series from Prompt 1 API.

2) Chart type toggle: Bar | Line | Pie | Area (persist choice in localStorage key `dlm.partner.dashboard.chartType`).

3) Recharts; accessible summary (`role="img"` + sr-only text describing totals).

4) Pie: limit slices (top N + Other); bar/line: revenue primary, optional second series orders (toggle).

5) Empty state with link to /partner/revenue when no delivered revenue in period.

Acceptance:
- Chart updates when period changes; no duplicate fetch (share query cache key with overview).
- prefers-reduced-motion: disable animation props.
```

---

## Prompt 4 — Frontend: Recent orders table (top 10 + status filter + actions)

```
Act as frontend-architect.

Read:
- frontend/features/partner/components/partner-recent-orders-table.tsx
- frontend/features/partner/components/partner-orders-table.tsx
- frontend/features/partner/components/partner-order-table-actions-menu.tsx
- usePartnerOrders hook + pagination standard (page_size 10)

Implement on `/partner` below overview row:

1) Section header: "Recent orders" + **Create order** button (opens modal — Prompt 5; stub callback OK until then).

2) Status filter: All | Needs action | Processing | Ready | Delivered | Cancelled (map to existing API filters/chips — do not invent new backend enum).

3) Table columns: Customer name, Phone, Delivery address (truncate + title tooltip), Created at (IST), Pickup/Delivery slot, Status badge, Actions dropdown.

4) Actions menu items (reuse print routes + hub links):
   - Print invoice / Print bill (when lifecycle allows)
   - Print tags / Reprint labels
   - Open order detail
   - Open in Customers & Orders hub
   - Advance status (when allowed — same rules as hub row)
   - Copy tracking code / WhatsApp customer (wa.me with prefilled text stub)

5) Always show latest 10 for selected status; link "View all" → /partner/orders with query params.

Acceptance:
- Responsive: card list on sm, table md+.
- Actions menu keyboard accessible; matches hub behavior.
```

---

## Prompt 5 — Frontend: Create order modal (90% viewport)

```
Act as frontend-architect + ui-ux-designer.

Read:
- frontend/features/partner/hooks/use-partner-walk-in-order-composer.ts
- frontend/features/partner/components/ops-visual/partner-walk-in-order-workspace.tsx
- frontend/features/partner/orders-hub (create tab)
- docs/features/partner-coupons.md
- Customer desk lookup components

Implement `PartnerCreateOrderDialog`:

1) Dialog ~90vw × 90vh, scrollable body, sticky footer (Cancel | Save order).

2) **Phone-first customer block:**
   - Indian phone input (+91), debounced lookup
   - If match: show customer card (name, last orders, unpaid badge); **do not** create duplicate user — bind existing customer_id
   - If no match: collect name (required), optional email, optional gender for tags

3) **Services / garments:**
   - Reuse catalog + service picker from walk-in composer (iron, wash+iron+fold, dry clean, etc.)
   - Per-line: garment type, qty, service, color/note (for tag text), optional photo thumb

4) **Order meta:** walk-in vs doorstep; address + slot picker; delivery charges; coupon select (active shop coupons + validate); express flag; special instructions; internal note; GST invoice checkbox

5) **Pricing sidebar (desktop) / accordion (mobile):** subtotal, discount, delivery, GST lines, total — live from composer logic

6) Wire submit to existing walk-in / assisted create API; on success: close modal → open Prompt 6 success strip OR inline success panel with order id + token

Acceptance:
- Same validation errors as hub create.
- No new create endpoint unless spec explicitly required.
- Form accessible (labels, focus trap in dialog).
```

---

## Prompt 6 — Post-create success: print tags + bag token prominence

```
Act as frontend-architect.

Read:
- frontend/features/partner-shop-floor/components/walk-in-success-panel.tsx
- frontend/features/partner-shop-floor/components/print-order-actions.tsx
- docs/features/partner-shop-floor.md (color token)

After successful create from dashboard modal:

1) Non-blocking success region on `/partner` (or modal step 2): large **color token** (e.g. R-42), order id, item summary counts (2 shirts, 1 pant).

2) Primary CTA: **Print tags now** (opens tags print route / window)
   Secondary: Print bag label, Add another order, Open order detail

3) Auto-scroll success into view; respect reduced motion

Acceptance:
- Print URLs match hub create success behavior.
- Token visible before staff navigates away (mix-up prevention).
```

---

## Prompt 7 — WhatsApp: rich order-received message on create

```
Act as backend-architect + frontend-architect.

Read:
- docs/features/offline-booking-whatsapp.md
- backend Celery tasks for send_order_status_whatsapp
- Twilio/template configuration docs

Implement:

1) Extend walk-in create success notification payload to include:
   - Item breakdown text (qty × garment × service)
   - Bag/token id
   - Promised ready / delivery window
   - Total INR (and paid vs balance due if unpaid)

2) Template strategy:
   - Dev: plain body via existing stub
   - Prod: document new Meta template name `order_received_detailed` OR map fields into approved template variables

3) Frontend: after create, show "Message sent to customer" or actionable error with retry (idempotent).

4) Optional: `WhatsApp customer` row action opens wa.me with same body for manual send fallback.

Acceptance:
- Only for walk-in/partner-created orders with valid E.164 phone.
- Does not break existing status-change WhatsApp chain.
- Tests for message body formatter (unit).
```

---

## Prompt 8 — Invoice on complete + dashboard polish + QA

```
Act as frontend-architect + qa-engineer.

Read:
- Print lifecycle: invoice available when status delivered/collected per existing rules
- docs/qa/partner-admin-pagination-matrix.md patterns

1) Ensure actions menu **Print invoice / Download PDF** enabled only when order complete per PrintOrderActions rules; same on dashboard table.

2) Consolidate `/partner` layout:
   - Remove redundant embedded full composer from first viewport IF modal is primary (keep link "Open full workspace" → hub create tab for power users)

3) Owner brief strip (optional): surface booking requests + delayed orders from existing owner-brief helpers — do not duplicate KPIs.

4) Playwright smoke: period toggle changes KPI labels; open create modal; mock create success shows print CTA.

5) Update docs/features/partner-laundry-dashboard-redesign.md status + .cursor/context/current-status.md one line.

Acceptance:
- Light + dark @ 375 and 1280.
- No regression on /partner/orders hub.
```

---

## QA checklist (manual)

- [ ] Today / week / month KPIs match API definitions (spot-check 3 orders in DB)
- [ ] Chart type persists across refresh
- [ ] Status filter shows correct top 10; View all deep-links hub
- [ ] Phone lookup attaches existing customer; new phone creates one customer
- [ ] Coupon validate + discount on total
- [ ] Print tags immediately after create; reprint from row menu
- [ ] Invoice/PDF only when lifecycle allows
- [ ] WhatsApp sent on create (or clear stub message in dev)
- [ ] Keyboard: period control, modal trap, actions menu
- [ ] IST "today" boundary at midnight India

## Laundry-owner extras (backlog — pull into future prompts)

| Item | Why |
| ---- | --- |
| Partial advance payment | Cash drawer accuracy |
| Rush order → pinned in hub queue | Peak hour ops |
| Item photos at intake | Dispute prevention |
| Weight-based bulk bag | Traditional dhobi pricing |
| Customer language pref (EN/HI) | WhatsApp comprehension |
| Daily cash summary tile | Owner reconciliation |
| Low pickup/delivery SLA alerts | Logistics pillar link |
