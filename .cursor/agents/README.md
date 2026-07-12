# Cursor Agents

This folder defines the **specialist personas** Cursor switches into based on the task. Each agent has:

- **Responsibilities** — what they own
- **Standards** — the rules they enforce
- **Workflow** — how they operate
- **Pre-flight checklist** — before starting
- **Post-flight checklist** — before declaring done
- **Output expectations** — what "done" looks like

## When to use which agent

| Task                                       | Primary Agent              | Sub-agent (often used)               |
| ------------------------------------------ | -------------------------- | ------------------------------------ |
| New React component / page                 | `frontend-architect`       | `component-builder`                  |
| New API endpoint                           | `backend-architect`        | `api-engineer`                       |
| New schema / migration                     | `database-architect`       | `database-engineer`                  |
| UX rework / design system                  | `ui-ux-designer`           | `responsive-layout-engineer`         |
| Write/expand tests                         | `qa-engineer`              | `api-tester` / `ui-tester`           |
| Security review                            | `security-reviewer`        | `security-tester`                    |
| Perf investigation                         | `performance-optimizer`    | `performance-tester`                 |
| CI/CD / deploy issue                       | `devops-engineer`          | —                                    |
| Feature scoping / prioritization           | `product-manager`          | —                                    |
| Business / commission rules                | `business-analyst`         | —                                    |
| PR review                                  | `code-reviewer`            | —                                    |
| Accessibility audit                        | `accessibility-reviewer`   | `ui-tester`                          |
| Hero / landing motion                      | `animation-specialist`     | `animation-engineer`                 |
| Docs / ADRs                                | `documentation-writer`     | —                                    |

## Agent registry

| #   | Agent                                                         |
| --- | ------------------------------------------------------------- |
| 01  | [`frontend-architect`](frontend-architect.md)                 |
| 02  | [`backend-architect`](backend-architect.md)                   |
| 03  | [`database-architect`](database-architect.md)                 |
| 04  | [`ui-ux-designer`](ui-ux-designer.md)                         |
| 05  | [`qa-engineer`](qa-engineer.md)                               |
| 06  | [`security-reviewer`](security-reviewer.md)                   |
| 07  | [`performance-optimizer`](performance-optimizer.md)           |
| 08  | [`devops-engineer`](devops-engineer.md)                       |
| 09  | [`product-manager`](product-manager.md)                       |
| 10  | [`business-analyst`](business-analyst.md)                     |
| 11  | [`code-reviewer`](code-reviewer.md)                           |
| 12  | [`accessibility-reviewer`](accessibility-reviewer.md)         |
| 13  | [`animation-specialist`](animation-specialist.md)             |
| 14  | [`documentation-writer`](documentation-writer.md)             |
