# Partner Customers & Orders Hub — Cursor prompt pack

> Paste prompts **in order** (0 → 8). Each prompt is one focused Cursor Agent session.  
> Goal: give laundry partners **one Customers / Orders workplace** — find customer → see history → create order → print tags → complete → print invoice — with English-first UI, picture-led affordances, chips/filters, and **no Shop Floor display mode**.

## How to use

1. Open a **new Agent chat** per prompt.
2. Copy the full block under that prompt (from `Act as…` to the end of acceptance criteria).
3. Do **not** skip Prompt 0 — it rewrites IA and retires Shop Floor as a mode so later prompts don’t rebuild two shells.
4. After Prompt 8, run the QA checklist at the bottom.
5. Related prior packs (do not contradict without updating specs):
   - [`orders-hub.md`](../../docs/features/orders-hub.md) — CRM tabs already merged
   - [`partner-shop-floor.md`](../../docs/features/partner-shop-floor.md) — print + Cloth Wall (reuse print/intake, retire mode)
   - [`partner-owner-command-center.md`](partner-owner-command-center.md) — Advanced owner shell (evolve, don’t fork)

## Product north star (read before any prompt)

| Persona | Needs |
| ------- | ----- |
| **Laundry owner / counter staff** | One place for customers + orders; phone lookup; walk-in & doorstep create; tags on intake; invoice on handover/pay |
| **Partner from any Indian state** | **English by default** — no Hindi/Hinglish as primary UI; optional later language picker only if needed |
| **Busy shop** | Chips, filters, images, big tap targets — understand actions without reading dense English |

**Design thesis:** One job — “this customer’s orders.” Picture-first shortcuts. Print is part of the order lifecycle, not a separate “Shop Floor mode.” Mobile-first (360–414px).

**Partner mental model (must match UI):**

```text
Customer walks in / calls
  → Find by phone (or create guest)
  → See past orders + unpaid / ready
  → New order (walk-in or doorstep)
  → Print garment TAGS immediately
  → Work progresses (status chips)
  → Ready / collected / paid
  → Print BILL or GST INVOICE
  → Optional reprint anytime
```

**Already exists — enhance, don’t duplicate:**

- Orders Hub: `/partner/orders` tabs `orders | desk | requests | directory`
- Create: `/partner/new-order`, `/partner/floor/new` (Cloth Wall), `/partner/walk-in-orders`
- Print APIs + HTML: tags / bill / invoice under `/partner/floor/print/[orderId]/…` + partner order detail
- Nav: `frontend/features/partner/lib/partner-nav.ts`
- Mode: `dlm.partner_ui_mode` (`shop_floor` | `advanced`) — **this pack removes Shop Floor as a display mode**
- Catalog thumbs: `frontend/public/catalog/` + `CatalogGarmentThumb`

**Creative must-haves (laundry-partner inventiveness — include in Prompt 0 decisions):**

1. **Unified nav label** — single item e.g. **Customers & Orders** (or **Orders**) that owns customers + all order create/list flows.
2. **Shortcut chips** — e.g. Needs action · Ready today · Walk-in · Doorstep · Unpaid · Today · Repeat customers.
3. **Smart filters** — phone last-4, name, tracking/token, date, source, status, payment.
4. **Customer card → orders** — one tap from directory/desk into that customer’s order list + “New order for this customer”.
5. **Lifecycle print CTAs** — after create: **Print tags**; when ready/delivered/collected: **Print bill / invoice**; always **Reprint**.
6. **Intake success panel** — calm success with image + primary “Print tags” + secondary “New another order”.
7. **Repeat last order** — for known phone, 1-tap clone last line items (if data allows) with edit before save.
8. **Recent customers strip** — last 8 phones served today (local + API if available).
9. **Token / tracking scannable** — big token on detail + print center search from hub.
10. **WhatsApp share invoice** (optional soft) — `wa.me` with tracking + amount if already patterned in app; else stub CTA.
11. **Picture labels** on chips/actions (small garment/status illustrations) — literacy without Hindi.
12. **Retire Display mode Shop Floor** — single partner shell (today’s Advanced/Owner shell); keep useful floor *routes* (print, cloth wall) as deep links / hub actions, not a second OS.
13. **English primary** everywhere partner-facing in this hub; migrate Hinglish floor copy to English when those screens remain reachable.
14. **Remove redundant sidebar items** — New Order, Walk-in orders, People › Customers as separate top-level entries → chips / tabs / FABs inside the hub (redirects preserve bookmarks).

