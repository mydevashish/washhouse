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

- Route: `/stores` — marketing directory (`StoresCard`: cover, name/city, Call Store / Message Store / Get Location; contact lazy via `useCardInView`; search + optional **Near me**; no compare filters; cover/name → `/discover/[id]`; contact buttons `stopPropagation`)
- Route: `/discover`, `/discover/[id]` — discovery + **laundry storefront** (`LaundryStorefrontView`)
- Storefront catalogue: `ServiceCatalogBrowser` — sticky category chips with scroll-spy, search (live region for result count), garment photos via `resolveServicePhoto` + `CatalogGarmentThumb`, optional `?category=` deep-link, empty CTA back to `/stores`
- Detail / storefront contact: Call + WhatsApp; optional **Directions** when contact API `show_directions` (lat/lng present) — not on marketing sticky CTA; storefront contact GET deferred until near viewport
- `frontend/features/discover/` (list/detail); `frontend/features/storefront/`; `frontend/features/marketing/stores/` (public directory)

### `/stores` gallery polish

| Piece | Behavior |
| ----- | -------- |
| Hero | Brand-led cover; phone short padding (`py-7`) so search / Near me reach faster; roomier from `sm` up; microcopy emphasizes call / message / directions alongside opening the storefront |
| Filters | One control cluster (search + **Near me**); tablet `md:` row cluster; phone/tablet sticky under nav — compact chrome when pinned (`lg:static`); does not fight bottom MarketingShell CTA |
| Motion | Card fade/slide-in (stagger capped at 6), hover lift + cover scale; `md+` subtle cover parallax on hover/focus; verified nudge — `prefers-reduced-motion` disables |
| Variety | Per-slug cover images from `laundry-images` + slug-hash gradient overlay / muted fallback |
| Images | `next/image` with responsive `sizes`, fixed `aspect-[5/3]`, solid muted fallback on error (no CLS) |
| Contact | Lazy `GET …/contact` via `useCardInView` — never on mount for all cards |
| Density | `gap-4` / `md:gap-5` / `lg:gap-6`, card radius `rounded-xl` (`--radius-xl`); 1-col phone, 2-col `md` gallery with `items-stretch` |
| Actions | Cover + name link to `/discover/[id]`; labeled **Call Store** / **Message Store** / **Get Location** (`flex-wrap`, 44px targets) with `stopPropagation` |
| Loading | Skeletons only while list pending/empty — never on search debounce or background refetch |

### `/stores` Near me

| Piece | Behavior |
| ----- | -------- |
| Control | **Near me** requests browser geolocation; deny/unavailable/insecure-origin keeps search-by-area with a polite status message; toggle off restores prior sort (`top_rated` by default) |
| Distance | Client haversine (`lib/geo.ts`) when list/search items include `latitude`/`longitude`; directory uses `ANY_DISTANCE_KM` (sort only — no 50 km radius wipe); approximate slug-hash distances never gate the list and do not rank ahead of real GPS rows |
| Partial | GPS on but no published store pins → **Near me · on** plus polite “map pins not published” status; list stays browsable (rating order among approx rows) |
| APIs | Reuses `GET /laundries` + `GET /laundries/search` — no dedicated near-me endpoint |

### `/stores` card actions

| Action | Behavior |
| ------ | -------- |
| **Call Store** / **Message Store** | Shown when `GET /laundries/{id}/contact` returns `show_call` / `show_whatsapp` and `contact_available`; same guest gating as storefront (`requires_login` → login redirect; no `tel:` / `wa.me` hrefs in markup for gated guests) |
| **Get Location** | Shown when directions URL or `map_url` resolves; hidden when coords/map unavailable |
| A11y | Article `aria-label="{name}, {city}"`; cover link `Open {name}`; action group `Actions for {name}`; button names match visible labels (`Call Store for {name}`, etc.); focus rings via `focus-within` / link inset ring |
| Tracking | `POST .../contact/track` with `source: stores_directory` for signed-in customers |

### Sticky CTA vs stores entry (offline booking)

| Piece | Behavior |
| ----- | -------- |
| Offline sticky | **Book Pickup** opens `BookNowDialog` via `useBookNowStore`; WhatsApp secondary — no Stores/Call on the bar |
| Online sticky | Unchanged: Book nearest → `/discover` + WhatsApp + Call |
| Find stores | Floating FAB **Find stores** → `/stores` (also navbar Stores) |
| Quick-pick sheet | `StoresQuickPickSheet` remains available as a deferred Drawer component (spotlight + compact rows + GPS); not mounted from sticky anymore |
| `/stores` Near me | Geo → `sort: nearest` + `ANY_DISTANCE_KM` (sort only, no radius wipe); first card `variant="featured"` when real GPS distances exist; `md:` spans full grid width |

## Acceptance criteria

- [x] Debounced search 300ms
- [x] Server pagination default 20
- [x] Only approved laundries in public list
- [x] Discover store cards show owner-set “from ₹” compare hints when published (Slice 5)
- [x] Price filter/sort on `/discover` uses real `start_price_inr` (not pseudo hash prices)
- [x] Marketing `/stores` gallery cards: cover/name → `/discover/[id]`; Call Store / Message Store / Get Location (when contact API allows); no service peek
- [x] `/stores` gallery polish: stagger motion (reduced-motion safe), slug-hash overlays, lazy contact, no debounce skeletons
- [x] `/stores` phone/tablet: compact hero, sticky filter cluster, cover link + contact card actions, 2-col gallery
- [x] `/stores` **Near me** uses browser geolocation + client haversine when laundry coords are published; graceful deny keeps area search
- [x] Storefront (`/discover/[id]`) shows full service catalogue by category with prices, photos, sticky chips, search, and schedule-pickup CTA
- [x] Storefront contact GET deferred until near viewport (does not block LCP)
- [x] Offline sticky Book Pickup opens schedule dialog; Find stores via FAB; online sticky unchanged
- [x] `/stores` featured first card when Near me has real GPS distances
