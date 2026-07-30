# Offline booking — UI feature map supplement

**Last updated:** 2026-07-30  
**Canonical map:** merge into root `UI_FEATURE_MAP.md` when writable.

## Offline booking mode (`FEATURE_ONLINE_BOOKING=false`)

| Feature | Navigation Path | Required Role | Required Test Data | Dependencies | API |
| ------- | --------------- | ------------- | ------------------ | ------------ | --- |
| Guest browse + contact | `/discover` → `/discover/[id]` | **Public (no login)** | Approved laundry + storefront contact | `GET /laundries/{id}/contact` (`requires_login: false`) | ✅ |
| Call / WhatsApp sidebar | Laundry detail → Services tab sidebar | **Public (no login)** | `show_call` / `show_whatsapp` on storefront | Contact API + `OfflineBookingContactPanel` | ✅ |
| Directions (coords) | Laundry detail / storefront contact panels | **Public** | Laundry `latitude` + `longitude` → `show_directions` | Google / Apple / `geo:` via `pickDirectionsUrl`; track `directions_click` when signed-in. **Not** on mobile-bar or marketing sticky | ✅ |
| Stores directory contact | `/stores` card action row | **Public (no login)** offline; login-gated online | Same contact flags | Contact API + `trackContactEvent` `source: stores_directory` | ✅ |
| Stores Near me | `/stores` filter cluster → **Near me** | Public | Laundry list with optional `latitude`/`longitude` | Browser geolocation + client haversine on list/search APIs; deny → search-by-area; sticky compact filters on phone/tablet scroll | ✅ |
| Offline sticky Book Pickup | Marketing sticky **Book Pickup** → `BookNowDialog` | Public | Contact lead via `POST /marketing/contact` `order-help` | `useBookNowStore` + WhatsApp secondary; Stores/Call removed from sticky; FAB keeps Find stores (+ Call offline). Online sticky primary remains **Book nearest** → `/discover` | ✅ |
| Checkout redirect | `/checkout/[laundryId]` | Public | Laundry id | Redirects to `/discover/[id]` with offline banner | ✅ |
| Partner walk-in orders | `/partner/walk-in-orders` | Partner | Partner laundry + services | `POST /partner/walk-in-orders` | ✅ |
| Walk-in status → WhatsApp | Partner → Orders / walk-in list | Partner | Walk-in order + customer phone | Status patch + `send_order_status_whatsapp` | ✅ |

**Guest contact in offline mode:** no login required; phone/WhatsApp returned by public contact API. Online mode still gates contact behind customer login.

**Partner dashboard:** add **Walk-in orders** row at `/partner/walk-in-orders`.
