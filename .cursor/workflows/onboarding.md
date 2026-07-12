# Onboarding Workflow

First day on the DLM codebase. Aim: shipping your first tiny PR by end of day 2.

## Day 0 — Setup

- [ ] Clone the repo
- [ ] Install Node ≥ 20, pnpm ≥ 9, Python ≥ 3.11, Docker
- [ ] `docker compose up -d --build`
- [ ] Verify:
  - <http://localhost:3000> renders
  - <http://localhost:8000/api/v1/docs> renders
- [ ] Manual: `cd backend && python -m venv DLM_env && activate && pip install -r requirements/dev.txt`
- [ ] Manual: `cd frontend && pnpm install && pnpm dev`

## Day 1 — Read

Read in this order (≈ 90 min):

1. `README.md`
2. `.cursor/rules/00-project-overview.md`
3. `.cursor/context/product.md`
4. `.cursor/context/tech-stack.md`
5. `.cursor/context/domain-glossary.md`
6. `.cursor/rules/01-architecture.md`
7. `.cursor/rules/03-folder-structure.md`
8. `.cursor/rules/16-cursor-operating-rules.md`
9. `docs/architecture/overview.md`

## Day 1 — Explore

- [ ] Click through the customer flow (register → discover → place order → track)
- [ ] Open the partner dashboard, place a test order, accept it
- [ ] Open the admin dashboard
- [ ] Read one Alembic migration end-to-end
- [ ] Read one feature folder end-to-end (`frontend/features/orders/`)

## Day 2 — Ship

- [ ] Pick a `good-first-issue` from the tracker
- [ ] Follow `.cursor/workflows/feature-development.md` (small slice)
- [ ] Open the PR using `.cursor/templates/pr-description.md`
- [ ] Address review
- [ ] Merge

## Day 7 — Check-in

- [ ] Confidence with each agent's role?
- [ ] Any rules unclear?
- [ ] Suggestions for `.cursor/logs/learnings.md`?

## Resources

- Architecture docs: `docs/architecture/`
- API docs: `docs/api/`
- Local API docs: <http://localhost:8000/api/v1/docs>
- Component playground: `cd frontend && pnpm storybook`