---

## Prompt 0 — Spec & IA (PM + UX) — DO FIRST

```
Act as product-manager + ui-ux-designer for DLM WashHouse Partner.

Read first:
- AGENTS.md, .cursor/rules/00-project-overview.md, 01-architecture.md, 13-ui-ux.md, 16-cursor-operating-rules.md, 19-responsive-design.md, 10-accessibility.md
- .cursor/context/current-status.md
- docs/features/orders-hub.md
- docs/features/partner-shop-floor.md
- docs/features/partner-owner-command-center.md
- docs/features/customer-desk.md
- docs/product/offline-booking-ui-map.md (if present)
- frontend/features/partner/lib/partner-nav.ts
- frontend/features/partner-shop-floor/types.ts
- frontend/store/partner-ui-mode.store.ts (or hooks/use-partner-ui-mode.ts)
- frontend/features/partner/orders-hub/ (or wherever PartnerOrdersHub lives)
- Print: frontend/features/partner-shop-floor/components/print-order-actions.tsx

Outcome:
Write a new feature spec that redesigns partner daily ops around ONE workplace:

  docs/features/partner-customers-orders-hub.md
  (use .cursor/templates/feature-spec.md)

Title idea: “Partner Customers & Orders Hub” (unify customers + orders + intake + print lifecycle; retire Shop Floor display mode; English-first; image-led).

Must define:

1) Problem
- Partners bounce between Orders, New Order, Walk-in, Customers for one job.
- Shop Floor display mode splits the product into two OSes; many partners don’t need/use it.
- Hinglish/Hindi-first floor UX fails partners who don’t speak Hindi.
- Print tags/invoice exist but feel “floor-only”, not part of normal order completion.

2) Personas & jobs-to-be-done (counter + owner). Map the daily loop:
   Find customer → create → print tags → process → ready → print invoice → collect.

3) Information architecture (HARD decisions — be explicit):
   - Single sidebar item for this workplace (propose exact label + href).
   - Tab / chip model (extend Orders Hub tabs OR redesign — justify).
   - Where New Order / Walk-in / Desk / Directory / Print live (tabs vs sheets vs FAB vs chips).
   - Redirect map for: /partner/new-order, /partner/walk-in-orders, /partner/customers, /partner/customer-desk, /partner/floor/*, /partner/floor/print/*
   - What happens to People › Customers nav item.
   - What happens to Logistics / Money / Staff (stay separate — confirm).

4) RETIRE Shop Floor as Display mode:
   - Remove `shop_floor` | `advanced` toggle from Settings / More / home.
   - Single shell = current Advanced / Owner Command Center shell.
   - Migrate useful Shop Floor capabilities INTO the hub (Cloth Wall create, print center, ready board if still valuable) as routes or hub panels — NOT as a second mode.
   - Default: no `dlm.partner_ui_mode` shop_floor; migration plan for existing localStorage values (force advanced / delete key).
   - Decide fate of /partner/floor/today, /ready, /more — keep as optional deep tools, redirect to hub equivalents, or fold into Logistics/Today. Pick one coherent plan.
   - Update partner-shop-floor.md status: mode retired; print + cloth wall become shared modules.

5) Language:
   - English is the only primary UI language for partner hub + remaining floor screens in scope.
   - Voice TTS: stop preferring Hindi; English (en-IN) if voice remains; default OFF.
   - No full i18n framework required in this pack unless trivial; document future language picker as non-goal or Phase 2.

6) Print lifecycle (must be product-clear):
   - On successful create (walk-in / cloth wall / assisted): primary CTA Print tags; secondary Continue / New order.
   - On Ready / Delivered / Collected (define exact statuses): primary Print bill; secondary GST invoice.
   - Hub order row + order detail: Print actions always available (reuse PrintOrderActions).
   - Optional Print center entry from hub chip (reuse /partner/floor/print search).
   - Thermal 58mm + browser print — no Bluetooth SDK in this pack.

7) Chips, filters, search (concrete list):
   - Shortcut chips (Needs action, Ready today, Walk-in, Doorstep, Unpaid, Today, All…)
   - Filters (status, source, payment, date range)
   - Search (phone, name, tracking, token last-4)
   - Customer-scoped filter when opened from directory/desk

8) Image system:
   - Every primary action / empty state / chip group gets a small illustration or catalog thumb where it aids recognition.
   - Propose assets under frontend/public/partner-ops/ or reuse catalog.
   - No purple-gradient AI slop; follow tokens.css; match Owner Command Center visual language if present.

9) Creative extras (accept or defer with rationale):
   - Recent customers strip
   - Repeat last order
   - WhatsApp share invoice
   - Big token display
   - Unpaid / ready overdue emphasis
   - Keyboard / phone keypad for desk (reuse existing)

10) Non-goals:
   - Admin Orders Hub redesign (mention parity later only)
   - New payment provider / Bluetooth printers
   - Full multilingual i18n
   - Fake metrics
   - Breaking print APIs

11) Phased slices mapped to Prompts 1–8:
   P1 — Spec lock + nav IA + mode retirement foundation (types/store defaults)
   P2 — Hub shell: tabs/chips/filters/search + image-led empty states
   P3 — Merge intake (New Order / Walk-in) into hub flows + redirects
   P4 — Customer-centric CRM (desk + directory) “new order for this customer”
   P5 — Print lifecycle CTAs (create success, ready, detail, hub rows)
   P6 — English copy pass + voice/lang defaults; remove Shop Floor toggle UI
   P7 — Floor route migration / redirects + delete dead mode chrome
   P8 — Polish, a11y, Playwright, docs, logs

12) Acceptance criteria + success metrics
   e.g. Partner finds customer + starts new order in ≤ 3 taps; prints tags without leaving order context; Settings has no Shop Floor mode; UI English-first.

13) Update:
   - docs/features/README.md
   - logs/feature-progress.md
   - .cursor/context/current-status.md (brief)
   - Note supersession vs orders-hub.md + partner-shop-floor.md (cross-link; don’t delete history)

Do NOT implement UI yet. Spec only. Be concrete with routes, components, redirects, and localStorage migration.
```

