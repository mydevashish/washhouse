# Authentication Forced Logout Loop — Root Cause Analysis

**Date:** 2026-06-02  
**Symptom:** After successful login, user is immediately redirected to `/login` with *"System updated. Please login again."*

---

## Root cause

**Access JWTs were issued without the `sid` (server boot id) claim, but every authenticated API call validated `sid` when `FORCE_LOGOUT_ON_RESTART=true`.**

| Token type | Had `sid`? | Validated on use? |
| ---------- | ---------- | ----------------- |
| Refresh    | Yes        | Yes (refresh)     |
| Access     | **No**     | **Yes (all `/users/me`, orders, etc.)** |

### Failure sequence

1. User logs in → receives access + refresh tokens.
2. Frontend stores access token and navigates (e.g. `/admin`).
3. First protected request (`GET /users/me`, dashboard data, etc.) runs `decode_token(..., validate_session=True)`.
4. `validate_token_server_session()` sees `token_sid` missing → raises `SessionInvalidatedError`.
5. API returns `AUTH_SESSION_INVALIDATED` with message *"System updated. Please login again."*
6. Axios interceptor / `tryRefreshSession` calls `performSessionLogout({ reason: 'server_restart' })`.
7. User lands on login with the message → **logout loop** on every login attempt.

This was **not** caused by:

- Server boot id changing per request (it is a process-level singleton).
- Session version changing on every login (there is no `SESSION_VERSION`; only `sid`).
- Frontend `sessionStorage` mismatch alone (mismatch logic only runs when a stored id exists and differs).

---

## How `sid` / boot id works

| Item | Implementation |
| ---- | -------------- |
| Generation | `uuid.uuid4().hex` once per API process |
| Storage | Module global `_SERVER_INSTANCE_ID` in `backend/app/core/server_session.py` |
| Startup | `init_server_instance()` in FastAPI `lifespan` (fixed in this patch) |
| JWT claim | `sid` on access + refresh tokens |
| Validation | `token_sid == get_server_instance_id()` when `FORCE_LOGOUT_ON_RESTART=true` |
| HTTP header | `X-Server-Instance-Id` on every response |
| Frontend store | `sessionStorage` key `dlm.server_instance_id` |

**Persists:** For the lifetime of one API worker process.  
**Regenerates:** Only on API process restart (deploy, crash, dev hot-reload).

---

## Secondary issue (fixed)

CORS did not expose `X-Server-Instance-Id`, so browsers could not read the header on cross-origin responses. Clients still received `server_instance_id` via `GET /auth/session-info`, but login/register now also capture the header when available.

---

## Files changed

### Backend

| File | Change |
| ---- | ------ |
| `app/core/security.py` | Add `sid` to `create_access_token()` |
| `app/core/server_session.py` | Structured log on `sid` mismatch / missing |
| `app/main.py` | Call `init_server_instance()` at startup; `expose_headers` for boot header |
| `tests/unit/test_server_session.py` | Unit tests for `sid` on access tokens |
| `tests/api/test_auth.py` | Assert login access token contains current `sid` |

### Frontend

| File | Change |
| ---- | ------ |
| `services/auth.ts` | Capture boot id from login/register/otp response headers |
| `lib/session-logout.ts` | Log logout reason, user, stored boot id |
| `lib/api.ts` | Log `AUTH_SESSION_INVALIDATED` and header mismatch |
| `components/session/session-manager.tsx` | Log session-info checks |

---

## Validation scenarios

| Scenario | Expected | Status |
| -------- | -------- | ------ |
| A — Login → refresh page | Stay logged in | Access token has valid `sid`; refresh uses cookie |
| B — Login → navigate app | Stay logged in | Protected APIs accept access token |
| C — Backend restart → next request | Single logout with message | Old `sid` invalid; re-login works |
| D — Login again after restart | Stay logged in | New tokens carry new `sid` |

### Automated checks

```bash
cd backend
pytest tests/unit/test_server_session.py -q
pytest tests/api/test_auth.py::test_register_and_login -q   # requires test DB
```

```bash
cd frontend
npm run type-check
```

### Manual check

1. Log in as admin/partner/customer.
2. Confirm dashboard loads (no instant redirect to login).
3. DevTools console: no `session.auth_invalidated` / `session.logout` with `server_restart` right after login.
4. Restart API → next API call logs out once → login again → stable session.

---

## Logging reference

**Backend** (structlog):

- `auth.session_invalidated` — `reason`: `sid_missing` | `sid_mismatch`, includes `token_typ`, `sub`, `token_sid`, `current_sid`

**Frontend** (dev console via `logger`):

- `session.auth_invalidated` — API returned `AUTH_SESSION_INVALIDATED`
- `session.server_instance_mismatch` — stored boot id ≠ response header
- `session.info_mismatch` — session-info poll detected restart
- `session.logout` — final logout with `reason`, `userId`, `storedServerInstanceId`

---

## Related docs

- `SESSION_MANAGEMENT.md` — idle timeout, tab sync, boot invalidation design
- `backend/.env.example` — `FORCE_LOGOUT_ON_RESTART`
