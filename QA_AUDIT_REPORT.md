# QA Audit Report — Doorstep Laundry Marketplace (DLM)

**Audit date:** 2026-06-03  
**Auditor role:** Principal QA / Security / Architecture / DevOps / Full Stack  
**Method:** Static code review, automated test execution, TypeScript validation, API/route inventory, security pattern analysis  
**Runtime testing:** Limited — local PostgreSQL unavailable (`InvalidPasswordError` for `dlm` user); 24/27 API integration tests could not execute

---

## Executive summary

DLM is a **well-architected MVP** with strong fraud/evidence foundations (pickup photos, inventory lock, delivery proof + OTP, chain of custody, disputes, trust scores, fraud engine). Core customer/partner/admin journeys are **partially implemented** with several **production blockers**: missing password-reset UI, incomplete financial settlement, stub notifications, weak default secrets, and insufficient automated test coverage in CI.

**Verdict:** Not production-ready for a real multi-tenant marketplace without addressing Critical and High items in `BUG_LIST.md`.

---

## Phase 1 — Authentication & session

| Test | Result | Evidence |
| ---- | ------ | -------- |
| Admin / Partner / Customer login | **Pass (code)** | `POST /auth/login`, email + OTP flows in `frontend/app/login/page.tsx` |
| Registration | **Pass (code)** | `POST /auth/register`, `frontend/app/register/page.tsx` |
| Forgot / reset password | **Partial** | Backend: `POST /auth/password/forgot`, `POST /auth/password/reset` — **no frontend pages** |
| Logout | **Pass (code)** | `POST /auth/logout`, httpOnly refresh cookie cleared |
| Session persistence | **Pass (code)** | Refresh via cookie; `tryRefreshSession()` in `frontend/lib/session.ts` |
| Idle timeout | **Pass (code)** | `GlobalIdleManager` — default 10 min idle, 2 min warning (`session-config.ts`) |
| Multi-tab sync | **Pass (code)** | `SESSION_SYNC_CHANNEL`, activity tracker |
| Backend restart logout | **Pass (code)** | JWT `sid` + `AuthSessionMonitor` polls `/auth/session-info` |
| Hydration issues | **Pass (code review)** | `useMounted`, `ClientDate`, auth bootstrap patterns present |
| Auth bypass | **Not found** | Bearer required on protected APIs; RoleGuard on admin/partner pages |

**Issues:** BUG-001 (no forgot-password UI), BUG-002 (OTP debug in API responses in dev), BUG-003 (weak JWT default secret).

---

## Phase 2 — Roles & permissions

| Area | Result |
| ---- | ------ |
| Backend role deps | `get_current_admin`, `get_current_partner`, `get_current_user_payload` in `deps.py` |
| Admin API protection | All `/admin/*` endpoints use `get_current_admin` |
| Partner API protection | Partner routes use `get_current_partner` |
| Customer `(app)` routes | `AuthGuard` — any authenticated user (no role filter) |
| Partner pages | Per-page `RoleGuard` with `partner`, `admin`, `super_admin` |
| Admin pages | Per-page `RoleGuard` — **except inventory-changes (fixed in this audit)** |
| Privilege escalation | Backend enforces ownership on orders (`order.user_id == payload.sub`) |

**Issues:** BUG-004 (inventory-changes missing RoleGuard — **fixed**), BUG-005 (customer can hit `(app)` routes; acceptable but admin impersonation not audited E2E).

---

## Phase 3 — Customer journey

| Step | Status |
| ---- | ------ |
| Browse laundries | Implemented — `/discover`, public `/laundries` API |
| Storefront / pricing | Implemented — discover detail, checkout |
| Create order | Implemented — `OrderService.create_order` |
| Schedule pickup | Implemented — pickup_at on order |
| Payment | Partial — Razorpay + COD; dev stub when keys missing |
| Order tracking | Implemented — status events, custody timeline |
| Delivery | Implemented — OTP + proof gate |
| Review | Implemented — post-delivery reviews |
| Loyalty points | **Stub** — API returns balance; no earn/spend hooks on orders |
| Reorder | **Not verified** — no dedicated reorder flow found |

---

## Phase 4 — Partner journey

