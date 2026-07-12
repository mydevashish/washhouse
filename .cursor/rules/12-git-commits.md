---
description: Git, branching, and commit message rules
alwaysApply: false
---

# Git & Commit Rules

## Branch model

We use a trunk-based model:

- `main` — protected, production
- `develop` — protected, staging
- `feat/...`, `fix/...`, `chore/...`, etc. — short-lived feature branches

### Branch naming

```
<type>/<scope>-<short-kebab>

feat/auth-add-otp-login
fix/orders-status-race
chore/deps-bump-fastapi
docs/architecture-update-diagram
refactor/repos-extract-base
perf/orders-add-index
test/e2e-checkout
ci/github-actions-cache
```

`<scope>` corresponds to a feature folder (`auth`, `orders`, `laundries`, etc.) or an area (`deps`, `ci`, `docs`).

## Conventional Commits

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type       | When                                                                |
| ---------- | ------------------------------------------------------------------- |
| `feat`     | New user-visible feature                                            |
| `fix`      | Bug fix                                                             |
| `docs`     | Documentation only                                                  |
| `style`    | Formatting / whitespace (no logic)                                  |
| `refactor` | Code change that neither adds a feature nor fixes a bug             |
| `perf`     | Performance improvement                                             |
| `test`     | Adding/fixing tests                                                 |
| `chore`    | Tooling, deps, build                                                |
| `ci`       | CI configuration                                                    |
| `build`    | Build system, bundler configs                                       |
| `revert`   | Reverts a previous commit                                           |

### Rules

1. **Subject is imperative**, ≤ 72 chars, no period.
   - ✅ `feat(orders): add cancellation flow`
   - ❌ `Added the cancellation flow.`
2. **Scope is lowercase** and matches the feature folder.
3. **Body** explains *why*, not *what* (the diff shows what). Wrap at 100 cols.
4. **Footer** for breaking changes and issue refs:
   - `BREAKING CHANGE: <description>`
   - `Refs: #123`, `Closes: #456`
5. **One logical change per commit.** No "fix typo + add feature".

### Examples

```
feat(orders): add cancellation flow with refund window

Customers can cancel within 15 minutes of pickup confirmation.
A Celery task processes the refund asynchronously.

Closes: #142
```

```
fix(auth): prevent refresh-token reuse

The previous implementation accepted a refresh token after rotation
because we only invalidated on a successful exchange. We now mark
the old token as used before issuing the new one.

Refs: SEC-2026-04-12
```

```
chore(deps): bump fastapi to 0.115.0

Updates patch+minor to pick up async lifespan fixes.
No code changes required.
```

## Pull requests

### Title

Same convention as the squashed commit message — Conventional Commit format.

### Description (template enforced)

```
## Summary
What changed and why.

## Screenshots / Recordings
(if UI)

## Test plan
- [ ] Unit
- [ ] Integration / E2E
- [ ] Manual
- [ ] Lighthouse / load test (if perf-sensitive)

## Logs updated
- [ ] `logs/implementation-log.md`
- [ ] `logs/feature-progress.md`
- [ ] Other:

## Risk & rollback
What could break, and how do we revert?

Refs: #
```

### Review

- Min 1 approval (2 for `main`).
- All CI green.
- All required logs updated.
- No `console.log` / `print` / `TODO` without a tracking issue.

### Merging

- **Squash and merge** to `develop` / `main`.
- Delete branches after merge.
- Releases via tags `v<MAJOR>.<MINOR>.<PATCH>` from `main`.

## Pre-commit hooks (husky / pre-commit)

| Hook            | Action                                                |
| --------------- | ----------------------------------------------------- |
| `pre-commit`    | lint + format staged files                            |
| `commit-msg`    | Conventional Commits lint                             |
| `pre-push`      | type-check + unit tests on touched packages           |

## What NOT to commit

- ❌ `.env*` (except `.env.example`)
- ❌ `node_modules/`, `DLM_env/`, build artifacts
- ❌ Generated coverage / report files
- ❌ IDE configs (except `.vscode/extensions.json` + `.vscode/settings.json`)
- ❌ Secrets, tokens, API keys (pre-commit scans)
- ❌ Database dumps
- ❌ Personal `.local` overrides

## Rebase / squash policy

- Rebase your feature branch on `develop` daily.
- Squash before merge (squash-and-merge does this automatically).
- Never rewrite history on `main` or `develop`.

## Tags & releases

- `v0.x.y` until first prod release (1.0).
- After 1.0: SemVer strict.
  - `MAJOR` — breaking API or major UX overhaul
  - `MINOR` — new features, backward compatible
  - `PATCH` — bug fixes only
- Release notes generated from Conventional Commits.
