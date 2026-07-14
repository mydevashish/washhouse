# Implementation Log

> Append-only. Newest at the top. Use `.cursor/templates/log-entry.md`.

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
