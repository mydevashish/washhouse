# Production readiness — v0.1.0 (prep)

**Date:** 2026-07-13  
**Agent:** devops-engineer  
**Source ref:** `main` @ `dff9403`  
**Verdict:** **DO NOT DEPLOY** — Phase 0–2 blockers remain open.

---

## Executive summary

DLM is prepared for production promotion on paper: CI workflows corrected, Vercel env documented, migrations reviewed, release notes drafted, and rollback plan defined. **Deployment is blocked** until Phase 0–2 ship criteria are met (forgot-password UI, backend health on staging, integration test parity).

Current live stack (interim): **Vercel** `washhouse.vercel.app` + **Render** `washhouse.onrender.com`. Target stack per runbooks: Vercel + Railway + Neon (`dlm.app` / `staging.dlm.app`).

---

## 1. CI status

### Local verification (2026-07-13)

| Gate | Result | Notes |
| ---- | ------ | ----- |
| Frontend ESLint | **PASS** | `npm run lint` |
| Frontend type-check | **PASS** | After `npm run build` (`.next/types` required) |
| Frontend Jest | **PASS** | 7 suites, 21 tests |
| Frontend build | **PASS** | 62 routes |
| Playwright smoke | **FIXED** | Selectors updated; CI runs `smoke.spec.ts` on all pushes |
| Backend unit pytest | **PASS** | 7 tests |
| Backend integration pytest | **BLOCKED** | Postgres auth failure locally (`BUG-010`) |
| Backend ruff | **Not fully run** | Style nits only |

### CI fixes applied in this prep

- `.github/workflows/frontend.yml` — switched from broken `pnpm` + wrong env vars to `npm ci` + `NEXT_PUBLIC_API_URL`
- Playwright smoke runs on **all** `main`/`develop` pushes (not PR-only)
- `frontend/playwright.config.ts` — `npm run start` webServer in CI
- `frontend/tests/e2e/smoke.spec.ts` — aligned with current hero copy

### Remaining CI gaps

- Backend integration tests require Postgres service (works in GitHub Actions; local needs `docker compose up db`)
- `gh` CLI unavailable locally — confirm green on GitHub Actions after merge
- Lighthouse workflow not re-run in this session

---

## 2. Phase 0–2 blockers (deploy gate)

| ID | Phase | Blocker | Status |
| -- | ----- | ------- | ------ |
| — | 0 | Doc consolidation | **Shipped** |
| BUG-001 | 1 | No `/forgot-password` or `/reset-password` UI | **Open** |
| BUG-003 | 1 | Weak default `JWT_SECRET` in prod | **Mitigated** — startup validator added; must set 32+ char secret in Railway/Render |
| BUG-002 | 1 | `OTP_DEBUG` in API responses | **Mitigated** — forced off in staging/prod |
| — | 1 | CI/CD baseline green | **In progress** — workflow fixed; verify on remote |
| BUG-010 | 1 | Integration tests fail without Docker Postgres | **Open** (docs) |
| BUG-012 | 2 | Razorpay `payment.captured` webhook incomplete | **Open** |
| BUG-016 | 2 | No order-create idempotency | **Open** |
| — | 2 | Staging backend health | **FAIL** — `washhouse.onrender.com` health timed out; `staging.dlm.app` unreachable |

**Release gate:** Resolve BUG-001, confirm backend health on staging, green CI on `develop`, then open `develop → main` PR.

---

## 3. Vercel environment variables

Documented in [`infrastructure/vercel/env.md`](../../infrastructure/vercel/env.md).

### Production (minimum)

```
NEXT_PUBLIC_API_URL=https://washhouse.onrender.com/api/v1
NEXT_PUBLIC_APP_URL=https://washhouse.vercel.app
NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=true
NEXT_TELEMETRY_DISABLED=1
```

### Staging (when `staging.dlm.app` is wired)

```
NEXT_PUBLIC_API_URL=https://<staging-backend>/api/v1
NEXT_PUBLIC_APP_URL=https://staging.dlm.app
NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=true
NEXT_TELEMETRY_DISABLED=1
```

Optional: `NEXT_PUBLIC_SENTRY_DSN`, PostHog keys, contact vars — see `frontend/.env.example`.

---

## 4. Migration review

**Head revision:** `20260703_0031` — Walk-in order support (offline partner entry)  
**Chain:** 31 revisions, linear, no branch conflicts.

### Latest migration (`20260703_0031`)

- Adds `order_source` enum (`online`, `walk_in`)
- Makes `orders.user_id` and `orders.address_id` nullable (walk-in orders)
- Adds `customer_name`, `customer_phone`, `partner_notes`
- **Downgrade:** Reversible — drops columns, restores NOT NULL, drops enum

### Irreversible downgrades (document only — roll forward in prod)

| Revision | Reason |
| -------- | ------ |
| `20260603_0017` | Postgres enum value additions for audit actions |
| `20260603_0019` | Settlement audit enum values |
| `20260603_0027` | `user_role` + `platform_partner` — `ALTER TYPE ... ADD VALUE` |

