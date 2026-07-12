# Offline booking — UI feature map supplement

**Last updated:** 2026-07-03  
**Canonical map:** merge into root `UI_FEATURE_MAP.md` when writable.

## Offline booking mode (`FEATURE_ONLINE_BOOKING=false`)

| Feature | Navigation Path | Required Role | Required Test Data | Dependencies | API |
| ------- | --------------- | ------------- | ------------------ | ------------ | --- |
| Guest browse + contact | `/discover` → `/discover/[id]` | **Public (no login)** | Approved laundry + storefront contact | `GET /laundries/{id}/contact` (`requires_login: false`) | ✅ |
| Call / WhatsApp sidebar | Laundry detail → Services tab sidebar | **Public (no login)** | `show_call` / `show_whatsapp` on storefront | Contact API + `OfflineBookingContactPanel` | ✅ |
| Checkout redirect | `/checkout/[laundryId]` | Public | Laundry id | Redirects to `/discover/[id]` with offline banner | ✅ |
| Partner walk-in orders | `/partner/walk-in-orders` | Partner | Partner laundry + services | `POST /partner/walk-in-orders` | ✅ |
| Walk-in status → WhatsApp | Partner → Orders / walk-in list | Partner | Walk-in order + customer phone | Status patch + `send_order_status_whatsapp` | ✅ |

**Guest contact in offline mode:** no login required; phone/WhatsApp returned by public contact API. Online mode still gates contact behind customer login.

**Partner dashboard:** add **Walk-in orders** row at `/partner/walk-in-orders`.
