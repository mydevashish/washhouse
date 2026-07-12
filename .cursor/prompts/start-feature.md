# Prompt: Start a feature

Act as the **product-manager** agent first, then hand off to **frontend-architect** and **backend-architect**.

Feature: **<name>**
Persona: **<customer | partner | admin>**
Outcome we want: **<one sentence>**
Constraints: **<budgets, deadlines, scope limits>**

## Step 1 — Discover & spec (PM)

- Read `00-project-overview.md`, `.cursor/agents/product-manager.md`
- Create `docs/features/<feature>.md` using `.cursor/templates/feature-spec.md`
- Define goals, non-goals, user stories, acceptance criteria
- Add entry to `logs/feature-progress.md` with status `planned`
- Sketch the UX flow (Mermaid acceptable)
- Identify metrics

## Step 2 — Plan the slice (architects)

- Backend: schemas → model → migration → repo → service → endpoint
- Frontend: routes → feature folder → components → state → polish
- Background work (Celery) if any
- Document API contract in `docs/api/` upfront

## Step 3 — Build (sub-agents)

Hand off:
- `database-engineer` → models + migration
- `api-engineer` → endpoint
- `component-builder` → atoms / molecules
- `form-specialist` → forms
- `state-management-engineer` → data hooks

## Step 4 — Quality

- `qa-engineer` → unit + integration + E2E
- `security-reviewer` → auth + authz + inputs
- `performance-optimizer` → budgets
- `accessibility-reviewer` → axe + manual
- `ui-ux-designer` → token + dark + 375 px

## Step 5 — Ship

- `code-reviewer` → PR checklist
- `devops-engineer` → staging → prod
- Update `logs/feature-progress.md` → `shipped`
- Update `docs/features/<feature>.md` → `shipped`
- Post-deploy smoke test

Begin with **Step 1**. Ask one clarifying question if persona / outcome is unclear.
