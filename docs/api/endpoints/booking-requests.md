# Booking Requests API

> Status: **implemented** (Slice 2–6 — services + HTTP APIs + suggest-laundries + notify stubs + **convert → assisted order**)
> Last updated: 2026-08-03  
> Feature: [booking-requests.md](../../features/booking-requests.md)  
> Envelope: standard `{ "data": …, "meta": … }` per `.cursor/rules/05-api-standards.md`

## Book Now backend target (Slice 2 decision)

**Replace** Book Now’s `order-help` marketing contact path with `POST /api/v1/booking-requests`.

| Surface | Backend |
| ------- | ------- |
| Book Now dialog (`BookPickupForm`) | `POST /booking-requests` |
| General contact / franchise forms | unchanged — `POST /marketing/contact`, `POST /marketing/franchise-inquiries` |

Historical `order-help` rows in `marketing_contact_submissions` are **not** auto-migrated into `booking_requests` (optional one-shot backfill later).

## Auth overview

| Surface | Auth |
| ------- | ---- |
| `POST /booking-requests` | Public (no JWT); rate-limited |
| `/admin/booking-requests/*` | JWT role `admin` |
| `/partner/booking-requests/*` | JWT role `partner` (or staff bound to laundry); laundry from token — **never** trust client `laundry_id` for scope |

## Enums

### `BookingRequestStatus`

`new` | `reviewing` | `assigned` | `contacted` | `confirmed` | `converted_to_order` | `declined` | `expired` | `cancelled`

### `BookingRequestSource`

`marketing_home` | `stores` | `services` | `deep_link` | `admin_created` | `partner_created`

### `BookingRequestPriority`

`normal` | `high` | `urgent`

### `BookingRequestServiceType`

Align with Book Now constants (extendable):

`wash-fold` | `wash-iron` | `premium-laundry` | `dry-clean` | `shoe-cleaning` | `curtain-cleaning` | `other`

### `BookingRequestPreferredTime`

`morning` | `afternoon` | `evening` | `flexible`

### `BookingRequestCreatedByRole`

`public` | `admin` | `partner`

### `BookingRequestMessageVisibility`

`customer_facing` | `internal`

### `BookingRequestEventType`

`created` | `updated` | `status_changed` | `assigned` | `transferred` | `released` | `responded` | `note_added` | `soft_deleted` | `restored` | `converted` | `expired`

### `BookingRequestSlaBadge` (computed, response-only)

`fresh` | `aging` | `overdue` | `met` | `na`

## Shared resource shape

```json
{
  "id": "uuid",
  "public_code": "BR-K7M2QX",
  "customer_name": "Priya Sharma",
  "phone_e164": "+919876543210",
  "service_type": "wash-fold",
  "preferred_time_window": "morning",
  "address_text": "Near Koramangala water tank",
  "city": "Bengaluru",
  "pincode": "560034",
  "notes": "≈8 kg",
  "source": "marketing_home",
  "status": "new",
  "priority": "normal",
  "sla_badge": "fresh",
  "sla_age_seconds": 420,
  "assigned_laundry_id": null,
  "assigned_laundry_name": null,
  "assigned_at": null,
  "assigned_by_user_id": null,
  "converted_order_id": null,
  "created_by_role": "public",
  "created_by_user_id": null,
  "last_response_at": null,
  "closed_at": null,
  "deleted_at": null,
  "created_at": "2026-08-03T06:30:00Z",
  "updated_at": "2026-08-03T06:30:00Z",
  "whatsapp_url": "https://wa.me/919876543210?text=...",
  "open_duplicate_ids": []
}
```

`whatsapp_url` is server-built (digits without `+`, prefilled English/Hinglish script with `public_code`). Clients may rebuild; server is source of truth for script versioning.

---

## Public

### `POST /api/v1/booking-requests`

Create a booking request from Book Now (or equivalent).

**Request**

| Field | Type | Required | Rules |
| ----- | ---- | -------- | ----- |
| `customer_name` | string | yes | 1–100, trimmed |
| `phone` | string | yes | Indian mobile → stored as `phone_e164` |
| `service_type` | enum | yes | see above |
| `preferred_time_window` | enum | yes | see above |
| `notes` | string | no | max 1500 |
| `address_text` | string | no | max 500 |
| `city` | string | no | max 100 |
| `pincode` | string | no | Indian 6-digit if present |
| `source` | enum | no | default `marketing_home`; allow `stores`, `services`, `deep_link` |

**Response `201`**

```json
{
  "data": {
    "id": "uuid",
    "public_code": "BR-K7M2QX",
    "status": "new"
  },
  "meta": {
    "request_id": "req_…",
    "timestamp": "…",
    "duplicate_warning": false,
    "open_request_ids": []
  }
}
```

When another **open** request exists for the same `phone_e164`:

- Still `201`
- `meta.duplicate_warning: true`
- `meta.open_request_ids: ["uuid", …]`

**Errors:** `422` validation · `429` rate limit (3/phone/hour, 5/IP/hour)

---

## Admin

Base: `/api/v1/admin/booking-requests`

### `GET /admin/booking-requests`

**Query**

| Param | Type | Notes |
| ----- | ---- | ----- |
| `page`, `page_size` | int | default 1 / 20; max 100 |
| `status` | enum \| csv | filter |
| `priority` | enum | |
| `sla_badge` | enum | computed filter |
| `assigned_laundry_id` | uuid | |
| `unassigned` | bool | `true` → `assigned_laundry_id IS NULL` |
| `phone` | string | normalized lookup |
| `q` | string | public_code / name / phone ilike |
| `source` | enum | |
| `include_deleted` | bool | default false |
| `created_from`, `created_to` | datetime | optional created_at range |
| `sort` | string | default `sla` (overdue first, then `created_at` desc); alt `created_at`, `updated_at`, `last_response_at` |

**Response `200`:** `data: BookingRequest[]` + pagination meta. Include `open_counts` in meta optional:

```json
"meta": {
  "pagination": { "page": 1, "page_size": 20, "total": 42, "total_pages": 3 },
  "inbox": { "new": 5, "reviewing": 2, "overdue": 3 }
}
```

### `POST /admin/booking-requests`

Create on behalf of a phone (CRM).

Same body as public **plus** optional:

| Field | Type | Required |
| ----- | ---- | -------- |
| `assigned_laundry_id` | uuid | no — if set, status starts `assigned` |
| `priority` | enum | no |
| `status` | enum | no — default `new` or `assigned` |

`created_by_role=admin`, `source=admin_created`.

### `GET /admin/booking-requests/{id}`

Detail + embedded recent messages (e.g. last 50) + events (last 50). Full lists via sub-routes if needed later.

### `PATCH /admin/booking-requests/{id}`

Partial update of mutable fields + optional `status` / `priority`.

Mutable: `customer_name`, `service_type`, `preferred_time_window`, `notes`, `address_text`, `city`, `pincode`, `priority`, `status`.

Status changes append `booking_request_events` (`status_changed`). Opening detail may auto-set `new` → `reviewing` via dedicated behavior (client calls PATCH or server side-effect documented as: **first admin GET detail while `new` promotes to `reviewing`** — prefer explicit `POST .../claim` to keep GET pure).

**Preferred claim endpoint (keeps GET idempotent):**

### `POST /admin/booking-requests/{id}/claim`

`new` → `reviewing`. Idempotent if already `reviewing`.

### `DELETE /admin/booking-requests/{id}`

Soft delete (`deleted_at=now()`). Event `soft_deleted`.

### `POST /admin/booking-requests/{id}/restore`

Clears `deleted_at`. Event `restored`.

### `POST /admin/booking-requests/{id}/assign`

```json
{
  "laundry_id": "uuid",
  "note": "optional internal note"
}
```

- Laundry must be **approved + active**
- Sets `assigned_laundry_id`, `assigned_at`, `assigned_by_user_id`
- Status → `assigned` (from `new` / `reviewing` / previous `assigned` on transfer)
- Transfer (already assigned to another laundry): event `transferred` (from/to in payload)
- First assign: event `assigned`

### `POST /admin/booking-requests/bulk-assign` (v1.1)

```json
{
  "request_ids": ["uuid", "uuid"],
  "laundry_id": "uuid"
}
```

**Response `200`:** per-id success/failure map. Partial success allowed.

### `GET /admin/booking-requests/{id}/suggest-laundries` (v1.1)

Returns up to N active (approved) laundries ranked for assign UI:

1. Pincode match in laundry `address_line` (when request has pincode)
2. City match
3. Rating (`avg_rating`)
4. Recently updated laundry (proxy for “active”)

Each suggestion includes `laundry_id`, `name`, `city`, `avg_rating`, `reason` (`pincode_match` | `city_match` | `nearest_area` | `highest_rated` | `recently_active`), and `score`. Empty list → UI falls back to manual picker only.

**Query:** `limit` (default 5, max 10)

### `POST /admin/booking-requests/{id}/messages`

```json
{
  "body": "Hi Priya, …",
  "visibility": "customer_facing"
}
```

- `customer_facing` updates `last_response_at`; if status ∈ {`assigned`} → auto `contacted`
- `internal` → event `note_added` only
- Event `responded` for customer-facing

### `GET /admin/booking-requests/by-phone/{phone}`

Phone may be raw or E.164; server normalizes.

**Response `200`**

```json
{
  "data": {
    "phone_e164": "+919876543210",
    "requests": [ /* summary rows newest first */ ],
    "messages_preview": [ /* optional flat recent across requests */ ]
  }
}
```