---

## Prompt 1 — Nav IA + retire mode foundation

```
Act as frontend-architect + ui-ux-designer.

Implement Slice P1 ONLY from docs/features/partner-customers-orders-hub.md:
1) Partner nav: single Customers & Orders workplace (per spec label/href).
2) Foundation to retire Shop Floor display mode (store default + hide toggle prep).
3) Redirect stubs as specified (or leave TODOs only if spec says Prompt 3/7).

Read:
- docs/features/partner-customers-orders-hub.md
- frontend/features/partner/lib/partner-nav.ts (+ partner-nav.test.ts)
- frontend/components/layout/partner-shell.tsx
- frontend/features/partner-shop-floor/types.ts
- frontend/store/partner-ui-mode.store.ts
- frontend/hooks/use-partner-ui-mode.ts
- frontend/features/partner-shop-floor/components/partner-ui-mode-toggle.tsx
- .cursor/rules/13-ui-ux.md, 19-responsive-design.md

Requirements:

NAV
- Collapse Operations items: remove separate top-level New Order, Walk-in orders, and People › Customers IF the spec says so.
- One primary nav item for the hub with badgeKeys (orders + bookingRequests) preserved.
- Active states: /partner/orders?tab=*, legacy aliases, new redirects all highlight the hub item.
- Update search aliases / page titles (getPartnerPageTitle).
- Keep Logistics, Staff, Money, Shop, System per spec.

MODE FOUNDATION
- Change default partner UI mode to the single shell (former `advanced`).
- On hydrate: if localStorage is `shop_floor`, migrate to advanced (one-time) per spec.
- Do NOT delete floor routes yet (Prompt 7). Do NOT remove toggle UI yet if spec schedules copy in P6 — but default must never land users in shop_floor shell after this prompt if spec says P1.
- PartnerShell should reliably show Advanced nav/home after migration.

TESTS
- Update partner-nav.test.ts, partner-ui-mode tests, shop-floor-nav tests as needed so CI reflects new IA.
- Do not break Owner Command Center overview unless nav labels change requires title updates.

CONSTRAINTS
- No hub UI redesign yet (Prompt 2).
- No print CTA work yet.
- Mobile drawer still clear; no denser than today.

Acceptance:
- Sidebar shows one Customers/Orders workplace per spec.
- Fresh + migrated devices open Advanced shell by default.
- Unit tests green for nav + mode migration.
- Update logs/implementation-log.md briefly.
```

