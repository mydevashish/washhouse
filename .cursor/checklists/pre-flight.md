# Pre-flight Checklist

Run this before writing any code.

## Context

- [ ] Read `00-project-overview.md`
- [ ] Identified the responsible **agent** (`.cursor/agents/`)
- [ ] Identified the **sub-agent** if applicable
- [ ] Reviewed any relevant rules (e.g., security, perf, a11y)
- [ ] Located the affected feature in `logs/feature-progress.md`

## Scope

- [ ] Task scope written in 1–3 sentences
- [ ] Acceptance criteria written (Given/When/Then)
- [ ] Non-goals explicit
- [ ] Persona affected named

## Design

- [ ] Smallest viable slice identified
- [ ] UI sketched at 375 px (for UI tasks)
- [ ] API contract drafted (for backend tasks)
- [ ] DB shape drafted (for data tasks)

## Safety

- [ ] Auth + role requirements identified
- [ ] PII implications identified
- [ ] Rate-limit / abuse scenarios considered
- [ ] Performance budget impact estimated

## Tests

- [ ] List of test cases written before coding
- [ ] Mocking strategy decided
- [ ] E2E flow named (if user-visible)

## Logs / docs

- [ ] Which `logs/` files will be updated?
- [ ] Which `docs/` will be updated?
- [ ] Need an ADR? If yes, draft it first.

## Plan (optional but recommended)

> Post a 3–7 step plan in the chat before coding.
