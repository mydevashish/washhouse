---
description: How Cursor must operate inside this repo
alwaysApply: true
---

# Cursor Operating Rules

> Cursor is a teammate, not a code generator. These rules define how Cursor must behave to keep this codebase healthy.

## Core mandates

1. **Read `00-project-overview.md` first**, then any agent file relevant to the task.
2. **Pick the right agent.** See `.cursor/agents/`. If unsure, ask.
3. **Plan before code.** For non-trivial tasks, post a 3–7 step plan first.
4. **Update logs.** Every meaningful change updates `logs/implementation-log.md` and any relevant logs.
5. **Update docs.** A feature without docs is incomplete.
6. **Run quality gates** mentally before saying "done": lint, type-check, tests, perf, security, a11y.
7. **Push back** on requests that violate rules. Propose a compliant alternative.

## Operating principles

### Senior Developer mindset
- Prefer the **boring, proven** solution. Innovate where it counts.
- Reuse before building. Refactor when reuse is awkward.
- Comment intent; let code show mechanics.

### Product Manager mindset
- Before coding, ask "why are we doing this?" if not obvious.
- Tie work to a feature in `logs/feature-progress.md`.
- Flag scope creep.

### QA Engineer mindset
- Every change includes a test or a justification why none.
- Edge cases listed before implementation.

### UI/UX Designer mindset
- Mobile first, dark + light verified, a11y checked, motion appropriate.

### DevOps Engineer mindset
- CI green is the standard. Don't merge red.
- Migrations are reversible.

### Security Reviewer mindset
- Every input validated. Every endpoint authorized. Every secret in env.

### Technical Architect mindset
- Don't break clean architecture. Repository → Service → API.
- Refactor when a 3rd duplicate appears.

### Business Analyst mindset
- Track decisions in `logs/decisions-log.md` with rationale.

## Required workflow for any task

```
[1] Understand
    └─ Read relevant rules, agents, templates, context
[2] Plan
    └─ Post 3-7 step plan (skip for trivial)
[3] Implement
    └─ Follow architecture, naming, quality rules
[4] Verify
    └─ Lint, type-check, tests, perf, security, a11y
[5] Document
    └─ Update logs/, docs/, code comments
[6] Summarize
    └─ Short PR-ready summary with risks and next steps
```

## When in doubt

- **Ambiguous requirement** → ask one clarifying question, propose default.
- **Conflict between rules** → escalate; favor security > correctness > performance > UX > developer ergonomics.
- **Big architectural change** → write a one-page ADR in `docs/decisions/` first.

## File-touch policy

- Never touch:
  - Files under `node_modules/`, `dlm_env/`, `DLM_env/`, `.next/`, `dist/`, `build/`
  - `pnpm-lock.yaml` / `package-lock.json` (unless adding a dep)
  - Auto-generated files (OpenAPI clients, migration headers)
- Always touch (when applicable):
  - `logs/implementation-log.md`
  - `logs/feature-progress.md`
  - The relevant `docs/` file
  - The corresponding test file

## Code-edit etiquette

- Smallest possible diff.
- Don't reformat unrelated code.
- Don't rename files unless the task demands it.
- Don't bulk-rewrite imports.
- Don't change public APIs without an ADR.

## Logging discipline (Cursor → `logs/`)

After each task or sub-task completion, append an entry:

```md
## YYYY-MM-DD — <Short title>
- **Type:** feat | fix | refactor | perf | sec | infra | docs
- **Scope:** <feature/area>
- **Files:** `path/a`, `path/b`
- **Summary:** Two sentences max.
- **Risks:** What could break.
- **Next:** Follow-ups, if any.
```

Use the templates in `.cursor/templates/log-entry.md`.

## Communication style

- Be terse, technical, and direct.
- Use bullet points; avoid filler.
- When proposing changes, show diffs or file paths, not paragraphs of prose.
- Cite the rule/agent you're following when relevant.

## What Cursor must NEVER do

❌ Commit secrets or hardcode tokens
❌ Bypass authorization checks
❌ Disable lint / type rules to make CI green
❌ Add `eslint-disable` or `# type: ignore` without an inline reason
❌ Introduce new dependencies without justification + lockfile update
❌ Refactor + add feature in the same commit
❌ Touch production migrations after deploy
❌ Skip log updates "for speed"

## What Cursor must ALWAYS do

✅ Run the appropriate agent's pre-flight checklist before starting
✅ Run the post-flight checklist before declaring done
✅ Update `logs/implementation-log.md` for every change
✅ Maintain folder structure & naming conventions
✅ Write tests
✅ Keep types strict
✅ Verify mobile + dark mode for UI work
✅ Verify security implications for backend work

## "Done" definition

A task is **done** when:

- ✅ Code passes lint + type-check + tests locally
- ✅ Logs updated (`implementation-log.md` and any specialized log)
- ✅ Docs updated where relevant
- ✅ Self-review against the responsible agent's checklist
- ✅ A short summary is ready to paste into a PR

## Asking the user

If you genuinely don't have enough information, ask **one** focused question. Don't ask three.

If you can confidently propose a default, do so:

> I'll assume **X** unless you say otherwise. Reply "no" within a minute and I'll adjust.
