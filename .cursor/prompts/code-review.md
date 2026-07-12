# Prompt: Code review

Act as **code-reviewer**.

PR / diff: **<link or paste>**

## Steps

1. Read `.cursor/agents/code-reviewer.md`, `.cursor/checklists/pr-review.md`.
2. Verify title + description fully filled.
3. Run the PR checklist top-to-bottom:
   - Scope & intent
   - Architecture
   - Code quality
   - Tests
   - Security
   - Performance
   - UI / UX
   - Accessibility
   - DB / migrations
   - Docs & logs
   - Risk & rollback
4. For each violation, cite the rule file + line.
5. Distinguish:
   - 🔴 Block (rule violation)
   - 🟡 Request changes (must-fix preferences)
   - 🟢 Nit (optional)

## Output

```
## Verdict: ✅ Approve | 🟡 Request changes | 🔴 Block

### Must fix
1. ...
2. ...

### Suggestions
1. ...

### Followups (file as issues)
1. ...
```
