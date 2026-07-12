# New Feature Checklist

Use when shipping a feature end-to-end.

## Discovery & spec

- [ ] Feature spec written: `docs/features/<feature>.md` (use the template)
- [ ] Persona, goals, non-goals explicit
- [ ] Acceptance criteria (Given/When/Then)
- [ ] Metrics / analytics events listed
- [ ] Entry added to `logs/feature-progress.md` with status `planned`

## Design

- [ ] UX flow sketched
- [ ] Mobile-first wireframes
- [ ] Dark + light variants
- [ ] Empty / loading / error states designed
- [ ] Tokens cover the visuals; if not, add tokens first

## Backend

- [ ] Domain model designed → `app/models/...`
- [ ] Migration drafted → `alembic/versions/...`
- [ ] Schemas → `app/schemas/...`
- [ ] Repository → `app/repositories/...`
- [ ] Service → `app/services/...`
- [ ] Endpoints → `app/api/v1/endpoints/...`
- [ ] OpenAPI metadata complete
- [ ] Background tasks (if any) → `app/tasks/...`

## Frontend

- [ ] Feature folder → `frontend/features/<feature>/`
- [ ] TanStack Query hooks → `features/<feature>/api/`
- [ ] Zod schemas → `features/<feature>/schemas/`
- [ ] Components built (Card, List, Detail, Form, Skeleton, Empty)
- [ ] Routes added → `frontend/app/<segment>/`
- [ ] States: empty / loading / error / dark

## Quality

- [ ] Unit tests
- [ ] Integration tests (API + DB)
- [ ] Component tests (Jest + RTL)
- [ ] E2E happy path (Playwright)
- [ ] A11y axe scan clean
- [ ] Lighthouse mobile ≥ 90

## Security

- [ ] Auth + roles enforced
- [ ] Inputs validated
- [ ] Audit log (if admin / money)
- [ ] Rate limit on sensitive endpoints

## Observability

- [ ] Logs at start / ok / fail per task
- [ ] Sentry tags include feature name
- [ ] Analytics events instrumented

## Docs & logs

- [ ] `docs/features/<feature>.md` updated to "shipped"
- [ ] `docs/api/` updated
- [ ] `docs/database/schema.md` updated
- [ ] `logs/implementation-log.md` final entry
- [ ] `logs/feature-progress.md` status → "shipped"

## Launch

- [ ] Feature flag (if risky)
- [ ] Staging soak test (≥ 24h)
- [ ] PR to `main` reviewed and squashed
- [ ] Tag release
- [ ] Smoke test post-deploy
- [ ] Post-launch monitor (Sentry, p95) for 24–48h
