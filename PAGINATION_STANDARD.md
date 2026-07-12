# Platform Pagination Standard

Single backend-driven pagination, search, filter, and sort contract for all DLM list endpoints.

## Goals

- No page loads all records
- All search, filter, and sort happens on the server
- Consistent API response shape across modules
- Reusable frontend hooks and table components
- Performance for 100k+ users and 1M+ orders

---

## Query Parameters

Every list endpoint accepts:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | `1` | 1-based page number |
| `page_size` | int | `10` | Records per page |
| `search` | string | — | Case-insensitive partial match |
| `sort_by` | string | module default | Column key |
| `sort_order` | `asc` \| `desc` | module default | Sort direction |

**Allowed page sizes:** `10`, `25`, `50`, `100`  
Invalid `page_size` values fall back to `10`.

Module-specific filters are appended as query params (e.g. `role`, `status`, `created_from`).

---

## Response Format

```json
{
  "items": [],
  "page": 1,
  "page_size": 10,
  "total_records": 500,
  "total_pages": 50,
  "has_next": true,
  "has_previous": false
}
```

Wrapped in the standard API envelope: `{ "data": { ... }, "meta": { ... } }`.

Legacy endpoints may expose `total` as an alias for `total_records` during migration.

---

## Backend

### Core utilities

| File | Purpose |
|------|---------|
| `backend/app/core/pagination.py` | `ListQueryParams`, `build_paginated_response`, `paginate_select`, `apply_ilike_search`, `apply_sort` |
| `backend/app/api/list_params.py` | Generic FastAPI `ListParams` dependency |
| `backend/app/schemas/common.py` | `PaginatedListResponse[T]` Pydantic model |

### Adding a new list endpoint

1. Extend `ListQueryParams` (or create `*_list_params.py`) with module filters.
2. Add a FastAPI dependency with `Query()` defaults.
3. Repository: build SQLAlchemy `select`, apply filters/search/sort, count + offset/limit.
4. Service: map rows to schemas, call `build_paginated_response`.
5. Endpoint: return `success_envelope(PaginatedListResponse[Row].model_validate(data))`.

### Reference implementation

**Trust scores** — full search, filter, sort, pagination:

- `backend/app/api/trust_score_list_params.py`
- `backend/app/repositories/trust_score.py` → `list_customers_paginated`
- `backend/app/api/v1/endpoints/trust_scores.py`
- `frontend/features/admin/admin-trust-scores-panel.tsx`

**Admin users / orders / audit logs** — standard list params:

- `backend/app/api/admin_list_params.py`
- `backend/app/services/admin_service.py` → `list_*_paginated`
- `backend/app/api/v1/endpoints/admin.py`

### Database

Migration `20260603_0030` adds composite indexes for common list queries:

- `users(role, trust_score, created_at)`
- `users(fraud_risk_level)`
- `orders(status, created_at)`
- `complaints(user_id, complaint_type)`
- `audit_logs(resource_type, created_at)`
- `audit_logs(action, created_at)`

Use correlated subqueries or joins with aggregation — avoid N+1 per row.

---

## Frontend

### Types

`frontend/lib/pagination/types.ts`

- `PaginatedList<T>`
- `ListQueryState`
- `DEFAULT_PAGE_SIZE = 10`
- `ALLOWED_PAGE_SIZES = [10, 25, 50, 100]`

### Hook

`frontend/lib/pagination/use-server-list.ts` — `useServerList`

- Debounced search (300ms)
- Page / page size / sort state
- React Query integration
- Resets to page 1 on filter/search/sort change

### Components

| Component | Path |
|-----------|------|
| `VirtualDataTable` | `frontend/components/data-table/virtual-data-table.tsx` |
| `DataTablePagination` | `frontend/components/data-table/data-table-pagination.tsx` |
| `ServerListToolbar` | `frontend/components/data-table/server-list-toolbar.tsx` |

`VirtualDataTable` uses TanStack Virtual for row virtualization. Sort/pagination/search state is server-driven via `useServerList`.

### Service client pattern

```typescript
export async function listItems(params: ListQueryState = {}): Promise<PaginatedList<Item>> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<Item>>>('/path', { params });
  return data.data;
}
```

---

## Migration Status

| Module | Backend | Frontend |
|--------|---------|----------|
| Trust scores (customers) | Done | Done |
| Admin users | Done | Done |
| Admin orders | Done | Done |
| Admin audit logs | Done | Done |
| Settlements | Aligned (`total_records`) | Done |
| Disputes datatable | Partial (`total` legacy) | Server-driven |
| Announcements | Offset-based | Pending |
| Laundries management | Unpaginated | Client-side |
| Reviews / fraud / notifications | Unpaginated | Pending |
| Laundry trust scores | Unpaginated | Pending |

### Rollout checklist for remaining modules

1. Add `*_list_params.py` with filters
2. Paginate repository query
3. Update endpoint response to `PaginatedListResponse`
4. Replace `useDataTableState` + full fetch with `useServerList`
5. Remove client-side `filterFn` / `getSortValue`
6. Add indexes if query plan shows seq scans

---

## UI Requirements

Each list page should show:

- Total records count
- Current page and page size selector (10 / 25 / 50 / 100)
- Search box (debounced, server-side)
- Filter controls (drawer or filter bar)
- Sortable column headers
- Refresh button
- Export button (where applicable)
- Loading, empty, and error states

---

## Validation

- Search: partial, case-insensitive, backend-only
- Filters: applied in SQL WHERE clauses
- Sort: backend ORDER BY only
- Pagination: accurate `total_records`, `has_next`, `has_previous`
- Performance: no full-table fetch to frontend
- Mobile: toolbar and pagination stack responsively

---

## Related docs

- `.cursor/rules/05-api-standards.md` — API conventions
- `docs/database/schema.md` — table indexes
