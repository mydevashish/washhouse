# Security Checklist

Run when touching auth, data, or anything sensitive.

## Authentication

- [ ] All new endpoints require `Depends(get_current_user)` (or explicit `@public`)
- [ ] Role enforced via `require_role(...)`
- [ ] No new public endpoints unless intentional

## Authorization (per-object)

- [ ] Customers see only their data
- [ ] Partners see only their laundry's data
- [ ] Admins see all (with audit log)
- [ ] IDOR test added

## Inputs

- [ ] Pydantic schema has `extra="forbid"` (inbound)
- [ ] Field types are precise (UUID, datetime, enum — not str)
- [ ] Bounds set (`max_length`, `ge`, `le`)
- [ ] File uploads: MIME + magic bytes + size cap

## Data

- [ ] No PII in logs (mask emails, phones)
- [ ] No tokens in logs
- [ ] PII at rest encrypted where possible
- [ ] PAN never stored (Stripe tokens only)

## Secrets

- [ ] No new env keys without doc entry in `infrastructure/<provider>/env.md`
- [ ] No hardcoded keys / passwords
- [ ] Pre-commit secret scan clean

## Headers

- [ ] HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP set
- [ ] CORS allow-list explicit
- [ ] No new `eval` / `dangerouslySetInnerHTML`

## Rate limiting

- [ ] Sensitive endpoints rate-limited
- [ ] Login + OTP + reset stricter
- [ ] 429 returned with `Retry-After`

## Idempotency

- [ ] Money-moving POSTs accept `Idempotency-Key`
- [ ] Replays return the original response

## Audit

- [ ] Admin actions write `audit_logs`
- [ ] Role changes audited
- [ ] Refunds audited
- [ ] Payouts audited

## Dependencies

- [ ] `pip-audit` / `npm audit` clean
- [ ] Bandit / Semgrep clean

## Logs

- [ ] Entry in `logs/security-log.md`
