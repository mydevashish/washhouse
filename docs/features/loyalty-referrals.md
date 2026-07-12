# Feature: Loyalty, referrals, coupons

> Status: planned  
> Last updated: 2026-06-01

## Scope (v1)

- Points on `delivered` orders (configurable rate)
- Referral codes (referrer + referee discount)
- Admin-created coupon codes

## Non-goals (v1)

- Complex tiers, gamification leaderboards

## Data model

- `loyalty_accounts`, `loyalty_transactions`
- `referral_codes`
- `coupons`, `coupon_redemptions`

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/loyalty/me` | Balance | customer |
| POST | `/api/v1/orders/{id}/apply-coupon` | Apply code | customer |
| POST | `/api/v1/referrals/claim` | Claim referral | customer |
