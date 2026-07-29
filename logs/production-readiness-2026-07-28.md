# Production launch GO / NO-GO — 2026-07-28

**Roles:** product-manager + devops-engineer  
**Sources:** `.cursor/checklists/post-deploy.md`, `.cursor/context/current-status.md`, `logs/bug-tracker.md`, `docs/features/README.md`, `docs/deployment/production-readiness-v0.1.0.md`, local Playwright CI2 logs, live probes  
**Date:** 2026-07-28

---

## 1. Executive verdict: **NO-GO**

Do **not** promote to production (`dlm.app` / paid online marketplace cutover).

**Why (non-negotiable):**

| Gate | Status | Owner |
| ---- | ------ | ----- |
| BUG-001 forgot / reset password UI | **OPEN** — no `/forgot-password` or `/reset-password` pages; login has no link | **frontend-architect** |
| Open P0/P1 empty | **FAIL** — see §3 | — |
| Post-deploy health probes | **FAIL** — `/health/db` + `/health/redis` → **404** (local + Render) | **backend-architect** |
| Staging verified + stable | **WEAK PASS** — liveness 200 on probe today; bug still open; cold-start history | **devops-engineer** |
| Target stack (Railway + Neon + `staging.dlm.app`) | **NOT WIRED** — interim Vercel + Render only | **devops-engineer** |
| Sentry baseline on live | **NOT VERIFIED** | **devops-engineer** |

**Soft-launch exception (offline / call-to-book only):** could be reconsidered as **GO WITH RISK** *only if* product explicitly accepts (a) password reset via support/ops until BUG-001 ships, (b) `FEATURE_ONLINE_BOOKING=false`, (c) COD / no live Checkout.js, (d) WhatsApp as best-effort stub. That is **not** a full production GO. Owners must sign the exception in writing before any promote.

Prior prep doc (`docs/deployment/production-readiness-v0.1.0.md`, 2026-07-13) already said **DO NOT DEPLOY**. Local role journeys improved materially on 2026-07-28; **infra + auth recovery gaps did not clear the gate**.

---

## 2. Role scorecards

### Automated E2E (local, 2026-07-28)

| Role | Suite | Pass | Pass % | Evidence |
| ---- | ----- | ---- | ------ | -------- |
| Customer (Riya) | `customer-journey.spec.ts` | 7/7 | **100%** | `logs/playwright-customer-ci2-pass2.txt` |
| Partner (Mahesh) | `partner-journey.spec.ts` | 10/10 | **100%** | `logs/playwright-partner-ci2-pass2.txt` |
| Admin (Anita) | `admin-marketplace-chain.spec.ts` | 5/5 | **100%** | `logs/playwright-admin-ci2-pass2.txt` |

Local product journeys are green. That is necessary, not sufficient for launch.

### Launch-weighted journeys (post-deploy + Phase 0–2 gates)

| Role | Journeys scored | Pass | Pass % | Notes |
| ---- | --------------- | ---- | ------ | ----- |
| Customer | 9 | 7 | **78%** | Discover, address, checkout (COD path), track, cancel, authz = pass. **Forgot-password = fail.** Live Razorpay Checkout.js = fail (server order create only). Staging end-to-end not re-run. |
| Partner | 10 | 10 | **100%** | Dashboard, accept order, inventory/QR, staff, pricing, walk-in, settlements surfaces, admin deny — local green. Staging unverified. |
| Admin | 6 | 5 | **83%** | Dashboard, approvals+confirm, module load, role deny, role home = pass. **Staging admin smoke = not verified** (historically SKIP when API down). |

**Staging / prod smoke (post-deploy checklist):** cannot mark Pass — readiness probes missing; full role smokes never completed on `washhouse.onrender.com` after API recovery.

---

## 3. Open P0 / P1 list

**Must be empty for GO. It is not.**

