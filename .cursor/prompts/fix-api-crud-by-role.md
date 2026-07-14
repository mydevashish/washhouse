# Prompt: Fix API CRUD by role (customer, partner, admin)

Act as **qa-engineer** orchestrating role-specific fixes from the diagnose inventory.

## Prerequisite

Phases 1–3 complete (connectivity, auth, contracts). This prompt executes **end-to-end CRUD verification and fixes** per role.

## Goal

All primary create/read/update/delete flows work for each role with correct loading, success, and error states.

---

## Customer role

### Routes to test

| Route | Operations | Service file |
| ----- | ---------- | ------------ |
| `/discover` | List laundries, search, filters | `laundries.ts` |
| `/discover/[slug]` | Detail, reviews, services | `laundries.ts` |
| `/checkout/[laundryId]` | Create order | `orders.ts`, `payments.ts` |
| `/orders` | List orders, track status | `orders.ts` |
| `/orders/[id]` | Detail, cancel? | `orders.ts` |
| `/account` | Read/update profile, addresses | `users.ts` |
| Complaints / reviews | Create complaint, post review | `complaints` endpoints if wired |

### CRUD matrix

| Action | Endpoint (expected) | UI confirmation |
| ------ | ----------------- | --------------- |
| **R** List laundries | `GET /laundries` | Cards render on `/discover` |
| **R** Laundry detail | `GET /laundries/{id}` | Detail page loads |
| **C** Create order | `POST /orders` | Checkout completes |
| **R** List my orders | `GET /orders` | Orders page lists items |
| **R** Order detail | `GET /orders/{id}` | Tracking info shows |
| **U** Update profile | `PATCH /users/me` | Name saves |
| **C** Add address | `POST /users/me/addresses` | Address appears |
| **U** Edit address | `PATCH /users/me/addresses/{id}` | Address updates |
| **D** Delete address | `DELETE /users/me/addresses/{id}` | Address removed |

### Fix loop per failure

1. Reproduce in browser → capture Network request/response
2. Fix contract or backend per `fix-api-frontend-contracts.md`
3. Add/extend `backend/tests/api/test_orders.py` or relevant test
4. Mark bug resolved in `logs/bug-tracker.md`

---

## Partner role

Login: `/login?audience=partner` → `/partner`

### Routes to test

| Route | Operations | Service file |
| ----- | ---------- | ------------ |
| `/partner` | Dashboard analytics | `partner.ts`, `business-health.ts` |
| `/partner/orders` | List, accept, reject, status update | `partner.ts` |
| `/partner/staff` | List, add, remove staff | `partner.ts`, `staff-management.ts` |
| `/partner/service-catalog` | CRUD services | `partner-service-catalog.ts` |
| `/partner/settlements` | List settlements | `settlements.ts` |
| `/partner/operations` | Pickup/delivery queues | `operations.ts` |
| `/partner/reviews` | Review management | `review-management.ts` |
| Walk-in orders | Create walk-in | `partner-walk-in-orders.ts` |

### CRUD matrix

| Action | Endpoint (expected) | UI confirmation |
| ------ | ----------------- | --------------- |
| **R** Orders queue | `GET /partner/orders` | Order cards render |
| **U** Accept order | `POST /partner/orders/{id}/accept` | Status changes |
| **U** Update status | `PATCH /partner/orders/{id}/status` | Status badge updates |
| **C** Add staff | `POST /partner/staff` | Staff row appears |
| **D** Remove staff | `DELETE /partner/staff/{id}` | Row removed |
| **C** Add service | `POST /partner/service-catalog/...` | Service in catalog |
| **U** Update service | `PATCH ...` | Price/name updates |
| **D** Delete service | `DELETE ...` | Service removed |

### Partner-specific pitfalls

- Laundry not approved → empty orders or 403
- Staff user vs owner permissions
- Service catalog validation (price_inr as string decimal)

---

## Admin role

Login: `/login?audience=admin` → `/admin`

### Routes to test

| Route | Operations | Service file |
| ----- | ---------- | ------------ |
| `/admin` | Dashboard KPIs | `admin.ts` |
| `/admin/laundries` | List, approve, commission | `admin.ts` |
| `/admin/customers` | List customers | `admin.ts` |
| `/admin/orders` | List all orders | `admin.ts` |
| `/admin/disputes` | List, resolve disputes | `disputes.ts` |
| `/admin/platform-config` | Read/update settings | `platform-config.ts` |
| `/admin/announcements` | CRUD announcements | `announcements.ts` |
| `/admin/settlements` | Settlement management | `settlements.ts` |
| Revenue / fraud / trust | Analytics panels | `revenue-analytics.ts`, `fraud-detection.ts`, `trust-score.ts` |

### CRUD matrix

| Action | Endpoint (expected) | UI confirmation |
| ------ | ----------------- | --------------- |
| **R** Dashboard | `GET /admin/dashboard` | KPI cards show numbers |
| **R** Pending laundries | `GET /admin/laundries/pending` | Queue renders |
| **U** Approve laundry | `POST /admin/laundries/{id}/approve` | Status → approved |
| **R** All laundries | `GET /admin/laundries` | DataTable populated |
| **U** Commission rate | `PATCH /admin/laundries/{id}/commission` | Rate saves |
| **R** Customers | `GET /admin/customers` | Table loads |
| **U** Platform config | `PATCH /admin/platform-config/...` | Toast success |
| **C** Announcement | `POST /admin/announcements` | Appears in list |
| **U** Resolve dispute | `PATCH /admin/disputes/{id}` | Status updates |

### Admin-specific pitfalls

- Paginated tables via `useServerList` — verify `meta.pagination.total` matches UI
- Large PATCH payloads for platform config — partial vs full update
- Datatable optimistic updates without refetch

---

## Cross-cutting UI requirements

For every fixed view:

1. **Loading** — skeleton, not blank screen
2. **Error** — `getApiErrorMessage()` + retry button
3. **Empty** — `EmptyState` with CTA when `data.length === 0` and API returned 200
4. **Mutation** — toast on success; field errors on 422; no silent failure

## Final verification

```bash
cd backend && pytest tests/api/ -q
cd frontend && pnpm run lint && pnpm run type-check
# Optional: Playwright smoke
cd frontend && pnpm run test:e2e -- smoke
```

## Done when

- [ ] All CRUD matrix rows pass manual QA for customer, partner, admin
- [ ] No infinite loading on any dashboard
- [ ] `logs/bug-tracker.md` — all role CRUD bugs resolved
- [ ] `logs/implementation-log.md` updated
