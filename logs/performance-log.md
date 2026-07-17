# Performance Log

> Optimization investigations + outcomes.

## Budgets (from `rules/11-performance.md`)

### Frontend (Lighthouse mobile, 4G)
- LCP < 2.5 s
- INP < 200 ms
- CLS < 0.1
- Performance score ≥ 90
- First-load JS (gz): ≤ 180 KB landing / ≤ 240 KB app shells

### Backend (per endpoint)
- Read p95 < 200 ms
- Write p95 < 400 ms
- Background job lag p95 < 30 s

## History

### 2026-07-17 — `/pricing` rack neighbor photo prefetch

- **Area:** frontend marketing pricing
- **Symptom:** Product crossfades can flash empty muted while next garment image loads
- **Hypothesis:** Warming next/image optimizer URLs for `activeIndex ± 1` before settle keeps the dual buffer painted
- **Change:** Page-wide concurrency cap 2; skip when reduced-motion or rack off-screen; shared `sizes` with visible frame
- **Result:** Expected fewer empty-frame flashes on tag scroll without stampeding Unsplash/next image on a long page

### 2026-07-13 — Homepage `/` + Discover `/discover` bundle trim

- **Area:** frontend
- **Symptom:** `/` First Load JS 252 kB (budget 180 kB); `/discover` 227 kB; hero carousel image loading partially deferred; need to verify `dynamic()` splits in `marketing-homepage.tsx`
- **Profile:** `npm run build` route table (`next build`), code audit of hero carousel + marketing shell client boundaries
- **Hypothesis:** Sync client boundaries (framer-motion fade-in above fold, footer in client shell, navbar command dialog, below-fold discover sections) inflate first-load JS and LCP image weight
- **Options considered:**
  1. **Remove sync framer-motion / defer below-fold sections** — high ROI, low risk *(chosen)*
  2. Slim root `Providers` for marketing routes — high ROI, high complexity (separate layout tree)
  3. CSS-only hero (no Embla) — medium LCP win, high UX regression
- **Change:**
  - Removed sync `FadeIn` (framer-motion) from above-fold “How it works” on `/`; section now static + `dynamic()`-loaded chunk
  - Split `MarketingShell` into server wrapper + `MarketingShellChrome` client so `MarketingFooter` stays RSC (not pulled into client bundle)
  - Deferred `FloatingContactActions`, `NavbarCommandSearch` via `dynamic({ ssr: false })`
  - Tightened hero carousel image loading: **active + next only** until user navigates (was active + next + prev on mount → 3 images; now 2)
  - `/discover`: `dynamic()` for `BookingFlowSteps`, `HomeWhyChooseUs`, `HomeTestimonials` (Embla + framer-motion off critical path)
  - `services-preview`: replaced `useReducedMotion` from framer-motion with local `usePrefersReducedMotion` hook
  - Fixed `trust-strip` lint (`tabIndex` on non-interactive `<ul>`) to unblock production build
- **Before → After (First Load JS, `next build`):**
  - `/`: **252 kB → 237 kB** (−15 kB, −6%)
  - `/discover`: **227 kB → 180 kB** (−47 kB, −21%, **within 240 kB app budget**)
  - Shared baseline: 102 kB (unchanged)
- **LCP (estimated, not Lighthouse-run this session):**
  - Hero: −1 above-fold carousel image on initial paint (slide 3 no longer prefetched)
  - `/discover`: single `priority` hero image unchanged; less JS contends with LCP decode
  - **Target LCP < 2.5 s mobile:** needs Lighthouse confirmation on deployed/staging URL
- **Cost:** bundle −15 kB on `/`, complexity + (3 small layout split files, 1 extracted section); no API/cache changes
- **Files:** `marketing-homepage.tsx`, `how-it-works-section.tsx`, `hero-carousel.tsx`, `marketing-shell.tsx`, `marketing-shell-chrome.tsx`, `marketing-footer-contact-actions.tsx`, `global-navbar.tsx`, `marketplace-homepage.tsx`, `services-preview.tsx`, `trust-strip.tsx`
- **Follow-ups:**
  - `/` still **57 kB over** 180 kB landing budget — next Pareto hit: route-specific `Providers` slim shell or defer auth/nav stores on marketing pages
  - Lighthouse mobile performance **53** (2026-07-13 prod `next start`, simulated throttling) — accessibility 97, best-practices 96, SEO 100; primary drag: TBT 1.6 s + LCP 3.7 s
  - Run Lighthouse mobile on staging for `/` and `/discover` to confirm LCP < 2.5 s
  - `pnpm analyze` diff in CI on PRs touching marketing routes
