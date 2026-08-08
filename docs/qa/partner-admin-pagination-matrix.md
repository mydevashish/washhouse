# Partner + Admin pagination QA matrix

> Prompt 8 lock — 2026-08-08  
> Standard: [`PAGINATION_STANDARD.md`](../../PAGINATION_STANDARD.md)  
> Inventory: [`ui-and-pagination-inventory.md`](./ui-and-pagination-inventory.md)

Legend: **Y** = yes / green · **P** = partial / deferred with note · **N/A** = not applicable · **—** = not required for this surface

## P0 / P1 lists (must be green)

| List | API default 10 | search | sort | filter | FE pagination UI | mobile | empty | error | Test file |
| ---- | -------------- | ------ | ---- | ------ | ---------------- | ------ | ----- | ----- | --------- |
| Partner orders | Y | Y | Y | bucket/status | Y (`DataTablePagination`) | Y | Y | Y | `backend/tests/api/test_partner.py::test_partner_orders_paginated_default_page_size` · `frontend/tests/e2e/partner-pagination.spec.ts` |
| Partner customer insights | Y | Y | spend | list_type/segment | Y | Y | Y | Y | `test_partner.py::test_partner_customer_insights_paginated_default_page_size` |
| Partner staff activity | Y | — | created_at | — | Y | Y | Y | Y | `test_partner.py::test_partner_staff_activity_paginated_default_page_size` |
| Partner walk-in orders | Y | Y | — | — | Y | Y | Y | Y | `test_walk_in_orders.py::test_walk_in_orders_list_paginated_default_page_size` |
| Partner reviews | Y | — | — | rating/reply | Y | Y | Y | Y | Partner Prompt 4 API + `PartnerReviewsView` |
| Partner booking requests | Y | phone | sla | status | Y | Y | Y | Y | `test_booking_requests.py` + inbox default 10 |
| Customer desk order history | Y | — | — | — | prev/next | Y | Y | Y | `test_customer_desk.py` · desk e2e |
| Admin laundries | Y | Y | Y | status | Y | Y | Y | Y | `test_admin_laundries_pagination.py` |
| Admin laundries management | Y | Y | Y | — | Y (`/admin/laundries`) | Y | Y | Y | same BE test + `partner-pagination.spec.ts` (admin) |
| Admin users / orders / audit / trust | Y | Y | Y | role/status | Y | Y | Y | Y | `test_admin.py::test_admin_paginated_lists_return_200_envelope` |
| Partner settlements | Y | — | — | — | Y | Y | Y | Y | FE Prompt 6; API default 10 |
| Partner logistics boards | N/A (scoped board, cap 200) | Y | — | tab/staff | tab nav | Y | Y | Y | ops scoped + `done-today` |
| Partner audit (orders) | Y (via orders) | Y | Y | — | Y | Y | Y | Y | uses paginated `/partner/orders` |

## P2 / deferred (dated)

| List | Status | Note |
| ---- | ------ | ---- |
| Partner notifications | Mitigated | Derived from action/active pages of 50; dedicated attention API later |
| Admin announcements / reviews / laundry trust / inventory changes | Done | Default 10 + `useServerList` (Prompt 5) |
| Admin/partner disputes | Done | `total_records` (+ legacy `total`) |
| Revenue analytics laundry table | Partial | Default 10; legacy envelope mix OK |
| Public laundry directory | Deferred | Default limit 100 exception; FE concatenates pages |
| Service catalog | Deferred P3 | Unbounded small catalog |
| Legacy `GET /partner/customers` | Deferred | CRM uses insights; unbounded aggregate unused by primary UI |
| Customer app `GET /orders` | Deferred P3 | `limit`/`offset` default 10 after Prompt 7 FE; not full `PaginatedList` yet |

## Open P0 bugs

**Zero.** Inventory UI-01…UI-04 closed (Prompts 2–5).

## How to verify manually

1. Network: `/partner/orders`, `/admin/laundries`, `/partner/customers` → `page_size=10`, `items.length ≤ 10`, `total_records` present.
2. Click **Next page** → request `page=2`.
3. Invalid `page_size=15` → response `page_size` falls back to **10**.
4. Empty laundry / no orders → empty state, not spinner forever.
5. Force API 500 → error state + retry.

## CI commands

```bash
cd backend && pytest tests/unit/test_list_query_params.py tests/api/test_partner.py::test_partner_orders_paginated_default_page_size tests/api/test_admin_laundries_pagination.py -q
cd frontend && pnpm exec playwright test tests/e2e/partner-pagination.spec.ts
```
