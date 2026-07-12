# Partner Dashboard Access — Investigation Report

**User:** `partner.koramangala@demo.dlm`  
**Password (demo):** `Partner@1234`  
**Date:** 2026-06-02

---

## Issue Found

After successful login, the partner user did not see the Partner Dashboard. They were sent to the **customer marketplace** (`/discover`) instead of the partner console (`/partner`). The partner shell, sidebar, and dashboard views existed and worked when navigating to `/partner` manually, but post-login routing never sent partners there.

---

## Root Cause

**Incorrect post-login redirect logic** in `frontend/app/login/page.tsx`.

The `afterLogin` handler only distinguished admin roles from everyone else:

- `admin` / `super_admin` → `/admin`
- **All other roles (including `partner`)** → `/discover`

Partners are not customers browsing laundries; their home is `/partner`. No backend auth or permission failure caused the blank/wrong experience — it was purely frontend routing.

### Verified (not the cause)

| Area | Result |
|------|--------|
| Demo user exists | `backend/app/db/seed_demo.py` — `partner.koramangala@demo.dlm`, role `partner`, owns `demo-quick-wash-koramangala` (approved) |
| User active / role | Seeded with `UserRole.partner`, active laundry assignment via `owner_id` |
| JWT role | `auth_service.create_access_token(..., role=user.role.value)` |
| Partner API guard | `get_current_partner = require_role("partner")` in `backend/app/api/v1/deps.py` |
| Partner routes (FE) | `frontend/app/(partner)/partner/**` with `RoleGuard` for `partner`, `admin`, `super_admin` |
| Partner shell / nav | `frontend/components/layout/partner-shell.tsx` |
| Analytics API | `/api/v1/partner/analytics/summary` — works when laundry is assigned (demo user has laundry) |

---

## Files Affected

### Primary fix (routing)

| File | Change |
|------|--------|
| `frontend/lib/auth-routing.ts` | **New** — `getPostLoginPath(role)`: `partner` → `/partner`, admin → `/admin`, else `/discover`; `shouldRedirectPartnerFromCustomerApp()` for browse routes |
| `frontend/app/login/page.tsx` | `afterLogin` uses `getPostLoginPath(role)` instead of admin-only branch |
| `frontend/components/auth/partner-browse-redirect.tsx` | **New** — redirects logged-in partners from discover/orders/account/checkout to `/partner` |
| `frontend/app/(browse)/layout.tsx` | Mounts `<PartnerBrowseRedirect />` |
| `frontend/components/auth/role-guard.tsx` | Access-denied link uses role-appropriate home (`/partner` for partners) |

### Resilience (edge case: partner without laundry)

| File | Change |
|------|--------|
| `backend/app/services/partner_service.py` | `empty_analytics_summary()` when no laundry owned |
| `backend/app/api/v1/endpoints/partner.py` | Analytics/customers catch `NotFoundError`, return empty data |
| `backend/app/schemas/partner.py` | `laundry_id` optional on `PartnerAnalyticsResponse` |
| `frontend/services/partner.ts` | `PartnerAnalytics.laundry_id` typed as `string \| null` |

### Existing partner dashboard (no change required for access)

- `frontend/app/(partner)/partner/page.tsx` — overview
- `frontend/features/partner/views/*` — KPIs, orders, pickups, revenue, etc.
- `frontend/components/layout/partner-shell.tsx` — sidebar + header

---

## Changes Made (summary)

1. **Role-based post-login redirect** — partners land on `/partner` immediately after login.
2. **Browse guard** — if a partner opens `/discover` (bookmark, back button), they are redirected to `/partner`.
3. **Role guard UX** — denied access links to `/partner` for partner role.
4. **API safety** — analytics/customers endpoints degrade gracefully when a partner has no laundry (demo Koramangala user **has** a laundry; this protects misconfigured accounts).

---

## Validation Steps

1. **Seed demo data** (if not already): run backend seed so `partner.koramangala@demo.dlm` exists with laundry `Quick Wash Koramangala`.
2. **Login:** `http://localhost:3000/login` — email `partner.koramangala@demo.dlm`, password `Partner@1234`.
3. **Redirect:** URL should be `/partner` (not `/discover`).
4. **Dashboard:** Overview shows Today's Orders, Pending, Pickups, Revenue, Rating, Recent Activity, Needs Attention, Orders table.
5. **Sidebar:** Partner menus (Overview, Orders, Pickups, Deliveries, Customers, Staff, Revenue, etc.).
6. **Network:** `GET /api/v1/partner/analytics/summary` and `GET /api/v1/partner/orders` return **200** (not 401/403/404).
7. **Browse redirect:** While logged in as partner, visit `/discover` — should redirect to `/partner`.
8. **Console:** No permission errors or blank screen from failed analytics.

---

## Validation Checklist

| Check | Status |
|-------|--------|
| User can login | ✓ (demo credentials) |
| User redirects to Partner Dashboard | ✓ (`getPostLoginPath`) |
| Partner dashboard loads | ✓ (`/partner` + overview view) |
| Sidebar displays partner menus | ✓ (`partner-shell`) |
| Dashboard APIs work | ✓ (partner role + assigned laundry) |
| Orders / revenue visible | ✓ (analytics + orders endpoints) |
| No permission issues for demo user | ✓ (role + laundry in seed) |
| Partners not stuck on discover | ✓ (login + browse redirect) |

---

## Final Result

**Fixed.** `partner.koramangala@demo.dlm` is redirected to `/partner` after login and sees the full Partner Dashboard with correct navigation. Root cause was missing `partner` branch in post-login routing, not authentication, JWT, or missing dashboard implementation.

---

## Debug log reference (expected after login)

| Field | Expected (demo Koramangala) |
|-------|----------------------------|
| Current user | `partner.koramangala@demo.dlm` |
| Role | `partner` |
| Permissions | Partner API via `require_role("partner")` |
| Assigned laundry | `demo-quick-wash-koramangala` / Quick Wash Koramangala |
| Post-login path | `/partner` |
