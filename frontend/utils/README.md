# Utils

Pure functions only. No React. No side-effects. No imports from `lib/api.ts` or stores.

Prefer `lib/` for client-bound helpers (`cn`, `formatPrice`, `api`, `logger`, `motion`, `env`).
Use `utils/` for tiny, generic helpers (date math, string helpers, parsing).

## Rules

- Pure
- 100% test coverage
- Named exports only
- One concept per file
