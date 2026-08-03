# Feature: Marketing homepage v2

> Status: shipped  
> Last updated: 2026-08-03 (Book Now → booking request confirmation with public_code)  
> Route: `/`  
> Related: [offline-booking-whatsapp.md](offline-booking-whatsapp.md), [customer-discovery.md](customer-discovery.md)

## Problem

The public landing page must convert visitors into WhatsApp bookings or franchise inquiries while showcasing WashHouse trust signals, services, and partner network — optimized for mobile India, dark/light themes, and low-end Android devices.

## Scope

| In scope | Out of scope |
| -------- | ------------ |
| Hero carousel (4 slides), stats, special care, featured stores teaser | Page-level Services preview / Reviews on `/` (Services → `/services`; reviews → `/discover` testimonials + laundry detail) |
| Sticky navbar, mobile sticky CTA, floating FAB | Inline contact form on `/` (lives on `/contact`) |
| Marketing APIs: stats, testimonials, contact, franchise | Theme toggle in marketing navbar (uses system / app shell elsewhere) |
| Playwright smoke + a11y specs | Full Lighthouse CI gate on `/` (manual verify documented) |

## Section map

Render order from `frontend/features/marketing/home/marketing-homepage.tsx`:

| # | Section | Component | Data source | Notes |
| - | ------- | --------- | ----------- | ----- |
| Shell | Sticky navbar | `MarketingNavbar` | static nav config | Home, Services, Pricing, **Stores** (`/stores`), About, Franchise, Contact + desktop CTAs: Book Now (dialog) / **Stores** (`/stores`) / Call (icon `lg+`, label `xl+`); Staff shortens to “Staff” below `xl` |
| 1 | Hero + carousel | `MarketingHomeHero` → `HeroCarousel` | `hero-slides.ts` | 4 slides; Embla autoplay 5 s; glass promo badge |
| 1b | Hero mobile CTAs | `home-hero.tsx` | static | In-flow below carousel (`sm:hidden`): Book pickup (dialog), Become a partner |
| 2 | Stats band | `StatsBand` | `GET /marketing/stats` + fallback | 5 KPIs (customers, cities, pickup points, garments, rating) |
| 3 | Trust strip | `TrustStrip` | static | Verified / pickup / express badges |
| 4 | How it works | `HowItWorksSection` | static steps | 5-step process in glass card |
| 5 | Why choose us | `WhyChooseSection` | static | 6 benefit blocks |
| 6 | Special care | `SpecialCareSection` | `special-care-items.ts` | Delicate-item tiles → `/services#…`; wired in homepage |
| 7 | Delivery options | `DeliveryOptionsBand` | static | Equal Regular / Express cards; Popular corner ribbon; Book Now → pickup dialog |
| 8 | Featured stores | `FeaturedStoresTeaser` | `GET /laundries` (top 3) | Title **Verified WashHouse partners** (no GPS claim — Near me is on `/stores`); skeleton / error / empty never blank; CTA → `/stores` |
| 9 | Franchise teaser | `FranchiseTeaser` | static | Apply → `/franchise#apply`; brochure → `/brochures/washhouse-franchise.pdf` (`FRANCHISE_BROCHURE_PDF_HREF`, `download`). Content wrapper must be `relative` so glass panel sits above absolute photo/gradient (same as FranchiseHero / FinalCtaBand). |
| 10 | Partner login | `PartnerLoginStrip` | static | Partner / staff entry |
| 11 | App promo | `AppPromoSection` | static | Features + Coming Soon store badges first on mobile; compact phone mock (no tall empty gap) |
| 12 | Final CTA band | `FinalCtaBand` | `useMarketingBookingCtaMode` | **Online:** Book nearest (`/discover`) primary + WhatsApp/Call secondary; **Offline:** WhatsApp primary + Find stores (`/stores`) + Call; `data-marketing-bottom-cta` + `data-booking-mode` |
| Shell | Mobile sticky CTA | `MobileStickyCta` | same booking flag as `useOnlineBookingEnabled` | **Online:** Book nearest primary → `/discover`; WhatsApp/Call icon secondary. **Offline:** Book Pickup primary (`useBookNowStore` → `BookNowDialog`) + WhatsApp secondary; no Stores/Call on the bar; hides when final CTA in view |
| Shell | Floating FAB | `FloatingContactActions` | env contact config | WhatsApp + Find stores + Call; when sticky visible: hide WhatsApp always; hide Call only in **online** mode (offline sticky has no Call — FAB keeps Call + Find stores); full hide on final CTA / footer social |
| Shell | Book Now dialog | `BookNowDialog` | `POST /booking-requests` | Shared modal; `?book=1` deep link; name/phone/service/time → booking request; confirmation shows `public_code` + WhatsApp/Call |
| Shell | Footer | `MarketingFooter` | static groups | Company, Partner, Legal, Support links |

