# Partner Owner Command Center — Cursor prompt pack

> Paste prompts **in order** (0 → 7). Each prompt is one focused Cursor Agent session.  
> Goal: turn Advanced Partner Mode into an **easy, beautiful, image-led business cockpit** for laundry owners — staff, orders, delivery, customers, revenue, platform %, growth — without breaking Shop Floor Mode.

## How to use

1. Open a **new Agent chat** per prompt.
2. Copy the full block under that prompt (from `Act as…` to the end of acceptance criteria).
3. Attach relevant files if Cursor asks (the prompt lists them).
4. Do **not** skip Prompt 0 — it locks scope so later prompts do not invent parallel UIs.
5. After Prompt 7, run the QA checklist at the bottom.

## Product north star (read before any prompt)

| Persona | Needs |
| ------- | ----- |
| **Laundry owner** (Advanced Mode) | See money, people, logistics, customers in one calm cockpit; act in 1–2 taps |
| **Counter staff** (Shop Floor Mode) | Keep 4 big tiles — **do not redesign Shop Floor in this pack** |

**Design thesis:** One composition per screen · picture-first reference art · agentic “what should I do next?” · real metrics only · India laundry (INR, GST, commission, Hinglish-friendly microcopy where helpful).

**Already exists — enhance, don’t duplicate:**

- Routes: `/partner`, `/partner/orders`, `/partner/staff`, `/partner/deliveries`, `/partner/pickups`, `/partner/customers` (hub alias), `/partner/revenue`, `/partner/settlements`, `/partner/reports`, `/partner/floor/*`
- Specs: `docs/features/partner-dashboard.md`, `partner-shop-floor.md`, `partner-staff.md`, `commission.md`, `orders-hub.md`
- APIs: `GET /partner/analytics/summary`, settlements, staff CRUD, orders hub
- Shell/nav: `frontend/features/partner/lib/partner-nav.ts`, `partner-shell.tsx`
- Catalog photos: `frontend/public/catalog/` + `CatalogGarmentThumb`

---

## Prompt 0 — Spec & information architecture (PM + UX)

```
Act as product-manager + ui-ux-designer for DLM WashHouse Partner Advanced Mode.

Read first:
- AGENTS.md, .cursor/rules/00-project-overview.md, 01-architecture.md, 13-ui-ux.md, 16-cursor-operating-rules.md
- .cursor/context/current-status.md
- docs/features/partner-dashboard.md
- docs/features/partner-shop-floor.md (NON-GOAL: do not change Shop Floor 4-tile home)
- docs/features/partner-staff.md, commission.md, orders-hub.md
- frontend/features/partner/lib/partner-nav.ts
- frontend/features/partner/views/partner-overview-view.tsx
- frontend/features/partner/views/partner-revenue-view.tsx

Outcome:
Create a feature spec that transforms Advanced Partner Mode into an **Owner Command Center** — calm, aesthetic, agentic, picture-led — so a laundry owner can maintain staff, orders, delivery, customers, and money (gross / platform % / net / growth) without feeling overwhelmed by a huge sidebar.

Write: docs/features/partner-owner-command-center.md (from .cursor/templates/feature-spec.md)

Must define:

1) Problem & personas (owner vs floor staff). Explicit: Shop Floor stays; Advanced Mode becomes Owner Command Center.

2) Information architecture — collapse today’s dense nav into **5 owner pillars** (keep routes via redirects/aliases where needed):
   - **Today** → `/partner` (agentic home)
   - **Orders** → `/partner/orders` (Orders Hub — keep)
   - **Logistics** → unified Pickup + Delivery experience (can keep `/partner/pickups` + `/partner/deliveries` under one visual hub)
   - **People** → Customers + Staff (two tabs or sibling pages under one mental model)
   - **Money** → Revenue + Commission transparency + Settlements + growth (unify `/partner/revenue`, `/partner/settlements`, light Reports)

3) Agentic home concept for `/partner` (Advanced):
   - “Owner brief” strip: 3–5 prioritized next actions with icons/images (e.g. Accept 4 orders, 2 deliveries due, Staff offline, Settlement ready)
   - Money snapshot: Today gross · Platform cut % · Your net · WoW/MoM growth sparklines
   - Visual module map: large illustrated cards (Orders / Logistics / People / Money / Shop) — not a KPI wall of 8 equal cards
   - Keep existing real analytics; no invented numbers

4) Visual system for reference images:
   - Prefer existing catalog + partner UI illustrations under frontend/public/ (propose paths)
   - Every empty state + every pillar card gets a concrete illustration or photo reference
   - Status language with color + icon + short label (not color alone)
   - Follow tokens.css; avoid purple-gradient AI slop, cream-serif terracotta cliché, newspaper layouts
   - Premium India laundry aesthetic: fresh, clean, trustworthy, mobile-first

5) Money model (must be crystal clear for partners):
   - Gross revenue (delivered / paid rules — use existing order truth)
   - Platform commission % (laundry.commission_rate or platform default — see commission.md)
   - Platform commission ₹
   - Partner net (gross − commission − any known fees already in settlements)
   - Growth: vs yesterday, vs last week, vs last month (% + absolute ₹)
   - Split walk-in vs doorstep if data allows

6) Non-goals:
   - No Shop Floor redesign
   - No Admin rebuild
   - No fake demo metrics
   - No new payment provider
   - No rewriting Orders Hub tabs unless required for People pillar

7) Phased slices (map to Prompts 1–7):
   P1 IA + nav + visual language
   P2 Agentic Overview home
   P3 Money intelligence API + UI
   P4 Logistics board (image-led)
   P5 People — Customers CRM polish
   P6 People — Staff roster + assign to runs
   P7 Polish, motion, empty states, a11y, docs

8) Acceptance criteria + success metrics (e.g. owner finds commission % in < 5s; completes “check today” in < 30s)

9) Update docs/features/README.md + logs/feature-progress.md + .cursor/context/current-status.md briefly

Do NOT implement UI yet. Spec only. Be concrete with routes, components, and API gaps.
```

