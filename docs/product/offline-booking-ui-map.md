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

| Partner walk-in orders | `/partner/walk-in-orders` (list); create via **New Order** `/partner/new-order?mode=walk_in` | Partner | Partner laundry + services | `POST /partner/walk-in-orders` | ✅ |

| Partner New Order | `/partner/new-order` — walk-in \| doorstep assisted workspace | Partner | Catalog + desk APIs | Walk-in create + assisted create | ✅ FE |

| Partner Order detail | `/partner/orders/[id]` — items, totals, status stepper, advance actions | Partner | Partner JWT + order | `GET /partner/orders/{id}` + status APIs | ✅ |

| Walk-in status → WhatsApp | Partner → Orders / walk-in list | Partner | Walk-in order + customer phone | Status patch + `send_order_status_whatsapp` | ✅ |

| Partner Customer Desk | **Orders** → Find customer (`/partner/orders?tab=desk`); legacy `/partner/customer-desk` → redirect | Partner | Partner JWT + optional past own-laundry orders | Name/phone search + lookup/history + assisted create | ✅ API / ✅ hub tab |

| Admin Customer Desk | **Orders** → Find customer (`/admin/orders?tab=desk`); legacy `/admin/customer-desk` → redirect | Admin | Admin JWT | Name/phone search + lookup/history + assisted create + BR handoff | ✅ API / ✅ hub tab |

| Partner Booking requests | **Orders** → Requests (`/partner/orders?tab=requests`); legacy `/partner/booking-requests` → redirect | Partner | Partner JWT + assigned BRs | BR inbox + convert via desk factory | ✅ API / ✅ hub tab |

| Admin Booking requests | **Orders** → Requests (`/admin/orders?tab=requests`); legacy `/admin/booking-requests` → redirect | Admin | Admin JWT | BR inbox + assign / convert | ✅ API / ✅ hub tab |

| Partner Customer insights | **Orders** → Directory (`/partner/orders?tab=directory`); legacy `/partner/customers` → redirect | Partner | Partner JWT | Insights surface inside hub | ✅ API / ✅ hub tab |

| Admin Customers | **Orders** → Directory (`/admin/orders?tab=directory`); legacy `/admin/customers` → redirect | Admin | Admin JWT | Customers table inside hub | ✅ API / ✅ hub tab |

| Partner Orders Hub | `/partner/orders` — tabs: Today/Orders \| Find customer \| Requests \| Directory (**hard-merge**) | Partner | Partner JWT | Desk + BR + insights + queue | ✅ FE |

| Admin Orders Hub | `/admin/orders` — tabs: Today/Orders \| Find customer \| Requests \| Directory (**hard-merge**); sidebar keeps **Laundries** | Admin | Admin JWT | Desk + BR + customers + platform queue | ✅ FE |



**Guest contact in offline mode:** no login required; phone/WhatsApp returned by public contact API. Online mode still gates contact behind customer login.



**Partner dashboard:** **New Order** (`/partner/new-order`) is the primary create path. **Walk-in list / pickups / deliveries / operations center** stay as separate nav items. **Orders Hub** at `/partner/orders` is the CRM home (desk + requests + insights + queue). **Order detail** at `/partner/orders/[id]`.



**Admin dashboard:** **Laundries** stays in Operations nav. **Orders Hub** at `/admin/orders` collapses Customers / Customer Desk / Booking requests into hub tabs.



**Assisted doorstep vs walk-in:** Desk **Place doorstep** uses assisted create (`order_source=assisted_partner` when Slice 2 lands) and **bypasses** `FEATURE_ONLINE_BOOKING`. Walk-in remains the in-shop short path from the same desk (hub **Find customer** tab).


