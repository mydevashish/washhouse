# Offline booking — UI feature map supplement

**Last updated:** 2026-08-04  
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
| Partner Customer Desk | `/partner/customer-desk` (also Customers insights **Open desk**, Orders/Walk-in **Find customer**) | Partner | Partner JWT + optional past own-laundry orders | Name/phone search + lookup/history + assisted create | ✅ |
| Admin Customer Desk | `/admin/customer-desk` | Admin | Admin JWT | Name/phone search + lookup/history + assisted create + BR handoff | ✅ |

**Guest contact in offline mode:** no login required; phone/WhatsApp returned by public contact API. Online mode still gates contact behind customer login.

**Partner dashboard:** **Walk-in orders** at `/partner/walk-in-orders`; **Customer Desk** at `/partner/customer-desk` (counter phone lookup — laundry-scoped history only).

**Assisted doorstep vs walk-in:** Desk **Place doorstep** uses assisted create (`order_source=assisted_partner` when Slice 2 lands) and **bypasses** `FEATURE_ONLINE_BOOKING`. Walk-in remains the in-shop short path from the same desk.