---

## Prompt 1 — Nav IA + visual language foundation

```
Act as frontend-architect + ui-ux-designer.

Implement Slice P1 of docs/features/partner-owner-command-center.md ONLY:
1) Partner Advanced Mode navigation regrouped into the 5 owner pillars (Today / Orders / Logistics / People / Money) + keep Shop / System secondary as needed.
2) Shared visual primitives for the Owner Command Center.

Read:
- docs/features/partner-owner-command-center.md
- frontend/features/partner/lib/partner-nav.ts
- frontend/components/layout/partner-shell.tsx
- frontend/features/partner/components/* (kpi, panel, content)
- frontend/styles/tokens.css
- .cursor/rules/13-ui-ux.md, 19-responsive-design.md, 10-accessibility.md

Requirements:

NAV
- Update PARTNER_NAV_SECTIONS so owners scan fewer sections; labels feel human (“Money”, “People”, “Logistics”) not enterprise.
- Preserve all existing hrefs (Orders Hub aliases, floor routes, settings). Do not break Shop Floor mode toggle / floor routes.
- Active states + badges still work (orders, pickups, bookingRequests, notifications).
- Mobile drawer stays usable; no denser than today.

VISUAL PRIMITIVES (new under frontend/features/partner/components/owner/ or similar)
- OwnerPillarCard — large illustrated entry card (image/illustration + title + one-line subtitle + optional badge count + href). Picture-first; not a tiny icon KPI.
- OwnerActionChip / OwnerBriefItem — next-action row with icon/image, title, why it matters, CTA.
- OwnerMoneyStat — amount + optional % delta + calm caption (for reuse on overview + money pages).
- OwnerEmptyState — illustration slot + Hinglish-friendly title + one CTA (reuse EmptyState patterns).
- Optional: OwnerSectionHeader with short “what this page is for” line.

IMAGES
- Wire placeholder/real assets from frontend/public/ (catalog or new partner-ops/*.webp if you add 4–6 simple illustrations). Prefer next/image. No heavy Lottie. Lazy where below fold.
- If adding illustrations, keep file sizes small; document filenames in the feature spec.

CONSTRAINTS
- Do not rebuild overview content yet (that’s Prompt 2).
- Do not invent analytics APIs yet.
- Match existing PartnerContent / PartnerPageHeader patterns.
- Dark mode + 375px.

Done when:
- Nav reflects pillars
- Primitives exist and are demoed lightly on `/partner` OR a Story-less temporary usage in overview without full agentic redesign
- Spec acceptance for P1 checked
- Log chunk in logs/implementation-log.md
```

---

## Prompt 2 — Agentic Overview home (Advanced `/partner`)

