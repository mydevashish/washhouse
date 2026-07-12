---
description: Canonical folder structure and where things go
alwaysApply: true
---

# Folder Structure Rules

## Root

```
DLM/
├── backend/              # FastAPI
├── frontend/             # Next.js
├── docs/                 # All long-form documentation
├── logs/                 # Implementation tracking (machine + human readable)
├── scripts/              # Cross-stack utilities (db init, seeds, codegen)
├── infrastructure/       # IaC, deployment configs, Railway/Vercel/Neon
├── docker/               # Dockerfiles (overrides, not the primary ones)
├── .cursor/              # Cursor workspace (rules, agents, workflows)
├── .github/              # GitHub Actions, issue/PR templates
├── docker-compose.yml
├── .gitignore
└── README.md
```

## `backend/`

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/         # One file per resource
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── laundries.py
│   │   │   │   ├── orders.py
│   │   │   │   ├── payments.py
│   │   │   │   ├── reviews.py
│   │   │   │   ├── subscriptions.py
│   │   │   │   ├── notifications.py
│   │   │   │   └── admin.py
│   │   │   ├── deps.py            # Dependency injection helpers
│   │   │   └── router.py          # Aggregates all endpoints
│   │   └── __init__.py
│   ├── core/
│   │   ├── config.py              # Pydantic settings
│   │   ├── security.py            # JWT, password hashing
│   │   ├── logging.py             # Structured logging setup
│   │   └── exceptions.py          # Domain exception types
│   ├── db/
│   │   ├── base.py                # Declarative base
│   │   ├── session.py             # AsyncSession factory
│   │   └── init_db.py             # Bootstrap data
│   ├── middleware/
│   │   ├── request_id.py
│   │   ├── rate_limit.py
│   │   ├── error_handler.py
│   │   └── security_headers.py
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── laundry.py
│   │   ├── order.py
│   │   ├── payment.py
│   │   ├── review.py
│   │   ├── subscription.py
│   │   └── notification.py
│   ├── repositories/              # Persistence layer
│   ├── schemas/                   # Pydantic v2 schemas
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── laundry.py
│   │   ├── order.py
│   │   └── ...
│   ├── services/                  # Business logic
│   ├── tasks/                     # Celery tasks
│   │   ├── celery_app.py
│   │   ├── notifications.py
│   │   ├── payments.py
│   │   └── reports.py
│   ├── utils/                     # Pure helpers
│   └── main.py                    # FastAPI app factory
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── alembic.ini
├── tests/
│   ├── conftest.py
│   ├── api/
│   ├── services/
│   ├── repositories/
│   └── fixtures/
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   ├── prod.txt
│   └── test.txt
├── scripts/
│   ├── seed.py
│   └── create_admin.py
├── .env.example
├── Dockerfile
├── pyproject.toml
└── README.md
```

## `frontend/`

```
frontend/
├── app/
│   ├── (marketing)/               # Public marketing pages (landing)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── about/
│   │   └── pricing/
│   ├── (auth)/                    # Login, register, forgot-password
│   ├── (customer)/                # Customer dashboard
│   │   ├── discover/
│   │   ├── orders/
│   │   ├── subscriptions/
│   │   └── profile/
│   ├── (partner)/                 # Partner dashboard
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── pricing/
│   │   └── analytics/
│   ├── (admin)/                   # Admin dashboard
│   ├── api/                       # Route handlers (if any)
│   ├── layout.tsx                 # Root layout
│   ├── globals.css
│   ├── not-found.tsx
│   └── error.tsx
├── components/
│   ├── ui/                        # shadcn primitives
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx
│   │   └── mobile-nav.tsx
│   └── shared/                    # Cross-feature
│       ├── search-bar.tsx
│       ├── rating-stars.tsx
│       └── empty-state.tsx
├── features/
│   ├── auth/
│   ├── laundries/
│   ├── orders/
│   ├── payments/
│   ├── reviews/
│   ├── subscriptions/
│   ├── notifications/
│   ├── partner-dashboard/
│   ├── admin-dashboard/
│   └── landing/                   # R3F hero lives here
├── hooks/                         # Cross-cutting hooks
├── lib/
│   ├── api.ts                     # Axios instance + interceptors
│   ├── env.ts                     # Validated env vars (zod)
│   ├── logger.ts
│   └── utils.ts                   # cn(), formatDate(), etc.
├── providers/
│   ├── query-provider.tsx
│   ├── theme-provider.tsx
│   └── auth-provider.tsx
├── services/                      # External SDK wrappers
├── store/                         # Global Zustand stores (auth, ui)
├── styles/
│   └── tokens.css                 # Design tokens
├── types/                         # Global types
├── utils/                         # Pure helpers
├── public/
├── tests/
│   ├── e2e/                       # Playwright
│   ├── unit/                      # Jest + RTL
│   └── setup.ts
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## `docs/`

