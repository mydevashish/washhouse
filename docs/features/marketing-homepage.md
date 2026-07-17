# Feature: Marketing homepage v2

> Status: shipped  
> Last updated: 2026-07-13  
> Route: `/`  
> Related: [offline-booking-whatsapp.md](offline-booking-whatsapp.md), [customer-discovery.md](customer-discovery.md)

## Problem

The public landing page must convert visitors into WhatsApp bookings or franchise inquiries while showcasing WashHouse trust signals, services, and partner network — optimized for mobile India, dark/light themes, and low-end Android devices.

## Scope

| In scope | Out of scope |
| -------- | ------------ |
| Hero carousel (4 slides), stats, services, testimonials | Inline contact form on `/` (lives on `/contact`) |
| Sticky navbar, mobile sticky CTA, floating FAB | `SpecialCareSection` (built, not wired) |
| Marketing APIs: stats, testimonials, contact, franchise | Theme toggle in marketing navbar (uses system / app shell elsewhere) |
| Playwright smoke + a11y specs | Full Lighthouse CI gate on `/` (manual verify documented) |

## Section map

Render order from `frontend/features/marketing/home/marketing-homepage.tsx`:

| # | Section | Component | Data source | Notes |
| - | ------- | --------- | ----------- | ----- |
| Shell | Sticky navbar | `MarketingNavbar` | static nav config | Home, Services, Pricing (`/pricing`), About, Franchise, Contact + Book Now / Call |
| 1 | Hero + carousel | `MarketingHomeHero` → `HeroCarousel` | `hero-slides.ts` | 4 slides; Embla autoplay 5 s; glass promo badge |
| 1b | Hero mobile CTAs | `home-hero.tsx` | static | In-flow below carousel (`sm:hidden`): Book pickup, Become a partner |
| 2 | Stats band | `StatsBand` | `GET /marketing/stats` + fallback | 5 KPIs (customers, cities, pickup points, garments, rating) |
| 3 | Trust strip | `TrustStrip` | static | Verified / pickup / express badges |
| 4 | How it works | `HowItWorksSection` | static steps | 5-step process in glass card |
| 5 | Why choose us | `WhyChooseSection` | static | 6 benefit blocks |
| 6 | Services preview | `ServicesPreview` | `services-data.ts` | 6 service cards → `/services` |
| 7 | Delivery options | `DeliveryOptionsBand` | static | Regular vs Express |
| 8 | Featured stores | `FeaturedStoresTeaser` | `GET /laundries` (top 3) | Links to discover / store detail |
| 9 | Franchise teaser | `FranchiseTeaser` | static | Apply → `/franchise#apply`; brochure → `/contact?subject=franchise#contact-form`. Content wrapper must be `relative` so glass panel sits above absolute photo/gradient (same as FranchiseHero / FinalCtaBand). |
| 10 | Testimonials | `HomeTestimonials` | `GET /marketing/testimonials` + fallback | Mobile carousel + desktop 3-col grid |
| 11 | App promo | `AppPromoSection` | static | Web-first; no store links yet |
| 12 | Final CTA band | `FinalCtaBand` | static | WhatsApp + Call; `data-marketing-bottom-cta` |
| Shell | Mobile sticky CTA | `MobileStickyCta` | env contact config | Fixed bottom WhatsApp/Call; hides when final CTA in view |
| Shell | Floating FAB | `FloatingContactActions` | env contact config | Bottom-right on mobile/tablet; overlap-aware |
| Shell | Footer | `MarketingFooter` | static groups | Company, Partner, Legal, Support links |

### Hero carousel slides

| Slide | Headline | Variant |
| ----- | -------- | ------- |
| 1 | CLEAN CLOTHES. HAPPY LIFE. | welcome (WELCOME20 promo) |
| 2 | EXPERT CARE FOR EVERY FABRIC | services |
| 3 | START YOUR OWN LAUNDRY BUSINESS | franchise |
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

Frontend falls back to static values in `stats-fallback.ts` when API errors or returns empty.

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

## Frontend integration

