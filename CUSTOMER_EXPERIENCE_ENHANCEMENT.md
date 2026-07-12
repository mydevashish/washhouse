# Customer Experience Enhancement

> Detailed service catalog, enhanced storefront, contact management, Q&A, and engagement analytics  
> Last updated: 2026-06-03

## Overview

This release lets customers **understand exactly what services a laundry provides** before ordering, while giving partners rich storefront tools and admins full platform control.

```
Customer journey
  Discover → Storefront (gallery, facilities, services)
           → Browse / search / filter / sort services
           → View service details
           → Contact (call / WhatsApp / callback) — registered only
           → Ask questions → see answered Q&A
           → Checkout

Partner journey
  Service catalog CRUD → Storefront builder → Engagement analytics → Answer questions

Admin journey
  Categories & facility tags → Storefront approval → Q&A moderation → Platform analytics
```

---

## Part 1 — Detailed service catalog

### Service fields

| Field | Description |
|-------|-------------|
| **Service name** | e.g. Men's Shirt Wash + Iron |
| **Category** | Admin-managed slug (wash, iron, dry-clean, …) |
| **Description** | Customer-facing detail |
| **Price** | INR per unit |
| **Estimated duration** | Minutes |
| **Express available** | Boolean |
| **Pickup / Delivery available** | Boolean |
| **Status** | `active`, `paused`, `draft` (`catalog_status`) |
| **Popularity** | `view_count`, `order_count` for sort |

### Partner APIs

| Method | Path |
|--------|------|
| GET | `/api/v1/partner/services` |
| POST | `/api/v1/partner/services` |
| PATCH | `/api/v1/partner/services/{id}` |
| DELETE | `/api/v1/partner/services/{id}` |

**UI:** `/partner/services` — `PartnerServiceCatalogView`

### Customer experience

| Feature | Implementation |
|---------|----------------|
| Browse services | `ServiceCatalogBrowser` on storefront |
| Search | `?q=` on catalog API |
| Filter by category | `?category=` |
| Filter express | `?express_only=true` |
| Sort by price | `?sort=price_asc` / `price_desc` |
| Sort by popularity | `?sort=popular` (default) |
| Service details | `GET /laundries/{id}/services/{service_id}` (+ view tracking) |

---

## Part 2 — Enhanced storefront builder

Existing builder extended with:

| Feature | Field / section |
|---------|-----------------|
| Store banner | `cover_url` |
| Store logo | `logo_url` |
| Gallery | `gallery` (upload + categories) |
| Machine photos | `machines` |
| Team photos | `team` |
| About us | `brand_story` |
| Years of experience | `years_in_business` |
| Working hours | `working_hours` (JSON editor in profile tab) |
| Pickup / delivery radius | `pickup_radius_km`, `delivery_radius_km` |
| Publish toggle | `is_published` |
| Storefront approval | `approval_status` (admin) |

### Facilities (platform tags)

Seeded facility tags align with marketplace standards:

- Steam Iron, Express Service, Premium Care, Eco Friendly
- Commercial Machines, Same Day Delivery, 24 Hour Delivery, Pickup & Delivery

Partners select from `FACILITY_OPTIONS` / admin-managed `platform_facility_tags`.

**UI:** `/partner/storefront`

Public storefront enforces `is_published` and `approval_status != rejected`.

---

## Part 3 — Registered customer contact

### Rules

| User | Browse | See phone | Call |
|------|--------|-----------|------|
| **Guest** | Yes | No | Redirect to login |
| **Registered customer** | Yes | Yes (if partner enabled) | Yes + tracked |

Phone numbers are **never exposed** in HTML for guests — returned only via authenticated contact API after login.

### Call tracking

Events stored in `storefront_engagement_events`:

| Field | Value |
|-------|-------|
| `event_type` | `call_click` |
| `customer_id` | Logged-in customer |
| `laundry_id` | Target shop |
| `source` | e.g. `storefront` |
| `created_at` | Timestamp |

Duration tracking reserved for future telephony integration.

---

## Part 4 — WhatsApp & callback

| Action | Guest | Registered customer |
|--------|-------|---------------------|
| **Call shop** | Login redirect | `tel:` + track |
| **WhatsApp shop** | Login redirect | `wa.me` deep link + track |
| **Request callback** | Hidden | Form → `callback_requests` table |

Partner controls visibility per channel:

- `show_call`, `show_whatsapp`, `show_callback`
- `contact_phone`, `whatsapp_number`

**UI:** `StorefrontContactSection` on public storefront

---

## Part 5 — Customer questions

Customers (`customer` role) submit questions; partners answer; admins moderate.

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting partner reply |
| `answered` | Visible on storefront Q&A |
| `hidden` / `removed` | Admin moderated |

### APIs

