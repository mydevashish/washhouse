# Partner Customers & Orders — Four pillars workspace (Customers · Orders · Coupons · Services)

> Paste prompts **in order** (0 → 8). One Agent chat per prompt.  
> Goal: At the top of **`/partner/orders`**, show **four side-by-side tiles** (Customers, Orders, Coupons, Services). Each tile shows **2 glance KPIs**; clicking opens a **~90% viewport modal** with **search**, **create**, and **server-paginated tables** (default **page_size=10**). **Remove Coupons + Services from Operations sidebar**; deep routes redirect into the hub with `?workspace=`.

## How to use

1. Open a **new Agent chat** per prompt.
2. Copy the full block under that prompt (from `Act as…` through acceptance criteria).
3. Read `AGENTS.md` + `.cursor/context/current-status.md` first in **Prompt 0 only**.
4. After Prompt 8, run the QA checklist at the bottom.

## Product north star

| Persona | Needs at the counter |
| ------- | -------------------- |
| **Counter staff** | “Who is this?” → customers · “What’s in the shop?” → orders · “Any discount?” → coupons · “Do we offer dry clean?” → services — **without** hunting sidebar + tabs |
| **Owner** | Same tiles for setup (catalog + promos) and daily ops in one screen |

**Design thesis:** Picture-led **pillar cards** (`PartnerOpsSurface`) · **one modal pattern** for all four · **backend pagination** on customers + orders · **reuse CRUD** from existing coupon/service views · **English-first** · mobile **2×2 grid** → modals **full-screen on ≤640px**, **max-w-[90vw] max-h-[90vh]** on desktop.

**Already exists — extend, don’t duplicate:**

| Area | Location |
| ---- | -------- |
| Hub shell | `frontend/features/partner/orders-hub/partner-orders-hub.tsx` |
| Customer KPIs + paginated list | `GET /partner/customer-insights/dashboard`, `GET /partner/customer-insights/customers?search=&page=&page_size=` |
| Customer desk search / lookup | `searchPartnerCustomers`, `lookupPartnerCustomer` — `frontend/features/partner/customer-desk/api.ts` |
| Orders list + search | `listPartnerOrders` — `frontend/services/partner.ts`, `partner_service.list_orders` |
| Create order | Hub `?tab=create`, `PartnerWalkInOrderWorkspace`, `buildNewOrderHref` — `owner-customer-crm.ts` |
| Coupons CRUD | `frontend/features/partner/views/partner-coupons-view.tsx`, `frontend/services/partner-coupons.ts` |
| Services CRUD | `frontend/features/partner/views/partner-service-catalog-view.tsx`, `frontend/services/partner-service-catalog.ts` |
| Nav | `frontend/features/partner/lib/partner-nav.ts` (remove Ops **Services** + **Coupons**; keep **Your shop › Service catalog** → same `/partner/services` redirect) |
| Modal / table patterns | shadcn `Dialog`, hub tables `PartnerOrdersTable`, pagination types `@/lib/pagination/types` |
| Prior hub spec | `docs/features/partner-customers-orders-hub.md` (tabs + queue stay **below** pillars) |

**Hard rules:**

- Default list **page_size = 10**; never load unbounded customer/order lists in the modal.
- Modals: focus trap, `Escape` closes, restore focus to triggering tile; `role="dialog"` + labelled title.
- **Do not** remove queue chips, Find customer tab, Requests, or Create order tab — pillars **add** fast paths; tabs remain for power users.
- **Do not** break print routes or `/partner/floor/print`.
- Coupons/services: **no new CRUD APIs** unless a gap is proven in Prompt 1.
- `/partner/coupons` and `/partner/services` → redirect to `/partner/orders?workspace=coupons|services` (modal auto-opens).

**Owner-friendly extras (implement in Prompts 2–6):**

1. **Customer row actions:** Call (`tel:`), WhatsApp (`wa.me` via `whatsappHref`), **New order** (prefill `?tab=create&phone=&name=`), **Open desk** (`?tab=desk&phone=`).
2. **Orders modal:** KPI strip — **Needs action** count (reuse `bucket=action`), **This week** count (analytics `period=week` or list filter — see Prompt 1); row actions: status advance subset + `PrintOrderActions` compact.
3. **Coupons modal:** Copy code, active toggle, delete confirm; hint “Apply when creating orders in Create tab”.
4. **Services modal:** Inline edit like catalog view; empty state CTA “Add Wash & Fold”; link **Garment prices** → `/partner/pricing`.
5. **Debounced search** (300ms) in modals; min 2 chars for customer name search (match insights API).
6. **URL state:** `?workspace=customers|orders|coupons|services` opens modal; closing clears param (shallow `replace`).
7. **Loading / error / empty** states per modal; retry on error.

