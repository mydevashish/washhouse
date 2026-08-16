# Feature Progress Tracker

| Status        | Meaning                                             |
| ------------- | --------------------------------------------------- |
| `planned`     | Spec drafted, not started                           |
| `in-progress` | Active development                                  |
| `review`      | Code complete, in PR review                         |
| `staging`     | Merged to develop, on staging                       |
| `shipped`     | Live in production                                  |
| `paused`      | Blocked / on hold                                   |

---

## Phase 0 — Doc consolidation
- Status: **shipped**
- Deliverables: `docs/product/`, all `docs/features/*.md`, ADR-002, traceability, historical banners

## Phase 1 — Foundations
- Auth (register, login, refresh cookie, OTP, password reset, Google 501): **shipped**
- User profile + addresses: **shipped** (API + FE account)
- Base UI shell + dark mode: **shipped**
- CI / CD baseline: **in-progress** (frontend workflow fixed 2026-07-13; verify GitHub Actions green)

## Phase 2 — Customer MVP
- Laundry discovery: **shipped** (API + FE list + detail; search/filter/sort on `/discover` PartnersSection 2026-07-28; list/search expose optional lat/lng for client Near me 2026-07-29; storefront catalogue chips/photos/search 2026-07-29; `/stores` gallery motion/perf polish 2026-07-29; `/stores` phone/tablet sticky filter cluster + quick-pick-aligned card actions 2026-07-29; sticky quick-pick + directory `StoresCard` cover/name → `/discover/[id]` 2026-07-30; Near me radius/null-coords fix + demo lat/lng 2026-07-30; Near me clear/race + sticky status + Home teaser copy 2026-07-31; **temp:** marketing cover/name storefront nav disabled below `lg` 2026-07-31)
- Order placement: **shipped** (API + FE booking; GST fields on create)
- Order tracking: **shipped** (events API + FE polling; WS deferred; customer cancel within window 2026-07-28)
- Reviews: **shipped** (API + FE on delivered orders)
- Addresses: **shipped** (add/edit/delete on `/account` 2026-07-28)
- Riya customer journey E2E: **shipped** — `frontend/tests/e2e/customer-journey.spec.ts` + `playwright.customer.config.ts` (steps 1–6 + auth guard); 7/7 passed twice consecutively 2026-07-28 (`logs/playwright-customer-journey-1.txt`, `-2.txt`)
- Complaints: **shipped** as disputes (`FileDisputeForm` on order + `/disputes`) — not a separate complaints page

## Phase 3 — Partner MVP
- Partner registration: **shipped** (API)
- Partner dashboard / orders / scan: **shipped** (API + FE)
- Inventory / staff: **shipped** (API + FE staff list)
- Partner garment price list (platform catalog + per-laundry prices): **shipped** (Slices A–D + Slice 5) — DB, partner editor, public laundry price-list, marketplace-from + `/pricing` atelier peg tags, discovery compare “from ₹” on `/discover` cards (marketing `/stores` directory-only as of 2026-07-17) — `docs/features/partner-price-list.md` / `marketing-pricing.md`

## Phase 4 — Admin
- Approvals / dashboard: **shipped** (API + FE)
- Complaints / commission UI: **shipped** (commission FE; complaints as disputes)
- Admin marketplace chain automation: **shipped** (2026-07-28) — pytest `test_admin_marketplace_chain.py` (register→approve→order→accept→complete + 403 gates); Playwright `admin-marketplace-chain.spec.ts` (Anita UI surfaces + confirm dialogs + role deny)
- Approve/reject audit + confirmation dialogs: **shipped** (2026-07-28)

## Phase 5 — Payments + subscriptions
- Razorpay + COD: **shipped** (httpx provider when keys set + FE selection)
- Subscriptions: **in-progress** (plans table + list API) — **P2 launch gap** (do not block admin launch; see `docs/features/subscriptions.md`)
- Notifications WhatsApp: **shipped** (stub) — richer admin notification center still **P2** (`docs/features/notifications.md`)