```
docs/
├── architecture/
│   ├── overview.md
│   ├── backend.md
│   ├── frontend.md
│   ├── data-flow.md
│   └── diagrams/
├── api/
│   ├── README.md
│   └── endpoints/
├── database/
│   ├── schema.md
│   ├── erd.md
│   └── migrations.md
├── frontend/
│   ├── components.md
│   ├── routing.md
│   └── state.md
├── backend/
│   ├── services.md
│   └── tasks.md
├── deployment/
│   ├── vercel.md
│   ├── railway.md
│   └── neon.md
├── ui-ux/
│   ├── design-system.md
│   ├── motion.md
│   └── accessibility.md
├── business/
│   ├── personas.md
│   ├── pricing-model.md
│   └── commission-model.md
├── security/
│   ├── threat-model.md
│   ├── auth.md
│   └── secrets.md
├── testing/
│   ├── strategy.md
│   ├── e2e.md
│   └── backend.md
├── features/
│   └── README.md
├── decisions/                     # ADRs
│   └── README.md
└── roadmap/
    └── README.md
```

## `logs/`

```
logs/
├── implementation-log.md
├── feature-progress.md
├── bug-tracker.md
├── deployment-log.md
├── refactor-log.md
├── performance-log.md
├── security-log.md
└── decisions-log.md
```

## Naming rules

| What                       | Convention                            | Example                       |
| -------------------------- | ------------------------------------- | ----------------------------- |
| TS/TSX files               | `kebab-case.tsx`                      | `order-card.tsx`              |
| TS/TSX components (export) | `PascalCase`                          | `OrderCard`                   |
| TS hooks                   | `use-*.ts` / `useFoo`                 | `use-auth.ts`                 |
| TS zod schemas             | `*.schema.ts` / `fooSchema`           | `order.schema.ts`             |
| TS stores                  | `*.store.ts` / `useFooStore`          | `auth.store.ts`               |
| Python files               | `snake_case.py`                       | `order_service.py`            |
| Python classes             | `PascalCase`                          | `OrderService`                |
| Python functions           | `snake_case`                          | `create_order`                |
| Python constants           | `UPPER_SNAKE_CASE`                    | `MAX_RETRIES`                 |
| Env vars                   | `UPPER_SNAKE_CASE`                    | `DATABASE_URL`                |
| Routes (URLs)              | `kebab-case`                          | `/partner-dashboard`          |
| API resources              | plural `kebab-case`                   | `/api/v1/laundries`           |

## Where to put new things

| You are adding...                                | Put it in...                                   |
| ------------------------------------------------ | ---------------------------------------------- |
| A new API endpoint                               | `backend/app/api/v1/endpoints/<resource>.py`   |
| Business logic for that endpoint                 | `backend/app/services/<resource>_service.py`   |
| DB access for that resource                      | `backend/app/repositories/<resource>_repo.py`  |
| A new Celery task                                | `backend/app/tasks/<domain>.py`                |
| A new SQLAlchemy model                           | `backend/app/models/<resource>.py` + Alembic   |
| A new React page                                 | `frontend/app/<segment>/page.tsx`              |
| A new feature                                    | `frontend/features/<feature>/`                 |
| A new shared UI primitive                        | `frontend/components/ui/<name>.tsx`            |
| A new shared cross-feature component             | `frontend/components/shared/<name>.tsx`        |
| A new global type                                | `frontend/types/<domain>.ts`                   |
| A new global util                                | `frontend/lib/utils.ts` (extend) or new file   |
| A new doc                                        | The relevant `docs/<topic>/` subfolder         |
| A new ADR                                        | `docs/decisions/ADR-<NNN>-<slug>.md`           |