---

## Prompt 0 — Spec, UX & traceability (PM + UX + architects)

```
Act as product-manager + ui-ux-designer + frontend-architect + backend-architect for DLM WashHouse.

Read first:
- AGENTS.md, .cursor/rules/00-project-overview.md, 01-architecture.md, 13-ui-ux.md, 16-cursor-operating-rules.md, 19-responsive-design.md, 10-accessibility.md
- .cursor/context/current-status.md
- docs/features/partner-customers-orders-hub.md
- docs/features/partner-customers-orders-hub-ui-polish.md
- frontend/features/partner/orders-hub/partner-orders-hub.tsx
- frontend/features/partner/lib/partner-nav.ts
- frontend/features/partner/views/partner-coupons-view.tsx
- frontend/features/partner/views/partner-service-catalog-view.tsx
- backend/app/api/v1/endpoints/partner_customer_insights.py
- backend/app/services/customer_desk_service.py (lookup / guest semantics)

Outcome:
Write docs/features/partner-customers-orders-four-pillars-workspace.md from .cursor/templates/feature-spec.md

Must define:

1) Problem: Counter staff bounce between hub tabs, sidebar Services/Coupons, and directory — owners want **four obvious tiles** for daily CRM + setup.

2) Layout wireframe (375px + 1280px):
   - Row of 4 pillar cards below hub header, above OrdersHubTabs
   - Each card: icon, title, KPI line 1 (total), KPI line 2 (this week / active / needs attention)
   - Whole card clickable + visible “Open” affordance
   - Modal ~90% viewport; sticky header (title, search, primary create); scrollable body; footer pagination (customers + orders)

3) KPI sources (document exact API fields):
   - Customers: total_customers + new_this_week from customer-insights dashboard
   - Orders: total_records (all) + week count — specify backend source from Prompt 1
   - Coupons: count active / total from listPartnerCoupons
   - Services: count from listPartnerServices

4) **Create customer** product decision (pick one, justify):
   - **Recommended:** POST /api/v1/partner/customers — name + Indian mobile; create User (customer role) if new else update display name; idempotent on phone; partner laundry scoped; appears in insights list after create
   - **Fallback:** “Add customer” only pre-registers via desk lookup + toast “Customer ready — place first order” without POST (document limitation)

5) Orders modal “Create order” → navigate hub `?tab=create` with phone/name query (reuse buildNewOrderHref).

6) Nav change: remove Operations › Services and Coupons; keep Your shop › Service catalog; redirect map for /partner/coupons and /partner/services.

7) Non-goals: removing desk/requests tabs; Admin hub; Bluetooth print; i18n.

8) Phased delivery map Prompts 1–8.

9) QA matrix (375 / 768 / 1280, light/dark).

Acceptance:
- Spec merged with traceability line in docs/product/traceability.md
- No code in this prompt
```

---

## Prompt 1 — Backend: customer create + order week KPI (only if gaps)

```
Act as backend-architect for DLM.

Read:
- docs/features/partner-customers-orders-four-pillars-workspace.md (Prompt 0)
- backend/app/api/v1/endpoints/partner.py
- backend/app/api/v1/endpoints/partner_customer_insights.py
- backend/app/services/customer_insights_service.py
- backend/app/services/partner_service.py (list_orders)
- backend/tests/api/test_partner.py
- backend/tests/api/test_customer_desk.py

Tasks:

1) Confirm GET /partner/customer-insights/customers supports search + pagination (page, page_size default 10). Document; add tests if search regression missing.

2) If spec chose POST /partner/customers:
   - Schema: PartnerCustomerCreateRequest { name, phone }
   - Validate Indian mobile (reuse validate_strict_indian_mobile)
   - Create or link User; partner can only manage laundry-scoped visibility in insights list
   - Return PartnerCustomerSummary or desk profile shape
   - Tests: create new, duplicate phone idempotent, authz partner A cannot see partner B

3) **Hub tile KPI** (prefer one lightweight endpoint over N+1):
   - Option A: extend GET /partner/customer-insights/dashboard with orders_count_all_time + orders_count_this_week (IST week, align partner_analytics_period)
   - Option B: document FE using existing getPartnerAnalyticsOverview(week) + listPartnerOrders page=1 page_size=1 bucket=all
   - Pick one in code comments; implement minimal surface

4) Do NOT paginate coupons/services on backend unless list >100 in production data (unlikely).

Acceptance:
- pytest passes for new/changed tests
- OpenAPI reflects new routes if any
- Update feature spec API table
```

---

## Prompt 2 — Shared UI: pillar grid + hub workspace modal shell

