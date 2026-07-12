# Project-wide Logs

These are the **source of truth** for what changed, why, and when.

| File                                                     | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| [`implementation-log.md`](implementation-log.md)         | Append-only running log of every meaningful change   |
| [`feature-progress.md`](feature-progress.md)             | Feature kanban-style tracker                         |
| [`bug-tracker.md`](bug-tracker.md)                       | All bugs (open + resolved)                           |
| [`deployment-log.md`](deployment-log.md)                 | Every deploy                                         |
| [`refactor-log.md`](refactor-log.md)                     | Refactors with before/after metrics                  |
| [`performance-log.md`](performance-log.md)               | Perf investigations + outcomes                       |
| [`security-log.md`](security-log.md)                     | Security findings + fixes                            |
| [`decisions-log.md`](decisions-log.md)                   | Lightweight decisions (heavier ones → ADRs)          |

## Update rules

Cursor (and humans) **must** append after:

- A new feature
- A refactor
- A bug fix
- A perf optimization
- A security change
- A deploy
- A schema change
- A material decision

Use `.cursor/templates/log-entry.md` for the entry format.

## Why this exists

- **Memory.** Months from now, you'll want to know why something was decided.
- **Onboarding.** New engineers read this to catch up.
- **Audit.** Compliance + incident response need it.
- **Cursor.** AI agents need it to behave consistently across sessions.