| Step | Status |
| ---- | ------ |
| Dashboard | Implemented — KPI cards, trust score, action center |
| Orders / pickups / deliveries | Implemented |
| Customers / staff / revenue | Implemented |
| Storefront builder | Implemented |
| Reports / settings | Pages exist |
| Notifications | **Stub** — Zustand seed data, not backend-driven |

---

## Phase 5 — Admin journey

| Step | Status |
| ---- | ------ |
| Dashboard | Implemented |
| Laundries / customers / orders | Implemented |
| Commission | Implemented |
| Audit logs | Implemented |
| Disputes / fraud / trust scores | Implemented |
| Export | **Missing** — no CSV/PDF export endpoints |
| Settings | Page exists; scope not fully verified |

---

## Phase 6–7 — Fraud & evidence chain

See `FRAUD_PROTECTION_REPORT.md`. Evidence tables are append-only (no PATCH/DELETE on pickup proof, delivery proof). Chain of custody auto-records milestones.

---

## Phase 8 — Security

See `SECURITY_AUDIT.md`. Rate limiting middleware exists (Redis-backed). CSRF not applicable to bearer API; cookie refresh uses SameSite.

---

## Phase 9 — API health

See API section in `SECURITY_AUDIT.md` and `PERFORMANCE_REPORT.md`. 23 endpoint modules; consistent envelope pattern; auth guards on sensitive routes.

**Test execution:**

```
pytest tests/ → 3 passed, 24 errors (DB connection)
pytest tests/unit/ → 3 passed
npm run type-check → PASS (after fixes)
```

---

## Phase 10 — Database

Alembic migrations through `20260603_0014_fraud_detection.py`. Soft deletes on users/laundries/orders. FK cascades defined. See schema gaps in `BUG_LIST.md` (orphan risk on complaint.order_id SET NULL).

---

## Phase 11 — UI/UX

See `UI_UX_AUDIT.md`. Mobile-first Tailwind; dark mode via `next-themes`. Dispute forms had broken Select (Radix API on native component) — **fixed**.

---

## Phase 12 — Performance

See `PERFORMANCE_REPORT.md`. No Lighthouse CI run in this audit; bundle analyzer script exists.

---

## Phase 13 — Mobile

Responsive layouts and 44px touch targets on login. Tables use horizontal scroll patterns. **Not tested on physical devices** in this audit.

---

## Phase 14 — Error monitoring

Sentry types in devDependencies; no runtime verification. TypeScript errors blocked build — **resolved**.

---

## Phase 15 — Business logic

| Area | Status |
| ---- | ------ |
| Order lifecycle | Strong — status gates for pickup evidence, inventory, delivery proof |
| Commission | Stored on order; admin commission API |
| Partner payouts / settlement | **Not implemented** |
| Refunds | Webhook handler; manual admin path unclear |
| Loyalty earn | **Not wired** |
| Subscriptions | List + subscribe stub |

---

## Phase 16 — Edge cases

| Case | Handling |
| ---- | -------- |
| Network loss | Axios error helpers; toast messages |
| Expired session | Refresh + idle logout |
| Backend restart | `sid` mismatch → forced logout |
| Duplicate submissions | Partial — mutation loading states; no idempotency keys on orders |
| Large uploads | Image validation in services; max dispute photos = 5 |
| Concurrent updates | No optimistic locking on orders |

---

## Fixes applied during audit

| ID | Fix |
| -- | --- |
| BUG-006 | Dispute Select components → native `<Select>` API |
| BUG-007 | `InfoBanner` invalid `muted` variant → `default` |
| BUG-008 | `PartnerOrder` type mismatch on delivery verification |
| BUG-009 | Razorpay webhook rejects when secret missing in non-local env |
| BUG-004 | Added `RoleGuard` to `/admin/inventory-changes` |

---

## Production readiness scores

| Dimension | Score |
| --------- | ----- |
| Security | 58/100 |
| Performance | 62/100 |
| Scalability | 60/100 |
| UI/UX | 72/100 |
| Fraud protection | 78/100 |
| **Overall readiness** | **54/100** |

---

## Related documents

- `SECURITY_AUDIT.md`
- `PERFORMANCE_REPORT.md`
- `FRAUD_PROTECTION_REPORT.md`
- `UI_UX_AUDIT.md`
- `BUG_LIST.md`
- `IMPROVEMENT_RECOMMENDATIONS.md`
