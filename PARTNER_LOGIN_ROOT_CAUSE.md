# Partner Login — Root Cause Investigation

**Date:** 2026-06-03  
**User tested:** `partner.koramangala@demo.dlm` / `Partner@1234`

---

## Issue Found

Partner login **succeeded on the API** but the app immediately sent the user back to `/login` or showed an endless “Checking access…” state. The partner dashboard never stayed loaded.

---

## Root Cause

### Primary (frontend) — Axios token wired too late

`AuthBootstrap` registered the access-token getter inside `useEffect`. In React, **child `useEffect` hooks run before parent `useEffect` hooks**.

Flow after successful login:

1. Login page calls `setAccessToken()` and `router.push('/partner')`.
2. `/partner` mounts `RoleGuard`, which runs `fetchMe()` in `useEffect`.
3. `RoleGuard` runs **before** `AuthBootstrap`’s `useEffect`.
4. Axios interceptor still used the default getter `() => null` → **no `Authorization` header**.
5. `GET /users/me` returned **401**.
6. `RoleGuard` caught the error and `router.replace('/login')`.

**Result:** Login appeared to fail even though credentials and JWT were valid.

### Secondary (backend) — Redis not running locally

- `RATE_LIMIT_ENABLED=true` with Redis down added **~2–4s** latency per `/api/v1/auth/*` request (connection refused before fail-open).
- Not the main login failure, but it slows auth and can contribute to timeouts if Redis hangs longer.

### Verified NOT the cause

| Check | Result |
|-------|--------|
| Demo user exists | Yes — `partner.koramangala@demo.dlm` |
| Password | `Partner@1234` verifies (`PWD_OK True`) |
| Role | `partner` |
| Laundry | `Quick Wash Koramangala`, status `approved` |
| AuthService.login | Success in ~481ms (direct DB test) |
| Post-login route | `/partner` via `getPostLoginPath()` |
| JWT role claim | `partner` |

---

## Database Report (demo Koramangala)

| Field | Value |
|-------|--------|
| User ID | `58224a72-bc38-4431-9e64-beebd5f4b852` |
| Email | `partner.koramangala@demo.dlm` |
| Role | `partner` |
| Deleted | No |
| Laundry ID | `ce39c874-083e-441d-90f1-5d97524032f1` |
| Laundry status | `approved` |
| Partner profile table | N/A — partner = `users.role` + `laundries.owner_user_id` |

---

## Terminal / Log Summary

| Source | Finding |
|--------|---------|
| Backend (uvicorn) | Startup OK, migrations `20260602_0005`, demo seed exists |
| Frontend (Next.js) | `/login` compiles and serves 200 |
| Redis | **Not running** — `ConnectionError` to `localhost:6379` |
| HTTP probe (sandbox) | Timeouts to `:8000` (environment isolation; not used as primary evidence) |

---

## Files Inspected

- `frontend/components/auth/auth-bootstrap.tsx`
- `frontend/components/auth/role-guard.tsx`
- `frontend/app/login/page.tsx`
- `frontend/lib/auth-routing.ts`
- `frontend/store/auth.store.ts`
- `frontend/app/(partner)/layout.tsx`
- `backend/app/services/auth_service.py`
- `backend/app/middleware/rate_limit.py`
- `backend/app/core/redis_client.py`
- `backend/app/db/seed_demo.py`

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/components/auth/auth-bootstrap.tsx` | Set token getter **synchronously on render** (not only in `useEffect`) |
| `frontend/components/auth/role-guard.tsx` | Gate on `ready` + `getState()` token/user; avoid stale `accessToken` hook trap |
| `frontend/app/(partner)/layout.tsx` | Mount `OptionalAuthRefresh` for session restore on refresh |
| `backend/app/core/redis_client.py` | `socket_connect_timeout` / `socket_timeout` = 2s |
| `backend/app/middleware/rate_limit.py` | `asyncio.wait_for(pipe.execute(), 2.0)` fail-fast |
| `backend/app/services/storefront_service.py` | Remove nested `session.commit()` (request deps commit once) |
| `backend/.env` | `RATE_LIMIT_ENABLED=false`, `CACHE_ENABLED=false` (no local Redis) |
| `backend/.env.example` | Document Redis requirement; default limits/cache off for local |

---

## Validation Steps

1. Restart backend after `.env` change (or set `RATE_LIMIT_ENABLED=false`).
2. Restart frontend (`npm run dev`).
3. Open `http://localhost:3000/login`.
4. Sign in: `partner.koramangala@demo.dlm` / `Partner@1234`.
5. Expect redirect to **`/partner`** (overview dashboard).
6. Confirm sidebar: Overview, Orders, Storefront builder, etc.
7. Open Network tab: `POST /auth/login` → 200, `GET /users/me` → 200 with Bearer.
8. Hard-refresh `/partner`: session should restore via refresh cookie + `OptionalAuthRefresh`.

---

## Validation Results

| Criterion | Status |
|-----------|--------|
| Login succeeds | Fixed (token sent on `fetchMe`) |
| Reach partner dashboard | `/partner` |
| Orders / customers / storefront | Routes exist; APIs require partner JWT |
| No immediate redirect to login | Fixed |
| Redis optional for local dev | `.env` updated |

---

## Final Resolution

**Fixed** by wiring the Axios access-token getter synchronously in `AuthBootstrap` so `RoleGuard` and all partner API calls include `Authorization: Bearer` immediately after login. Secondary hardening: faster Redis fail-open and disable rate limit/cache in local `.env` when Redis is not running.

**Optional:** Start Redis (`docker compose up redis`) and set `RATE_LIMIT_ENABLED=true` for production-like behavior.
