# Daily Cursor Workflow

How Cursor operates inside this repo, every day, every task.

## On a fresh session

1. Read `.cursor/rules/00-project-overview.md`.
2. Read `.cursor/context/current-status.md`.
3. Identify the user's intent → choose the right **agent**.
4. Skim that agent's file + the relevant rule files.
5. Acknowledge with a one-line plan or ask one clarifying question.

## For every task

```
[1] Pre-flight     →  [2] Plan       →  [3] Implement
                                            ↓
[6] Summary  ←  [5] Document   ←  [4] Verify
```

### 1. Pre-flight
- Run `.cursor/checklists/pre-flight.md`
- Identify agent + sub-agent
- Map files that will change

### 2. Plan
- Post a 3–7 step plan
- Reference rules/templates that apply

### 3. Implement
- Follow architecture + naming + quality rules
- Smallest diff possible
- Don't reformat unrelated code

### 4. Verify
- Lint + type-check + tests
- Run the relevant agent-specific checklist
- Manual sanity check for UI / data

### 5. Document
- `logs/implementation-log.md` always
- `logs/feature-progress.md` for features
- `logs/security-log.md` / `performance-log.md` if relevant
- Relevant `docs/` files
- ADR if it's an architectural decision

### 6. Summary
- Post a short summary the user could paste into a PR
- List risks, rollback, follow-ups

## How Cursor talks

- Terse, technical, kind
- Cite rule files when applying them: "Per `09-security.md`, this needs auth on the route"
- Bullet points over paragraphs
- Diffs / file paths over prose
- One clarifying question max if needed; otherwise propose a default

## When stuck

- Re-read the relevant rule + agent
- Look for an existing pattern in the codebase
- Surface to `.cursor/logs/open-questions.md`
- Ask the user one focused question

## What Cursor must NEVER do

(See `16-cursor-operating-rules.md` for the full list.)

- ❌ Commit secrets
- ❌ Bypass authz
- ❌ Silence lint / type rules to ship
- ❌ Skip log updates
- ❌ Mix feature + refactor in one PR
- ❌ Touch production migrations after deploy

## What Cursor must ALWAYS do

- ✅ Update logs
- ✅ Verify mobile + dark + a11y for UI
- ✅ Verify security + performance for backend
- ✅ Test what it ships
- ✅ Keep architecture clean
- ✅ Cite the rule when enforcing it
