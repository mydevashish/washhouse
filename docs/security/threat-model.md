# Threat Model

A pragmatic STRIDE-style model for DLM. Refined per feature.

## Trust boundaries

```
[Anonymous user]  -- HTTPS -->  [Vercel Edge]  -- HTTPS -->  [FastAPI on Railway]  -- TLS -->  [Postgres / Redis / 3rd party]
```

## Spoofing

- **Risk:** stolen credentials, replayed tokens
- **Mitigations:**
  - bcrypt (cost ≥ 12) passwords
  - Short access tokens (15 min) + rotating refresh tokens (30 d)
  - Refresh token reuse detection → revoke all sessions
  - Rate-limit auth endpoints
  - Email verification before first login

## Tampering

- **Risk:** modified payloads, mass assignment
- **Mitigations:**
  - Pydantic v2 `extra="forbid"` on all inbound schemas
  - Whitelist enums; precise types
  - Idempotency keys for money-moving POSTs

## Repudiation

- **Risk:** "I didn't do that"
- **Mitigations:**
  - `audit_logs` for admin / money / role changes
  - Structured logs with `request_id`, `user_id`

## Information disclosure

- **Risk:** PII leaks, IDOR
- **Mitigations:**
  - Object-level authz in services (404 if not yours; don't leak existence)
  - PII masked in logs (`j***@example.com`)
  - No PAN stored (Stripe tokens only)

## Denial of service

- **Risk:** abuse, large payloads
- **Mitigations:**
  - Redis-backed rate limits
  - Body size limits
  - Timeouts on external HTTP
  - Circuit breakers around 3rd-party calls
  - Async + Celery to prevent request blocking

## Elevation of privilege

- **Risk:** customer → partner → admin escalation
- **Mitigations:**
  - Role checks at every endpoint (`require_role(...)`)
  - Object-level checks at every service method
  - Audit log on role changes
  - MFA for admin (future)

## Frontend-specific

- **XSS:** React escapes by default; never use `dangerouslySetInnerHTML` with user content
- **CSRF:** httpOnly Secure SameSite cookies; CSRF tokens for cookie-only endpoints
- **Open redirect:** validate `redirect_url` against allow-list
- **Click-jacking:** `X-Frame-Options: DENY`
- **Mixed content:** HTTPS everywhere; CSP enforced

## Dependency / supply chain

- Renovate / Dependabot
- `pip-audit` + `npm audit` in CI
- Bandit + Semgrep
- Verified webhook signatures