### `POST /admin/booking-requests/{id}/convert`

```json
{
  "force": false,
  "laundry_id": "uuid (optional — defaults to assigned_laundry_id)",
  "address": {
    "line1": "12 MG Road",
    "city": "Bengaluru",
    "pincode": "560034"
  },
  "pickup_at": "2026-08-05T10:00:00+05:30",
  "delivery_at": "2026-08-06T18:00:00+05:30",
  "items": [{ "service_id": "uuid", "quantity": 2 }],
  "notes": "optional",
  "payment_method": "cod"
}
```

- Requires `status=confirmed` unless `force=true` (admin only; `force` allows `contacted` or `confirmed`)
- Calls Customer Desk `create_assisted` (`order_source=assisted_admin`); phone/name from BR
- Address: body `address` / `address_id`, else BR `address_text` + city + pincode
- Sets `converted_order_id`, status `converted_to_order`, `closed_at`, event `converted`
- Idempotency key: `br-convert-{booking_request_id}`
- Response: `{ booking_request_id, public_code, status, converted_order_id, tracking_code, order_source, total_inr }`
- Already converted / terminal → `409 ALREADY_TERMINAL`
- Invalid status without force → `409 INVALID_STATUS_TRANSITION`

### `POST /admin/booking-requests/{id}/release`

Admin unassign: clears laundry, status → `reviewing`, event `released`.

---

## Partner

Base: `/api/v1/partner/booking-requests`  
All reads/writes scoped to token laundry. Foreign ids → **`404`**.

### `GET /partner/booking-requests`

Same filters as admin **except** `include_deleted`, `unassigned` (always assigned to self). Default exclude terminal optional via `status`.

### `POST /partner/booking-requests`

Create for own laundry:

- `source=partner_created`, `created_by_role=partner`
- Auto `assigned_laundry_id` = self, status `assigned`

### `GET /partner/booking-requests/{id}`

### `PATCH /partner/booking-requests/{id}`

Same mutable fields + status (legal subset). Cannot set `assigned_laundry_id`. Cannot soft-delete.

### `POST /partner/booking-requests/{id}/release`

Unassign back to admin inbox (`reviewing`, clear assignment).

### `POST /partner/booking-requests/{id}/messages`

Same as admin; visibility `customer_facing` | `internal`.

### `GET /partner/booking-requests/by-phone/{phone}`

Only returns requests (and messages) **for this laundry** involving that phone. If phone has only other-laundry history → empty `requests` (no cross-tenant leak).

### `POST /partner/booking-requests/{id}/convert`

Same body as admin **without** `force` (ignored if sent). Uses `assisted_partner` and the partner’s laundry.

---

## Error codes (domain)

| HTTP | `code` | When |
| ---- | ------ | ---- |
| 401 | `AUTH_FAILED` | Missing/invalid JWT |
| 403 | `FORBIDDEN` | Wrong role |
| 404 | `NOT_FOUND` | Missing or out-of-scope |
| 409 | `INVALID_STATUS_TRANSITION` | Illegal status move / convert without confirmed |
| 409 | `ALREADY_TERMINAL` | Mutate closed request / already converted |
| 422 | `VALIDATION_FAILED` | Pydantic / laundry inactive / missing address |
| 429 | `RATE_LIMITED` | Public create |

## WhatsApp script (server default)

```
Hi {customer_name}! This is WashHouse regarding booking {public_code}.
Service: {service_label}. Preferred: {time_label}.
Please reply with your pickup address / landmark so we can confirm. Thank you!
```

Digits for `wa.me`: strip non-digits from `phone_e164` (e.g. `919876543210`).

## Rate limits & security

- Public: reuse marketing contact style limits; store `client_ip` on create for abuse review (column on `booking_requests`)
- Validate phone with shared `validate_indian_phone`
- Partner scope enforced in service layer (not only query filter)
- Soft-deleted rows excluded unless admin `include_deleted`
- No public read-by-id (prevents IDOR on guest leads)

## Idempotency

- Public create: no idempotency key in v1 (duplicates allowed with warning)
- Admin/partner create: optional `Idempotency-Key` header (recommended for CRM double-submit) — **v1.1**

## Test matrix (minimum)

| Case | Expect |
| ---- | ------ |
| Public create happy path | 201 + row status `new` |
| Public invalid phone | 422 |
| Public rate limit | 429 |
| Admin list / assign / transfer | 200; partner sees after assign |
| Partner read other laundry id | 404 |
| Partner release | admin inbox `reviewing` |
| Message → `contacted` | status bump |
| Soft delete / restore | list visibility |
| Claim | `new` → `reviewing` |
| Convert happy (confirmed) | 200 + `converted_to_order` + order |
| Convert invalid status | 409 `INVALID_STATUS_TRANSITION` |
| Convert already converted | 409 `ALREADY_TERMINAL` |
