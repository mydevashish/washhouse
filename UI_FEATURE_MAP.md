# UI Feature Map — DLM Platform

**Last updated:** 2026-06-03  
**Purpose:** Every testable UI feature with navigation, role, data dependencies, and backend connection status.

**Legend — Backend connection:** ✅ Live API · ⚠️ Partial/stub · ❌ Not wired

---

## Authentication

| Feature | Navigation Path | Required Role | Required Test Data | Dependencies | API |
| ------- | --------------- | ------------- | ------------------ | ------------ | --- |
| Login (email) | `/login` | Public → any | User account | Auth API, refresh cookie | ✅ |
| Login (phone OTP) | `/login` → Phone OTP tab | Public | Phone number | OTP send/verify | ✅ |
| Register | `/register` | Public | Unique email | Auth register | ✅ |
| Forgot password | — | — | — | **No UI page** | ✅ API only |
| Reset password | — | — | — | **No UI page** | ✅ API only |
| Logout | User menu → Sign out | Any authenticated | Active session | POST `/auth/logout` | ✅ |
| Session idle timeout | Global (all routes) | Any authenticated | — | `GlobalIdleManager` | ✅ |
| Backend restart logout | Automatic | Any authenticated | Prior session | `/auth/session-info` | ✅ |

---

## Customer Marketplace

| Feature | Navigation Path | Required Role | Required Test Data | Dependencies | API |
| ------- | --------------- | ------------- | ------------------ | ------------ | --- |
| Landing page | `/` | Public | — | Marketing content | — |
| Discover laundries | `/discover` | Public | Approved laundries | `GET /laundries` | ✅ |
| Search laundries | `/discover?q=` | Public | Laundries in city | `GET /laundries/search` | ✅ |
| Laundry detail | `/discover/[id]` | Public | Laundry + services | `GET /laundries/{id}` | ✅ |
| Laundry storefront tab | `/discover/[id]` → Storefront | Public | Published storefront | Storefront API | ✅ |
| Reviews on detail | `/discover/[id]` → Reviews | Public | Reviews | `GET /laundries/{id}/reviews` | ✅ |
| Checkout | `/checkout/[laundryId]` | Customer | Address, services | Order create + payment | ✅ |
| My orders | `/orders` | Customer | Customer orders | `GET /orders` | ✅ |
| Order tracking | `/orders/[id]` | Customer | Order + events | Order detail, custody | ✅ |
| File dispute | `/orders/[id]` → Report issue | Customer | Delivered order | `POST /complaints` | ✅ |
| Dispute center | `/disputes` | Customer | Customer disputes | `GET /complaints` | ✅ |
| Account / loyalty | `/account` | Customer | User profile | `GET /loyalty/me` | ⚠️ Points not earned on orders |
| Become a partner | `/partners` | Public | — | Marketing | — |

**Customer mobile nav:** Discover · Orders · Account

---

## Admin Dashboard

| Feature | Navigation Path | Required Role | Required Test Data | Dependencies | API |
| ------- | --------------- | ------------- | ------------------ | ------------ | --- |
| Admin overview | Admin → `/admin` | Admin | Orders, laundries, complaints | `GET /admin/dashboard` | ✅ |
| Laundries list | Admin → Laundries | Admin | Laundries | `GET /admin/laundries/management` | ✅ |
| Create laundry | Admin → Laundries → Create | Admin | Partner user | `POST /admin/laundries` | ✅ |
| Customers | Admin → Customers | Admin | Customers | `GET /admin/users` | ✅ |
| Orders | Admin → Orders | Admin | Orders | `GET /admin/orders` | ✅ |
| Revenue | Admin → Revenue | Admin | Delivered/paid orders | Analytics API | ✅ |
| Commission | Admin → Commission | Admin | Platform settings | Commission API | ✅ |
| Approval center | Admin → Approval center | Admin | Pending laundries | `GET /admin/laundries/pending` | ✅ |
| Inventory changes | Admin → Inventory changes | Admin | Change requests | Inventory admin API | ✅ |
| Dispute center | Admin → Disputes | Admin | Open disputes | `GET /complaints/admin/*` | ✅ |
| Trust scores | Admin → Trust scores | Admin | Customers + laundries | Trust score APIs | ✅ |
| Fraud detection | Admin → Fraud detection | Admin | Fraud alerts | `GET /admin/fraud/alerts` | ✅ |
| Audit logs | Admin → Audit logs | Admin | Audit entries | `GET /admin/audit-logs` | ✅ |
| Notifications | Admin → Notifications | Admin | Dashboard metrics | **Stub** — derived from dashboard | ⚠️ |
| Settings | Admin → Settings | Admin | Platform settings | Settings API | ✅ |

---

## Partner Dashboard

| Feature | Navigation Path | Required Role | Required Test Data | Dependencies | API |
| ------- | --------------- | ------------- | ------------------ | ------------ | --- |
| Partner overview | Partner → `/partner` | Partner | Laundry, orders, analytics | Analytics + trust score | ✅ |
| Orders | Partner → Orders | Partner | Partner orders | `GET /partner/orders` | ✅ |
| Pickup requests | Partner → Pickup requests | Partner | Orders pre-pickup | Filtered orders | ✅ |
| Deliveries | Partner → Deliveries | Partner | Out for delivery orders | Filtered orders | ✅ |
| Customers | Partner → Customers | Partner | Past customers | `GET /partner/customers` | ✅ |
| Storefront builder | Partner → Storefront builder | Partner | Laundry + storefront | Storefront API | ✅ |
| Reviews | Partner → Reviews | Partner | Reviews | Reviews API | ✅ |
| Staff | Partner → Staff | Partner | Staff rows | `GET /partner/staff` | ✅ |
| Pricing & revenue | Partner → Pricing & revenue | Partner | Orders/revenue | Analytics | ✅ |
| Reports | Partner → Reports | Partner | Order history | Analytics | ⚠️ Basic |
| Notifications | Partner → Notifications | Partner | — | **Stub** — Zustand seed | ❌ |
| Audit logs | Partner → Audit | Partner | Audit entries | Limited | ⚠️ |
| Settings | Partner → Settings | Partner | Laundry profile | Partner settings | ✅ |
| Pickup evidence upload | Order card action | Partner | Active order | Pickup evidence API | ✅ |
| Inventory record | Order card action | Partner | Pre-pickup order | Inventory API | ✅ |
| Delivery proof + OTP | Order card action | Partner | Out for delivery | Delivery proof + OTP | ✅ |