---

## Prompt 2 — Hub shell: chips, filters, search, image-led

```
Act as frontend-architect + ui-ux-designer.

Implement Slice P2 of docs/features/partner-customers-orders-hub.md ONLY:
Upgrade `/partner/orders` hub shell into the daily workplace: shortcut chips, filters, search, picture-led empty/loading states — without forking Customer Desk / requests / directory modules.

Read:
- docs/features/partner-customers-orders-hub.md
- docs/features/orders-hub.md
- frontend/features/partner/orders-hub/** (and/or features/orders-hub/**)
- frontend/features/partner/views/partner-orders* 
- Pagination: docs/PAGINATION_STANDARD.md (default page_size 10)
- Catalog / public images patterns

Requirements:

CHIPS (shortcut)
- Implement the chip set from the spec (Needs action, Ready today, Walk-in, Doorstep, Unpaid, Today, All — adjust to real API filters).
- Chips must map to existing query params / bucket filters where possible; extend API only if spec + backend already support fields — otherwise client-side filter with clear limitation note OR small backend filter addition if trivial and in-scope.
- Selected chip visible; keyboard accessible; 44px tap targets.

FILTERS + SEARCH
- Compact filter bar: status, source (walk-in/doorstep), date, payment if available.
- Search: phone / name / tracking / token — debounce; works with pagination.
- Deep-linkable URL state (`?tab=&chip=&q=&…`) per spec.

IMAGE-LED UX
- Empty states with illustration + one English sentence + primary CTA (Find customer / New order).
- Optional small icons/images on chips (subtle, not emoji spam).
- Match Owner Command Center / tokens; dark mode + 375px.

TABS
- Keep/extend hub tabs per spec (orders / desk / requests / directory or renamed).
- Header explains the page in one English line: “Customers and their orders in one place.”

CONSTRAINTS
- Reuse PartnerOrdersTable / desk / BR / directory — wrap, don’t rewrite business logic.
- No intake merge yet (Prompt 3).
- No print buttons on rows yet (Prompt 5) unless already present on detail.

Acceptance:
- Partner can filter to Ready today / Walk-in in ≤ 2 taps.
- Search finds by phone last digits / tracking.
- Empty state is picture-led and English.
- Playwright or RTL smoke for chips + tab switch @ 375px.
- logs/implementation-log.md updated.
```

---

## Prompt 3 — Merge intake (New Order + Walk-in) into hub

