# PR Review Checklist

Full list — same as `.cursor/agents/code-reviewer.md`. Use this as a fast scan when reviewing.

## Quick scan (≤ 5 minutes)

- [ ] Title follows Conventional Commits
- [ ] Description filled (summary, screenshots, test plan, logs, risk)
- [ ] CI green
- [ ] Logs updated (`implementation-log.md` at minimum)
- [ ] Scope matches title — no scope creep

## Architecture

- [ ] Layering preserved (API → Service → Repo)
- [ ] Files in correct folder per `03-folder-structure.md`
- [ ] Naming per `04-naming-conventions.md`

## Code quality

- [ ] No `any` / `Any` (TS) or untyped Python
- [ ] No `console.log` / `print`
- [ ] No commented-out code
- [ ] Functions ≤ 40 lines (soft)
- [ ] No magic numbers

## Tests

- [ ] New code covered
- [ ] Critical paths covered (integration / E2E)
- [ ] No skipped tests without an issue link
- [ ] No flaky additions

## Security

- [ ] Auth required on new endpoints
- [ ] Inputs validated
- [ ] No secrets committed
- [ ] No PII in logs
- [ ] IDOR / authz tests added

## Performance

- [ ] No N+1
- [ ] Bundle delta acceptable (frontend)
- [ ] Lighthouse mobile ≥ 90 (touched routes)
- [ ] p95 stable or better (backend)

## UI / UX

- [ ] 375 px verified
- [ ] Dark mode parity
- [ ] Keyboard + screen-reader friendly
- [ ] Empty / loading / error states present
- [ ] Tokens used

## Database

- [ ] Migration reviewed (forward + back)
- [ ] Indexes correct
- [ ] No data + schema change on hot table in one migration

## Docs

- [ ] `docs/` updated where applicable
- [ ] OpenAPI clean
- [ ] ADR (if architectural)

## Verdict

- [ ] ✅ Approve
- [ ] 🟡 Request changes (list must-fix)
- [ ] 🔴 Block (rule violation + cite the rule)