```
Act as frontend-architect + ui-ux-designer for DLM.

Read:
- docs/features/partner-customers-orders-four-pillars-workspace.md
- frontend/features/partner/components/ops-visual/partner-ops-surface.tsx (or PartnerOpsSurface export)
- frontend/features/partner/orders-hub/partner-orders-hub-section.tsx
- .cursor/rules/13-ui-ux.md, 19-responsive-design.md

Task:
Create reusable components under frontend/features/partner/orders-hub/workspace/:

1) PartnerHubPillarGrid — 4 tiles responsive:
   - mobile: grid grid-cols-2 gap-2
   - lg: grid-cols-4 gap-3
   - Use PartnerOpsSurface / card language from dashboard redesign

2) PartnerHubPillarCard — props: id, title, icon, primaryMetric, secondaryMetric, loading, onOpen
   - data-testid={`hub-pillar-${id}`}

3) PartnerHubWorkspaceModal — large dialog:
   - className: max-w-[90vw] w-full max-h-[90vh] h-full sm:h-auto flex flex-col p-0 gap-0
   - mobile: h-[100dvh] max-h-[100dvh] max-w-full rounded-none sm:rounded-lg
   - slots: title, description, toolbar (search + actions), children, footer (pagination)
   - onOpenChange syncs ?workspace= query param via useRouter + useSearchParams (shallow replace)

4) PartnerHubWorkspacePagination — wired to PaginatedList (page, total_records, page_size fixed 10)

5) Unit test: pillar grid renders 4 cards; modal testid when workspace param set

Do NOT wire data yet — placeholders OK.

Acceptance:
- No lint errors
- a11y: dialog title, focus trap from shadcn Dialog
```

---

## Prompt 3 — Customers pillar + modal (list, search, create)

```
Act as frontend-architect for DLM.

Read:
- docs/features/partner-customers-orders-four-pillars-workspace.md
- Prompt 2 components
- frontend/services/customer-insights.ts
- frontend/features/partner/lib/owner-customer-crm.ts (tel, whatsapp, newOrderPrefillHref)
- frontend/features/partner/components/owner/owner-customer-card.tsx (reuse row patterns if useful)

Task:

1) PartnerHubCustomersPillar — useQuery dashboard for KPIs; open modal on click.

2) PartnerHubCustomersWorkspace (inside modal):
   - Debounced search → listPartnerCustomerInsights({ search, page, page_size: 10 })
   - Table columns: Name, Phone, Orders, Last visit, Tags (soft tag), Actions (call, WhatsApp, New order, Desk)
   - Empty / loading / error states
   - Footer pagination

3) Create customer:
   - Button “Add customer” → sheet/dialog form: name (required), phone (required, Indian)
   - Submit → POST from Prompt 1 OR documented fallback (lookup-only)
   - On success: invalidate insights queries, toast, optional open desk

4) Integrate pillar into partner-orders-hub.tsx below header, above OrdersHubTabs.

5) Tests: partner-orders-hub.test.tsx — pillars visible; customers modal opens with testid.

Acceptance:
- Default page size 10
- No full customer array fetch
- Phone validation UX matches walk-in workspace
```

---

## Prompt 4 — Orders pillar + modal (list, search, create)

```
Act as frontend-architect for DLM.

Read:
- docs/features/partner-customers-orders-four-pillars-workspace.md
- Prompt 2 shell
- frontend/features/partner/hooks/use-partner-operations.ts (usePartnerOrders)
- frontend/features/partner/components/partner-orders-table.tsx
- frontend/features/partner/orders-hub/use-partner-orders-queue-state.ts (search param mapping)

Task:

1) PartnerHubOrdersPillar — KPIs: total orders (all bucket) + this week (from Prompt 1 endpoint or analytics); secondary badge for needs_action if cheap.

2) PartnerHubOrdersWorkspace:
   - Search maps to listPartnerOrders search (tracking, phone, name, token)
   - Reuse PartnerOrdersTable or slim modal variant (same columns, compact actions)
   - Pagination: page, page_size=10, bucket=all (or spec default)
   - “New order” → router.push buildOrdersHubPath(..., 'create') or buildPartnerCreateOrderHref

3) Row actions: keep status advance + PrintOrderActions layout="compact"

4) Wire pillar + workspace=orders URL param.

5) Tests: modal opens; pagination controls present; search debounced.

Acceptance:
- Server-driven pagination only
- No duplicate order fetch logic — extend existing hooks/queryKeys
```

---

## Prompt 5 — Coupons pillar + modal (full CRUD extract)

