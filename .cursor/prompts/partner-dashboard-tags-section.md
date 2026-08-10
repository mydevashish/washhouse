# Partner Dashboard — Tags section (find · verify · reprint)

> Paste prompts **in order** (0 → 6). One Agent chat per prompt.  
> Goal: Add a **Tags** block on **`/partner`** immediately **after Recent orders** so counter staff can **find an order by order no. / phone / bag token (R-42)**, **verify** tag payload, and **reprint** labels when tags are missing or misplaced — **reuse** existing tag APIs and print routes; do not fork print HTML.

## How to use

1. Open a **new Agent chat** per prompt.
2. Copy the full block under that prompt (from `Act as…` through acceptance criteria).
3. Read `AGENTS.md` + `.cursor/context/current-status.md` first in **Prompt 0 only**.
4. After Prompt 6, run the QA checklist at the bottom.

## Product north star

| Persona | Needs after Recent orders |
| ------- | ------------------------- |
| **Counter staff** | “Customer lost a tag” → type phone or WH number → see token + preview → Print tags |
| **Owner** | Same flow without navigating to `/partner/floor/print` or hunting in hub |

**Design thesis:** Server-backed search (not only 50 active rows) · same print URLs as hub · `PartnerOpsSurface` language · mobile-first · debounced search · default page size **10**.

**Already exists — extend, don’t duplicate:**

| Area | Location |
| ---- | -------- |
| Dashboard shell | `frontend/features/partner/views/partner-laundry-dashboard-view.tsx` |
| Recent orders section (pattern) | `frontend/features/partner/components/partner-dashboard-recent-orders.tsx` |
| Print center (client filter — improve) | `frontend/features/partner-shop-floor/views/shop-floor-print-view.tsx` |
| Tag JSON API | `GET /api/v1/partner/orders/{order_id}/tags` → `getPartnerOrderTags` |
| Tag print UI | `frontend/features/partner-shop-floor/views/print-order-tags-view.tsx`, route `/partner/floor/print/[orderId]/tags` |
| Print helpers | `PrintOrderActions`, `buildPartnerPrintPath`, `print-lifecycle.ts` |
| Orders list search (BE) | `partner_service.list_orders` — `search` matches `tracking_code`, `customer_phone`, `token_code`, name |
| FE list | `listPartnerOrders({ search, bucket: 'all', page_size: 10 })` |
| Color token chips | `ColorTokenChip`, `ColorTokenBar` |
| Dashboard redesign spec | `docs/features/partner-laundry-dashboard-redesign.md` |
| Shop floor tokens spec | `docs/features/partner-shop-floor.md` |

**Hard rules:**

- **Do not** duplicate tag HTML generation — use existing print route + `OrderTagsService`.
- **Do not** remove `/partner/floor/print`; dashboard section **deep-links** there for “Open print center”.
- Search must work for **delivered / older** orders (use API `search` + `bucket=all`, not only `ShopFloorPrintView`’s 50 active client filter).
- Reprint must use **`buildPartnerPrintPath(orderId, 'tags')`** (same as row actions menu).
- Pagination default **10**; no invented mock orders.

---

## Prompt 0 — Spec, UX & traceability (PM + UX + architects)

```
Act as product-manager + ui-ux-designer + frontend-architect + backend-architect for DLM WashHouse.

Read first:
- AGENTS.md, .cursor/rules/00-project-overview.md, 01-architecture.md, 13-ui-ux.md, 16-cursor-operating-rules.md
- .cursor/context/current-status.md
- docs/features/partner-laundry-dashboard-redesign.md
- docs/features/partner-shop-floor.md (tokens + print only)
- frontend/features/partner/views/partner-laundry-dashboard-view.tsx
- frontend/features/partner-shop-floor/views/shop-floor-print-view.tsx
- backend/app/services/order_tags_service.py
- backend/app/services/partner_service.py (orders list search)

Outcome:
Write docs/features/partner-dashboard-tags-section.md from .cursor/templates/feature-spec.md

Must define:

1) Problem: Tags get lost on the floor; staff need a fixed place on /partner (below Recent orders) to find orders and reprint without opening Orders Hub or remembering /partner/floor/print.

2) Layout (mobile stack after Recent orders):
   - Section title: **Tags** (subtitle: find order · verify labels · reprint)
   - Single search field: placeholder e.g. "Order no. · phone · R-42"
   - Debounced server search (min 3 chars OR full tracking code / token pattern)
   - Result list (max 10): token chip, customer name, tracking #, phone, status badge, actions: **Verify tags** | **Print tags** | row menu subset if needed
   - Empty states: idle hint, no results, loading, error + retry
   - Footer link: "Open print center" → /partner/floor/print

3) **Verify tags** interaction (pick one in spec — document choice):
   - **Option A (recommended):** Inline expandable panel per result — fetch `GET .../tags` and show read-only preview (bag master + item lines, piece count) matching print-order-tags-view semantics without window.print
   - **Option B:** Navigate to `/partner/floor/print/[id]/tags` in same tab

4) Search rules documented:
   - Maps to existing `listPartnerOrders` `search` param (tracking_code, phone substring, token_code, customer name)
   - Phone: accept +91 / 10-digit; backend ilike already on customer_phone
   - Order no.: tracking_code (e.g. WH-…)
   - Token: R-42 / color token string

5) Non-goals: Bluetooth thermal SDK, editing tag content, reassigning token numbers, Admin UI.

6) Phased delivery map Prompts 1–6 below.

7) QA matrix bullets (375px + 1280px, light/dark).

Acceptance:
- Spec merged with one traceability line in docs/product/traceability.md
- No code in this prompt
```

