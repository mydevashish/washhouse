# Customer Desk API

> Status: **Slices 1–2 implemented** (lookup + history + assisted create/quote)  
> Last updated: 2026-08-04  
> Feature: [customer-desk.md](../../features/customer-desk.md)  
> Envelope: standard `{ "data": …, "meta": … }` per `.cursor/rules/05-api-standards.md`

## Auth overview

| Surface | Auth |
| ------- | ---- |
| `/admin/customers/*` (desk) | JWT role `admin` / `super_admin` |
| `/partner/customers/*` (desk) | JWT role `partner` bound to a laundry; **laundry from token/DB — never trust client `laundry_id` for scope** |
| `/admin/customer-desk/orders*` | admin; `Idempotency-Key` required on POST create |
| `/partner/customer-desk/orders*` | partner; server forces own `laundry_id`; `Idempotency-Key` required on POST create |

## Slice 1 — Lookup + history (implemented)

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| `GET` | `/api/v1/admin/customers/lookup?phone=` \| `?user_id=` | admin | Profile stub; unregistered valid phone → 200 empty guest |
| `GET` | `/api/v1/admin/customers/search?q=` | admin | Name / phone fragment / exact phone / UUID → up to 20 profiles |
| `GET` | `/api/v1/admin/customers/{user_id}/orders` | admin | Paginated; filters `status`, `date_from`, `date_to`, `q` (tracking) |
| `GET` | `/api/v1/admin/customers/orders?phone=` | admin | Guest / phone-keyed history |
| `GET` | `/api/v1/partner/customers/lookup?phone=` \| `?user_id=` | partner | Scoped `order_count`; guest with no own-laundry touch → **404**; registered `user_id` returns profile even when `order_count=0` |
| `GET` | `/api/v1/partner/customers/search?q=` | partner | Name / phone among customers with own-laundry orders only |
| `GET` | `/api/v1/partner/customers/{user_id}/orders` | partner | **Strict** `laundry_id` scope |
| `GET` | `/api/v1/partner/customers/orders?phone=` | partner | Guest phone history, laundry-scoped |

Also: `GET /api/v1/admin/orders` accepts optional `customer_phone` and `user_id` filters.

### `CustomerDeskProfile` (Slice 1 stub)

```json
{
  "user_id": "uuid-or-null",
  "name": "Priya Sharma",
  "phone": "+919876543210",
  "email": "priya@example.com",
  "registered": true,
  "order_count": 4,
  "last_order_at": "2026-07-28T10:00:00Z"
}
```

Partner `order_count` / `last_order_at` are scoped to own laundry.

### `CustomerDeskOrderRow`

```json
{
  "id": "uuid",
  "tracking_code": "DLMA1B2C3D",
  "status": "washing",
  "order_source": "walk_in",
  "laundry_id": "uuid",
  "laundry_name": "Sparkle Wash",
  "customer_name": "Priya Sharma",
  "customer_phone": "+919876543210",
  "subtotal_inr": "400.00",
  "delivery_fee_inr": "30.00",
  "cgst_inr": "38.70",
  "sgst_inr": "38.70",
  "total_inr": "507.40",
  "currency": "INR",
  "pickup_at": "2026-08-04T09:00:00Z",
  "delivery_at": "2026-08-05T18:00:00Z",
  "created_at": "2026-08-04T08:00:00Z",
  "created_by_user_id": "uuid-or-null",
  "item_summary": "Wash & Fold ×2, Dry Clean ×1"
}
```

---

## Enums

### `OrderSource` (extended)

Existing: `online` | `walk_in`  
**New:** `assisted_admin` | `assisted_partner`

### Assisted create implies

| Source | Who | Lifecycle |
| ------ | --- | --------- |
| `assisted_admin` | Admin JWT | Doorstep (online status path) |
| `assisted_partner` | Partner/staff JWT | Doorstep (online status path) |
| `walk_in` | Existing walk-in API only | In-shop shortcut (unchanged) |

## Shared shapes (full desk — Slice 2+)

### `AssistedOrderCreateRequest`

```json
{
  "phone": "+919876543210",
  "customer_name": "Priya Sharma",
  "laundry_id": "uuid",
  "address_id": "uuid-or-null",
  "address": {
    "line1": "12 MG Road",
    "line2": "Near Metro",
    "city": "Bengaluru",
    "pincode": "560001",
    "landmark": "Blue gate"
  },
  "pickup_at": "2026-08-04T09:00:00Z",
  "delivery_at": "2026-08-05T18:00:00Z",
  "items": [{ "service_id": "uuid", "quantity": 2 }],
  "notes": "Call on arrival",
  "payment_method": "cod",
  "reorder_from_order_id": "uuid-or-null",
  "save_address_to_user": false
}
```

### `AssistedOrderQuoteResponse`

```json
{
  "subtotal_inr": "400.00",
  "delivery_fee_inr": "30.00",
  "gst_rate": "18.00",
  "cgst_inr": "38.70",
  "sgst_inr": "38.70",
  "total_inr": "507.40",
  "currency": "INR",
  "warnings": ["Service 'Old Iron' is no longer offered and was skipped"]
}
```

---

## Slice 2 — Assisted create (implemented)

| Method | Path | Auth |
| ------ | ---- | ---- |
| `POST` | `/api/v1/admin/customer-desk/orders/quote` | admin |
| `POST` | `/api/v1/admin/customer-desk/orders` | admin (`Idempotency-Key` required) |
| `POST` | `/api/v1/partner/customer-desk/orders/quote` | partner |
| `POST` | `/api/v1/partner/customer-desk/orders` | partner (`Idempotency-Key` required) |

Creates order with `order_source=assisted_admin|assisted_partner`, GST via shared desk pricing (same CGST/SGST + delivery fee as online), bypasses `FEATURE_ONLINE_BOOKING`.  
Walk-in remains `POST /api/v1/partner/walk-in-orders` (unchanged).

---

## AuthZ / IDOR test matrix (required)

| Case | Expect |
| ---- | ------ |
| Partner A lists orders for phone that only ordered at laundry B | Empty list or 404 on profile — **never** B’s rows |
| Partner A GET order detail by id for laundry B order | `404` (existing partner order detail) |
| Partner A assisted create with `laundry_id` of B | Ignored / forced to A — order lands on A only |
| Admin can see both A and B history for same phone | `200` with both rows |
| Customer JWT hits desk endpoints | `401/403` |
| Assisted create without address | `422` |
| Guest create with valid address | `201`, `user_id=null`, snapshot columns set |

---

## Factory note (implementation)

Introduce an internal service helper (Slice 2: `OrderFactory` / `AssistedOrderService`) that:

1. Resolves user by phone (optional).
2. Validates laundry + catalog lines.
3. Computes GST / delivery fee / commission (same as `OrderService.create_order`).
4. Persists `Order` + `OrderItem` + `OrderStatusEvent` + custody event with actor role admin/partner.
5. Does **not** require customer JWT.

Booking-request convert calls this factory with actor + address mapped from BR fields (`POST …/booking-requests/{id}/convert`).

## Out of scope endpoints

- Password reset, wallet, loyalty adjust
- SMS send
- Auto-assign laundry
- Public/customer desk
