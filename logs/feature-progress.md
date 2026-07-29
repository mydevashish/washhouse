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
- Laundry discovery: **shipped** (API + FE list + detail; search/filter/sort on `/discover` PartnersSection 2026-07-28; list/search expose optional lat/lng for client Near me 2026-07-29; storefront catalogue chips/photos/search 2026-07-29; `/stores` gallery motion/perf polish 2026-07-29)
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
- Marketing homepage v2: **shipped** — hero carousel, glass UI, stats/testimonials APIs, Playwright smoke (`docs/features/marketing-homepage.md`); Request brochure → `/contact?subject=franchise#contact-form` (2026-07-17); Franchise teaser stacking fix — content wrapper `relative` so glass panel is visible over photo (2026-07-17); dedicated Pricing page `/pricing` with WashHouse category “from ₹” rate cards (photo + peg tags; visual uniqueness pass 2026-07-17 — denser tickets, women/kids ambient depth; `docs/features/marketing-pricing.md`); More Services card → `/services` (View services); Book Now → shared pickup dialog (`?book=1` / `BookNowDialog`, POST contact `order-help`) (2026-07-17); `/stores` slim directory (name + city, no compare UX) (2026-07-17); `/stores` Near me + sticky Stores quick-pick Drawer (2026-07-29); sticky/final CTAs respect online vs offline booking mode (Book nearest vs WhatsApp-primary) (2026-07-29); FadeIn force-visible + no FadeInItem around home CTAs (blank-band / WCAG 2.4.7 fix) (2026-07-29); desktop navbar Stores nav link + CTA → `/stores` (2026-07-29)
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