## Phase 6 — Launch
- Loyalty / referrals: **shipped** (API skeleton) — **P2** full admin loyalty ops UI (`docs/features/loyalty-referrals.md`); do not fail launch on thin loyalty surfaces
- Landing hero: **shipped** (Framer Motion)
- Marketing homepage v2: **shipped** — hero carousel, glass UI, stats/testimonials APIs, Playwright smoke (`docs/features/marketing-homepage.md`); Request brochure → `/contact?subject=franchise#contact-form` (2026-07-17); Franchise teaser stacking fix — content wrapper `relative` so glass panel is visible over photo (2026-07-17); dedicated Pricing page `/pricing` with WashHouse category “from ₹” rate cards (photo + peg tags; visual uniqueness pass 2026-07-17 — denser tickets, women/kids ambient depth; `docs/features/marketing-pricing.md`); More Services card → `/services` (View services); Book Now → shared pickup dialog (`?book=1` / `BookNowDialog`, POST contact `order-help`) (2026-07-17); `/stores` slim directory (name + city, no compare UX) (2026-07-17); `/stores` Near me + sticky Stores quick-pick Drawer (2026-07-29); sticky quick-pick redesign — spotlight + compact rows, layout skeleton, geo subtitle (2026-07-29); sticky/final CTAs respect online vs offline booking mode (Book nearest vs WhatsApp-primary) (2026-07-29); offline sticky Book Pickup replaces Stores+Call (2026-07-30); **offline sticky Book Pickup** (replaces Stores+Call) + FAB Find stores (2026-07-30); FadeIn force-visible + no FadeInItem around home CTAs (blank-band / WCAG 2.4.7 fix) (2026-07-29); desktop navbar Stores nav link + CTA → `/stores` (2026-07-29); welcome 25% OFF overlay visible on banner for mobile (2026-07-31)
- Runbooks: **shipped**
- E2E smoke: **shipped**
- Pickup evidence system: **shipped** (`PICKUP_EVIDENCE.md`)
- Item inventory verification: **shipped** (`INVENTORY_VERIFICATION.md`)
- Delivery OTP verification: **shipped** (`DELIVERY_OTP.md`)

## Call-to-book launch (offline booking mode)
- Status: **shipped**
- Feature flags: `FEATURE_ONLINE_BOOKING=false` / `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=false`
- Guest browse + Call/WhatsApp (no login): **shipped** — QA `docs/testing/offline-booking-qa.md` §2A.1
- Partner walk-in order entry: **shipped** — §2A.2
- Walk-in status → WhatsApp notifications: **shipped** — §2A.3
- Automated: `pnpm test:e2e --project=offline-booking`, `pytest backend/tests/api/test_walk_in_orders.py`
- Doc supplements (root files locked in session): `docs/product/offline-booking-ui-map.md`, `docs/product/offline-booking-customer-experience.md`

## Booking Requests (Book Now → admin/partner inbox)
- Status: **in-progress** (Slice 1–6 polish + **convert-to-order shipped** 2026-08-04; expiry job next)
- Spec: `docs/features/booking-requests.md`
- API: `docs/api/endpoints/booking-requests.md` (**implemented** — public/admin/partner + suggest-laundries + convert→assisted)
- Schema: `booking_requests` + `booking_request_messages` + `booking_request_events` in `docs/database/schema.md`
- Ops: `docs/runbooks/booking-requests.md`
- Why: Elevate marketing Book Now (no laundry selected) out of generic `order-help` contact leads into a first-class phone-CRM workflow with SLA, assign/transfer, WhatsApp deep link, and partner scoped CRUD
- Done: data layer; services + HTTP APIs; Book Now FE → `POST /booking-requests` with confirmation `public_code` + WhatsApp/Call fallbacks; Jest mapping/form tests; Playwright happy path updated; **admin inbox** at `/admin/booking-requests`; **partner inbox** at `/partner/booking-requests`; **Slice 6** — create-dialog duplicate phone banner, `GET …/suggest-laundries` + assign chips, notify stubs (admin on public create; partner on assign), ops runbook; **convert** → Customer Desk assisted factory (`converted_order_id` + event); FE Convert dialog → desk
- Next: expiry job; Playwright partner inbox smoke
- Non-goals: customer OTP self-serve portal; geo auto-assign as hard requirement; franchise/contact merge; CSV export / public track page (not in feature doc)

## Customer Desk (assisted order lookup & create)
- Status: **review** (Slices 1–5 complete 2026-08-04)
- Spec: `docs/features/customer-desk.md`
- API: `docs/api/endpoints/customer-desk.md` (lookup under `/admin|partner/customers/*`; create under `/admin|partner/customer-desk/orders`)
- Schema: migration `20260804_0039` — `assisted_*` sources; `created_by_user_id`; guest address snapshot; `idempotency_key`; desk indexes (`customer_phone,created_at`, `laundry_id,customer_phone,created_at`); `user_id,created_at` from `0003`
- Why: Admin/Partner phone CRM + doorstep assisted create (walk-in remains separate).
- Personas: Admin (platform-wide), Partner (own laundry only). Primary key: `phone_e164`.
- Non-goals v1: order-for-friend; password/wallet; auto-assign laundry; SMS blast; **mass PII export**.
- Slices:
  - **Slice 1 — Lookup + history:** ✅
  - **Slice 2 — Assisted create API:** ✅ quote + create, guest snapshot, audit, Idempotency-Key, `FEATURE_ONLINE_BOOKING` bypass
  - **Slice 3 — Admin UI:** ✅
  - **Slice 4 — Partner UI:** ✅
  - **Slice 5 — Tests / a11y / docs:** ✅ pytest role/IDOR/assisted matrix; Playwright admin+partner; a11y tab keyboard + labels; security checklist; perf indexes
