# Contributing to Doorstep Laundry Marketplace

Welcome. This guide explains how to work on the codebase. The full rulebook lives in [`.cursor/rules/`](.cursor/rules/).

## TL;DR

1. Read `.cursor/rules/00-project-overview.md`.
2. Pick (or create) an issue with a clear acceptance criteria.
3. Branch from `develop`: `feat/<scope>-<short-slug>` (or `fix/`, `chore/`, `docs/`, `refactor/`).
4. Code → lint → typecheck → test locally.
5. Open a PR using the template.
6. Address review feedback.
7. Merge (squash). Update `logs/implementation-log.md` and `logs/feature-progress.md`.

## Setup

```bash
# Windows
.\scripts\setup.ps1

# macOS / Linux
./scripts/setup.sh
```

Then:

```bash
docker compose up           # local stack
# or
./scripts/dev.sh
```

## Backend (FastAPI)

```bash
cd backend
# Activate the virtual environment (DLM_env)
source DLM_env/bin/activate     # macOS / Linux
.\DLM_env\Scripts\Activate.ps1  # Windows

ruff check .                    # lint
ruff format .                   # format
mypy app                        # types
pytest -q                       # tests
alembic upgrade head            # apply migrations
uvicorn app.main:app --reload   # run dev server
```

## Frontend (Next.js)

```bash
cd frontend
pnpm install
pnpm dev                        # dev server
pnpm lint                       # eslint
pnpm typecheck                  # tsc
pnpm test:ci                    # jest
pnpm test:e2e                   # playwright
pnpm build                      # production build
```

## Code rules (high signal)

- Read [`.cursor/rules/02-code-quality.md`](.cursor/rules/02-code-quality.md).
- **Mobile-first** — design at 375 px first.
- **Server components by default**; `"use client"` only when needed.
- **No business logic in endpoints** — use services.
- **No `any`**, no `print`, no `console.log` in committed code.
- **Errors are typed.** Raise domain exceptions; never raw HTTPException.
- **Migrations** — Alembic, reversible, online-safe.
- **Logs** — structured, no PII, propagate `request_id`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(orders): add cancellation window
fix(auth): rotate refresh token on use
docs(api): document /v1/laundries query params
refactor(frontend): extract Discover filters into hook
chore(deps): bump fastapi to 0.115
```

## Pull requests

Use the template. Mandatory items:

- Linked issue / spec
- Screenshots for any UI (mobile + desktop)
- "How to test" steps
- Checklist ticked
- `logs/implementation-log.md` updated

PRs that touch:

- DB schema → `migrations` reviewer required
- Auth / security → `security-reviewer` agent
- UI → `ui-ux-designer` + `accessibility-reviewer`

## Reviewing

- Look for: rule violations, missing tests, ambiguous naming, perf footguns, accessibility gaps.
- Use the checklists in `.cursor/checklists/`.

## Reporting bugs

Use the bug template under `.github/ISSUE_TEMPLATE/bug_report.md`.

## Asking questions

- Architecture: ping `backend-architect` / `frontend-architect`.
- Product: ping `product-manager`.
- Open questions go in `.cursor/logs/open-questions.md`.

## Community standards

- Be kind, blunt about ideas, kind about people.
- Disagree-and-commit once a decision is made.
- Document the why, not the what.

Welcome aboard.
