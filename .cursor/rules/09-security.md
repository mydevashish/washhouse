---
description: Security baseline — non-negotiable
alwaysApply: true
---

# Security Rules

> **Cursor must never bypass these rules.** If a request would violate any, push back and propose a secure alternative.

## Authentication

- **JWT** access (15 min) + refresh (30 days, rotating, one-time use).
- Tokens signed with **RS256** (asymmetric) in prod, **HS256** acceptable in dev.
- Refresh tokens stored as **httpOnly + Secure + SameSite=Lax** cookies, OR mobile-secure storage.
- **bcrypt** for password hashing (cost ≥ 12). Never SHA/MD5.
- Passwords: min 10 chars, must include 1 number, 1 letter, no common-password list.
- OTP: 6 digits, 5 min TTL, max 5 attempts, rate-limited.
- Email verification required before first login.

## Authorization

- **Role-based** with explicit checks in services (`require_role(...)`) and reinforced by FastAPI `Depends`.
- Roles: `customer`, `partner`, `admin`, `super_admin`.
- **No client-side trust.** Frontend hides UI; backend still authorizes.
- Object-level checks: a customer can only see their own orders; a partner only their laundry's orders.
- Admin actions create **audit log** entries.

## Input validation

- **Backend:** Pydantic v2 validates every request body/path/query.
- **Frontend:** Zod validates every form before submit.
- Reject unknown fields (`model_config = ConfigDict(extra="forbid")` on inbound schemas).
- Whitelist enums; never accept arbitrary strings where an enum applies.
- File uploads: validate MIME type AND magic bytes; cap size; scan filenames for traversal.

## Injection

- **SQL** — only parameterized queries via SQLAlchemy. **Never** string-format SQL.
- **XSS** — React escapes by default; never use `dangerouslySetInnerHTML` with user content.
- **Template injection** — only render trusted templates; no eval.
- **Command injection** — never spawn shells with user input; if necessary, use `shlex.quote`.
- **NoSQL** — N/A for now (Postgres only).

## Secrets

- **Never** hardcode secrets. Use environment variables loaded via `pydantic-settings`.
- `.env*` are git-ignored (except `.env.example`).
- Secrets in prod come from **Railway** (backend) / **Vercel** (frontend) env stores.
- Rotate JWT signing keys quarterly; refresh tokens are revoked on rotation.
- Use **Vercel/Railway encrypted env vars**; never commit `.env`.
- For long-lived secrets (Stripe, SMTP), document rotation in `docs/security/secrets.md`.

## Headers (backend response)

| Header                       | Value                                                   |
| ---------------------------- | ------------------------------------------------------- |
| `Strict-Transport-Security`  | `max-age=63072000; includeSubDomains; preload`          |
| `X-Content-Type-Options`     | `nosniff`                                               |
| `X-Frame-Options`            | `DENY`                                                  |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                       |
| `Permissions-Policy`         | `geolocation=(self), camera=(), microphone=()`          |
| `Content-Security-Policy`    | strict; see `docs/security/csp.md`                      |
| `X-Request-ID`               | per-request                                             |

Frontend sets equivalent headers via `next.config.mjs` and Vercel config.

## CORS

- Allow-list known origins (env-driven). No wildcards in prod.
- `Access-Control-Allow-Credentials: true` only with explicit origins.

## Rate limiting

- Implemented via Redis (sliding window or token bucket).
- Defaults defined in `05-api-standards.md`.
- Auth endpoints stricter (login: 10 / 15min, OTP: 5 / hour).

## Sessions / tokens

- Logout invalidates refresh token (DB revocation list).
- Single-use refresh tokens; reuse triggers full session revocation + alert.
- Maximum 5 active sessions per user; oldest evicted.

## Sensitive data

- **PII** (email, phone, address) encrypted at rest where possible.
- **PAN / card data** — never stored. Tokenize via Stripe.
- **Audit log** for every PII export by admin.

## Dependencies

- **Renovate** + **Dependabot** weekly.
- **npm audit** / **pip-audit** in CI.
- **Snyk** scan on PRs.
- Critical CVEs patched within 48 h.

## Frontend specifics

- No secrets in `NEXT_PUBLIC_*`.
- Do not log tokens to console.
- Sanitize user-generated content before rendering as HTML.
- `httpOnly` cookies for refresh tokens; access token in memory (not localStorage).

## Backend specifics

- All endpoints `Depends(get_current_user)` unless explicitly public.
- Sensitive endpoints require recent re-auth (`require_recent_auth(max_age=5min)`).
- Webhooks verified by signature (Stripe, etc.).
- Idempotency keys honored on POST that creates side effects.

## Threat-model checklist (every feature)

1. **What can a malicious customer do?** (IDOR, mass-assignment, escalation)
2. **What can a hostile partner do?** (data exfiltration, fake orders)
3. **What if an admin account is compromised?** (audit + MFA)
4. **What happens on replay / race?** (idempotency, locks)
5. **What if input is 10× expected size?** (limits, streaming)
6. **What if an external dependency is down?** (timeouts, retries, circuit breakers)

## Mandatory before merge

- ✅ No new `eval`, `exec`, `dangerouslySetInnerHTML`
- ✅ No new endpoint without `Depends(get_current_user)` (or explicit `@public`)
- ✅ No new admin endpoint without audit log
- ✅ No new secret committed (pre-commit hook scans)
- ✅ Dependencies scanned

## Incident response

- See `docs/security/incident-response.md`.
- Severity scale: SEV1 (data breach / outage) → SEV4 (cosmetic).
- All incidents logged in `logs/security-log.md`.