| Hook / client | File | Endpoint |
| ------------- | ---- | -------- |
| `useMarketingStats()` | `features/marketing/hooks/use-marketing.ts` | `GET /marketing/stats` |
| `useMarketingTestimonials()` | same | `GET /marketing/testimonials` |
| `useSubmitContact()` | same | `POST /marketing/contact` |
| `getMarketingStats()` etc. | `lib/api/marketing.ts` | Zod-validated API client |

## Automated tests

| Suite | Path | Coverage |
| ----- | ---- | -------- |
| Playwright smoke | `frontend/tests/e2e/marketing-homepage.spec.ts` | Load, carousel nav, contact validation, sticky CTA |
| Playwright a11y | `frontend/tests/e2e/marketing-a11y.spec.ts` | Axe on `/`, `/services`, `/pricing`, `/stores`, `/contact` |
| Playwright smoke (legacy) | `frontend/tests/e2e/smoke.spec.ts` | Homepage heading assertion |
| Jest unit | `frontend/features/marketing/home/home-hero.test.tsx` | Mobile CTA placement |
| Backend API | `backend/tests/api/test_marketing.py` | Contact, franchise, stats, testimonials |

```bash
# From frontend/
npm run test:e2e -- marketing-homepage
npm run test:e2e -- marketing-a11y
npm test -- home-hero

# From backend/
pytest tests/api/test_marketing.py
```

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
- [ ] WELCOME20 promo badge visible on welcome slide
- [ ] Stats band shows 5 KPIs (API or fallback)
- [ ] Mobile sticky CTA (WhatsApp + Call) visible at top; hides when scrolling to final CTA band
- [ ] Floating FAB does not overlap sticky CTA, hero CTAs, or footer social icons
- [ ] Footer social (Facebook/Instagram/etc.) fully visible & tappable above sticky CTA on mobile
- [ ] Navbar hamburger opens/closes; links navigate; body scroll locked when open
- [ ] All section headings visible; no horizontal scroll
- [ ] `/contact`: empty submit shows field errors; invalid phone rejected; valid submit shows success toast
- [ ] No console errors on `/` and `/contact`
- [ ] Dark mode: glass surfaces readable; no invisible text on gradients

### Tablet

- [ ] Hero carousel two-column layout; images load on active + next slide only
- [ ] Sticky CTA hidden (`lg:hidden`); footer contact actions visible
- [ ] Testimonials: carousel or grid renders without overflow
- [ ] Featured stores cards tappable; link to `/stores` (and laundry detail `/discover/[id]`) works
- [ ] Franchise teaser CTAs navigate to `/franchise` and brochure → `/contact?subject=franchise#contact-form` (Franchise pre-selected)

### Desktop

- [ ] Navbar inline links + Book Now / Call Now visible (no hamburger)
- [ ] Hero per-slide CTAs inside carousel (no duplicate global mobile CTAs)
- [ ] How it works / Why choose grids align; glass cards readable
- [ ] Services preview hover states; links to `/services` and individual service anchors
- [ ] Final CTA band WhatsApp + Call links open correctly
- [ ] Footer link groups side-by-side: 2 cols (mobile+), 3 cols (md), 5 cols (lg); all links 44px tap target; no horizontal overflow
- [ ] Keyboard: carousel focusable; tab order logical; skip-to-content works

### Cross-cutting

- [ ] `prefers-reduced-motion`: carousel autoplay paused (manual nav still works)
- [ ] Offline / API error: stats and testimonials show fallback content (no blank sections)
- [ ] WhatsApp links use correct `NEXT_PUBLIC_WHATSAPP` number
- [ ] Call links use correct `NEXT_PUBLIC_PHONE` number

## Files

| Area | Path |
| ---- | ---- |
| Route | `frontend/app/page.tsx` |
| Page component | `frontend/features/marketing/home/marketing-homepage.tsx` |
| Shell | `frontend/components/layout/marketing-shell.tsx` |
| API | `backend/app/api/v1/endpoints/marketing.py` |
| Schema | `backend/app/schemas/marketing.py` |
| DB | `backend/alembic/versions/20260713_0032_marketing_tables.py` |

## Open follow-ups

1. Wire `SpecialCareSection` or remove dead code
2. Bring `/` first-load JS within 180 kB budget (route-specific Providers)
3. Add theme toggle to marketing navbar for explicit dark-mode QA on marketing-only sessions
4. Run Lighthouse mobile on staging URL in CI
