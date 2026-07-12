# PR Workflow

```
Branch  →  Commit  →  Push  →  Open PR  →  CI + Review  →  Address  →  Squash-merge
```

## Branch

- `feat/<scope>-<slug>`, `fix/...`, `chore/...`, etc. (see `12-git-commits.md`)
- Rebase on `develop` daily

## Commit

- Conventional Commits
- One logical change per commit
- Tests + code + docs together (or commits sequenced so each one compiles)

## Push

- Push to origin
- First push: `git push -u origin HEAD`
- Husky pre-push hook runs type-check + unit tests

## Open PR

- Title = squashed commit message (Conventional Commits)
- Body = `.cursor/templates/pr-description.md`, fully filled
- Screenshots for UI (mobile + desktop + dark)
- Link the feature in `logs/feature-progress.md`
- Tag relevant reviewers + agents

## CI gates (all must be green)

- Lint (frontend + backend)
- Type-check
- Unit tests
- Integration tests
- Build (frontend + Docker backend)
- Lighthouse CI (touched routes)
- `pip-audit` / `npm audit`
- Secret scan

## Review

- Reviewer runs `.cursor/checklists/pr-review.md`
- Block on rule violations (cite the rule file)
- Approve when uncertainty is small + rollback is easy

## Address feedback

- Push fixups (don't force-push to overwrite unless rebasing is the only option)
- Reply to each thread
- Re-request review when ready

## Merge

- **Squash-and-merge**
- Final commit message follows the PR title (Conventional Commit)
- Delete the branch

## Post-merge

- Auto-deploy to staging (`develop`) or trigger prod release (`main`)
- Update `logs/implementation-log.md` if not already done
- Close linked issues (`Closes #...`)