---

## Prompt 1 — Backend: confirm search + tags auth (only if gaps)

```
Act as backend-architect for DLM.

Read:
- docs/features/partner-dashboard-tags-section.md (from Prompt 0)
- backend/app/services/partner_service.py (list orders + search)
- backend/app/api/v1/endpoints/partner.py (tags endpoints)
- backend/tests/api/test_order_color_tokens.py
- backend/tests/api/test_partner.py (orders list if present)

Task:
1) Verify partner orders list `search` covers: tracking_code, customer_phone (partial), token_code, customer_name — document in spec if already true.

2) If phone-last-4-only queries fail in practice (e.g. user types 4 digits), add minimal normalization in search (only if reproducible gap): e.g. strip non-digits and match suffix on customer_phone — with unit test.

3) Confirm tags endpoints return 404/403 for other laundry’s order_id (existing tests); add test if missing.

4) Do NOT add a new duplicate search endpoint unless spec required it; prefer `GET /partner/orders?search=&bucket=all&page_size=10`.

Acceptance:
- pytest green for touched tests
- logs/implementation-log.md one entry if behavior changed
```

---

## Prompt 2 — Shared FE: order lookup for tags (extract from print center)

```
Act as frontend-architect for DLM.

Read:
- docs/features/partner-dashboard-tags-section.md
- frontend/features/partner-shop-floor/views/shop-floor-print-view.tsx
- frontend/services/partner.ts (listPartnerOrders)
- frontend/features/partner/hooks/use-partner-operations.ts

Implement reusable module (suggested paths — adjust to match folder conventions):

1) `frontend/features/partner/dashboard/partner-tags-order-search.ts`
   - Export debounce delay constant (300–400ms)
   - Export `normalizePartnerTagsSearchQuery(raw: string): string`
   - Export `shouldRunPartnerTagsSearch(normalized: string): boolean` — e.g. length >= 3 OR looks like tracking/token (WH-, R-, etc.)

2) Hook `usePartnerTagsOrderSearch` in `frontend/features/partner/hooks/use-partner-tags-order-search.ts`
   - useQuery enabled when shouldRun… true
   - queryFn: `listPartnerOrders({ search, bucket: 'all', page: 1, page_size: 10, sort_by: 'created_at', sort_order: 'desc' })`
   - queryKey includes search string
   - staleTime: STALE.partnerAnalytics or partner orders standard

3) Refactor `ShopFloorPrintView` to use the same hook OR shared query helper (keep floor UX; replace client-side filter on 50 active rows with server search when query qualifies — backward compatible empty state copy).

4) Unit tests for normalize + shouldRun in `partner-tags-order-search.test.ts`

Acceptance:
- Print center still works; preferably improved for old orders
- No duplicate listPartnerOrders wiring in two places
```

---

## Prompt 3 — UI: PartnerDashboardTagsSection component

```
Act as frontend-architect + ui-ux-designer.

Read:
- docs/features/partner-dashboard-tags-section.md
- frontend/features/partner/components/partner-dashboard-recent-orders.tsx (section structure, PartnerOpsSurface)
- frontend/features/partner-shop-floor/components/color-token-chip.tsx
- frontend/features/partner-shop-floor/components/print-order-actions.tsx
- Hook from Prompt 2

Create `frontend/features/partner/components/partner-dashboard-tags-section.tsx`:

1) `<section aria-label="Tags" data-testid="partner-dashboard-tags">` wrapped in PartnerOpsSurface (match Recent orders density).

2) Header: h2 "Tags" + short description; optional link "Print center" → /partner/floor/print

3) Search input with Search icon, min-h 44px+, aria-describedby for hint text, data-testid="partner-dashboard-tags-search"

4) States: idle copy, loading skeleton, QueryErrorState + retry, no matches, results list

5) Each result row/card:
   - ColorTokenChip (color_token + token_code)
   - Customer name, #{tracking_code}, phone
   - PartnerStatusBadge
   - Primary button: Print tags → Link/buildPartnerPrintPath(id, 'tags') target _blank or same pattern as actions menu
   - Secondary: Verify tags (wire in Prompt 4 — stub opens placeholder OK)

6) Responsive: stacked cards sm+; touch targets ≥ 44px

Acceptance:
- Component renders in Storybook-free isolation via unit test or RTL smoke
- Keyboard: search focusable; buttons reachable
- Dark + light checked on PartnerOpsSurface
```

