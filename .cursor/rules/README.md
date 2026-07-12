# Cursor Rules

Standards for humans and AI. Rules load by scope to keep context lean.

## Always loaded (`alwaysApply: true`)

| File | Topic |
| ---- | ----- |
| [00-project-overview.md](00-project-overview.md) | Mission, stack, phases |
| [01-architecture.md](01-architecture.md) | Clean architecture |
| [03-folder-structure.md](03-folder-structure.md) | Repo layout |
| [09-security.md](09-security.md) | Security baseline |
| [16-cursor-operating-rules.md](16-cursor-operating-rules.md) | Cursor workflow |

## On demand (`alwaysApply: false`)

Loaded when matching files are open (see `globs` in frontmatter) or when the agent pulls them by `description`.

| File | Topic | Typical `globs` |
| ---- | ----- | ---------------- |
| [02-code-quality.md](02-code-quality.md) | Code quality | — |
| [04-naming-conventions.md](04-naming-conventions.md) | Naming | `**/*.{ts,tsx,py}` |
| [05-api-standards.md](05-api-standards.md) | REST API | `backend/**` |
| [06-error-handling.md](06-error-handling.md) | Errors | `backend/**` |
| [07-logging.md](07-logging.md) | Logging | `backend/**` |
| [08-testing.md](08-testing.md) | Testing | `**/*test*` |
| [10-accessibility.md](10-accessibility.md) | A11y | `frontend/**` |
| [11-performance.md](11-performance.md) | Performance budgets | — |
| [12-git-commits.md](12-git-commits.md) | Git + commits | — |
| [13-ui-ux.md](13-ui-ux.md) | UI/UX + tokens | `frontend/**` |
| [14-state-management.md](14-state-management.md) | State | `frontend/**` |
| [15-database-migrations.md](15-database-migrations.md) | DB + migrations | `backend/**` |
| [17-deployment-workflow.md](17-deployment-workflow.md) | Deployment | — |
| [18-animation-usage.md](18-animation-usage.md) | Motion | `frontend/**` |
| [19-responsive-design.md](19-responsive-design.md) | Responsive | `frontend/**` |
| [20-three-d-rules.md](20-three-d-rules.md) | R3F 3D | `frontend/features/landing/**` |
| [21-documentation.md](21-documentation.md) | Docs | `docs/**` |

## Related

- Agent routing: [`AGENTS.md`](../../AGENTS.md) at repo root
- Indexing exclusions: [`.cursorignore`](../../.cursorignore)

> Start with `00-project-overview.md`. Do not set every rule to `alwaysApply: true` — it slows every chat.
