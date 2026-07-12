---
description: Master project context. Always loaded (core rules only; see .cursor/rules/README.md).
alwaysApply: true
---

# Doorstep Laundry Marketplace — Project Overview

> **Cursor: read this first on every conversation.** This is the master rule.

## What we are building

**Doorstep Laundry Marketplace (DLM)** — a youth-focused, mobile-first marketplace where customers discover nearby laundries, schedule pickup & delivery, track orders in real time, and subscribe to monthly plans. Laundry partners get an order/inventory/pricing management dashboard. Admins get approvals, commissions, analytics, and complaint oversight.

## Personas

| Persona      | Goals                                                                 |
| ------------ | --------------------------------------------------------------------- |
| **Customer** | Find a good laundry fast, schedule pickup, pay, track, rate, subscribe |
| **Partner**  | Onboard, accept orders, run operations, see revenue                   |
| **Admin**    | Approve partners, set commissions, monitor health, resolve complaints |

## Core domains

- `auth` — registration, login, refresh, roles, password reset, OTP
- `users` — profiles, addresses, preferences
- `laundries` — partner registration, services, pricing, ratings
- `orders` — booking, lifecycle (pending → picked → washing → ready → out_for_delivery → delivered)
- `payments` — order payments, subscriptions, refunds, commissions
- `reviews` — ratings + text reviews, moderation
- `subscriptions` — monthly plans, recurring billing
- `notifications` — email, SMS, push, in-app
- `admin` — dashboards, approvals, complaints, commissions
- `analytics` — KPIs for partners + admins

## Non-negotiable principles

1. **Mobile-first.** Every screen designed for 360–414 px first, scaled up.
2. **Performance.** Lighthouse mobile ≥ 90, TTI < 3 s on 4G.
3. **Type-safety.** TypeScript strict on frontend, Pydantic v2 + typed SQLAlchemy on backend.
4. **Clean architecture.** API → service → repository → model. No shortcuts.
5. **Documentation lives with code.** Every feature updates `logs/` + `docs/`.
6. **Security by default.** Validate inputs, never trust the client, JWT everywhere.
7. **Accessibility.** WCAG 2.1 AA minimum.
8. **3D is ornamental.** R3F only on landing/hero. Never in dashboards.

## Tech stack — authoritative

### Frontend
- Next.js 15 (App Router, RSC, Server Actions)
- TypeScript strict
- Tailwind CSS + shadcn/ui
- Zustand (client state), TanStack Query (server state)
- React Hook Form + Zod
- Axios (with auth interceptor)
- Framer Motion
- React Three Fiber + Drei *(landing only)*
- Playwright + Jest + React Testing Library

### Backend
- FastAPI (async)
- SQLAlchemy 2.x (async)
- PostgreSQL 16
- Alembic
- Redis + Celery
- JWT (access + refresh) + bcrypt
- Pydantic v2
- Pytest + httpx

### Hosting
- Frontend → Vercel
- Backend → Railway
- DB → Neon
- Redis → Upstash

## Folder structure (canonical)

```
DLM/
├── backend/
├── frontend/
├── docs/
├── logs/
├── scripts/
├── infrastructure/
├── docker/
├── .cursor/
├── .github/
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Cursor operating mode

When working on this repo, Cursor acts as:

- **Senior Developer** — writes production-grade code
- **Product Manager** — challenges scope, asks "why"
- **QA Engineer** — writes/updates tests with every change
- **UI/UX Designer** — enforces design system + a11y
- **DevOps Engineer** — keeps CI/CD green
- **Technical Architect** — protects clean architecture
- **Security Reviewer** — checks every input, every header
- **Business Analyst** — ties code to business outcomes

## Mandatory checks before "done"

- ✅ Lint + type-check pass
- ✅ Tests pass (unit + relevant integration)
- ✅ `logs/implementation-log.md` updated
- ✅ `logs/feature-progress.md` updated if feature
- ✅ Relevant `docs/` updated
- ✅ Security implications reviewed
- ✅ Performance implications reviewed
- ✅ Accessibility implications reviewed

## Python virtual environment

The Python venv is always named **`DLM_env`**. All backend commands assume it is activated:

```bash
# Windows
backend\DLM_env\Scripts\activate
# macOS/Linux
source backend/DLM_env/bin/activate
```

---

**See also:**
- [`01-architecture.md`](01-architecture.md) — clean-architecture rules
- [`02-code-quality.md`](02-code-quality.md) — code quality standards
- [`16-cursor-operating-rules.md`](16-cursor-operating-rules.md) — how Cursor must operate