```
Act as frontend-architect + product-minded implementer.

Implement Slice P3 of docs/features/partner-customers-orders-hub.md:
Bring New Order + Walk-in into the Customers & Orders workplace so partners never hunt three nav items.

Read:
- docs/features/partner-customers-orders-hub.md
- frontend/app/(partner)/partner/new-order/page.tsx
- frontend/features/partner-shop-floor/views/partner-new-order-gate.tsx
- frontend/features/partner-shop-floor/views/cloth-wall-new-order-view.tsx
- frontend/features/partner/views/partner-walk-in-orders-view.tsx
- frontend/features/partner/customer-desk/** (buildNewOrderHref helpers)
- Redirect patterns from Orders Hub legacy pages

Requirements:

ENTRY POINTS (per spec — implement exactly)
- Hub primary FAB or chip: “New order”.
- Modes: Walk-in (counter) vs Assisted/doorstep — clear picture-led choice screen OR tabs.
- Prefer reusing Cloth Wall + assisted PartnerNewOrderView behind the gate; do not invent a third form.
- Walk-in list (active walk-ins) becomes a hub chip/filter OR sub-panel — not a separate sidebar item.
- Prefill from desk: phone/name query params still work.

REDIRECTS
- /partner/new-order → hub intake (or keep page but linked only from hub; redirect if spec says).
- /partner/walk-in-orders → hub equivalent (?chip=walk_in or ?tab=…).
- Update all in-app links (overview CTAs, logistics, CRM “new order” hrefs, E2E).

SUCCESS HANDOFF
- After create: navigate to success state that prompts Print tags (wire placeholder CTA to print route even if Prompt 5 polishes copy).
- Calm English success copy + image.

CONSTRAINTS
- No AuthZ changes; reuse walk-in + assisted APIs.
- Don’t break PartnerNewOrderGate assisted mode.
- Update partner-journey / offline-booking Playwright paths that hit /walk-in-orders.

Acceptance:
- Zero top-level Walk-in / New Order nav items (if spec removed them).
- Create walk-in + assisted still works from hub.
- Bookmarks to old URLs land correctly.
- Tests updated; logs updated.
```

---

## Prompt 4 — Customer-centric CRM (desk + directory)

```
Act as frontend-architect + ui-ux-designer.

Implement Slice P4 of docs/features/partner-customers-orders-hub.md:
Make “this customer” the center of gravity — history, new order, and their orders without leaving the hub.

Read:
- docs/features/partner-customers-orders-hub.md
- docs/features/customer-desk.md
- frontend/features/partner/customer-desk/**
- Partner directory / customers view mounted on tab=directory
- owner-customer-crm helpers

Requirements:

DESK
- Find by phone (keypad if exists) → profile + order history.
- Primary actions with images/labels: New walk-in order · New doorstep order · Call (if exists).
- “View all orders for this customer” applies customer-scoped filter on orders tab (URL state).
- Recent customers strip (today) if spec includes it — localStorage OK if API lacks endpoint; document.

DIRECTORY
- Cards remain CRM insights; each card CTA opens desk prefilled OR filtered orders + New order.
- Remove mental split “Customers page vs Orders page”.

REPEAT LAST ORDER (if spec accepted)
- If last order line items available, offer “Order same as last time” → intake prefilled editable.
- If data insufficient, show disabled reason or defer with comment in spec — do not fake items.

ENGLISH + CLARITY
- Replace any Hinglish desk strings in partner hub with clear English.
- Status badges use icon + text (not color alone).

Acceptance:
- From directory → new order for that phone in ≤ 2 taps.
- Desk history → filter orders tab for that customer.
- Mobile 375px usable; a11y labels on actions.
- Unit tests for href builders; logs updated.
```

---

## Prompt 5 — Print lifecycle (tags → invoice)

```
Act as frontend-architect + backend-aware implementer (FE-first).

Implement Slice P5 of docs/features/partner-customers-orders-hub.md:
Wire print into the order lifecycle partners actually run.

Read:
- docs/features/partner-customers-orders-hub.md
- docs/features/partner-shop-floor.md (print sections)
- frontend/features/partner-shop-floor/components/print-order-actions.tsx
- frontend/features/partner-shop-floor/views/shop-floor-print-view.tsx
- Print pages under frontend/app/(partner)/partner/floor/print/**
- Partner order detail view
- Backend partner tags/invoice endpoints (reuse; do not redesign PDF engine)

Requirements:

CREATE → TAGS
- After successful walk-in / cloth-wall / assisted create: success panel with:
  - Primary: Print tags (opens tags print view or window.print flow)
  - Secondary: Print bill (optional early) / Done / Create another
- English copy; optional small tag illustration.

READY / COMPLETE → INVOICE
- On order detail when status ∈ Ready | Delivered | Collected (per spec): emphasize Print bill + GST invoice.
- Hub order row overflow or icon button: Print (tags / bill / invoice) — reuse PrintOrderActions; don’t duplicate logic.

PRINT CENTER
- Hub chip or header action “Print center” → existing /partner/floor/print (or relocated route per spec).
- Search by phone last-4 / tracking still works.

REPRINT
- Always available from detail; idempotent APIs already — keep.

OPTIONAL
- WhatsApp share link for invoice/tracking if cheap; else skip.

CONSTRAINTS
- No Bluetooth SDK.
- Keep 58mm CSS print styles.
- Do not break existing floor print URLs (redirect OK).

Acceptance:
- Partner can print tags within 1 tap of create success.
- Partner can print invoice from Ready order without opening Shop Floor mode.
- RTL/Playwright covers presence of Print tags CTA on success + Print actions on detail.
- logs + feature spec checklist updated.
```

