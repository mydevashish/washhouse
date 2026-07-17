# Feature: Marketing Pricing page

> Status: shipped  
> Last updated: 2026-07-17  
> Route: `/pricing`  
> Related: [marketing-homepage.md](marketing-homepage.md), [partner-price-list.md](partner-price-list.md) (Slice D — marketplace “from” tables)

## Problem

Nav/footer “Pricing” previously scrolled to `/services#pricing`, mixing service catalog and pricing education. Visitors need a dedicated page that explains how pricing works and shows FebriWash-style category tables — without claiming fixed city-wide platform prices.

## Scope

| In scope | Out of scope |
| -------- | ------------ |
| Public `/pricing` in `MarketingShell` | Checkout tax/GST calculation |
| How pricing works (delivery / UPI / COD / compare stores) | Partner revenue or admin pricing tools |
| Category “from ₹” guide (screw-hook laundry tickets + reduced-motion tables) | Claiming GST on every order (deferred) |
| CTA → `/stores` | Discover marketplace pricing section |
| Nav + footer Pricing → `/pricing` | Booking bridge to catalog SKUs |

## Structure

| Section | Component | Notes |
| -------- | --------- | ----- |
| Hero | `PricingHero` | Brand-forward full-bleed (logo hero-level); rail accent; one headline, one support line, CTA → `/stores`; steam + fabric-wave atmosphere (steam-sky wash, not SaaS purple) |
| How it works | `PricingHowItWorks` | Sequential stations (`PRICING_STATIONS`: pickup → wash → price tag → pay); hanging-rail scroll reveals; handoff rail + drop into price guide; tight station spacing; no card grid |
| Price guide | `PricingPriceGuide` + `PricingAtelierGuide` | Dense photo+rate composition (see below); `prefers-reduced-motion` → fixed-aspect photo + `PricingCategoryTable`; tags keyboard-focusable (`tabIndex` + aria-label) |
| Variety note | `PricingVarietyNote` | Independent owners set rates + link `/stores`; shared rail reveal + atmosphere |
| CTA | `PricingCta` | “See prices near you” → `/stores`; dark atelier band + steam/wave |

### Price guide — photo + rate composition

Each category is one **photo + peg-rail** unit (not a card grid):