---

## Prompt 4 — Verify tags preview (inline panel)

```
Act as frontend-architect for DLM.

Read:
- docs/features/partner-dashboard-tags-section.md (verify interaction choice)
- frontend/features/partner-shop-floor/views/print-order-tags-view.tsx
- frontend/services/partner-order-tags.ts
- PartnerDashboardTagsSection from Prompt 3

Implement verify flow:

1) Subcomponent `PartnerDashboardTagsVerifyPanel` (same file or `partner-dashboard-tags-verify-panel.tsx`):
   - Props: orderId
   - useQuery → getPartnerOrderTags(orderId, { perPiece: readTagPerPieceSetting() })
   - Show: laundry name, token_code chip, customer, tracking, piece_count, list of tag lines (bag_master vs item) — read-only
   - Link: "Open full print view" → buildPartnerPrintPath(orderId, 'tags')
   - Loading / error states

2) In Tags section: toggling Verify expands one panel at a time (accordion); aria-expanded on trigger

3) Reuse visual tokens from print-order-tags-view where sensible; do NOT call window.print from verify panel

Acceptance:
- data-testid="partner-dashboard-tags-verify-{orderId}" on panel
- Per-piece setting respected (same localStorage key as shop floor)
```

---

## Prompt 5 — Wire dashboard + docs + logs

```
Act as frontend-architect + documentation-writer.

Read:
- frontend/features/partner/views/partner-laundry-dashboard-view.tsx
- PartnerDashboardTagsSection + verify panel
- docs/features/partner-dashboard-tags-section.md

1) Insert `<PartnerDashboardTagsSection />` **immediately after** `<PartnerDashboardRecentOrders />` and **before** create success panel.

2) Update docs/features/partner-laundry-dashboard-redesign.md IA diagram + goals: mention Tags row (find · verify · reprint).

3) Update logs/implementation-log.md and logs/feature-progress.md (one line each).

4) Mark checklist items in partner-dashboard-tags-section.md spec as done where applicable.

Acceptance:
- /partner shows Tags section in correct order
- No regression to create modal / recent orders
```

---

## Prompt 6 — Tests, Playwright smoke, QA

```
Act as qa-engineer + frontend-architect.

Read:
- docs/features/partner-dashboard-tags-section.md QA section
- Existing partner dashboard tests (grep partner-dashboard-recent-orders, partner-laundry)

1) RTL: partner-dashboard-tags-section.test.tsx — idle state, types search → mock listPartnerOrders → shows result + print link href

2) RTL: verify panel mocks getPartnerOrderTags

3) Playwright (if partner dashboard spec exists): extend smoke — visit /partner, tags search visible below recent orders, optional mocked API intercept

4) Run frontend test suite for touched files; note commands in implementation log

Acceptance:
- Tests pass locally
- QA checklist in spec copied below completed with notes
```

---

## Manual QA checklist (after Prompt 6)

> **Automated (2026-08-10):** Jest `partner-dashboard-tags-section` + `partner-tags-order-search` (8 tests). Playwright `partner-laundry-dashboard.spec.ts` tags placement smoke (auth required).

- [x] `/partner`: Tags section appears **below** Recent orders, above create success strip *(Playwright)*
- [ ] Search by **full tracking code** → correct order, Print tags opens `/partner/floor/print/{id}/tags` *(RTL href; manual)*
- [ ] Search by **phone** (full or last digits per spec) → finds order
- [ ] Search by **token** `R-42` (or shop token) → finds order
- [x] **Verify tags** shows bag + item lines matching print preview *(RTL)*
- [ ] Delivered / old order findable (server search, not only “active 50”)
- [ ] Empty / error / loading states sane; retry works
- [ ] Mobile 375px: usable search + buttons; desktop 1280px: aligned with ops surfaces
- [ ] Light + dark mode
- [ ] `/partner/floor/print` still works; refactored search consistent
- [ ] Row actions “Reprint labels” on Recent orders still matches Tags print URL

## Optional follow-up (separate chat)

- Promote Tags search to Orders Hub header (out of scope unless spec updated)
- Hindi/Hinglish microcopy for counter staff (`docs/features/partner-shop-floor.md` voice guidelines)
