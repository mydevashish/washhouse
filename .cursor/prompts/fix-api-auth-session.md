# Prompt: Fix API auth & session

Act as **backend-architect** + **frontend-architect** + **security-reviewer**.

## Prerequisite

Connectivity phase green (`fix-api-connectivity-env.md`). Failures are **Category C or D** (401/403, missing Bearer, refresh loops).

## Goal

Customer, partner, and admin users can log in, stay authenticated, and call role-guarded endpoints without spurious 401/403.

## Key files

| Concern | File |
| ------- | ---- |
| Axios Bearer injection | `frontend/lib/api.ts` |
| Token getter wiring | `frontend/components/auth/auth-bootstrap.tsx` |
| Auth API calls | `frontend/services/auth.ts` |
| Auth store | `frontend/store/auth.store.ts` |
| Session invalidation | `frontend/lib/session-logout.ts`, `frontend/lib/session-instance.ts` |
| BE auth endpoints | `backend/app/api/v1/endpoints/auth.py` |
| JWT deps | `backend/app/api/deps.py` (or equivalent `get_current_*`) |
| Force logout on restart | `backend/.env` → `FORCE_LOGOUT_ON_RESTART=true` |

## Investigation steps

### 1. Confirm Bearer header on guarded calls

In browser DevTools → Network → pick a failing request:

- Request headers must include `Authorization: Bearer <jwt>`
- `withCredentials: true` on axios (for httpOnly refresh cookie)

If missing: `AuthBootstrap` may not be mounted, or `accessToken` is null when query runs.

**Known pitfall:** `AuthBootstrap` must call `setAccessTokenGetter` synchronously on render (not in `useEffect`) — see comment in `auth-bootstrap.tsx`.

### 2. Login flow per role

Test each audience from `/login` or `/staff`:

| Role | Login path | Post-login route | Test endpoint |
| ---- | ---------- | ---------------- | ------------- |
| Customer | `/login` | `/discover` or `/orders` | `GET /users/me` |
| Partner | `/login?audience=partner` | `/partner` | `GET /partner/orders` |
| Admin | `/login?audience=admin` | `/admin` | `GET /admin/dashboard` |

Check `frontend/lib/auth-login-audience.ts` for audience routing.

### 3. Refresh token flow

`frontend/services/auth.ts` → `refreshSession()` posts to `/auth/refresh` with cookies.

Verify:
- Refresh cookie set on login (`Set-Cookie` in Network tab)
- 401 on expired access token triggers refresh (if interceptor implements retry — check `api.ts`; note: current interceptor logs but may not auto-retry — document gap if found)
- Stale refresh codes handled: `AUTH_TOKEN_EXPIRED`, `AUTH_SESSION_INVALIDATED`, `AUTH_TOKEN_REUSE`

### 4. Server restart / session instance mismatch

`frontend/lib/api.ts` checks `X-Server-Instance-Id` header.

When backend restarts with `FORCE_LOGOUT_ON_RESTART=true`:
- User should be logged out gracefully, not stuck in error loop
- Symptom: sudden 401 on all calls after `uvicorn` reload

Fix UX if user sees cryptic errors instead of redirect to login.

### 5. Role-based authorization (403)

Backend endpoints use role-specific deps, e.g.:
- `get_current_admin` for `/admin/*`
- Partner routes under `/partner/*`

If 403 with valid token:
- User logged in with wrong role (customer token hitting `/admin/dashboard`)
- Partner not approved / laundry not linked
- Check service-layer authz in `backend/app/services/`

### 6. Session idle / monitor

`frontend/components/session/auth-session-monitor.tsx` — ensure it doesn't fire logout during active API use. `setApiActivityCallback` in `api.ts` resets idle timer.

### 7. Write tests

```bash
cd backend && pytest tests/api/test_auth.py -q
```

Add cases if missing:
- Login → access protected route → 200
- No token → 401
- Wrong role → 403

Frontend: verify login E2E if exists, or add minimal Playwright test for admin login → dashboard loads.

## Fixes (common patterns)

1. **Queries fire before auth ready** — set `enabled: !!accessToken` on TanStack Query hooks in guarded layouts
2. **RoleGuard race** — ensure layout waits for `fetchMe()` before rendering children
3. **Cookie not sent** — `withCredentials: true` + same-site cookie settings + CORS `allow_credentials`
4. **Token not in store after OTP verify** — check `applyAuth()` in `auth.ts`

## Done when

- [ ] All three roles login and reach their dashboard without 401
- [ ] `GET /users/me` returns correct `role` after login
- [ ] Backend restart shows login prompt, not infinite loading
- [ ] 403 shows "Access denied" UI, not generic crash
- [ ] `tests/api/test_auth.py` green
- [ ] Bugs logged in `logs/bug-tracker.md`
