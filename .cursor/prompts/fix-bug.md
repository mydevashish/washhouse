# Prompt: Fix a bug

Act as **qa-engineer** then the relevant architect.

Bug: **<short title>**
Severity: **SEV1 | SEV2 | SEV3 | SEV4**
Reproducer: **<steps>**
Expected: **...**
Actual: **...**

## Steps

1. Read `.cursor/rules/06-error-handling.md` + the related agent file.
2. Open / create the bug entry in `logs/bug-tracker.md` using `.cursor/templates/bug-report.md`.
3. Reproduce locally.
4. **Write a failing test first** that captures the bug.
5. Fix the smallest code path possible.
6. Confirm the failing test now passes.
7. Verify no regressions: full test suite + lint + type-check.
8. Add observability if you wished you had it (logs / metrics).
9. Update `logs/implementation-log.md` and resolve the bug in `logs/bug-tracker.md`.
10. If SEV1/SEV2, file a post-mortem in `docs/decisions/`.
11. Run `.cursor/checklists/post-flight.md`.

If the root cause requires architectural change, **stop and propose an ADR**.
