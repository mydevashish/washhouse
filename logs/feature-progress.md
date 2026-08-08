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
- Status: **review** (2026-08-04)
- Spec: `docs/features/orders-hub.md`
- Why: Non-technical Admin/Partner need one Orders home — hard-merge collapses Desk / BR / Customers|insights into hub tabs under a single sidebar **Orders**.
- Done: Spec; soft-merge Today panel; Prompt 1 nav; Prompt 2 tabs + redirects; **Admin + Partner hub shells** (`features/admin|partner/orders-hub`) with header/tab requests badge, today strip + queue, desk/BR/directory reuse (no forks); Jest + Playwright hub smoke (admin + partner @ 375px, partner search → place-order)
- Next: Mark done after joint Admin/Partner QA on staging
- Non-goals: new backend CRUD; merging Laundries or partner walk-in/pickups/deliveries/ops center

## Partner Shop Floor Mode
- Status: **in progress** (literacy polish shipped — 2026-08-08)
- Spec: `docs/features/partner-shop-floor.md`
- Why: Counter staff (non-tech / low literacy) need picture-first intake, color tokens (`R-42`), 4-status floor board, and print (thermal tags/bill + A4 GST) — separate from Advanced Mode nav.
- Done: Feature spec; **P0 FE** shell; **P1 Cloth Wall**; **color tokens** + tags print; **thermal bill + A4 GST invoice**; **Today cards** + **Ready Diya**; **usability checklist** + Playwright journey + Practice mode; **literacy polish** (calm success, optional voice, patterns, keypad, coach ×3, lazy tiles)
- Next: QR image; optional `GET /partner/floor/today`; laundry GSTIN on profile; run checklist with real partners
- Non-goals: replacing Advanced Mode; new catalog photo assets first; Admin Floor; Bluetooth SDK in this slice; offline fake Practice demo APIs

## Partner Owner Command Center (Advanced Mode)
- Status: **in-progress** (P6 shipped 2026-08-08 — Prompt 6)
- Spec: `docs/features/partner-owner-command-center.md`
- Prompts: `.cursor/prompts/partner-owner-command-center.md` (P7 next)
- Why: Owners need a calm, picture-led cockpit — do-next brief, platform commission %, net ₹, growth, logistics + people — without breaking Shop Floor.
- IA: 5 pillars — Today · Orders · Logistics · People · Money
- Done (P1–P3): Nav + agentic home + money intelligence
- Done (P4): `/partner/logistics` hub tabs (Needs pickup / Out for delivery / Done today); illustrated run cards; Call / Accept / Advance / Assign rider (operations assign APIs); search + rider filter; nav collapsed to single Logistics (legacy `/pickups` `/deliveries` keep working)
- Done (P5): Orders Hub directory → human CRM cards (LTV, soft tags, Call/WhatsApp/New order/History); insights strip (new this week, repeat rate, top 5); phone on customer-insights API; tab label **Customers**; Desk remains find/create
- Done (P6): Staff roster cards (role art, Active/Suspended/Offline, on-shift); coverage today (pickup/delivery); add/edit dialog with illustrated role picker; Logistics deep links `?capability=` / `?action=add`; activity filter per card
- Next: **Prompt 7** — Aesthetic polish, a11y, Playwright, docs ship
- Non-goals: Shop Floor redesign; Admin rebuild; fake metrics; map SDK; LLM chatbot

## UI fix + backend pagination
- Status: **done** (Prompt 8 QA lock 2026-08-08)
- Spec/pack: `PAGINATION_STANDARD.md`, `.cursor/prompts/ui-fix-and-backend-pagination.md`, `docs/qa/ui-and-pagination-inventory.md`, `docs/qa/partner-admin-pagination-matrix.md`
- Why: Lists must stay fast — server-driven pages, default **10** rows
- Done: Prompt 0–8; matrix + admin laundry pagination tests + Playwright `partner-pagination.spec.ts`; DoD gate in `PAGINATION_STANDARD.md`
- Next: Dated deferrals only (public directory, notifications attention API, full CSV export, insights segment cap 500)
- Non-goals (this pack): Shop Floor redesign; discover client-concat; full CSV export job; dedicated notifications API