- Done: Full desk path admin+partner (lookup → history → assisted create → walk-in/BR handoffs); name/phone search results (max 20); FE order history Prev/Next pagination
- Next: ops runbook polish
- Synergy: booking-request convert calls the same assisted order factory (**shipped**)

## Orders Hub (hard-merge ops home)
- Status: **review** (2026-08-04); **Partner IA continues** in Customers & Orders Hub (2026-08-08)
- Spec: `docs/features/orders-hub.md` (Admin authoritative; Partner superseded for nav/intake by customers-orders hub)
- Why: Non-technical Admin/Partner need one Orders home — hard-merge collapses Desk / BR / Customers|insights into hub tabs under a single sidebar **Orders**.
- Done: Spec; soft-merge Today panel; Prompt 1 nav; Prompt 2 tabs + redirects; **Admin + Partner hub shells** (`features/admin|partner/orders-hub`) with header/tab requests badge, today strip + queue, desk/BR/directory reuse (no forks); Jest + Playwright hub smoke (admin + partner @ 375px, partner search → place-order)
- Next: Admin — mark done after staging QA; Partner — evolve via `partner-customers-orders-hub.md`
- Non-goals: new backend CRUD; merging Laundries (admin)

## Partner Customers & Orders Hub — Visual polish
- Status: **review** (Prompt 0–5 implemented 2026-08-08; hub test copy aligned)
- Spec: `docs/features/partner-customers-orders-hub-ui-polish.md`
- Prompts: `.cursor/prompts/partner-customers-orders-hub-ui-polish.md`
- Why: Hub is feature-complete but visually heavy — oversized controls, loose filters, stacked panels, washed pillar text
- Decisions: Split pillars (pattern C); slim chips/filters `h-8`/`h-9`; collapse Waiting to link; compact find strip
- Done: Spec + header/chips/filters/recent/scope; today declutter; OwnerPillarCard split; status badges; order/print density; tabs/empty; tests + QA section
- Next: Staging visual QA (light/dark 375/1280); mark polish **review/done**
- Non-goals: IA/API changes; Logistics/Money/Staff redesign

## Partner Customers & Orders Hub
- Status: **review** (P1–P8 complete — 2026-08-08)
- Spec: `docs/features/partner-customers-orders-hub.md`
- Prompts: `.cursor/prompts/partner-customers-orders-hub.md`
- QA: `docs/qa/partner-customers-orders-hub-matrix.md`
- Why: One workplace for find customer → create → print tags → ready → print bill; retire Shop Floor display mode; English-first; image-led chips
- IA: Sidebar **Customers & Orders** → `/partner/orders`; keep tabs `orders|desk|requests|directory`; FAB/chips for intake; Logistics/Money/Staff stay separate
- Mode: Force Advanced shell; migrate `dlm.partner_ui_mode=shop_floor` → `advanced`; toggle UI removed (P6); keep print + Cloth Wall modules
- Done (P1): Nav collapsed (no New Order / Walk-in / People › Customers); default `advanced` + hydrate migrate; hub aliases for intake/print; unit tests
- Done (P2): Shortcut chips + filter bar + `q` search; URL `?chip=&status=&source=&payment=&q=`; picture-led empty states; API `doorstep` / `unpaid` / `created_today`; RTL + Playwright smoke @ 375px
- Done (P3): Hub New order FAB/header sheet (Walk-in Cloth Wall · Doorstep assisted · Find customer); `/partner/walk-in-orders` → hub `chip=walk_in`; success panel Print tags + English copy; links/E2E updated
- Done (P4): Desk primary actions (walk-in / doorstep / call) + **View all orders** customer scope; directory **New order** ≤2 taps + View orders; recent-today strip (localStorage); Same as last when line items exist; phone keypad on desk
- Done (P5): Create success **Print tags** (walk-in / Cloth Wall / assisted / desk); Ready/delivered bill emphasis on detail + hub rows; Print center chip + header; reuse `PrintOrderActions`
- Done (P6): Removed Display mode toggle (Settings / More / home); picture-led Settings help → Customers & Orders; English-first floor copy; voice `en-IN` (never Hindi), default OFF; store forces advanced
- Done (P7): `/partner` always OCC overview; `floor/today|ready|more` redirects; deleted Shop Floor chrome (sidebar/bottom nav/home/boards); print + Cloth Wall kept; Playwright redirect smoke
- Done (P8): Calm motion (chips / empty / success); tab+chip focus + keyboard; loading/error consistency; a11y polish; QA matrix; Playwright P8 smoke (pagination 10, directory scope, settings English); docs/logs/status
- Next: Staging manual checklist (prompt pack QA); mark **done** after seed partner sign-off
- Non-goals: Admin hub redesign; Bluetooth printers; full i18n; breaking print APIs

