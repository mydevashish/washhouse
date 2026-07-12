# Prompt: Generate an ADR

Act as **documentation-writer** with the relevant architect agent.

Decision needed: **<one-sentence question>**

## Steps

1. Read `.cursor/rules/21-documentation.md`, `.cursor/templates/adr.md`.
2. Find the next ADR number in `docs/decisions/` (sequential).
3. Use the template; create `docs/decisions/ADR-NNN-<slug>.md`.
4. Fill in:
   - **Context** — what's forcing this decision
   - **Options** — at least 3 (including "do nothing")
   - **Decision** — what + why
   - **Consequences** — good + bad + follow-ups
5. Coordinate review with the relevant agent(s) before "accepted".
6. Append entry to `logs/decisions-log.md`:
   ```
   ## YYYY-MM-DD — ADR-NNN: <Title>
   - Status: proposed | accepted
   - Summary: ...
   - Impact: ...
   ```
7. If accepted, update any rules / docs the ADR contradicts.

Avoid ADRs for trivial choices. Use the decisions log for those.
