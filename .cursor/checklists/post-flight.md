# Post-flight Checklist

Run this before declaring a task done.

## Quality gates

- [ ] Lint passes (frontend + backend as applicable)
- [ ] Type-check passes (`tsc --noEmit`, `mypy`)
- [ ] Tests pass (`pnpm test`, `pytest`)
- [ ] Coverage gates met
- [ ] Build succeeds (`pnpm build`, backend Docker build)

## Architecture

- [ ] No layering violations
- [ ] No new circular imports
- [ ] Naming conventions followed
- [ ] Folder structure correct

## Security

- [ ] Inputs validated (Zod / Pydantic with `extra="forbid"`)
- [ ] Auth + role enforced on every new endpoint
- [ ] Object-level authz checks in services
- [ ] No secrets in code
- [ ] No PII in logs
- [ ] Dependencies scanned

## Performance

- [ ] No N+1 queries
- [ ] Indexes match query patterns
- [ ] Frontend bundle delta acceptable
- [ ] Lighthouse mobile ≥ 90 on touched routes
- [ ] Backend p95 unchanged or improved

## UI / UX

- [ ] 375 px verified
- [ ] Dark + light verified
- [ ] Keyboard verified
- [ ] Reduced-motion verified
- [ ] Empty / loading / error states present
- [ ] Tokens used (no hardcoded colors)
- [ ] Tap targets ≥ 44 × 44 px

## Accessibility

- [ ] ESLint a11y clean
- [ ] Axe scan clean on touched routes
- [ ] All interactive elements keyboard-operable
- [ ] All inputs labeled
- [ ] Contrast ≥ 4.5:1 body text

## Documentation

- [ ] `logs/implementation-log.md` updated
- [ ] `logs/feature-progress.md` updated (if a feature)
- [ ] Other `logs/*.md` updated as applicable
- [ ] Relevant `docs/` updated
- [ ] OpenAPI docs render cleanly for new endpoints
- [ ] PR description filled out

## Summary

Write a 2-sentence summary you would paste into a PR.