---

## Prompt 6 — English-first + remove Shop Floor toggle UI

```
Act as frontend-architect + ui-ux-designer.

Implement Slice P6 of docs/features/partner-customers-orders-hub.md:
English-first partner UI for this workplace; remove Display mode Shop Floor from settings/chrome.

Read:
- docs/features/partner-customers-orders-hub.md
- frontend/features/partner/views/partner-settings-view.tsx
- frontend/features/partner-shop-floor/lib/shop-floor-nav.ts
- frontend/features/partner-shop-floor/lib/floor-voice.ts
- PartnerUiModeToggle usages (settings, more, home footer)
- Any Hinglish strings on remaining reachable floor create/print screens

Requirements:

LANGUAGE
- All hub + settings strings in scope: clear English (India-friendly, not US slang).
- Cloth Wall / print / ready screens still linked from hub: English primary labels (Hinglish may remain as tiny secondary only if spec allows — default: remove primary Hinglish).
- floor-voice.ts: prefer en-IN / English voices; do not prefer Hindi; keep opt-in default OFF.
- Dates/numbers: en-IN where applicable.

DISPLAY MODE
- Remove PartnerUiModeToggle from Settings, More, home footer.
- Remove “Shop Floor” / “Advanced” choice copy.
- Keep store migration from P1; optionally simplify store to single-shell (or leave dead shop_floor enum unused — document).
- Settings page: replace mode section with short English help: “Orders, customers, and printing live under Customers & Orders” (wording per spec).

IMAGES
- Ensure settings / empty states still picture-led where mode UI was removed (don’t leave a blank hole).

TESTS
- Update partner-ui-mode-toggle tests (component may be deleted or unused).
- Fix any E2E that toggles Shop Floor.

Acceptance:
- Settings has no Shop Floor display mode control.
- Reachable partner ops UI is English-first.
- Voice does not prefer Hindi.
- logs + current-status note: Shop Floor mode retired from UI.
```

---

## Prompt 7 — Floor route migration & dead chrome cleanup

```
Act as frontend-architect.

Implement Slice P7 of docs/features/partner-customers-orders-hub.md:
Migrate or redirect Shop Floor routes so partners aren’t trapped in a second shell; delete dead mode chrome.

Read:
- docs/features/partner-customers-orders-hub.md (redirect / fate table)
- frontend/app/(partner)/partner/floor/**
- frontend/features/partner-shop-floor/**
- partner-shell.tsx ShopFloorSidebar / ShopFloorBottomNav
- PartnerHomeView mode branching

Requirements:

ROUTES (follow spec exactly)
- /partner home: always Owner/Advanced overview (no ShopFloorHomeView branch).
- /partner/floor/new, /today, /ready, /more, /print: either redirect to hub equivalents OR remain as advanced-shell pages without floor chrome.
- Ensure print + cloth wall still reachable from hub (deep links).
- Remove ShopFloor bottom nav / sidebar from ever mounting.

CLEANUP
- Delete or quarantine unused mode toggle, floor home tiles, coach marks that only served mode onboarding — only if unused.
- Do not delete print components or Cloth Wall.
- Update imports; no orphaned “shop_floor” UI branches in PartnerShell / PartnerHomeView.

DOCS
- Mark partner-shop-floor.md: Display mode retired; modules reused by Customers & Orders Hub.
- Cross-link partner-customers-orders-hub.md.

Acceptance:
- Visiting /partner never shows 4-tile Hinglish Shop Floor home.
- Print tags/invoice still work.
- No ShopFloorBottomNav in DOM on any partner page.
- Playwright partner smoke updated; unit tests green.
- logs/feature-progress.md + current-status.md updated.
```