```
Act as frontend-architect + ui-ux-designer. Creativity unlocked — but stay on-brand and practical.

Rebuild Advanced Mode `/partner` overview into an **Owner Command Center home** per docs/features/partner-owner-command-center.md.

Read:
- docs/features/partner-owner-command-center.md
- frontend/features/partner/views/partner-overview-view.tsx
- partner-action-center, partner-kpi-card, partner-ops-footer-strip, partner-recent-orders-table
- hooks: usePartnerAnalytics, usePartnerOrders, operations dashboard
- Shop Floor: ensure mode=shop_floor still renders floor home — DO NOT break it

Design composition (first viewport = ONE composition, not a dashboard wall):

1) **Owner greeting + laundry name** + primary CTAs: New Order | Find customer | Open logistics

2) **Agentic “Do next” brief** (max 5 items):
   - Derive from real data: needs-action orders, overdue pickups/deliveries, booking requests, low staff coverage if available, settlement pending if available
   - Each item: small reference image/icon, plain-language title, count, deep-link
   - If nothing urgent: calm success state with illustration (“Floor is clear — nice work”)

3) **Money pulse** (compact, beautiful — not 8 equal KPI cards):
   - Today gross ₹
   - Platform % (if API not ready yet, show “—” or existing field; leave hook for Prompt 3)
   - Your estimated net ₹
   - Growth chip (WoW or vs yesterday) when data exists
   - Link to Money pillar

4) **Pillar map** — 4 large OwnerPillarCards with images:
   Orders · Logistics · People · Money
   Optional 5th Shop (storefront/pricing) below fold

5) **Today’s floor strip** — ready / in process / deliveries (reuse derive helpers) + recent orders table (compact)

6) Trust score / reviews can stay below fold if already present

Constraints:
- Dynamic-import charts only if still needed; prefer fewer charts on home
- Real data only; loading skeletons; QueryErrorState
- Performance: lean for low-end Android; no 3D
- Motion: 2–3 subtle intentional motions (brief appear / action highlight); respect prefers-reduced-motion
- Preserve partner-ops-footer-strip if still useful, or merge into brief

Acceptance:
- Owner understands “what to do” + “how money looks today” in < 10 seconds
- Looks cooler/more aesthetic than current KPI grid, without clutter
- Shop Floor mode unaffected
- Update partner-dashboard.md + feature spec status for P2
```

---

## Prompt 3 — Money intelligence (API + Revenue UI)

```
Act as backend-architect + frontend-architect + business-analyst.

Implement Money intelligence for Partner Owner Command Center (Slice P3).

Read:
- docs/features/partner-owner-command-center.md
- docs/features/commission.md
- docs/features/partner-dashboard.md
- backend partner analytics_summary + settlement services
- frontend partner-revenue-view.tsx, partner-settlements-view.tsx, partner-reports-view.tsx
- laundry.commission_rate / order commission snapshot fields

GOAL
Partners must instantly see:
- How much they earned (gross)
- What % goes to the platform
- How much ₹ is platform commission
- What they keep (net)
- Whether revenue is growing (vs prior period)

BACKEND
- Extend GET /api/v1/partner/analytics/summary (preferred) OR add GET /api/v1/partner/analytics/money
  Include at minimum:
  - revenue_today_inr, revenue_week_inr, revenue_month_inr (existing)
  - revenue_yesterday_inr, revenue_prev_week_inr, revenue_prev_month_inr (for growth)
  - growth_today_pct, growth_week_pct, growth_month_pct (null-safe)
  - effective_commission_rate (fraction or percent — document clearly)
  - commission_today_inr / week / month (from snapshotted order commission where possible)
  - partner_net_today_inr / week / month (= gross − commission for the same basis)
  - optional: walk_in vs doorstep gross split
- Use REAL order data + laundry commission rules. No fake multipliers.
- Tests: unit/API for rates, growth math, empty laundry, IDOR partner scope
- OpenAPI descriptions clear for FE

FRONTEND — unify Money experience on `/partner/revenue` (and surface on Overview money pulse):
- Hero money composition:
  - Big “Your net today”
  - Secondary: Gross | Platform cut (X%) | Commission ₹
  - Growth badges with ↑↓ and % (accessible, not color-only)
- Period toggle: Today / Week / Month
- Simple growth chart (dynamic import) — net or gross over periods you can support; keep honest
- Commission explainer card with plain language:
  “Platform keeps ~10% of delivered order value. Your rate: X%. Settlements pay your net.”
  Link to Settlements
- Keep service breakdown if useful; make it visual (bars + optional garment thumbs when service maps to catalog)
- Empty states with illustrations

CONSTRAINTS
- Don’t change admin commission config APIs
- Don’t invent subscription fees unless already in schema
- Settlements page can get a thin “how this ties to net” banner — no full rewrite

Docs: update feature spec, schema notes if needed, partner-dashboard API table.
Log implementation.
```

