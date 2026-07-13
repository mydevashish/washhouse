# Deployment Log

> Every prod + staging deploy. Newest first.

## Entry template

```
### YYYY-MM-DD HH:MM — <env> — <release tag / sha>
- **Deployer:** <name>
- **Services:** frontend / backend / worker
- **Migrations:** yes / no — <list>
- **Feature flags:** <toggled flags>
- **Smoke tests:** pass / fail
- **Rollback plan:** redeploy `<previous sha>`
- **Notes:** ...
```

## History

### 2026-07-13 14:00 — staging prep — production readiness (no deploy)

- **Deployer:** devops-engineer (Cursor)
- **Env:** staging prep / production **blocked**
- **Commit:** `dff9403` (main)
- **Services:** frontend CI fixed; backend Render health **FAIL**; staging.dlm.app unreachable
- **Migrations:** head `20260703_0031` reviewed — 3 irreversible enum downgrades documented
- **Feature flags:** `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=true` (prod default)
- **Smoke tests:** partial — Vercel frontend PASS; API flows SKIP (backend down)
- **Rollback plan:** see `docs/deployment/production-readiness-v0.1.0.md` §7
- **Notes:** DO NOT deploy until Phase 0–2 blockers fixed (BUG-001, staging health, CI green on remote). Full report: `docs/deployment/production-readiness-v0.1.0.md`

_(First production deploy will append a `v0.1.0` entry here.)_
