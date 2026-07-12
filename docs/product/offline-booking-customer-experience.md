# Offline booking — customer experience contact rules

**Last updated:** 2026-07-03  
**Canonical doc:** merge into `CUSTOMER_EXPERIENCE_ENHANCEMENT.md` Part 3–4 when writable.

## Part 3 — Customer contact

### Online booking enabled (default)

| User | Browse | See phone | Call |
|------|--------|-----------|------|
| **Guest** | Yes | No | Redirect to login |
| **Registered customer** | Yes | Yes (if partner enabled) | Yes + tracked |

### Offline booking (`FEATURE_ONLINE_BOOKING=false`)

| User | Browse | See phone | Call / WhatsApp |
|------|--------|-----------|-----------------|
| **Guest** | Yes | Yes (if partner enabled) | Yes — no login |
| **Registered customer** | Yes | Yes (if partner enabled) | Yes + tracked |

`GET /laundries/{id}/contact` returns `requires_login: false`, `offline_booking_mode: true`, and phone/WhatsApp for approved laundries with contact channels enabled.

## Part 4 — WhatsApp & callback (offline)

| Action | Guest | Registered customer |
|--------|-------|---------------------|
| **Call shop** | `tel:` (no login) | `tel:` + track |
| **WhatsApp shop** | `wa.me` (no login) | `wa.me` + track |
| **Request callback** | Hidden | Hidden |