---

## Prompt 8 — Polish, a11y, QA, docs

```
Act as frontend-architect + qa-engineer + documentation-writer.

Implement Slice P8 of docs/features/partner-customers-orders-hub.md: production harden.

Read:
- docs/features/partner-customers-orders-hub.md
- .cursor/rules/10-accessibility.md, 13-ui-ux.md, 02-code-quality.md, 16-cursor-operating-rules.md
- Existing Playwright: frontend/tests/e2e/partner-journey.spec.ts, orders-hub partner specs
- docs/qa/partner-admin-pagination-matrix.md (don’t regress page_size 10)

Requirements:

POLISH
- Motion: 2–3 calm transitions (chip select, success panel) — no noisy animation.
- Loading / error / empty consistency.
- Focus management on tab/chip changes.
- Dark mode + 375px + desktop.

A11Y
- WCAG 2.1 AA: contrast, labels, keyboard chips/filters, print buttons named.
- Status not by color alone.

QA MATRIX (add docs/qa/partner-customers-orders-hub-matrix.md)
Cover:
1. Nav: single hub item; old URLs redirect
2. Find customer → new order → print tags
3. Ready order → print bill/invoice
4. Chips: Needs action / Walk-in / Ready today
5. Directory → customer orders
6. Settings: no Shop Floor mode
7. English UI smoke
8. Pagination still default 10
9. Mobile 375px critical path

PLAYWRIGHT
- Implement critical path smoke (partner role) for matrix rows that are automatable.
- Fix flakes; no skipped critical tests without reason.

DOCS / LOGS
- Feature spec status → review or done
- logs/implementation-log.md, logs/feature-progress.md
- .cursor/context/current-status.md
- .cursor/prompts/README.md already lists this pack — confirm link text accurate

Acceptance:
- Matrix documented; critical Playwright green.
- Lint + typecheck pass for touched packages.
- No Shop Floor mode in UI; hub is English-first Customers & Orders workplace.
```

---

## QA checklist (after Prompt 8)

Manual on a real partner account (or seed):

- [ ] Sidebar: one Customers & Orders entry (no separate New Order / Walk-in / Customers)
- [ ] Settings: **no** Shop Floor / Display mode toggle
- [ ] UI language: English primary on hub, intake, print, settings
- [ ] Find phone → history → New order → success → **Print tags**
- [ ] Advance/ready → **Print bill / GST invoice**
- [ ] Chips filter Ready today / Walk-in / Needs action
- [ ] Directory customer → New order prefilled
- [ ] `/partner/walk-in-orders` and `/partner/new-order` bookmarks still work (redirect)
- [ ] `/partner` is owner overview — **not** 4-tile Shop Floor
- [ ] Print center search by tracking / last-4 still works
- [ ] 375px: FAB/chips tappable; no horizontal trap
- [ ] Dark mode readable
- [ ] Pagination default 10 still

---

## Suggested chat titles

| Prompt | Chat title |
| ------ | ---------- |
| 0 | Spec: Customers & Orders Hub |
| 1 | Nav + retire Shop Floor default |
| 2 | Hub chips filters search |
| 3 | Merge New Order + Walk-in |
| 4 | Customer-centric desk/directory |
| 5 | Print tags + invoice lifecycle |
| 6 | English-first + remove mode toggle |
| 7 | Floor route migration cleanup |
| 8 | QA polish Playwright docs |

---

## Notes for the human product owner

- **Shop Floor Mode** was built for low-literacy Hinglish counters. Your partners asked for one English workplace instead — this pack **reuses** Cloth Wall + print, but **kills the second OS**.
- **Orders Hub** already merged Desk / Requests / Directory; this pack finishes the job by merging **intake + customers nav + print lifecycle**.
- Run **Prompt 0 alone first**, review the spec IA table, then continue 1→8. If Prompt 0 proposes keeping Logistics separate (recommended), don’t merge delivery boards into Orders.
