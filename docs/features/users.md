# Feature: User profile and addresses

> Status: planned  
> Owner: backend-architect  
> Last updated: 2026-06-01

## Problem

Customers need saved delivery addresses and profile details for repeat bookings.

## API surface

| Method | Path | Purpose | Auth |
| ------ | ---- | ------- | ---- |
| GET | `/api/v1/users/me` | Current user | authenticated |
| PATCH | `/api/v1/users/me` | Update profile | authenticated |
| GET | `/api/v1/users/me/addresses` | List addresses | customer |
| POST | `/api/v1/users/me/addresses` | Add address | customer |
| PATCH | `/api/v1/users/me/addresses/{id}` | Update | customer |
| DELETE | `/api/v1/users/me/addresses/{id}` | Soft delete | customer |

## Data model

- `user_addresses` (exists): label, line1, line2, city, state, pincode, lat, lng, is_default

## Frontend surface

- Route: `/account`
- `frontend/features/auth/` or `frontend/app/(app)/account/`

## Acceptance criteria

- [ ] One default address per user enforced
- [ ] Pincode validation for India (6 digits)
