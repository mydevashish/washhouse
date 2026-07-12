# Feature Progress Tracker

| Status        | Meaning                                             |
| ------------- | --------------------------------------------------- |
| `planned`     | Spec drafted, not started                           |
| `in-progress` | Active development                                  |
| `review`      | Code complete, in PR review                         |
| `staging`     | Merged to develop, on staging                       |
| `shipped`     | Live in production                                  |
| `paused`      | Blocked / on hold                                   |

---

## Phase 0 — Doc consolidation
- Status: **shipped**
- Deliverables: `docs/product/`, all `docs/features/*.md`, ADR-002, traceability, historical banners

## Phase 1 — Foundations
- Auth (register, login, refresh cookie, OTP, password reset, Google 501): **shipped**
- User profile + addresses: **shipped** (API + FE account)
- Base UI shell + dark mode: **shipped**
- CI / CD baseline: **planned** (workflows exist; verify green locally)

## Phase 2 — Customer MVP
- Laundry discovery: **shipped** (API + FE list + detail)
- Order placement: **shipped** (API + FE booking)
- Order tracking: **shipped** (events API + FE polling; WS deferred)
- Reviews: **shipped** (API + FE on delivered orders)

## Phase 3 — Partner MVP
- Partner registration: **shipped** (API)
- Partner dashboard / orders / scan: **shipped** (API + FE)
- Inventory / staff: **shipped** (API + FE staff list)

## Phase 4 — Admin
- Approvals / dashboard: **shipped** (API + FE)
- Complaints / commission UI: **shipped** (commission FE; complaints API only)

## Phase 5 — Payments + subscriptions
- Razorpay + COD: **shipped** (httpx provider when keys set + FE selection)
- Subscriptions: **in-progress** (plans table + list API)
- Notifications WhatsApp: **shipped** (stub)

## Phase 6 — Launch
- Loyalty / referrals: **shipped** (API skeleton)
- Landing hero: **shipped** (Framer Motion)
- Runbooks: **shipped**
- E2E smoke: **shipped**
- Pickup evidence system: **shipped** (`PICKUP_EVIDENCE.md`)
- Item inventory verification: **shipped** (`INVENTORY_VERIFICATION.md`)
- Delivery OTP verification: **shipped** (`DELIVERY_OTP.md`)

## Call-to-book launch (offline booking mode)
- Status: **shipped**
- Feature flags: `FEATURE_ONLINE_BOOKING=false` / `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=false`
- Guest browse + Call/WhatsApp (no login): **shipped** — QA `docs/testing/offline-booking-qa.md` §2A.1
- Partner walk-in order entry: **shipped** — §2A.2
- Walk-in status → WhatsApp notifications: **shipped** — §2A.3
- Automated: `pnpm test:e2e --project=offline-booking`, `pytest backend/tests/api/test_walk_in_orders.py`
- Doc supplements (root files locked in session): `docs/product/offline-booking-ui-map.md`, `docs/product/offline-booking-customer-experience.md`
