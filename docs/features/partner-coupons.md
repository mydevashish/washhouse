# Feature: Partner shop coupons

> Status: **shipped** (2026-08-09)  
> Owner: product-manager → backend-architect + frontend-architect

## Scope

- Each laundry shop manages its own coupon codes (Operations sidebar → **Coupons**).
- Codes are uppercase, unique per shop, with `discount_percent` (1–100) and active flag.
- Validate at create order (walk-in + doorstep) via `POST /api/v1/partner/coupons/validate`.
- Apply on order save: `coupon_code` + `discount_inr` on `orders`.

## API

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/api/v1/partner/coupons` | List shop coupons |
| POST | `/api/v1/partner/coupons` | Create |
| PATCH | `/api/v1/partner/coupons/{id}` | Update |
| DELETE | `/api/v1/partner/coupons/{id}` | Delete |
| POST | `/api/v1/partner/coupons/validate` | Validate code for checkout |

Walk-in create: optional `coupon_code` on `WalkInOrderCreateRequest`.  
Assisted partner create: optional `coupon_code` on `AssistedOrderCreateRequest`.

## Non-goals

- Platform-wide promo campaigns (legacy global `coupons` rows without `laundry_id` are ignored).
- Customer self-serve coupon entry in the consumer app (this pack = partner counter only).