### Book Now dialog

Primary marketing **Book Now** / **Book pickup** CTAs open a shared Radix Dialog (`features/marketing/book-now/`) instead of navigating to `/stores`.

| Piece | Role |
| ----- | ---- |
| `useBookNowStore` | Zustand open/close + optional service pre-select |
| `BookNowCta` / `BookNowLink` | Buttons/links that open the dialog (no full-page nav) |
| `BookPickupForm` | RHF + Zod; maps fields via `mapBookPickupToBookingRequest()` → `submitBookingRequest()` → `POST /booking-requests` |
| `BookPickupSuccess` | Confirmation panel: `public_code` (e.g. `BR-K7M2QX`), what happens next, WhatsApp / Call fallbacks; **Done** closes dialog |
| `BookNowDialog` | Focus trap, Esc, `aria-labelledby`, mobile full-viewport, mounted in `MarketingShellOverlays`; title switches on confirmation |
| `/?book=1` | Deep link opens the same dialog (`source: deep_link`); closing strips the query param |
| `/stores` | Slim partner directory (name + city + Call Store / Message Store / Get Location) with optional **Near me** (browser geolocation → client haversine when list items include lat/lng); navbar **Stores** and FAB **Find stores** navigate here. No per-store price/rating compare UX; cover/name do not link to `/discover/[id]` (temp — see `StoreNavSurface`); contact buttons stay separate. |

Form fields map to booking-request API fields (`customer_name`, `phone`, `service_type`, `preferred_time_window`, `notes`, `source`). General `/contact` still uses `POST /marketing/contact`.

### Hero carousel slides

| Slide | Headline | Variant |
| ----- | -------- | ------- |
| 1 | CLEAN CLOTHES. HAPPY LIFE. | welcome (25% OFF on first 3 orders — glass overlay on banner image, all breakpoints; no coupon code) |
| 2 | EXPERT CARE FOR EVERY FABRIC | services |
| 3 | START YOUR OWN LAUNDRY BUSINESS | franchise — Apply → `/franchise#apply`; brochure → `/brochures/washhouse-franchise.pdf` |
| 4 | WE PICK. WE CLEAN. WE DELIVER. | delivery |

## API contracts

Base path: `/api/v1/marketing` — **public, no auth**.

All responses use the standard envelope: `{ "data": …, "meta": … }`.

### `POST /contact`

Submit a marketing contact form (used on `/contact`).

**Request body**

| Field | Type | Required | Rules |
| ----- | ---- | -------- | ----- |
| `name` | string | yes | 1–100 chars, trimmed |
| `phone` | string | yes | Indian mobile; normalized to `+91XXXXXXXXXX` |
| `email` | string | no | Valid email if provided |
| `subject` | enum | yes | `general`, `order-help`, `franchise`, `partnership`, `legal-privacy` |
| `message` | string | yes | 10–2000 chars, trimmed |

**Response `201`**

```json
{
  "data": {
    "id": "uuid",
    "status": "received"
  }
}
```

**Rate limits:** 3 submissions per phone per hour; 5 per IP per hour → `429`.

### `POST /franchise-inquiries`

Used on `/franchise#apply`.

**Request body**

| Field | Type | Required | Rules |
| ----- | ---- | -------- | ----- |
| `name` | string | yes | 1–100 chars |
| `phone` | string | yes | Indian mobile |
| `email` | string | yes | Valid email |
| `city` | string | yes | 1–100 chars |
| `investment_range` | enum | yes | `10-25`, `25-50`, `50-plus`, `unsure` |
| `message` | string | yes | 10–2000 chars |

**Response `201`:** same shape as contact (`id`, `status: "received"`).

**Rate limits:** 3 per IP per hour → `429`.

**Client error UX (contact + franchise):** Unreachable API shows actionable “couldn’t reach servers / email support” copy (not bare axios “Network Error”). Field validation and `429` map to toast + inline alert. Success toast + form reset unchanged. Local smoke requires backend on `NEXT_PUBLIC_API_URL` (default `http://localhost:8000/api/v1`).

