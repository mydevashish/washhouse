# Offline booking — customer experience contact rules

**Last updated:** 2026-07-29  
**Canonical doc:** merge into `CUSTOMER_EXPERIENCE_ENHANCEMENT.md` Part 3–4 when writable.

## Part 3 — Customer contact

### Online booking enabled (default)

| User | Browse | See phone | Call |
|------|--------|-----------|------|
| **Guest** | Yes | No | Redirect to login |
| **Registered customer** | Yes | Yes (if partner enabled) | Yes + tracked |

### Offline booking (`FEATURE_ONLINE_BOOKING=false`)

| User | Browse | See phone | Call / WhatsApp |
|------|--------|-----------|-----------------|
| **Guest** | Yes | Yes (if partner enabled) | Yes — no login |
| **Registered customer** | Yes | Yes (if partner enabled) | Yes + tracked |

`GET /laundries/{id}/contact` returns `requires_login: false`, `offline_booking_mode: true`, and phone/WhatsApp for approved laundries with contact channels enabled.

## Part 4 — WhatsApp & callback (offline)

| Action | Guest | Registered customer |
|--------|-------|---------------------|
| **Call shop** | `tel:` (no login) | `tel:` + track |
| **WhatsApp shop** | `wa.me` (no login) | `wa.me` + track |
| **Directions** | Maps deep link (no login) when lat/lng present | Deep link + `directions_click` track |
| **Request callback** | Hidden | Hidden |

### Directions

- Shown when `show_directions: true` (default whenever laundry `latitude` + `longitude` exist). Partner hide-toggle deferred.
- URLs on contact payload: `google_maps_url`, `apple_maps_url`, `geo_url`. Client picks by platform (iOS → Apple, Android → `geo:`, else Google).
- Surfaces: `OfflineBookingContactPanel` (inline/sidebar only — **not** `mobile-bar`) and `StorefrontContactSection`. Not on marketing sticky CTA / FABs.
- Track event: `directions_click` (engagement enum); guests open maps without persisting an event.

### Surfaces + analytics `source`

| Surface | Component | Track `source` |
|---------|-----------|----------------|
| Storefront | `StorefrontContactSection` | `storefront` |
| Offline detail / mobile bar | `OfflineBookingContactPanel` | `offline_booking` |
| Marketing `/stores` cards | `StoresCard` | `stores_directory` |