| Piece | Behavior |
| ----- | -------- |
| Layout | Desktop 12-col: editorial photo **5** + rates **7**, alternating L↔R; tablet/mobile stack photo above rates. Content width ~1440px (`MARKETING_CONTAINER`). |
| Optical top line | Category `h3`, photo top, and peg-rail top share one start line (`items-start` / `justify-start`) — rates are not vertically centered in a void. |
| Spacing | SectionHeader → first rack ~24–28px. Between categories: **32–40px** mobile, **40–56px** desktop. Stations → guide uses a shared handoff rail + vertical drop + reduced top padding / transparent border (not a hard gallery break). |
| Photo | Fixed `4/3` aspect at all breakpoints (even heights, no CLS). Caption stays **beside rates** (rod-mark + `h3`); no on-photo overlay/gradient unless a caption is ever placed on the image edge. Soft **atelier plate** under the photo shows the active garment name (not on the image). `sizes` sized for 5/12 of marketing width @2x; Unsplash source ≥1600w. |
| Peg rail + tags | Conveyor screw-hook laundry tickets; compact stub header with filled stub band (no empty top); name **18–20px**, “from ₹” price **24–26px** (`--atelier-price`). Content-sized ticket faces (no min-height void). Few tags **left-align** on the rail. Horizontal tag scroller only — page itself must not scroll sideways (`overflow-x: clip` on rail wrap + page shell; `overscroll-behavior-x: contain` on the scroller). **Mobile snap:** `scroll-snap-type: x mandatory` + `scroll-snap-stop: always` so flings settle on one tag. **Scroll-synced spotlight:** the tag nearest the rack focus line (~28% from scroller left) drives tag highlight live; keyboard focus also syncs. Active tag gets a soft lift + edge ring; inactive tags dim slightly (opacity transition paused mid-fling). |
| Product photo sync | `resolvePricingProductImage(slug, name, category)` maps garment families (jacket denim / puffer / leather, saree, shirt, bedsheet, …) to editorial frames; unknown slugs fall back to the category hero. Photo + plate update from a **settled** index (`scrollend` / ~90ms idle) so crossfades don’t thrash mid-fling. Crossfade is opacity + scale only (`~420ms` desktop / `~280ms` mobile, `[0.16,1,0.3,1]`); soft shutter wash on change; `prefers-reduced-motion` → instant swap. Plate is a single truncated line (ellipsis, no wrap). Applies to **every** motion atelier rack (Men, Women, Kids, Winter, Household, kg). **Neighbor prefetch:** while a rack is in view (and motion is allowed), `usePrefetchRackPhotos` warms next/image optimizer URLs for `activeIndex ± 1` (page-wide concurrency cap 2) so the dual-buffer crossfade never flashes empty muted; skipped when `prefers-reduced-motion` or the section is off-screen. |
| Conveyor accent | Thin (1–2px) horizontal rail-colored line under each photo+rack unit — subtle atelier cue, not a card border. |
| Atmosphere | Grain/mist + per-category misted ambient imagery stay `z-index: 0` behind photo+rates; women/kids use **rich** fabric depth (higher opacity, lighter veil, multi-stop category tint wash). No text on ambient. Prices must remain crisp in light + dark. Ambient blur/drift pause when section leaves viewport (`data-atmosphere`). |
| Photo mood | One CSS/SVG micro-loop per category on the **photo edge** only (`PricingCategoryMood`: steam / fabric / hang). Pause off-screen (`data-mood`) and when section atmosphere is off. `prefers-reduced-motion` → no mood layer (static photo). Mobile uses a smaller canvas; never on tickets; never blocks price LCP. No Lottie/video. |
| Motion | CSS 3D spindle `rotateY` + capped idle sway; `prefers-reduced-motion` → static photo + table, no sway/flip. Signature motions page-wide: spindle tags, rail reveals, ambient/steam-wave (refine only — do not pile on). |

Data: `GET /api/v1/catalog/marketplace-from` with static WashHouse suggested fallback so the page never blanks.

**Motion:** Page shell `.pricing-page` shares laundry-atelier tokens (steam rise + fabric-wave CSS/SVG). Section reveals use horizontal rail travel (`PricingRailReveal` / `PricingRailInView` — transform + opacity only). Continuous steam/wave/mist pause when the section leaves the viewport (`data-atmosphere`). Price tags use CSS 3D only (`perspective` + scroll-scrubbed `rotateY` spindle flip + `rotateZ` settle); category racks alternate conveyor slide via `PricingRailReveal`. Category photo edges carry one lightweight CSS/SVG mood loop (`PricingCategoryMood` — steam / fabric / hang; IO-paused; reduced-motion hard-stop). Idle sway capped to ~7 concurrent in-view tags; off-screen pause via `useInView`. No micro-sound, no Three.js, no Lottie/video heroes. All continuous motion gated by `prefers-reduced-motion`.

Services keeps a short `#pricing` teaser linking to `/pricing` so old bookmarks still resolve.

## Files

- `frontend/app/pricing/page.tsx`
- `frontend/features/marketing/pricing/*` (page motion: `pricing-page-shell.tsx`, `pricing-page-atmosphere.tsx`, `pricing-rail-reveal.tsx`, `use-pricing-section-active.ts`; atelier rack: `pricing-atelier.css`, `pricing-atelier-guide.tsx`, `pricing-category-rack.tsx`, `pricing-category-photo.tsx`, `pricing-category-mood.tsx`, `pricing-category-mood-map.ts`, `pricing-category-ambient.tsx`, `pricing-category-images.ts`, `pricing-product-images.ts`, `use-active-rack-item.ts`, `use-prefetch-rack-photos.ts`, `lib/prefetch-pricing-product-image.ts`, `lib/neighbor-rack-indexes.ts`, `pricing-price-tag.tsx`, `pricing-peg-rail.tsx`)
- API: `docs/api/endpoints/marketplace-from.md`
- Nav: `frontend/lib/navigation/marketing-nav.ts`
- Footer: `frontend/lib/navigation/marketing-footer.ts`
