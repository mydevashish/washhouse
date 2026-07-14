# Prompt: Fix API frontend↔backend contracts

Act as **frontend-architect** + **backend-architect**.

## Prerequisite

Connectivity + auth phases green. Failures are **Category E, F, or H** (422, wrong path, response shape, UI logic after 200).

## Goal

Every `frontend/services/*.ts` call matches its FastAPI endpoint — path, method, params, body, and response parsing.

## Contract rules (canonical)

Per `.cursor/rules/05-api-standards.md`:

```json
// Success
{ "data": <payload>, "meta": { "request_id", "timestamp", "pagination?" } }

// Error
{ "error": { "code", "message", "details?" }, "meta": { ... } }
```

FE services should:
1. Type response as `ApiEnvelope<T>`
2. Return `data.data` (the inner payload)
3. For lists with pagination, read `meta.pagination` when present

## Systematic audit

### Step 1 — Generate FE→BE map

For each file in `frontend/services/*.ts` and `frontend/lib/api/marketing.ts`:

```
| Service function | HTTP | FE path | BE router file | BE path | Match? |
```

Grep helper:

```bash
rg "api\.(get|post|put|patch|delete)" frontend/services --no-heading
rg "@router\.(get|post|put|patch|delete)" backend/app/api/v1/endpoints --no-heading
```

### Step 2 — Response shape patterns

Watch for these mismatches (known issue class — see `parseLaundryListPayload` in `laundries.ts`):

| BE returns | FE expects | Symptom |
| ---------- | ---------- | ------- |
| `data: [...]` | `data.items` | Empty list, "0 results" |
| `data: { items, total }` | `data: [...]` | Crash or empty |
| Paginated `meta.pagination` | Flat array | Wrong page count |
| `Decimal` as string | `number` | Display bugs (usually OK) |
| snake_case field | camelCase | `undefined` in UI |

Add defensive parsers only where APIs legitimately return multiple shapes; otherwise **fix the backend** to one canonical shape.

### Step 3 — Query param alignment

`frontend/lib/pagination/use-server-list.ts` sends:

```
page, page_size, search, sort_by, sort_order
```

Verify each admin/partner list endpoint accepts the same names. Check `backend/app/schemas/` for list query models.

### Step 4 — Mutation bodies

For each `POST/PATCH/DELETE` failure (422):

1. Read Pydantic schema in `backend/app/schemas/`
2. Compare with FE TypeScript interface and form payload
3. Check `extra="forbid"` — extra fields cause 422
4. Map field errors via `frontend/lib/api-field-errors.ts` in forms

### Step 5 — Fix priority

1. Endpoints that block page load (GET list/detail)
2. Primary mutations (create order, update status, approve laundry)
3. Secondary admin config PATCHes

### Step 6 — Error display audit

Every `useQuery` / `useServerList` consumer should handle:

```tsx
if (query.isError) return <ErrorState message={getApiErrorMessage(query.error)} onRetry={() => query.refetch()} />;
```

Grep for queries missing error UI:

```bash
rg "useQuery|useServerList" frontend/features --glob "*.tsx" -l
```

### Step 7 — Marketing API (Zod validation)

`frontend/lib/api/marketing.ts` uses `parseEnvelope` with Zod schemas — if marketing fails but other APIs work, check schema drift vs `backend/app/schemas/marketing.py`.

## Per-file service checklist

Run through these high-traffic modules:

- [ ] `laundries.ts` — list/search/detail/reviews
- [ ] `orders.ts` — create, list, status
- [ ] `users.ts` — profile, addresses
- [ ] `admin.ts` — dashboard, laundries, customers, orders
- [ ] `partner.ts` — orders, staff, analytics
- [ ] `disputes.ts`, `settlements.ts`, `platform-config.ts`
- [ ] `announcements.ts`, `staff-management.ts`
- [ ] `marketing.ts` — stats, testimonials, contact, franchise

## Tests

For each fixed contract:

```bash
# Backend
cd backend && pytest tests/api/test_<resource>.py -q

# Frontend unit (if parser added)
cd frontend && pnpm test -- laundries
```

## Done when

- [ ] FE→BE map has no unmatched paths
- [ ] No 422 on happy-path CRUD with valid seed data
- [ ] List endpoints return data visible in UI (not "0" when API has rows)
- [ ] Field validation errors show on correct form inputs
- [ ] Contract fixes logged in `logs/bug-tracker.md`
