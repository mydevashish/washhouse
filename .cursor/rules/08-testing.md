---
description: Testing strategy and rules
globs: "**/*test*"
alwaysApply: false
---

# Testing Rules

## Pyramid (target coverage)

```
        ▲
        │   E2E (Playwright)            ~5%   — critical user flows only
        │   Integration (httpx/api)    ~25%   — API + DB working together
        │   Unit (Jest / Pytest)       ~70%   — services, hooks, utils
        └─────────────────────────────►
```

**Minimum coverage:** 70% statements project-wide, 80% on `services/` and `repositories/`. CI fails below.

## Frontend

### Tools
- **Jest** + **@testing-library/react** — units and components
- **Playwright** — E2E
- **MSW** — HTTP mocking for unit/integration tests

### What to test

| Subject                           | How                                                 |
| --------------------------------- | --------------------------------------------------- |
| Pure utilities (`utils/`, `lib/`) | Unit, plain Jest                                    |
| Hooks                             | `renderHook` from RTL                               |
| Components                        | Render + interactions + accessibility               |
| Zustand stores                    | Unit test reducers/actions                          |
| Zod schemas                       | Parse valid + invalid inputs                        |
| TanStack Query hooks              | With MSW mocks                                      |
| Forms                             | Submit happy + validation paths                     |
| E2E critical flows                | Login, search, place order, partner accept, admin approve |

### File location

- Co-locate: `order-card.tsx` ↔ `order-card.test.tsx` in the same folder.
- E2E specs live in `tests/e2e/<feature>.spec.ts`.

### Conventions

```ts
describe('OrderCard', () => {
  it('renders status badge', () => { ... });
  it('calls onClick when pressed', async () => { ... });
  it('is keyboard accessible', async () => { ... });
});
```

- Use `it('...')` reading as "it does X".
- One assertion per test where possible.
- Use `data-testid` only when no role/text/label is reachable. Prefer roles.

### Accessibility tests

- Every interactive component test asserts there's an accessible name.
- Add `@axe-core/playwright` checks on critical pages.

## Backend

### Tools
- **Pytest** + **pytest-asyncio** — async tests
- **httpx.AsyncClient** — API tests
- **factory-boy** — model factories
- **pytest-cov** — coverage

### Layered tests

| Layer        | Type              | Notes                                                    |
| ------------ | ----------------- | -------------------------------------------------------- |
| Utilities    | Unit              | Pure                                                     |
| Repositories | Integration       | Real Postgres via fixtures                               |
| Services     | Unit (mostly)     | Mock repositories                                        |
| API          | Integration       | `httpx.AsyncClient(app=app, base_url=...)` + real DB     |
| Tasks        | Unit              | Test pure logic; eager Celery for orchestration tests    |

### Fixtures (`tests/conftest.py`)

- `db_session` — fresh transaction per test, rolled back
- `client` — `AsyncClient` wired to `app`
- `auth_client` — pre-authenticated client (customer / partner / admin)
- `factory.*` — model factories

### Naming

```python
# tests/services/test_order_service.py
class TestCreateOrder:
    async def test_creates_order_and_sets_status_pending(...): ...
    async def test_rejects_when_laundry_not_approved(...): ...
    async def test_calculates_total_with_subscription_discount(...): ...
```

### Database isolation

- One transaction per test, rolled back at teardown.
- Use SAVEPOINTs for nested transactions.
- Tests must never depend on order.

## E2E (Playwright)

### Project setup
- Headless in CI, headed locally.
- Run against `docker compose` stack.
- Reset DB between specs via `scripts/test-reset-db.py`.

### Critical flows we always test

1. **Customer onboarding** — register → verify OTP → log in
2. **Discovery & search** — filter, sort, view detail
3. **Place order** — pickup time, address, pay
4. **Order tracking** — status updates reflect in UI
5. **Partner accept order** — login as partner, accept, update status
6. **Admin approval** — admin approves a new laundry
7. **Subscription** — subscribe, see plan, cancel

## Performance tests

- `k6` scripts in `tests/perf/` (backend).
- Lighthouse CI on every PR (frontend).
- Targets in `09-performance` and `docs/testing/strategy.md`.

## What NOT to test

- ❌ Implementation details (private functions, internal state).
- ❌ Framework code (React, FastAPI).
- ❌ Generated code (OpenAPI clients, Prisma if added later).
- ❌ Third-party libraries.

## Running tests

```bash
# Frontend
cd frontend
pnpm test                # unit
pnpm test:watch
pnpm test:e2e            # Playwright
pnpm test:e2e:ui         # Playwright UI mode

# Backend
cd backend
source DLM_env/bin/activate
pytest                   # all
pytest -k "order"        # filter
pytest --cov=app --cov-report=html
```

## CI

- Tests run on every PR.
- Coverage report uploaded as artifact.
- E2E recorded videos for failed runs.
- Slowest 10 tests printed each run.
