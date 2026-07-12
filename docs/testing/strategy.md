# Testing Strategy

## Pyramid

```
        ▲
        │   E2E (Playwright)            ~5%
        │   Integration (httpx/api)    ~25%
        │   Unit (Jest / Pytest)       ~70%
        └─────────────────────────────►
```

## Coverage targets

- Repo-wide ≥ 70% statements
- `services/`, `repositories/` ≥ 80%
- Critical flows have explicit E2E coverage

## Frontend

- **Jest** + **React Testing Library** for components + hooks
- **MSW** for HTTP mocking
- **Playwright** for E2E (Chromium desktop + mobile Chrome + mobile Safari)
- **@axe-core/playwright** for a11y

## Backend

- **Pytest** + **pytest-asyncio**
- **httpx.AsyncClient** for API integration
- **factory-boy** for fixtures
- Real Postgres (rolled back per test)

## Performance

- **Lighthouse CI** on PRs (touched routes)
- **k6** smoke / load tests in `tests/perf/`

## Security

- **pip-audit** / **npm audit** (deps)
- **Bandit** + **Semgrep** (SAST)
- Targeted security tests (401, 403, IDOR, rate limit, replay)

## CI

- Tests on every PR
- E2E recording on failure
- Slowest 10 tests printed
- Coverage diff uploaded

See `.cursor/rules/08-testing.md`.