---

## Orders (lifecycle features)

| Status | Visible in Admin | Partner | Customer | QA seed count |
| ------ | ---------------- | ------- | -------- | ------------- |
| Confirmed | ✅ | ✅ | ✅ | 162 |
| Pickup assigned | ✅ | ✅ | ✅ | 127 |
| Picked up | ✅ | ✅ | ✅ | 105 |
| Washing | ✅ | ✅ | ✅ | 86 |
| Ironing | ✅ | ✅ | ✅ | 75 |
| Ready | ✅ | ✅ | ✅ | 92 |
| Out for delivery | ✅ | ✅ | ✅ | 105 |
| Delivered | ✅ | ✅ | ✅ | 1152 |
| Cancelled | ✅ | ✅ | ✅ | 96 |

---

## Services & pricing

| Feature | Location | Data needed |
| ------- | -------- | ----------- |
| Laundry services | Discover detail, checkout | `laundry_services` rows per laundry |
| Partner pricing edit | Partner → Revenue / services | Active services |
| Commission rate | Admin → Commission | `platform_settings`, per-laundry override |

---

## Reviews

| Feature | Path | Data |
| ------- | ---- | ---- |
| Public reviews | Discover → laundry | 50+ reviews (QA seed) |
| Submit review | Order detail (delivered) | Delivered order without existing review |
| Partner reviews list | `/partner/reviews` | Reviews for partner laundry |

---

## Trust scores

| Feature | Path | Role | Data |
| ------- | ---- | ---- | ---- |
| Customer trust (admin) | `/admin/trust-scores` → Customer tab | Admin | Customers with trust_score events |
| Partner trust (admin) | `/admin/trust-scores` → Partner tab | Admin | Laundries with completed orders |
| Laundry trust (partner) | `/partner` overview card | Partner | Partner laundry + orders |

---

## Fraud detection

| Feature | Path | Role | Data |
| ------- | ---- | ---- | ---- |
| Fraud alerts list | `/admin/fraud` | Admin | `fraud_alerts` rows |
| Acknowledge / resolve | Alert detail | Admin | Open alerts |
| Risk summary cards | `/admin/fraud` top | Admin | Open alerts by level |

---

## Dispute center

| Feature | Path | Role | Data |
| ------- | ---- | ---- | ---- |
| File dispute | Customer order tracking | Customer | Delivered order |
| My disputes | `/disputes` | Customer | Customer complaints |
| Admin investigation | `/admin/disputes` | Admin | Complaints + order evidence bundle |

---

## Loyalty program

| Feature | Path | Role | Data | Status |
| ------- | ---- | ---- | ---- | ------ |
| Points balance | `/account` | Customer | `loyalty_accounts` | ⚠️ API exists; no earn on order |
| Referral code | `/account` | Customer | `referral_codes` | ✅ Auto-created |

---

## Subscriptions

| Feature | Path | Data | Status |
| ------- | ---- | ---- | ------ |
| List plans | API only / future UI | `subscription_plans` | ⚠️ Seeded via `seed_marketplace.py`; no customer UI |
| Subscribe | API | User + plan | ⚠️ Backend stub |

---

## Reports

| Feature | Path | Role | Status |
| ------- | ---- | ---- | ------ |
| Partner reports | `/partner/reports` | Partner | ⚠️ Basic analytics view |
| Admin revenue | `/admin/revenue` | Admin | ✅ |

---

## Evidence chain (order-level, not top-level nav)

| Feature | Trigger | Data required | QA seed |
| ------- | ------- | ------------- | ------- |
| Pickup photos | Partner upload | Order in pickup flow | ❌ Not on bulk orders |
| Inventory verification | Partner + customer confirm | Pre-pickup | ❌ Not on bulk orders |
| Chain of custody timeline | Auto on milestones | Order events | ⚠️ Status events only |
| Delivery proof | Partner upload | Out for delivery | ❌ Not on bulk orders |
| Delivery OTP | Partner verify | Proof uploaded | ❌ Not on bulk orders |

---

## Modules without dedicated UI

| Module | Backend | Frontend |
| ------ | ------- | -------- |
| WebSocket order updates | ✅ `/ws/orders` | ⚠️ Partial |
| Payments webhook | ✅ | N/A |
| Pickup evidence blob serve | ✅ JWT | In order cards |
| Complaint photos | ✅ | In dispute forms |

---

## Quick reference — who can access what

| Route prefix | Guard | Roles |
| ------------ | ----- | ----- |
| `/discover`, `/` | Public | All |
| `/login`, `/register` | Public | All |
| `/orders`, `/account`, `/disputes`, `/checkout` | AuthGuard | Any authenticated (intended customer) |
| `/partner/*` | RoleGuard per page | partner, admin, super_admin |
| `/admin/*` | RoleGuard per page | admin, super_admin |