## Partner Shop Floor Mode
- Status: **display mode retired** (hub P7/P8 — 2026-08-08; print + Cloth Wall shared modules)
- Spec: `docs/features/partner-shop-floor.md` (superseded for mode by customers-orders hub)
- Why (historical): Counter staff needed picture-first intake, color tokens (`R-42`), boards, and print — shipped as a second OS; now folded into one hub.
- Done: Feature spec; **P0 FE** shell; **P1 Cloth Wall**; **color tokens** + tags print; **thermal bill + A4 GST invoice**; **Today cards** + **Ready handoff** (historical); **usability checklist** + Playwright journey + Practice mode; **literacy polish**; **English copy + toggle removed (hub P6)**; **boards → hub chips + dead chrome deleted (hub P7)**; **hub P8 QA lock**
- Next: Optional QR image on tags; no further dual-mode work
- Non-goals (going forward): keeping dual display mode; Hindi-primary UI

## Partner WashHouse Ops Visual
- Status: **in-progress** (Prompt 1 primitives — 2026-08-09)
- Spec: `docs/features/partner-washhouse-ops-visual.md`
- Why: Unify WashHouse ops chrome (hero, KPI, status bars, create layout) from admin demo reference into partner routes without forked nav or fake metrics.
- Done (P1): `frontend/features/partner/components/ops-visual/*` (surface, section label, hero, KPI grid, status bars, trend strip); barrel `index.ts`; demo `/partner/ops-visual-demo`; smoke test `partner-ops-visual.test.tsx`
- Next: Prompt 2 — wire `/partner` first viewport (`partner-overview-view.tsx`)

## Partner Owner Command Center (Advanced Mode)
- Status: **in-progress** (P6 shipped 2026-08-08 — Prompt 6)
- Spec: `docs/features/partner-owner-command-center.md`
- Prompts: `.cursor/prompts/partner-owner-command-center.md` (P7 next)
- Why: Owners need a calm, picture-led cockpit — do-next brief, platform commission %, net ₹, growth, logistics + people — single shell (Shop Floor mode retired by Customers & Orders Hub).
- IA: 5 pillars — Today · Orders (→ Customers & Orders) · Logistics · People · Money — evolve nav with hub pack
- Done (P1–P3): Nav + agentic home + money intelligence
- Done (P4): `/partner/logistics` hub tabs (Needs pickup / Out for delivery / Done today); illustrated run cards; Call / Accept / Advance / Assign rider (operations assign APIs); search + rider filter; nav collapsed to single Logistics (legacy `/pickups` `/deliveries` keep working)
- Done (P5): Orders Hub directory → human CRM cards (LTV, soft tags, Call/WhatsApp/New order/History); insights strip (new this week, repeat rate, top 5); phone on customer-insights API; tab label **Customers**; Desk remains find/create
- Done (P6): Staff roster cards (role art, Active/Suspended/Offline, on-shift); coverage today (pickup/delivery); add/edit dialog with illustrated role picker; Logistics deep links `?capability=` / `?action=add`; activity filter per card
- Next: **Prompt 7** — Aesthetic polish, a11y, Playwright, docs ship (Operations already = Customers & Orders from hub P1)
- Non-goals: dual Shop Floor shell; Admin rebuild; fake metrics; map SDK; LLM chatbot

## Partner Laundry Dashboard — live data on current visual
- Status: **review** (Prompt 8 polish/tests 2026-08-14)
- Spec: `docs/features/partner-laundry-dashboard-live-data.md`
- Pack: `.cursor/prompts/partner-laundry-dashboard-live-data.md`
- Matrix: `docs/qa/partner-laundry-dashboard-live-data-matrix.md`
- Why: Keep franchise `/partner` layout; replace mock KPIs; fix dead View all / rows
- Done: Prompt 0–8 — full live dashboard; a11y + dark page shell; Jest + Playwright smoke
- Next: Manual QA light/dark @ 375/1280; merge when green

