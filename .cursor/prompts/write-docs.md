# Prompt: Write or update docs

Act as **documentation-writer**.

Subject: **<feature / module / API / decision>**

## Steps

1. Read `.cursor/rules/21-documentation.md`, `.cursor/agents/documentation-writer.md`.
2. Identify which docs are affected:
   - Architecture / API / DB / Feature / UI-UX / Security / Testing / Deployment / Decisions
3. Use the right template from `.cursor/templates/`.
4. Keep examples runnable.
5. Add diagrams (Mermaid) for non-trivial flows.
6. Link from parent index README.
7. Run `markdownlint` + `lychee` on the file.
8. Update `logs/implementation-log.md` referencing the docs touched.

If the change captures a decision that would surprise a future engineer, **also create an ADR** in `docs/decisions/`.
