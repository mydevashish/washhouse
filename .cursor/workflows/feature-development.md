# Feature Development Workflow

End-to-end recipe Cursor follows when shipping a feature.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. Discover     2. Spec       3. Slice      4. Build     5. Verify       │
│   ↓               ↓             ↓             ↓             ↓            │
│ user need     docs/features/  smallest      backend +    tests, perf,    │
│ + persona     <feature>.md    valuable      frontend +   security,       │
│                              first slice   bg tasks      a11y, docs      │
│                                                              ↓           │
│                                                          6. Ship →       │
│                                                          7. Monitor →    │
│                                                          8. Iterate      │
└──────────────────────────────────────────────────────────────────────────┘
```

## 1. Discover (PM)

- Read `.cursor/agents/product-manager.md`
- Confirm user problem + persona + why now
- Identify success metric

## 2. Spec (PM + relevant architects)

- Create `docs/features/<feature>.md` from `.cursor/templates/feature-spec.md`
- Add entry in `logs/feature-progress.md`:
  ```
  ## <Feature name>
  - Status: planned
  - Owner: <agent>
  - Spec: docs/features/<feature>.md
  - Slice 1 of N:
  ```
- Sketch API contract in `docs/api/`
- Sketch DB shape in `docs/database/schema.md`

## 3. Slice

- Identify the **smallest valuable end-to-end slice**
- Defer non-essentials (cross out in the spec)
- Break into PR-sized chunks (1 day each ideally)

## 4. Build

Order matters:

1. **DB** — model + migration (via `database-engineer`)
2. **Repo + Service** — backend logic (via `api-engineer`)
3. **Endpoint** — thin router with OpenAPI metadata
4. **API tests** — auth, validation, happy, IDOR
5. **Frontend feature folder** — types, schemas, query hooks
6. **Components** — atoms first, then molecules, then organisms
7. **Routes** — wire pages with loading + error
8. **Forms** — `form-specialist`
9. **Component tests + Playwright happy path**
10. **Tasks** — Celery (if any)

Update `logs/implementation-log.md` after each chunk:

```
## YYYY-MM-DD HH:MM — <chunk>
- Type: feat
- Scope: <feature>
- Files: ...
- Summary: ...
```

## 5. Verify

Run reviews:

- `qa-engineer` — coverage gates
- `security-reviewer` — checklist
- `performance-optimizer` — Lighthouse + p95
- `accessibility-reviewer` — axe + keyboard
- `ui-ux-designer` — tokens + dark + 375 px

## 6. Ship

- Open PR via `.cursor/workflows/pr.md`
- Squash-merge to `develop`
- Validate on staging (≥ 24h for risky)
- Open `develop → main` PR
- Tag release
- Follow `.cursor/workflows/deployment.md`

## 7. Monitor

- Sentry for 24–48 h
- Confirm KPIs instrumented
- Watch p95 + error rate
- Update `logs/feature-progress.md` → `shipped`

## 8. Iterate

- Address feedback / follow-ups
- File followups as issues
- Update `docs/features/<feature>.md` with what changed

## Done definition

- ✅ Acceptance criteria all checked
- ✅ Tests at all relevant levels
- ✅ Docs + logs updated
- ✅ Lighthouse mobile ≥ 90, p95 stable
- ✅ Sentry quiet
- ✅ Feature flag removed (if used) within 2 releases