---

## Prompt 4 — Logistics board (Pickups + Deliveries, image-led)

```
Act as frontend-architect + ui-ux-designer.

Implement Logistics pillar (Slice P4): make Pickup + Delivery effortless and visual.

Read:
- docs/features/partner-owner-command-center.md
- partner-pickups-view.tsx, partner-deliveries-view.tsx, partner-operations-view.tsx
- partner-derive helpers, order status maps
- staff APIs if assignment exists

UX
Create a unified Logistics hub feel (either:
  A) New `/partner/logistics` with tabs Pickups | Deliveries | Routes today, redirecting old paths, OR
  B) Shared layout component used by both existing pages)
Prefer B if faster; A if cleaner IA. Update nav accordingly.

Each run card should be scannable in 2 seconds:
- Status badge (color + icon + label)
- Customer name + phone (tap to call on mobile)
- Time window / SLA hint if available
- Address short line
- Order token / order id
- Optional staff assignee chip
- Primary action: Advance status / Assign staff / Open order
- Soft reference illustration by status family (pickup vs out-for-delivery vs delivered) — reuse public assets

Boards:
- Needs pickup
- Out for delivery
- Done today
Filters: search phone/name/token; staff filter if data exists

Assignment (if backend supports; else UI stub with clear TODO only if API missing — prefer wiring real staff list):
- Assign pickup_only / delivery_only / full_access staff to a run

Constraints:
- No map SDK required in P4 (optional static “route list” order by area/pincode if field exists)
- Mobile-first big tap targets
- Reuse order detail for deep work
- Don’t break Shop Floor ready/today boards

Acceptance: partner can clear morning pickups + afternoon deliveries from one mental place; page feels lighter than current tables.
```

---

## Prompt 5 — People › Customers (CRM that feels human)

```
Act as frontend-architect + ui-ux-designer.

Implement People › Customers polish (Slice P5) inside Orders Hub directory/desk patterns — do not resurrect a competing /partner/customers product.

Read:
- docs/features/partner-owner-command-center.md
- docs/features/orders-hub.md, customer-desk.md
- partner orders hub features (admin|partner orders-hub)
- partner-customers-view.tsx (legacy)

Goals:
- Customer directory cards that feel human: avatar initials or illustration, name, phone, last order, lifetime ₹ (if API allows), order count, “Regular / New / At risk” soft tags derived from real dates/counts
- Quick actions: Call · WhatsApp link (wa.me) · New order prefill · Open history (desk)
- Insights strip: new customers this week, repeat rate if computable, top customers by revenue (top 5)
- Picture-led empty state (“No customers yet — first walk-in starts your book”)
- Keep Desk tab as the operational find/create path; Directory becomes the relationship view

If analytics lack LTV fields, compute cautiously from partner-visible orders only or extend a thin partner customers summary endpoint (document + test). Prefer extending existing partner analytics/customers endpoints over new sprawl.

Constraints:
- No parallel nav item that splits customers away from Orders Hub unless spec mandates People landing with tabs
- IDOR-safe; partner sees only own laundry customers
- a11y: keyboard, contrast, don’t rely on color alone for tags

Update docs + implementation log.
```

---

## Prompt 6 — People › Staff (roster + floor coverage)

```
Act as frontend-architect + backend-architect (only if API gaps).

Implement People › Staff as a beautiful, usable roster (Slice P6).

Read:
- docs/features/partner-staff.md
- docs/features/partner-owner-command-center.md
- partner-staff-view.tsx
- services/staff-management.ts
- Logistics assignment from P4

UX upgrade (keep CRUD capabilities):
1) Staff gallery/roster: card per person with role illustration (pickup / delivery / inventory / full_access), status pill (Active / Suspended / Offline), schedule summary
2) Coverage today: “Who can run pickups?” “Who can deliver?” — visual checklist
3) Add/Edit staff in a calm drawer/sheet (not a dense form wall); role picker with image + one-line “what they can do”
4) From staff card: view activity, reset password, suspend — keep existing mutations
5) Deep link from Logistics “Assign” into pre-filtered staff by role
6) Empty state illustration + CTA “Add your first helper”

Backend only if needed:
- Ensure list/dashboard endpoints return fields UI needs (role, active, suspended, schedule)
- Optional: on-shift flag — only if trivial; else derive from schedule locally

Constraints:
- Security: partner-scoped; no privilege escalation
- Don’t break existing staff tests; extend them
- Mobile friendly

Docs: mark partner-staff acceptance progress; link from Owner Command Center spec.
```

