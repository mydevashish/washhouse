# Feature: Customer discovery

> Status: shipped (list + detail; Slice 5 compare price hints)  
> Owner: frontend-architect + backend-architect  
> Last updated: 2026-07-29  
> Related: [partner-price-list.md](partner-price-list.md)

## Problem

Customers must find nearby laundries with ratings, price, and availability.

## UX flow

1. App requests location (or user picks city).
2. List laundries sorted by distance with filters.
3. Tap laundry → detail with services, garment price list, and reviews preview.

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/laundries` | Search/list; includes compare price hints | optional |
| GET | `/api/v1/laundries/search` | Text search; same hint fields | optional |
| GET | `/api/v1/laundries/{id}` | Detail + services | optional |
| GET | `/api/v1/laundries/{id}/price-list` | Partner garment prices | public |
| GET | `/api/v1/laundries/{id}/reviews` | Review summary | optional |

List/search items may include `wash_fold_from_*`, `shirt_dry_clean_from_*`, and `start_price_*` when the laundry has offered those catalog items — see [laundry-compare-hints.md](../api/endpoints/laundry-compare-hints.md).

## Data model

- `laundries`, `laundry_services`, `laundry_item_prices` + `platform_catalog_items`
- Indexes: `ix_laundries_city_is_approved`, lat/lng for haversine

## Frontend surface

- Route: `/stores` — marketing directory (`StoresCard`: cover, trust, place, service peek, Open store; hover/focus prefetches `queryKeys.laundry`; search + optional **Near me**; no compare filters)
- Route: `/discover`, `/discover/[id]` — discovery + **laundry storefront** (`LaundryStorefrontView`)
- Storefront catalogue: `ServiceCatalogBrowser` — sticky category chips with scroll-spy, search (live region for result count), garment photos via `resolveServicePhoto` + `CatalogGarmentThumb`, optional `?category=` deep-link, empty CTA back to `/stores`
- Detail / storefront contact: Call + WhatsApp; optional **Directions** when contact API `show_directions` (lat/lng present) — not on marketing sticky CTA; storefront contact GET deferred until near viewport
- `frontend/features/discover/` (list/detail); `frontend/features/storefront/`; `frontend/features/marketing/stores/` (public directory)

### `/stores` gallery polish

| Piece | Behavior |
| ----- | -------- |
| Hero | Brand-led cover; phone short padding (`py-7`) so search / Near me reach faster; roomier from `sm` up |
| Filters | One control cluster (search + **Near me**); tablet `md:` row cluster; phone/tablet sticky under nav — compact chrome when pinned (`lg:static`); does not fight bottom MarketingShell CTA |
| Motion | Card fade/slide-in (stagger capped at 6), hover lift + cover scale; `md+` subtle cover parallax on hover/focus; verified/rating nudge — `prefers-reduced-motion` disables |
| Variety | Per-slug cover images from `laundry-images` + slug-hash gradient overlay / muted fallback |
| Images | `next/image` with responsive `sizes`, fixed `aspect-[5/3]`, solid muted fallback on error (no CLS) |
| Contact | Lazy `GET …/contact` via `useCardInView` — never on mount for all cards |
| Density | `gap-4` / `md:gap-5` / `lg:gap-6`, card radius `rounded-xl` (`--radius-xl`); 1-col phone, 2-col `md` gallery with `items-stretch` |
| Actions | Primary **Open store** + icon-only Call/WhatsApp (`flex-nowrap`, matches quick-pick; no 2-line wrap at 360px) |
| Service peek | Max-height clamp so tablet card heights stay aligned |
| Microcopy | Directory **Open store** → storefront **See full menu** / **Schedule pickup** |
| Loading | Skeletons only while list pending/empty — never on search debounce or background refetch |

### `/stores` Near me

| Piece | Behavior |
| ----- | -------- |
| Control | **Near me** requests browser geolocation; deny/unavailable keeps search-by-area with a polite status message |
| Distance | Client haversine (`lib/geo.ts`) when list/search items include `latitude`/`longitude`; otherwise approximate slug-hash distance (legacy) sorts after real GPS rows |
| APIs | Reuses `GET /laundries` + `GET /laundries/search` — no dedicated near-me endpoint |

### `/stores` card actions

| Action | Behavior |
| ------ | -------- |
| **Open store** | Primary link → `/discover/[id]` |
| **Call** / **WhatsApp** | Shown when `GET /laundries/{id}/contact` returns `show_call` / `show_whatsapp` and `contact_available`; same guest gating as storefront (`requires_login` → login redirect; no `tel:` / `wa.me` hrefs in markup for gated guests) |
| Tracking | `POST .../contact/track` with `source: stores_directory` for signed-in customers |

### Sticky stores quick-pick (offline booking)

| Piece | Behavior |
| ----- | -------- |
| Trigger | Marketing sticky **Stores** → deferred Drawer (no maps SDK) |
| Rank | Up to 3 via `pickNearestOrFeatured` + `enrichLaundry` (cover, distance when GPS) |
| Layout | Phone: status chip + spotlight #1 + compact rows; tablet `md+`: 2-column (spotlight left / list right); sheet `max-w-lg` / `md:max-w-2xl` centered |
| Loading | Layout-matched skeleton (spotlight + 2 rows) — not spinner-only |
| Geo | Featured while location pending; subtitle tracks idle/pending/denied/near; swap to nearest when GPS resolves (same card shell) |
| Contact | Icon-only Call/WhatsApp (44px); `source: stores_quick_pick`; guest login redirect when required |
| Footer | **See all stores** → `/stores` + Close |
| Motion | Entrance fade/slide + drawer scale off when `prefers-reduced-motion` |
| `/stores` Near me | First card `variant="featured"` (“Closest to you”); `md:` spans full grid width |

## Acceptance criteria

- [x] Debounced search 300ms
- [x] Server pagination default 20
- [x] Only approved laundries in public list
- [x] Discover store cards show owner-set “from ₹” compare hints when published (Slice 5)
- [x] Price filter/sort on `/discover` uses real `start_price_inr` (not pseudo hash prices)
- [x] Marketing `/stores` gallery cards: cover, verified, rating, delivery, service peek, Open store (Call/WhatsApp when contact API allows)
- [x] `/stores` gallery polish: stagger motion (reduced-motion safe), slug-hash overlays, lazy contact, no debounce skeletons, WashHouse CTAs
- [x] `/stores` phone/tablet: compact hero, sticky filter cluster, quick-pick-aligned card actions, 2-col height-stable gallery
- [x] `/stores` **Near me** uses browser geolocation + client haversine when laundry coords are published; graceful deny keeps area search
- [x] Storefront (`/discover/[id]`) shows full service catalogue by category with prices, photos, sticky chips, search, and schedule-pickup CTA
- [x] Storefront contact GET deferred until near viewport (does not block LCP)
- [x] Sticky quick-pick: spotlight + compact rows, tablet 2-col, contact gating `stores_quick_pick`
- [x] `/stores` featured first card when Near me / nearest sort