| ID | Pri | Sev | Status | Owner | Why it blocks |
| -- | --- | --- | ------ | ----- | ------------- |
| **BUG-001** | P1 (launch gate / High) | S1 | **OPEN** | frontend-architect | Users cannot recover accounts without ops; Phase 1 ship criterion in `current-status.md` |
| **BUG-2026-07-28-003** | P1 | S1 | **OPEN** (live probe 200 today) | devops-engineer | Staging health historically timed out; not formally closed; cold-start risk remains |
| **BUG-010** (`BUG_LIST.md`) | P1 / Critical (test infra) | S2 | **OPEN** | qa-engineer | Integration suite fragile locally; remote CI green not confirmed this session |

**Recently resolved P0/P1 (do not block):** walk-in Redis hang (020), partner admin shell leak (021), checkout env no-op (013), discover filters (010), customer cancel (011), local FE→Render mispoint (001), migration startup (14-001), etc.

**Open P2 (do not flip GO alone, still ship debt):** SEC-001 invoice numbers, SEC-002 CORS example, SEC-003 OTP rate windows, `/health/db|redis` 404, type-check/Jest nits, Playwright webServer hang workaround.

---

## 4. Known stubs — acceptable for soft launch?

| Stub | Reality | Soft launch (offline / call-to-book)? | Full online launch? |
| ---- | ------- | ------------------------------------- | ------------------- |
| **Razorpay Checkout.js** | Server `createRazorpayOrder` exists; **no Checkout.js** load / payment modal in FE | **Yes** if `FEATURE_ONLINE_BOOKING=false` or COD-only messaging | **No** — do not advertise UPI/card |
| **WhatsApp** | Provider + Celery enqueue; templates/provider keys often unset; OTP/order WA still stubbed/best-effort | **Yes** with Call CTA + SMS/email fallback; set expectations | **No** for India “WhatsApp-first” promise |
| **Subscriptions** | `planned` / plans seed + list API; billing not launch-critical (`docs/features/subscriptions.md` P2) | **Yes** — out of soft-launch scope | **Defer** — do not market plans |
| **Notifications center** | FE stubs / planned richer center | **Yes** | **Defer** |
| **Loyalty accrual** | API skeleton; points often not wired on delivery (BUG-013) | **Yes** | **Defer** |

**Product call:** Soft launch = offline browse + Call/WhatsApp + partner walk-in is **acceptable with stubs**. Paid online marketplace with Razorpay UI is **not**.

---

## 5. Deploy runbook readiness

| Item | Ready? | Evidence / gap |
| ---- | ------ | -------------- |
| Rollback plan documented | **Partial** | `production-readiness-v0.1.0.md` §7 — Vercel promote previous + Render/Railway redeploy; no Alembic downgrade | Prefer roll-forward |
| Previous Vercel deployment identified | **No** (pre-deploy action) | Operator must pin before promote |
| Previous Railway/Render image identified | **No** | Same |
| Neon PITR window confirmed | **No** | Target Neon not cut over; interim Render DB PITR unknown |
| Health checks | **Incomplete** | `GET /api/v1/health` → 200 (local + Render **2026-07-28 probe**). `/health/db`, `/health/redis` → **404**. Checklist cannot pass. |
| Sentry | **Not ready** | Projects documented (`infrastructure/sentry/README.md`); DSN/baseline **not verified** on interim prod/staging |
| Migrations release command | **Documented** | `alembic upgrade head` before app; irreversible enum downgrades noted |
| CI remote green | **Unconfirmed this session** | Workflows fixed 2026-07-13; `gh` status not re-checked 2026-07-28 |
| Post-deploy log discipline | **Ready** | `logs/deployment-log.md` exists; this report appended |

**Runbook verdict:** Paper runbook exists; **operational readiness fails** on health readiness probes, rollback asset IDs, Sentry baseline, and target-stack cutover.

### Live probes (2026-07-28, this report)

| Check | Result |
| ----- | ------ |
| `https://washhouse.onrender.com/api/v1/health` | **200** `{"status":"ok",...}` |
| `https://washhouse.onrender.com/api/v1/health/db` | **404** |
| `https://washhouse.onrender.com/api/v1/health/redis` | **404** |
| `https://washhouse.vercel.app` | **200** |

