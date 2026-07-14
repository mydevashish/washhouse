# Prompt: API integration test matrix

Act as **qa-engineer** with **backend-architect** and **frontend-architect**.

## Prerequisite

CRUD fixes complete (`fix-api-crud-by-role.md`). This phase **locks in** fixes with automated tests.

## Goal

Every fixed endpoint has pytest coverage; critical user journeys have Playwright smoke tests. CI stays green.

## Backend API tests

### Existing suite

```
backend/tests/api/
  test_auth.py
  test_health.py
  test_orders.py
  test_marketing.py
  test_disputes.py
  ... (19 files)
```

Run full suite:

```bash
cd backend && pytest tests/api/ -v --tb=short
```

### Coverage gaps to fill

For each endpoint fixed in prior phases, add tests following `.cursor/prompts/write-tests.md` and `.cursor/sub-agents/qa/api-tester.md`:

| Endpoint pattern | Required test cases |
| ---------------- | ------------------- |
| Public GET | 200 + envelope shape |
| Authenticated GET | 401 no token, 403 wrong role, 200 happy |
| POST create | 422 invalid body, 201/200 happy |
| PATCH update | 404 wrong id, 422 validation, 200 happy |
| DELETE | 404, 403 IDOR, 204/200 happy |
| List + pagination | page boundary, empty list, search param |

### Test template (pytest + httpx)

```python
async def test_admin_dashboard_requires_admin(client, admin_headers):
    r = await client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert "data" in body
    assert "orders_total" in body["data"]

async def test_admin_dashboard_forbidden_for_customer(client, customer_headers):
    r = await client.get("/api/v1/admin/dashboard", headers=customer_headers)
    assert r.status_code == 403
```

Use fixtures from `backend/tests/conftest.py` for seeded users per role.

### Priority order for new test files

1. `test_admin.py` — dashboard, laundries CRUD (if missing)
2. `test_partner.py` — partner orders, staff (if missing)
3. Extend `test_orders.py` — customer order create
4. `test_users.py` — profile, addresses CRUD (if missing)
5. `test_platform_config.py` — admin config PATCH

## Frontend tests

### Unit tests for parsers

If you added response normalizers (like `parseLaundryListPayload`):

```bash
cd frontend && pnpm test -- laundries.test
```

### E2E smoke expansion

Extend `frontend/tests/e2e/smoke.spec.ts` or add `api-smoke.spec.ts`:

```typescript
test('discover loads laundry cards when API returns data', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: /professional laundry/i })).toBeVisible();
  // Wait for either cards or explicit empty state — not perpetual skeleton
  await expect(
    page.locator('[data-testid="laundry-card"], [data-testid="discover-empty"]')
  ).toBeVisible({ timeout: 15_000 });
});
```

Add role-gated smokes (with test credentials from seed):

- Admin login → dashboard KPI visible
- Partner login → orders section loads

Store credentials in `frontend/.env.test` or Playwright config — never commit real passwords.

## Contract drift guard (optional but valuable)

Add a script or test that diffs:
- Paths called in `frontend/services/*.ts`
- Paths registered in `backend/app/api/v1/endpoints/`

Flag FE calls with no BE route.

## CI checklist

```bash
cd backend && pytest tests/api/ -q
cd frontend && pnpm run lint && pnpm run type-check && pnpm test
cd frontend && pnpm run test:e2e -- smoke
```

## Done when

- [ ] `pytest tests/api/` — 0 failures
- [ ] Every P0/P1 bug from diagnose phase has a regression test
- [ ] Frontend lint + type-check green
- [ ] E2E smoke covers discover + at least one authenticated role
- [ ] `logs/implementation-log.md` lists new test files
