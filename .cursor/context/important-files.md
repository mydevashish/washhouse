# Important Files — Cheat Sheet

> Where to look for the canonical version of something. Updated as the repo grows.

## Cross-cutting

| Topic                          | File                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| Project mission                | `.cursor/rules/00-project-overview.md`                           |
| Product index                  | `docs/product/INDEX.md`                                          |
| Feature specs                  | `docs/features/README.md`                                        |
| Traceability matrix            | `docs/product/traceability.md`                                   |
| Tech stack                     | `.cursor/context/tech-stack.md`                                  |
| Domain glossary                | `.cursor/context/domain-glossary.md`                             |
| Environment vars               | `.cursor/context/environment.md`                                 |
| Folder structure rules         | `.cursor/rules/03-folder-structure.md`                           |
| Naming conventions             | `.cursor/rules/04-naming-conventions.md`                         |
| Git + commits                  | `.cursor/rules/12-git-commits.md`                                |

## Frontend

| Topic                          | File                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| Architecture rules             | `.cursor/rules/01-architecture.md`                               |
| Design tokens                  | `frontend/styles/tokens.css`                                     |
| Tailwind config                | `frontend/tailwind.config.ts`                                    |
| Axios instance                 | `frontend/lib/api.ts`                                            |
| Env loader                     | `frontend/lib/env.ts`                                            |
| Motion tokens                  | `frontend/lib/motion.ts`                                         |
| Providers                      | `frontend/providers/`                                            |
| Stores                         | `frontend/store/`                                                |
| Global types                   | `frontend/types/`                                                |
| Feature folders                | `frontend/features/<feature>/`                                   |

## Backend

| Topic                          | File                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| App factory                    | `backend/app/main.py`                                            |
| Settings                       | `backend/app/core/config.py`                                     |
| Security helpers               | `backend/app/core/security.py`                                   |
| Exceptions                     | `backend/app/core/exceptions.py`                                 |
| Logging                        | `backend/app/core/logging.py`                                    |
| DB base                        | `backend/app/db/base.py`                                         |
| DB session                     | `backend/app/db/session.py`                                      |
| API router                     | `backend/app/api/v1/router.py`                                   |
| DI deps                        | `backend/app/api/v1/deps.py`                                     |
| Celery app                     | `backend/app/tasks/celery_app.py`                                |
| Alembic env                    | `backend/alembic/env.py`                                         |

## Logs (project-wide)

| Topic                          | File                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| Implementation log             | `logs/implementation-log.md`                                     |
| Feature progress               | `logs/feature-progress.md`                                       |
| Bug tracker                    | `logs/bug-tracker.md`                                            |
| Deployment log                 | `logs/deployment-log.md`                                         |
| Performance log                | `logs/performance-log.md`                                        |
| Security log                   | `logs/security-log.md`                                           |
| Refactor log                   | `logs/refactor-log.md`                                           |
| Decisions log                  | `logs/decisions-log.md`                                          |

## Workflows

| Topic                          | File                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| Feature development            | `.cursor/workflows/feature-development.md`                       |
| Bug-fix workflow               | `.cursor/workflows/bug-fix.md`                                   |
| Refactor workflow              | `.cursor/workflows/refactor.md`                                  |
| Deployment workflow            | `.cursor/workflows/deployment.md`                                |
| PR workflow                    | `.cursor/workflows/pr.md`                                        |
| Daily Cursor workflow          | `.cursor/workflows/daily-cursor.md`                              |
