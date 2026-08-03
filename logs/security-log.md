# Security Log

> Findings, fixes, audits, and exceptions. Sensitive details go to the private security tracker; reference it here.

## Entry template

```
### YYYY-MM-DD — <title>
- **Source:** internal review / SAST / pen test / external report
- **Severity:** critical / high / medium / low / info
- **CWE / OWASP:** ...
- **Affected:** <module / endpoint / dependency>
- **Description:** ...
- **Fix:** <PR>
- **Mitigations:** ...
- **Verification:** <test / scan>
- **Disclosed:** internal / public
```

## History

### 2026-08-03 — Booking requests Slice 2 authz
- **Source:** internal review (feature implementation)
- **Severity:** info
- **Affected:** `POST /booking-requests`, `/admin/booking-requests/*`, `/partner/booking-requests/*`
- **Description:** Public create never accepts client `laundry_id` (`extra=forbid`). Partner reads/writes enforced by assigned laundry scope (foreign ids → `404`). Assign/transfer admin-only; partner may release only. Phone timeline partner-scoped to current/historical assignment via events. Full phone E.164 returned to staff (ops need WhatsApp/call).
- **Fix:** Service-layer checks in `BookingRequestService`; covered by `tests/api/test_booking_requests.py`
- **Verification:** pytest authz/IDOR/assign/phone matrix green
- **Disclosed:** internal

### 2026-07-28 — Prod-readiness security checklist (auth / IDOR / payments / CORS / secrets)

- **Source:** internal review (security-reviewer + qa-engineer)
- **Agents:** [Security Review](10613803-7109-4d77-aaf7-672d37d7dcd7)
- **Severity:** high → fixed; medium → filed
- **Checklist results:**

| # | Item | Result |
| - | ---- | ------ |
| 1 | httpOnly refresh cookie / no tokens in localStorage | **PASS** — `auth_cookies.set_refresh_cookie(httponly=True)`; Zustand `partialize` stores only `user` |
| 2 | IDOR (orders / addresses / partner / admin) | **PASS** — ownership via `get_for_user` / address `user_id` / partner laundry scope; cancel IDOR test 404 |
| 3 | Rate limit auth + OTP | **PASS (hardened)** — `/api/v1/auth` 20/min, `/otp` 5/min; **auth now fail-closed** if Redis unavailable |
| 4 | GST invoice fields on order create | **PARTIAL** — `gst_rate` / `cgst_inr` / `sgst_inr` set; `invoice_number` never assigned → Medium BUG |
| 5 | COD vs Razorpay + webhook idempotency | **PASS (hardened)** — cancel reconciles payment; `payment.captured` → `paid` + Payment upsert; terminal-state guards |
| 6 | PII not leaked in errors / public APIs | **PASS** — generic domain messages; 500s are opaque |
| 7 | CORS locked in prod env examples | **PARTIAL** — allow-list env-driven; `.env.example` is localhost-only → Medium BUG |
| 8 | No secrets in repo | **PASS** — `.env` gitignored + untracked; no committed `.env` |

- **High fixes applied:**
  1. Customer cancel reconciles payment (`failed` for unpaid/COD; Razorpay refund → `refunded`)
  2. Razorpay `payment.captured` marks order `paid` and stores payment ids (idempotent)
  3. Auth rate limiter fails closed when Redis is down
- **Verification:** `pytest tests/api/test_order_cancel_payment.py` — 4 passed
- **Medium filed:** `logs/bug-tracker.md` BUG-2026-07-28-SEC-001…003

**Must-fix before prod (ops):**
1. Set strong `JWT_SECRET` / RS256 keys, `RAZORPAY_*`, `CORS_ALLOW_ORIGINS` to production FE only
2. Redis required when `RATE_LIMIT_ENABLED=true` (auth will 429 if Redis is down — intentional)
3. Confirm webhook URL receives `payment.captured` in Razorpay dashboard
4. Assign `invoice_number` on order create (BUG-SEC-001) before issuing legal GST invoices

### 2026-05-25 — Workspace security guardrails established
- **Source:** internal review
- **Severity:** info
- **Description:** Adopted RS256 JWTs, bcrypt for passwords, security headers middleware, rate limit defaults, CORS allow-list, and secrets via env only.
- **Refs:** `rules/09-security.md`, `docs/security/auth.md`, `docs/security/threat-model.md`, `docs/security/secrets.md`.