```
Act as frontend-architect for DLM.

Read:
- docs/features/partner-customers-orders-four-pillars-workspace.md
- frontend/features/partner/views/partner-coupons-view.tsx
- frontend/services/partner-coupons.ts

Task:

1) Extract presentational + mutation logic into frontend/features/partner/orders-hub/workspace/partner-hub-coupons-workspace.tsx (and small hook if needed).

2) PartnerHubCouponsPillar — KPI: active count / total count from listPartnerCoupons.

3) Modal: table of coupons (code, discount %, active, actions: toggle, delete, copy code); create dialog (reuse existing form).

4) Refactor PartnerCouponsView to render the same workspace inside PartnerContent for backward compatibility OR thin wrapper that opens hub redirect — prefer wrapper redirect to /partner/orders?workspace=coupons.

5) Tests for create + toggle still pass.

Acceptance:
- CRUD behavior unchanged vs current coupons page
- data-testid hub-pillar-coupons, hub-workspace-coupons
```

---

## Prompt 6 — Services pillar + modal (full CRUD extract)

```
Act as frontend-architect for DLM.

Read:
- docs/features/partner-customers-orders-four-pillars-workspace.md
- frontend/features/partner/views/partner-service-catalog-view.tsx
- frontend/services/partner-service-catalog.ts
- frontend/features/partner/lib/partner-service-category-options.ts

Task:

1) Extract catalog CRUD into partner-hub-services-workspace.tsx (inline edit rows from catalog view).

2) PartnerHubServicesPillar — KPI: service count; secondary “from ₹X” optional if easy.

3) Modal: list + add service + edit + delete; PartnerServiceCategoryField reuse.

4) PartnerServiceCatalogView → redirect or embed workspace; /partner/services page uses redirect to hub ?workspace=services (Next redirect in app route).

5) Link in modal footer: “Garment prices” → /partner/pricing.

6) Update ops-visual links that say “Manage services” to use ?workspace=services where appropriate.

Acceptance:
- CRUD parity with catalog view
- No regression in walk-in composer service list (still uses listPartnerServices)
```

---

## Prompt 7 — Nav, redirects, E2E hooks

```
Act as frontend-architect + devops-minded engineer for DLM.

Read:
- docs/features/partner-customers-orders-four-pillars-workspace.md
- frontend/features/partner/lib/partner-nav.ts
- frontend/features/partner/lib/partner-nav.test.ts
- frontend/tests/e2e/partner-orders-hub.spec.ts
- frontend/tests/e2e/partner-journey.spec.ts
- app/(partner)/partner/coupons/page.tsx and services/page.tsx (if exist)

Task:

1) Remove from PARTNER_NAV_SECTIONS operations: Services + Coupons items.

2) Keep PARTNER_ORDERS_HUB_SEARCH_ALIASES entries for Coupons/Services but href → /partner/orders?workspace=coupons|services.

3) Add redirects:
   - /partner/coupons → /partner/orders?workspace=coupons
   - /partner/services → /partner/orders?workspace=services (unless Your shop catalog should stay full page — spec: catalog bookmark redirects to modal; document in spec)

4) Update partner-nav.test.ts expectations (Operations section item count).

5) E2E: partner-orders-hub — 4 pillars visible; open customers modal; sidebar has no Coupons under Operations.

Acceptance:
- Breadcrumbs/titles still sensible (getPartnerPageTitle)
- Legacy bookmarks work
```

---

## Prompt 8 — QA matrix, docs status, polish

```
Act as qa-engineer + ui-ux-designer for DLM.

Read:
- docs/features/partner-customers-orders-four-pillars-workspace.md
- docs/qa/partner-customers-orders-hub-matrix.md (extend or add sibling matrix)

Task:

1) Add docs/qa/partner-four-pillars-workspace-matrix.md — cases: each modal open/close, pagination, search, create customer, create order navigation, coupon CRUD, service CRUD, redirects, 375px layout, keyboard Escape.

2) Mark feature spec status review when done.

3) Visual polish pass:
   - Pillar cards equal height
   - Modal table horizontal scroll on mobile
   - Consistent h-9 buttons (hub polish system)

4) Run: frontend unit tests for orders-hub; backend pytest test_partner + test_customer_desk; note any manual staging checks.

Acceptance:
- Matrix checked in doc
- No known blockers listed in .cursor/context/current-status.md (short note if needed)
```

---

## Post-pack manual QA (you)

| Check | Pass |
| ----- | ---- |
| `/partner/orders` shows 4 pillars above tabs | ☐ |
| Customers modal: 10 rows, next page hits network | ☐ |
| Add customer: name + phone saves and appears in search | ☐ |
| Orders modal: search by phone last 4 | ☐ |
| New order from customer row prefills create tab | ☐ |
| Coupons: create, toggle, delete in modal | ☐ |
| Services: add/edit/delete in modal | ☐ |
| Sidebar Operations has no Coupons/Services | ☐ |
| `/partner/coupons` opens hub + modal | ☐ |
| Light + dark, 375px, no horizontal page scroll | ☐ |
