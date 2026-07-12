# Bug List — DLM Platform Audit

**Last updated:** 2026-06-03  
**Legend:** Critical / High / Medium / Low | Status: Open / Fixed / Won't fix

---

## Critical

| ID | Title | Root cause | Fix | Status |
| -- | ----- | ---------- | --- | ------ |
| BUG-009 | Razorpay webhook accepted without signature in production | `verify_webhook()` returned `{}` when `RAZORPAY_WEBHOOK_SECRET` unset | Reject in non-local/test env; require signature header | **Fixed** |
| BUG-010 | Integration test suite non-functional in default dev setup | Postgres credentials mismatch / DB not running | Document docker-compose bootstrap; CI must provision `dlm_test` | Open |
| BUG-011 | No partner payout / settlement engine | Feature not built | Implement payout ledger + admin reconciliation before live money | Open |

---

## High

| ID | Title | Root cause | Fix | Status |
| -- | ----- | ---------- | --- | ------ |
| BUG-001 | Forgot / reset password — no UI | Backend exists; frontend never built | Add `/forgot-password` and `/reset-password` pages | Open |
| BUG-003 | Default `JWT_SECRET` too weak | Dev default `dev-secret-change-me` (20 bytes) | Enforce ≥32 char secret in staging/prod startup check | Open |
| BUG-004 | `/admin/inventory-changes` missing RoleGuard | Page omitted guard wrapper | Wrap with `RoleGuard` + `AdminContent` | **Fixed** |
| BUG-006 | Dispute forms TypeScript/build failure | Radix Select API used on native `<select>` wrapper | Use native `value`/`onChange` on `Select` | **Fixed** |
| BUG-012 | Payment success webhook incomplete | Handler only processes failed/dispute/refund events | Handle `payment.captured` → mark order paid | Open |
| BUG-013 | Loyalty points never accrue on orders | No hook in `OrderService` / delivery complete | Wire points on delivered orders | Open |
| BUG-014 | Admin/customer notifications are stubs | Frontend uses Zustand seed data | Connect to `notifications` table + API | Open |

---

## Medium

| ID | Title | Root cause | Fix | Status |
| -- | ----- | ---------- | --- | ------ |
| BUG-002 | OTP debug codes in API responses | `otp_debug` returned when debug mode enabled | Strip in production via `APP_ENV` gate | Open |
| BUG-005 | Customer AuthGuard allows any role in `(app)` | By design for shared shell | Optional: restrict customer-only routes | Open |
| BUG-007 | Invalid InfoBanner variant `muted` | Typo in trust score card | Use `default` | **Fixed** |
| BUG-008 | PartnerOrder missing `delivery_verification` | Stale fallback property | Use query data only | **Fixed** |
| BUG-015 | No CSV/export on admin lists | Not implemented | Add export endpoints | Open |
| BUG-016 | No idempotency on order creation | Double-submit can duplicate orders | Idempotency-Key header + cache | Open |
| BUG-017 | Rate limit falls open when Redis down | Middleware logs warning and continues | Fail closed for auth routes or in-memory fallback | Open |
| BUG-018 | Google OAuth returns placeholder URL | `501` or stub callback | Complete OAuth or hide button | Open |
| BUG-019 | Fraud customer refund rate uses lifetime orders | Denominator is all delivered, not windowed | Align 30-day window with other signals | Open |

---

## Low

| ID | Title | Root cause | Fix | Status |
| -- | ----- | ---------- | --- | ------ |
| BUG-020 | pytest asyncio fixture scope warning | Unset `asyncio_default_fixture_loop_scope` | Set in pytest.ini | Open |
| BUG-021 | Duplicate complaint type enum values | Legacy + new types coexist | Migration to consolidate | Open |
| BUG-022 | Partner register uses `get_current_user_payload` | Any logged-in user can register laundry | Restrict to partner role or onboarding flow | Open |
| BUG-023 | Reorder flow absent | Not built | Add "Book again" on order detail | Open |
| BUG-024 | E2E coverage minimal | Only `smoke.spec.ts` | Expand Playwright suite | Open |

---

## Test results snapshot

```
backend pytest tests/     → 3 passed, 24 errors (DB)
backend pytest tests/unit/ → 3 passed
frontend tsc --noEmit     → PASS (post-fix)
frontend playwright       → Not run (requires live stack)
```
