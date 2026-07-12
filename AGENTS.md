# DLM — Agent routing

Quick map for Cursor / coding agents. Full rules live in `.cursor/rules/`.

## Always read first

- `.cursor/rules/00-project-overview.md` — product, stack, phases
- `.cursor/rules/01-architecture.md` — FE/BE layering
- `.cursor/rules/03-folder-structure.md` — where files go
- `.cursor/rules/16-cursor-operating-rules.md` — workflow, logs, done definition
- `.cursor/context/current-status.md` — current phase
- `docs/product/INDEX.md` — canonical product + India constraints
- `docs/product/traceability.md` — map historical docs → features

## By area

| Task | Rules | Agents |
| ---- | ----- | ------ |
| Backend API | `05-api-standards`, `06-error-handling`, `09-security` | `.cursor/agents/backend-architect.md` |
| DB / migrations | `15-database-migrations` | `.cursor/agents/database-architect.md` |
| Frontend UI | `13-ui-ux`, `19-responsive-design`, `10-accessibility` | `.cursor/agents/frontend-architect.md` |
| Landing / 3D | `18-animation-usage`, `20-three-d-rules` | `.cursor/agents/animation-specialist.md` |
| Deploy | `17-deployment-workflow` | `.cursor/agents/devops-engineer.md` |
| New feature | `.cursor/workflows/feature-development.md`, `.cursor/checklists/new-feature.md` | product-manager + relevant architect |

## Code locations

- Customer app: `frontend/app/(app)/`, `frontend/features/`
- API: `backend/app/api/v1/endpoints/`
- Services: `backend/app/services/`
- Schema: `docs/database/schema.md`
- Feature specs: `docs/features/<feature>.md`

## Performance note

Rules with `alwaysApply: false` load when matching files are open or when the agent pulls them by `description`. Do not set every rule to `alwaysApply: true`.
