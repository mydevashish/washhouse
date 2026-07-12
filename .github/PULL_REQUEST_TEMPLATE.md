<!-- Use this template for every PR. Keep it short and concrete. -->

## Summary
<!-- 1-3 sentences. What changed and why. -->

## Linked issues / specs
- Closes #
- Spec: `docs/features/<feature>.md`
- ADR (if any): `docs/decisions/ADR-NNN-...md`

## Changes
- [ ] Backend
- [ ] Frontend
- [ ] DB migration
- [ ] Docs
- [ ] Infra / CI
- [ ] Tests only

## Screenshots / recordings
<!-- Required for any UI change. Mobile (375px) and desktop. -->

## How to test
<!-- Exact steps to verify locally. Include credentials / seed if needed. -->
1. ...
2. ...

## Checklist
- [ ] Follows `.cursor/rules/`
- [ ] Lint, type-check, tests pass locally
- [ ] New code has unit / integration tests
- [ ] Mobile-first layout verified (375 / 768 / 1024 / 1440)
- [ ] Dark mode verified (if UI)
- [ ] A11y checks (keyboard, screen reader, contrast) — if UI
- [ ] Errors logged with `request_id` (if backend)
- [ ] No PII in logs
- [ ] Performance budgets met
- [ ] Security: auth, authz, validation, rate limits considered
- [ ] Migrations reviewed for online safety (if DB)
- [ ] `logs/implementation-log.md` updated
- [ ] `logs/feature-progress.md` updated (if feature)
- [ ] Docs updated

## Risks + rollback
<!-- What could break? How do we roll back? -->
