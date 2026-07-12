# Sub-Agents

Specialist executors that work under a primary agent. Each sub-agent is laser-focused on one craft.

## Structure

```
sub-agents/
├── frontend/
│   ├── component-builder.md
│   ├── animation-engineer.md
│   ├── responsive-layout-engineer.md
│   ├── form-specialist.md
│   └── state-management-engineer.md
├── backend/
│   ├── api-engineer.md
│   ├── auth-engineer.md
│   ├── database-engineer.md
│   ├── celery-engineer.md
│   └── cache-engineer.md
└── qa/
    ├── api-tester.md
    ├── ui-tester.md
    ├── performance-tester.md
    └── security-tester.md
```

## When to invoke a sub-agent

Primary agents delegate to sub-agents for narrow, repetitive tasks:

| Primary                  | Sub-agent for…                                                  |
| ------------------------ | --------------------------------------------------------------- |
| `frontend-architect`     | Building one component / form / animation                       |
| `backend-architect`      | Implementing one endpoint / auth flow / Celery task              |
| `database-architect`     | Writing one repository or one query optimization                |
| `qa-engineer`            | Writing tests for one endpoint / one screen / one flow          |

Sub-agents follow all rules in `.cursor/rules/` and report to their primary agent for coordination.