---

## Prompt 7 — Aesthetic polish, motion, images, QA

```
Act as ui-ux-designer + accessibility-reviewer + performance-optimizer + qa-engineer.

Final polish pass for Partner Owner Command Center (Slice P7).

Read:
- docs/features/partner-owner-command-center.md
- All owner/* components and updated views from P1–P6
- docs/qa/ patterns (see partner-shop-floor-usability.md for checklist style)
- .cursor/rules/10-accessibility.md, 13-ui-ux.md, 19-responsive-design.md

Do:

1) VISUAL AUDIT
- First viewport of `/partner` (Advanced) reads as one composition
- Pillar cards + empty states all have real images/illustrations (no broken next/image)
- Consistent spacing, type scale, token colors; dark mode checked
- Remove leftover dense “enterprise admin” chrome where Owner CC should feel calmer

2) MICROCOPY
- Confident, warm, short; explain commission in human words
- Optional Hinglish subtitles on pillar cards (like Shop Floor) without cluttering Advanced Mode

3) MOTION
- 2–3 intentional motions sitewide in this surface (brief, staggered pillar enter; brief highlight on Do-next item)
- Respect prefers-reduced-motion

4) A11Y
- axe clean on overview, revenue, logistics, staff
- Focus order, tap targets, status not color-only
- Charts have text alternatives

5) PERF
- Dashboard still aims < 2s on mid Android / 4G mindset: dynamic charts, image sizes, no layout thrash
- Verify Shop Floor mode still loads lean

6) TESTS
- Playwright smoke: Advanced overview shows money pulse + pillar links; revenue shows commission %; logistics tab/filter; staff add or list
- Fix flaky selectors

7) DOCS
- Feature spec → shipped / in-progress accurate
- Update partner-dashboard.md “Phase 2 Owner Command Center”
- docs/qa/partner-owner-command-center.md checklist (owner 10-second comprehension)
- Update .cursor/context/current-status.md
- logs/feature-progress.md + implementation-log.md

Out of scope: new features, Shop Floor redesign, Admin.

Return a short ship summary: what changed, how to demo, remaining gaps.
```

---

## Bonus prompts (optional, after 0–7)

### Bonus A — Owner “Ask” assistant strip (lightweight, not a chatbot product)

```
Act as frontend-architect. Add a non-LLM “smart answers” strip on Advanced `/partner`:
chips like “Who delivers today?”, “What’s my platform %?”, “Orders needing action”.
Each chip scrolls/navigates to the real panel or expands a computed one-liner from existing query cache.
No OpenAI/Anthropic calls. Pure deterministic UX sugar. Keep subtle and aesthetic.
```

### Bonus B — Printable daily owner brief

```
Act as frontend-architect. Add “Print today’s brief” on Overview: HTML print view with net ₹, commission %, open pickups/deliveries, staff on coverage. Reuse print CSS patterns from partner floor print routes. Offline-friendly simple layout.
```

### Bonus C — Reference image generation guide

```
Act as ui-ux-designer. Create docs/design/partner-owner-illustrations.md listing 8 needed illustrations (Today calm, Orders stack, Scooter delivery, Staff team, Money net, Empty customers, Empty staff, Settlement).
For each: purpose, aspect ratio, style notes (WashHouse brand blue #2D7BFF + coral accent, clean laundry context, no purple neon), suggested filename under frontend/public/partner-ops/.
Do not generate binary images in git if tooling lacking — specify what to commission or which catalog shots to reuse temporarily.
```

---

## Suggested Cursor Agent settings

| Prompt | Mode | Notes |
| ------ | ---- | ----- |
| 0 | Agent | Spec only |
| 1–2 | Agent | FE-heavy |
| 3 | Agent | BE + FE; run pytest |
| 4–6 | Agent | FE (+ thin BE) |
| 7 | Agent | QA + polish |

Always remind the agent: **Shop Floor Mode is sacred; Owner Command Center = Advanced Mode only.**

---

## Manual demo script (after Prompt 7)

1. Login as partner → confirm mode Advanced.
2. `/partner`: see Do-next brief + money pulse + illustrated pillars in one calm first viewport.
3. Open Money: see platform % , commission ₹, net, growth.
4. Logistics: move a delivery / assign staff.
5. People: customer card → prefill new order; staff card → role clarity.
6. Toggle Shop Floor → still 4 tiles only.
7. Dark mode + phone width check.