| Method | Path | Role |
|--------|------|------|
| GET | `/laundries/{id}/questions` | Public (answered only) |
| POST | `/laundries/{id}/questions` | Customer |
| GET | `/partner/questions` | Partner |
| POST | `/partner/questions/{id}/answer` | Partner |
| GET | `/admin/customer-experience/questions` | Admin |
| POST | `/admin/customer-experience/questions/{id}/moderate` | Admin |

---

## Part 6 — Partner analytics

`GET /api/v1/partner/engagement-analytics?days=30`

| Metric | Source |
|--------|--------|
| Store views | `store_view` events |
| Service views | `service_view` events |
| Calls generated | `call_click` |
| WhatsApp clicks | `whatsapp_click` |
| Questions asked | `question_asked` + `customer_questions` |
| Callback requests | `callback_request` |
| Conversion rate | (calls + WhatsApp + callbacks) / store views |

---

## Part 7 — Admin controls

**Route:** `/admin/customer-experience`

| Control | API prefix |
|---------|------------|
| Service categories | `/admin/customer-experience/categories` |
| Facility tags | `/admin/customer-experience/facility-tags` |
| Storefront approval | `/admin/customer-experience/storefronts/*` |
| Question moderation | `/admin/customer-experience/questions/*` |
| Engagement overview | `/admin/customer-experience/overview` |

Default categories seeded: Wash, Iron, Wash + Iron, Dry Clean, Premium Care, Home Linen, Specialty.

---

## Part 8 — UI/UX

- **Mobile-first** service cards with express badges and duration hints
- **Dark / light mode** via existing design tokens (`bg-card`, `text-muted-foreground`, gradients)
- **Marketplace-quality** storefront hero, gallery grid, facility chips
- **Urban Company / Zomato-inspired** contact action bar with clear guest gating
- Responsive catalog search bar and filter controls

---

## Database

Migration: `20260603_0029_customer_experience.py`

| Table | Purpose |
|-------|---------|
| `service_categories` | Admin taxonomy |
| `platform_facility_tags` | Admin facility list |
| `storefront_engagement_events` | Analytics + call tracking |
| `customer_questions` | Q&A |
| `callback_requests` | Callback queue |

Extended:

- `laundry_services` — description, duration, express, pickup/delivery, status, view/order counts
- `laundry_storefronts` — WhatsApp, contact visibility, approval status

```bash
cd backend && python -m alembic upgrade head
```

---

## File map

### Backend

| Path | Role |
|------|------|
| `app/models/customer_experience.py` | Q&A, events, categories |
| `app/models/laundry.py` | Extended `LaundryService` |
| `app/models/storefront.py` | Contact visibility fields |
| `app/repositories/customer_experience.py` | Queries |
| `app/repositories/partner_service_catalog.py` | Partner service CRUD |
| `app/services/customer_experience_service.py` | Contact, Q&A, analytics |
| `app/services/partner_service_catalog_service.py` | Catalog logic |
| `app/services/admin_customer_experience_service.py` | Admin controls |
| `app/api/v1/endpoints/partner_service_catalog.py` | Partner APIs |
| `app/api/v1/endpoints/customer_experience.py` | Public + customer APIs |
| `app/api/v1/endpoints/admin_customer_experience.py` | Admin APIs |

### Frontend

| Path | Role |
|------|------|
| `services/customer-experience.ts` | API client |
| `services/partner-service-catalog.ts` | Partner catalog client |
| `features/discover/detail/service-catalog-browser.tsx` | Search/filter/sort UI |
| `features/storefront/storefront-contact-section.tsx` | Call / WhatsApp / callback |
| `features/storefront/storefront-questions-section.tsx` | Q&A |
| `features/partner/views/partner-service-catalog-view.tsx` | Partner catalog manager |
| `features/admin/views/admin-customer-experience-view.tsx` | Admin dashboard |

---

## Test plan

1. Run migration `20260603_0029`.
2. Partner → **Service catalog** → add Men's Shirt Wash + Iron with description and price.
3. Customer storefront → search "shirt", filter category, sort by price.
4. **Guest** → click Call → redirected to login; phone not in page source.
5. **Customer login** → Call / WhatsApp work; events appear in engagement analytics.
6. Submit callback request → row in `callback_requests`.
7. Ask question as customer → partner answers → appears in Q&A section.
8. Admin moderates question → hidden from public list.
9. Partner toggles contact visibility off → buttons disappear.
10. Unpublish storefront → public page falls back to legacy detail view.

---

## Related docs

- [docs/features/laundry-search.md](./docs/features/laundry-search.md)
- [docs/features/partner-dashboard.md](./docs/features/partner-dashboard.md)
- [SETTLEMENT_MANAGEMENT.md](./SETTLEMENT_MANAGEMENT.md)

---

## Future enhancements

- Structured working-hours editor (day-by-day UI)
- Telephony integration for call duration
- Partner notifications on callback / new question
- Service popularity auto-rank in search results
- Full admin UI for category CRUD (API ready)