## Partner Dashboard — Tags section (find · verify · reprint)
- Status: **review** (Prompt 6 tests 2026-08-10)
- Spec: `docs/features/partner-dashboard-tags-section.md`
- Done: Prompts 0–6 — BE search confirm; shared `usePartnerTagsOrderSearch`; dashboard Tags UI + verify panel; wired on `/partner`; RTL + Playwright placement smoke
- Next: Manual QA matrix (375/1280, light/dark, live API search)

## Partner Ops Fixes + Compact UI
- Status: **review** (Prompts 0–12 complete 2026-08-16)
- Spec: `docs/features/partner-ops-fixes-compact-ui.md`
- Matrix: `docs/qa/partner-ops-fixes-compact-ui-matrix.md`
- Why: Stakeholder pass — 15 bugs/gaps (session 60m, 10-digit phone, create-order spend/qty, customers load/edit, picked up, garment catalog tools, storefront save, reports/revenue filters, orders paid/pending) + partner-wide compact density
- Scope: Prompts 0–12; density `h-9` / `rounded-xl` / `gap-3` / `p-3 sm:p-4`; 44px touch only on mobile create-order checkout CTA
- Done: Prompt 0 — spec + QA matrix; Prompt 1 — session 60m + `partner-phone-schema`; Prompt 2 — `partner-compact.ts` density sweep; Prompt 3 — total spent + decimal qty; Prompt 4 — customers load + edit sheet + PATCH API; Prompt 5 — picked-up gates + toast; Prompt 6 — catalog fix, template, select-all, all-visible; Prompt 7 — services workspace search + 10/page; Prompt 8 — storefront save; Prompt 9 — orders paid/pending columns; Prompt 10 — reports IST filters; Prompt 11 — revenue year + custom; Prompt 12 — QA matrix 25 Pass / 5 staging deferrals, Playwright `partner-ops-fixes.spec.ts`, Jest 255/255 green
- Next: Staging manual pass (M01 idle, M10 live pickup, M21–M22 CSV spot-check, M29 dark AA); merge when green
- Non-goals: Admin density; Shop Floor revival; new payment provider

## Partner garment service catalog (bulk Excel + multi-service rates)
- Status: **review** (Prompt 9 polish 2026-08-14)
- Spec: `docs/features/partner-garment-service-catalog.md`
- Pack: `.cursor/prompts/partner-garment-service-catalog-bulk.md`
- Matrix: `docs/qa/partner-garment-service-catalog-matrix.md`
- Done: Prompts 0–9 — DB/models, import service, API, FE catalog UI, bulk upload/delete, Cloth Wall bridge, lazy thumbnails, a11y, Playwright + Jest, pricing cross-link
- Next: Manual QA matrix (375/1280, light/dark); merge when green

## UI fix + backend pagination
- Status: **done** (Prompt 8 QA lock 2026-08-08)
- Spec/pack: `PAGINATION_STANDARD.md`, `.cursor/prompts/ui-fix-and-backend-pagination.md`, `docs/qa/ui-and-pagination-inventory.md`, `docs/qa/partner-admin-pagination-matrix.md`
- Why: Lists must stay fast — server-driven pages, default **10** rows
- Done: Prompt 0–8; matrix + admin laundry pagination tests + Playwright `partner-pagination.spec.ts`; DoD gate in `PAGINATION_STANDARD.md`
- Next: Dated deferrals only (public directory, notifications attention API, full CSV export, insights segment cap 500)
- Non-goals (this pack): Shop Floor redesign; discover client-concat; full CSV export job; dedicated notifications API

## Partner WashHouse Ops Visual
- Status: **review** (Prompt 6 shipped 2026-08-09)
- Spec: `docs/features/partner-washhouse-ops-visual.md`
- Matrix: `docs/qa/partner-washhouse-ops-visual-matrix.md`
- Done: Prompts 1–6 — `ops-visual` components; `/partner` hero + KPI + status + trend; new-order two-column; hub/desk snapshot cards; `partner-shell` admin-aligned nav (`rounded-2xl`, `bg-primary/10`), sidebar from `xl`, footer today line; dark-mode KPI/surface borders; catalog imagery standardization
- Next: Staging Lighthouse + optional PostHog KPI events; API tickets OPS-VIS-API-1..3
- Non-goals: duplicate admin demo sidebar; Mon–Sun fake trend; Shop Floor revival