### Pre-deploy migration checklist

- [x] `alembic upgrade head` runs in CI (GitHub Actions Postgres service)
- [x] Release command: `alembic upgrade head && uvicorn ...` (Render/Railway)
- [ ] Confirm `alembic current` on staging Neon matches `20260703_0031` before prod
- [ ] Neon PITR window confirmed (7 days)

---

## 5. Post-deploy checklist — staging smoke (2026-07-13)

Target: `staging.dlm.app` — **not reachable** (DNS/infra pending).  
Interim checks against current Vercel deploy:

### Health

| Check | Result |
| ----- | ------ |
| `GET /api/v1/health` | **FAIL** — `washhouse.onrender.com` timed out |
| `GET /api/v1/health/db` | **SKIP** — backend unreachable |
| `GET /api/v1/health/redis` | **SKIP** — backend unreachable |
| Frontend home renders | **PASS** — `washhouse.vercel.app` loads < 3s |

### Smoke flows

| Flow | Result |
| ---- | ------ |
| Register / login / logout | **SKIP** — backend down |
| Search + laundry detail | **PARTIAL** — `/discover` renders; 0 laundries (API) |
| Place order | **SKIP** |
| Partner login + orders | **SKIP** |
| Admin dashboard | **SKIP** |

### Errors / performance

| Check | Result |
| ----- | ------ |
| Sentry baseline | **Not verified** — DSN not configured locally |
| 5xx spike | **N/A** |
| p95 / LCP | **Not measured** this session |
| Queue lag | **N/A** |

### Rollback readiness

| Item | Value |
| ---- | ----- |
| Previous Vercel deployment | Identify in Vercel → Deployments before promote |
| Previous Render/Railway image | Identify in provider dashboard |
| Neon PITR | Confirm in Neon console before prod cut |

---

## 6. Release notes — v0.1.0 (draft)

### Customer

- Marketing homepage refresh (hero carousel, glass surfaces, WashHouse branding)
- Discover marketplace: search, filters, laundry cards
- Order booking, tracking, reviews
- Offline / call-to-book mode (`NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=false`)
- Marketing pages: About, Services, Stores, Contact, Franchise, Terms, Privacy

### Partner

- Dashboard, orders, pickups, deliveries, walk-in orders
- Storefront builder, staff management, settlements UI
- Operations center, QR scan API

### Admin

- Approvals, KPI dashboard, disputes, fraud, trust scores
- Commission, settlements, profit sharing, announcements

### Platform

- 31 Alembic migrations through walk-in orders
- Auth: OTP, refresh cookies, session invalidation on restart
- Evidence chain: pickup photos, inventory verification, delivery OTP + proof
- Razorpay + COD stubs (live keys required for real payments)

### Known limitations

- Forgot / reset password: API only, no frontend
- Notifications: frontend stubs
- Loyalty points: no accrual on delivery
- Render backend cold-start / downtime observed during prep

---

## 7. Rollback plan

### Trigger (within 30 min of prod deploy)

- Health check fails after migrations
- Sentry error rate > 2× baseline for 5 min
- Critical smoke flow broken (login, discover, checkout)

### Steps

1. **Announce** in `#dlm-incidents`
2. **Vercel:** Deployments → previous production build → **Promote**
3. **Backend:** Railway/Render → Deployments → **Redeploy** previous image
4. **Database:** Do **not** downgrade Alembic in prod unless PITR required. Prefer roll-forward fix.
5. **Severe schema issue:** Neon PITR to pre-deploy timestamp + forward-fix migration
6. **Log:** Append rollback entry to `logs/deployment-log.md`

### Rollback verification

- `GET /api/v1/health` → 200
- Frontend home + discover render
- Login smoke passes
- Sentry quiet for 5 min

---

## 8. Promotion checklist (when blockers cleared)

1. [ ] All Phase 0–2 blockers closed
2. [ ] CI green on `develop`
3. [ ] Staging post-deploy checklist **PASS**
4. [ ] `logs/feature-progress.md` → `shipping` for launch features
5. [ ] PR `develop → main` with this doc + release notes
6. [ ] Tag `v0.1.0` on merge commit
7. [ ] Set production secrets: `JWT_SECRET` (32+ chars), `RAZORPAY_*`, `DATABASE_URL`, Redis URLs
8. [ ] Vercel env per `infrastructure/vercel/env.md`
9. [ ] Run post-deploy checklist on prod within 15 min
10. [ ] Append `logs/deployment-log.md`
11. [ ] Monitor Sentry + p95 for 24h

---

## 9. Related docs

- [Deployment workflow](../../.cursor/workflows/deployment.md)
- [Post-deploy checklist](../../.cursor/checklists/post-deploy.md)
- [Vercel env](../../infrastructure/vercel/env.md)
- [BUG_LIST.md](../../BUG_LIST.md)