---

## 6. Shipped vs planned (product scope)

From `docs/features/README.md` + `logs/feature-progress.md`:

**Shipped (local / code):** Auth (API), profile/addresses, UI shell, discovery, order place/track/cancel, reviews, partner onboarding/dashboard/inventory/QR/staff/price list, admin approvals/dashboard/commission, marketing homepage + pricing, walk-in + evidence chain, Razorpay/COD **server** paths.

**In-progress / planned (do not sell as live):** Complaints (README still in-progress; disputes UI exists), **Subscriptions**, **Notifications**, **WhatsApp notifications**, **Loyalty/referrals** full ops, live Checkout.js.

---

## 7. Exact commands to re-verify after deploy

Run within **15 minutes** of any promote (swap hosts to prod URLs).

### Health

```powershell
# Liveness (must 200)
Invoke-WebRequest https://washhouse.onrender.com/api/v1/health -UseBasicParsing

# Readiness — expect FAIL until implemented; must be 200 before GO
Invoke-WebRequest https://washhouse.onrender.com/api/v1/health/db -UseBasicParsing
Invoke-WebRequest https://washhouse.onrender.com/api/v1/health/redis -UseBasicParsing

# Frontend
Invoke-WebRequest https://washhouse.vercel.app -UseBasicParsing
```

### Auth smoke

```powershell
$body = '{"email":"admin@yopmail.com","password":"<QA_PASSWORD>"}'
Invoke-WebRequest https://washhouse.onrender.com/api/v1/auth/login -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

### Local stack re-verify (before promote)

```powershell
# Backend
cd backend
# ensure DATABASE_URL / SMTP / JWT_SECRET set for target env
uvicorn app.main:app --port 8000

# Health
Invoke-WebRequest http://localhost:8000/api/v1/health -UseBasicParsing

# Pytest (API) — set test DB creds if needed
$env:DATABASE_URL="postgresql+asyncpg://<user>:<pass>@localhost:5432/dlm_test"
$env:DATABASE_URL_DIRECT="postgresql://<user>:<pass>@localhost:5432/dlm_test"
pytest -q --tb=line tests/api

# Frontend (servers already up — use role configs; avoid default dual webServer)
cd ../frontend
npm run lint
npx playwright test --config=playwright.customer.config.ts
npx playwright test --config=playwright.partner.config.ts
npx playwright test --config=playwright.admin.config.ts
npx playwright test --config=playwright.auth.config.ts
```

### Post-deploy smoke (manual / browser)

1. Customer: register → login → logout; discover → laundry detail; place COD/test order.
2. Partner: login → orders list → accept / status advance.
3. Admin: login → dashboard → approvals queue.
4. Sentry: no new issues above baseline for 5 minutes; no 5xx spike.
5. Confirm previous Vercel + Render/Railway deployment IDs recorded for rollback.
6. Append result to `logs/deployment-log.md`.

### Clear blockers before next GO review

```text
1. frontend-architect: ship /forgot-password + /reset-password + login link (BUG-001); Playwright cover
2. backend-architect: implement GET /api/v1/health/db + /health/redis (BUG-2026-07-28-004)
3. devops-engineer: close staging health bug with SLO; wire Railway/Neon or harden Render; set Sentry DSN + verify alert path
4. qa-engineer: confirm GitHub Actions green on develop; re-run role Playwright against staging URLs
```

---

## 8. Decision log

| Option | Verdict |
| ------ | ------- |
| Full production (online booking + Razorpay UI + WhatsApp promise) | **NO-GO** |
| Soft launch offline / call-to-book on interim Vercel+Render | **GO WITH RISK** only with signed exception + BUG-001 ops workaround |
| Promote without readiness probes / Sentry | **Forbidden** |

**Signed recommendation:** **NO-GO** until BUG-001 closed, readiness health endpoints ship, staging health bug formally closed with soak, and one clean staging post-deploy checklist pass.

---

*Appended to `logs/deployment-log.md` on 2026-07-28.*
