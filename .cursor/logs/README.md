# Cursor Operational Logs

Internal logs Cursor writes to track its own behavior, status, and learnings during this workspace.

> Distinct from `/logs/` at the repo root, which tracks **project-wide** implementation, bugs, deployments, and decisions.

| File                                | Purpose                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| [`session-notes.md`](session-notes.md) | Per-session running notes during a long task         |
| [`agent-handoffs.md`](agent-handoffs.md) | Records when Cursor switches between agents         |
| [`open-questions.md`](open-questions.md) | Open questions to surface to the user               |
| [`learnings.md`](learnings.md)      | Things Cursor learned about this repo                    |
| [`overrides.md`](overrides.md)      | User-approved exceptions to default rules                |

## How to use

- Cursor appends to these files as it works.
- Entries are short and structured.
- Old entries are archived monthly into `archive/<YYYY-MM>.md`.
- Project-wide logs (`/logs/`) take precedence; `.cursor/logs/` is for Cursor's own scratch.
