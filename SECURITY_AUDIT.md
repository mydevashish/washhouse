# Security Audit — DLM Platform

**Date:** 2026-06-03  
**Scope:** Authentication, authorization, API security, data protection, file uploads, payment webhooks

---

## Summary

| Category | Rating | Notes |
| -------- | ------ | ----- |
| Authentication | B | JWT + refresh rotation, bcrypt, server session `sid` |
| Authorization | B+ | Role deps on APIs; frontend RoleGuard (one gap fixed) |
| Input validation | B | Pydantic v2 on requests; image validation on uploads |
| Secrets management | D (dev) | Weak defaults; must override in prod |
| API hardening | C+ | Rate limit exists; fails open without Redis |
| Evidence integrity | A- | Append-only evidence models |
| Payment security | C → B | Webhook bypass fixed in this audit |

**Security score: 58/100** (production config assumed immature)

---

## Authentication

### Strengths
- **Password hashing:** bcrypt, 12 rounds (`security.py`)
- **JWT access tokens:** 15 min TTL, typed (`typ: access`)
- **Refresh tokens:** httpOnly cookie, rotation via `AuthService.refresh`
- **Server restart invalidation:** `sid` claim + `FORCE_LOGOUT_ON_RESTART`
- **Refresh token reuse detection:** `TokenReuseError` path

### Vulnerabilities

| Severity | Finding | Root cause | Recommendation |
| -------- | ------- | ---------- | -------------- |
| **High** | Weak default `JWT_SECRET` | Dev placeholder | Startup validator: refuse boot if secret &lt; 32 chars in prod |
| **Medium** | OTP debug in response | Dev convenience leak | Never return `otp_debug` when `APP_ENV=production` |
| **Medium** | No account lockout on email login | Only delivery OTP agent lockout | Add failed login counter per user/IP |
| **Low** | HS256 with short key warning | PyJWT InsecureKeyLengthWarning in tests | Use RS256 or 256-bit secret in prod |

---

## Authorization

### Strengths
- `get_current_admin` restricts to `admin` | `super_admin`
- Order endpoints verify `order.user_id == payload.sub`
- Partner endpoints resolve laundry by owner
- Custody/delivery proof scoped by role (customer/partner/admin)

### Vulnerabilities

| Severity | Finding | Status |
| -------- | ------- | ------ |
| **High** | `/admin/inventory-changes` UI without RoleGuard | **Fixed** |
| **Medium** | `get_current_user_payload` on partner laundry register — any authenticated user | Open — validate role or onboarding state |
| **Medium** | WebSocket orders (`ws_orders.py`) — verify auth scope | Review token on WS connect |
| **Low** | Admin RoleGuard allows page shell flash before deny | Acceptable UX; API still protected |

---

## JWT & session

- Access token in memory (Zustand) — good vs XSS exfil of refresh
- Refresh in httpOnly cookie — mitigates XSS theft
- **CSRF:** Refresh uses cookie; ensure `SameSite=Lax/Strict` on cookie (verify `auth_cookies.py`)
- **Multi-tab:** BroadcastChannel sync for idle/logout

---

## API security

| Control | Present | Notes |
| ------- | ------- | ----- |
| Rate limiting | Yes | `RateLimitMiddleware` — Redis sliding window |
| CORS | Yes | Configured in `main.py` |
| Input validation | Yes | Pydantic schemas |
| SQL injection | Low risk | SQLAlchemy ORM parameterized |
| Error leakage | Low | Domain errors → structured envelope |
| Pagination caps | Yes | `limit` max 100 on search |

**Rate limit gap:** When Redis unavailable, requests proceed (logged warning). Recommend fail-closed for `/auth/*`.

---

## File upload security

- Pickup evidence, delivery proof, dispute photos: **image validation** (`validate_image_bytes`)
- Stored with compressed + original keys
- Served via JWT-protected blob endpoints (not public URLs)
- Max dispute photos: 5

**Recommendations:**
- Add explicit file size cap in middleware
- Virus scan hook for production
- Content-Type sniffing beyond client-declared type

---

## Payment webhook

| Before audit | After fix |
| ------------ | --------- |
| Missing webhook secret → verification skipped | Non-local env → `ValidationError` |
| Missing signature header → passed | Rejects empty signature |

**Remaining:** No replay protection on webhook idempotency; add event ID dedup table.

---

## Broken access control test matrix

| Attack | Expected | Code review |
| ------ | -------- | ----------- |
| Customer → admin API | 403 | Pass — `get_current_admin` |
| Customer → partner order | 404 | Pass — laundry ownership check |
| Partner → other laundry order | 404 | Pass |
| Unauthenticated → evidence | 401 | Pass — auth deps |
| IDOR on complaint photo | Blocked | Pass — viewer check in service |

---

## XSS / frontend

- React default escaping
- No `dangerouslySetInnerHTML` found in critical paths (spot check)
- User content in reviews/disputes — ensure sanitization if rendered as HTML (currently plain text)

---

## Dependency & infra

- Secrets in `.env` — not committed (verify `.gitignore`)
- No hardcoded Razorpay keys in repo
- Docker-compose for local Postgres

---

## Remediation priority

1. Production secret validation (JWT, webhook, Razorpay)
2. Complete payment.captured handling + webhook idempotency
3. Rate limit fail-closed on auth
4. Forgot-password UI + secure reset flow E2E test
5. Penetration test before launch