### `GET /stats`

Public marketing KPIs for stats band.

**Response `200`**

```json
{
  "data": {
    "happy_customers": 5000,
    "cities_covered": 50,
    "pickup_points": 120,
    "garments_cleaned": 250000,
    "avg_review_rating": 4.7,
    "customer_satisfaction_percent": 96
  }
}
```

Frontend maps API values in `stats-fallback.ts`. While `PRELAUNCH_STATS` / `NEXT_PUBLIC_PRELAUNCH_STATS` is on (default), the stats band shows **Coming Soon** per KPI (labels unchanged) and skips the stats fetch. Flip the flag to `false` at launch to show live API numbers; on API error the fallback uses zeros rather than invented marketing counts.

### `GET /testimonials`

Curated testimonials for homepage carousel.

**Query params:** `limit` (1–20, default 6).

**Response `200`**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Priya S.",
      "location": "Bengaluru",
      "rating": 5,
      "text": "…",
      "avatarUrl": "https://…",
      "isFeatured": true
    }
  ]
}
```

Frontend falls back to static testimonials when API errors or returns empty.

## Imagery

Marketing heroes use dedicated **1920×1080** WebP assets; service preview cards use **4∶3 catalog tiles** (1200×900). Service preview tiles under `catalog/services/{wash-fold,wash-iron,premium-laundry,dry-clean,shoe-cleaning,curtain-cleaning,more-services}.webp` must be real WebP (not JPEG bytes with a `.webp` extension) — mislabeled masters caused `naturalWidth: 0` / blank optimizer failures.

| Piece | Path |
| ----- | ---- |
| **Marketing heroes** | `frontend/public/marketing/heroes/` (`welcome`, `services`, `franchise`, `delivery`) |
| **Hero registry** | `frontend/features/marketing/catalog/marketing-hero-images.ts` |
| **Catalog tiles** | `frontend/public/catalog/` (`men/`, `women/`, `kids/`, `winter/`, `household/`, `accessories/`, `services/`) |
| **Catalog registry** | `frontend/features/marketing/catalog/washhouse-catalog-photos.ts` |
| **Slug/name → key** | `frontend/features/marketing/catalog/resolve-catalog-photo-key.ts` (shared with `/pricing`) |

Regenerate marketing heroes: `python scripts/download-marketing-heroes.py` (sources in `scripts/marketing-hero-sources.json`). Catalog crop/manifest workflow: `frontend/public/catalog/README.md`.

### Image map (homepage)

| Surface | Asset | File |
| ------- | ----- | ---- |
| Hero slide 1 — welcome | Folded fresh laundry | `/marketing/heroes/welcome.webp` |
| Hero slide 2 — services | Professional facility | `/marketing/heroes/services.webp` |
| Hero slide 3 — franchise | Partner storefront | `/marketing/heroes/franchise.webp` |
| Hero slide 4 — delivery | Doorstep pickup / courier | `/marketing/heroes/delivery.webp` |
| Delivery slide phone mock | On-time delivery tile | `/catalog/services/on-time-delivery.webp` |
| Special care tiles | Catalog / specialty garments | `special-care-items.ts` → `/catalog/**` |
| Franchise teaser banner | Franchise hero (decorative) | `/marketing/heroes/franchise.webp` |
| Final CTA band | Services hero (decorative) | `/marketing/heroes/services.webp` |
| `/services` page hero | Welcome hero (decorative) | `/marketing/heroes/welcome.webp` |
| `/stores` page hero | Franchise hero (decorative) | `/marketing/heroes/franchise.webp` |

**LCP:** only the first carousel slide (`welcome`) gets `priority` / `fetchPriority="high"`; below-fold banners use `priority={false}` or lazy loading.

## Frontend integration

| Hook / client | File | Endpoint |
| ------------- | ---- | -------- |
| `useMarketingStats()` | `features/marketing/hooks/use-marketing.ts` | `GET /marketing/stats` |
| `useMarketingTestimonials()` | same | `GET /marketing/testimonials` |
| `useSubmitContact()` | same | `POST /marketing/contact` |
| `submitBookingRequest()` | `lib/api/booking-requests.ts` | `POST /booking-requests` (Book Now) |
| `getMarketingStats()` etc. | `lib/api/marketing.ts` | Zod-validated marketing API client |

## Automated tests

| Suite | Path | Coverage |
| ----- | ---- | -------- |
| Playwright smoke | `frontend/tests/e2e/marketing-homepage.spec.ts` | Load, carousel nav, contact validation, Book Now dialog + submit, **online** sticky Book nearest + final CTA |
| Playwright offline | `frontend/tests/e2e/offline-booking.spec.ts` (`offline-booking` project :3001) | Guest contact + **offline** sticky Book Pickup + WhatsApp + FAB Find stores + final CTA copy |
| Playwright a11y | `frontend/tests/e2e/marketing-a11y.spec.ts` | Axe on `/`, `/services`, `/pricing`, `/stores`, `/contact` |
| Playwright smoke (legacy) | `frontend/tests/e2e/smoke.spec.ts` | Homepage heading assertion |
| Jest unit | `frontend/features/marketing/home/home-hero.test.tsx` | Mobile CTA placement |
| Jest unit | `frontend/features/marketing/lib/use-marketing-booking-cta-mode.test.tsx` | Online/offline CTA mode + optimistic env while loading |
| Jest unit | `frontend/features/discover/marketplace/fade-in.test.tsx` | FadeIn force-visible fallback + reduced-motion plain markup |
| Jest unit | `frontend/features/marketing/book-now/map-book-pickup-to-request.test.ts` | Form → API field mapping + source resolution |
| Jest unit | `frontend/features/marketing/book-now/book-pickup-form.test.tsx` | Submit calls booking-requests + shows public_code confirmation |
| Backend API | `backend/tests/api/test_marketing.py` | Contact, franchise, stats, testimonials |

```bash
# From frontend/
npm run test:e2e -- marketing-homepage
npm run test:e2e -- marketing-a11y
npm test -- home-hero
npm test -- fade-in

# From backend/
pytest tests/api/test_marketing.py
```

### FadeIn visibility (2026-07-29)

Homepage bodies use `FadeIn` from `features/discover/marketplace/fade-in.tsx`. `FadeInItem` applies Framer `fadeUp.hidden` (`opacity: 0`) until the parent reaches `visible`.

**Bug:** Aggressive `whileInView` margins + late dynamic mounts could leave Delivery / Services / App promo / Featured stores / Franchise / Final CTA bodies stuck invisible (headers outside `FadeIn` still showed → blank bands).

**Fix:**
- Soft viewport (`margin: '0px 0px -10% 0px'`, `amount: 0.01`) + **700ms force-visible** fallback on `FadeIn` / `FadeInItem` / `FadeInStagger`
- `prefers-reduced-motion` → plain `div`s (full opacity)
- Home sections with focusable CTAs no longer wrap cards/links in `FadeInItem` (same WCAG 2.4.7 pattern as `partners-section.tsx`)

## Performance targets

Per `rules/11-performance.md` and `logs/performance-log.md`:

| Metric | Target | Status (2026-07-13 prod build, Lighthouse mobile) |
| ------ | ------ | -------------------------------------------------- |
| Lighthouse mobile performance | ≥ 90 | **53** — LCP 3.7 s, TBT 1.6 s, CLS 0.02 |
| Lighthouse accessibility | ≥ 90 | **97** |
| Lighthouse best practices | ≥ 90 | **96** |
| Lighthouse SEO | ≥ 90 | **100** |
| LCP | < 2.5 s | **3.7 s** (simulated mobile) |
| CLS | < 0.1 | **0.02** ✓ |
| First-load JS `/` | ≤ 180 kB gz | **237 kB** (57 kB over budget) |

## Manual QA checklist

Run on **phone (390×844)**, **tablet (768×1024)**, and **desktop (1280×800)** in both **light** and **dark** mode.

### Phone

- [ ] `/` loads without layout shift; hero headline readable above fold
- [ ] Hero carousel: swipe, prev/next buttons, dot tabs advance slides; live region announces slide
- [ ] 25% OFF promo badge + “On Your FIRST THREE Orders” visible on welcome banner image (not only in text column)
- [ ] Stats band shows 5 KPIs (API or fallback)
- [ ] Mobile sticky CTA respects booking mode: **online** Book nearest (`/discover`) primary + WhatsApp/Call secondary; **offline** Book Pickup (opens dialog) + WhatsApp; hides when scrolling to final CTA band
- [ ] Floating FAB: while sticky CTA is visible, hide WhatsApp; hide Call only in online mode; keep Find stores; full FAB hides for final CTA / footer social; no overlap with hero CTAs
- [ ] Footer social (Facebook/Instagram/etc.) fully visible & tappable above sticky CTA on mobile
- [ ] Navbar hamburger opens/closes; links navigate; body scroll locked when open
- [ ] All section headings visible; no horizontal scroll
- [ ] Navbar **Book Now** opens pickup dialog (no `/stores` navigation); Esc / close restores focus
- [ ] `/?book=1` deep-links the same dialog; submit shows confirmation with `public_code` (e.g. `BR-…`); Done closes; WhatsApp/Call still available
- [ ] `/contact`: empty submit shows field errors; invalid phone rejected; valid submit shows success toast
- [ ] Contact aside **Book a pickup** opens the same dialog
- [ ] No console errors on `/` and `/contact`
- [ ] Dark mode: glass surfaces readable; no invisible text on gradients

### Tablet

- [ ] Hero carousel two-column layout; images load on active + next slide only
- [ ] Sticky CTA hidden (`lg:hidden`); footer contact actions visible
- [ ] Reviews live on `/discover` (not home); Featured stores cards tappable; link to `/stores` works
- [ ] Franchise teaser CTAs navigate to `/franchise` and brochure → `/brochures/washhouse-franchise.pdf` (download)

### Desktop

- [ ] Navbar inline links (incl. Stores) + Book Now / Stores / Call Now visible (no hamburger)
- [ ] Hero per-slide CTAs inside carousel (no duplicate global mobile CTAs)
- [ ] How it works / Why choose grids align; glass cards readable
- [ ] `/services`: service grid (Wash & Fold, Dry Cleaning, …) with Browse laundries CTAs — not embedded on `/`
- [ ] Special care tiles link to `/services#…`; Delivery Popular ribbon fully visible; both delivery Book Now open dialog
- [ ] Featured stores: loading skeleton / error / empty never a blank white slab; Browse → `/stores`
- [ ] Final CTA band matches mode: **online** Book nearest + WhatsApp + Call; **offline** WhatsApp + Find stores + Call
- [ ] Footer link groups side-by-side: 2 cols (mobile+), 3 cols (md), 5 cols (lg); all links 44px tap target; no horizontal overflow
- [ ] Keyboard: carousel focusable; tab order logical; skip-to-content works

### Cross-cutting

- [ ] `prefers-reduced-motion`: carousel autoplay paused (manual nav still works); section bodies (Delivery, App promo, Featured stores, Final CTA) visible immediately — no opacity-0 trap
- [ ] Scroll `/` mobile + desktop: Delivery cards, Services cards, App promo features + store badges, Featured stores, Franchise teaser, Final CTA all visible under headers (no blank bands)
- [ ] Offline / API error: stats and testimonials show fallback content (no blank sections)
- [ ] WhatsApp links use correct `NEXT_PUBLIC_WHATSAPP` number
- [ ] Call links use correct `NEXT_PUBLIC_PHONE` number

## Files

| Area | Path |
| ---- | ---- |
| Route | `frontend/app/page.tsx` |
| Page component | `frontend/features/marketing/home/marketing-homepage.tsx` |
| Booking CTA mode | `frontend/features/marketing/lib/use-marketing-booking-cta-mode.ts` |
| Sticky / final CTAs | `frontend/components/marketing/mobile-sticky-cta.tsx`, `frontend/features/marketing/home/final-cta-band.tsx` |
| Shell | `frontend/components/layout/marketing-shell.tsx` |
| API | `backend/app/api/v1/endpoints/marketing.py` |
| Schema | `backend/app/schemas/marketing.py` |
| DB | `backend/alembic/versions/20260713_0032_marketing_tables.py` |

## Open follow-ups

1. Bring `/` first-load JS within 180 kB budget (route-specific Providers)
2. Add theme toggle to marketing navbar for explicit dark-mode QA on marketing-only sessions
3. Run Lighthouse mobile on staging URL in CI
4. **Booking Requests Slice 3:** Book Now uses `POST /booking-requests` with in-dialog confirmation (`public_code` + WhatsApp/Call). General contact still uses `POST /marketing/contact`. Admin/partner inbox UI remains — see [booking-requests.md](booking-requests.md).
