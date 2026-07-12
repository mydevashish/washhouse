---
description: Clean architecture & layering rules for backend and frontend
alwaysApply: true
---

# Architecture Rules

## Backend — Clean / Layered Architecture

```
┌──────────────────────────────────────────────────────────┐
│ API Layer (app/api/v1/endpoints/*.py)                    │
│   - FastAPI routers, dependency injection                │
│   - Request/response Pydantic schemas                    │
│   - HTTP concerns only                                   │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Service Layer (app/services/*.py)                        │
│   - Business logic, orchestration                        │
│   - Transactions, cross-repository workflows             │
│   - NO HTTP, NO ORM imports leaking up                   │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Repository Layer (app/repositories/*.py)                 │
│   - All database access                                  │
│   - SQLAlchemy queries                                   │
│   - Returns models or domain DTOs                        │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Model Layer (app/models/*.py)                            │
│   - SQLAlchemy ORM models                                │
│   - Pure data + relationships                            │
└──────────────────────────────────────────────────────────┘
```

### Backend rules

1. **API endpoints MUST NOT import models or run DB queries directly.** They call services.
2. **Services MUST NOT import FastAPI primitives** (`Request`, `Depends`, `HTTPException`). Raise domain exceptions; the API layer maps them.
3. **Repositories MUST NOT contain business logic.** Only persistence.
4. **One repository per aggregate** (e.g., `OrderRepository`, `LaundryRepository`).
5. **All DB I/O is async.** Use `AsyncSession`.
6. **Pydantic schemas live in `app/schemas/`** — never reuse ORM models as response models.
7. **Long-running work goes to Celery** — never block a request > 200 ms.
8. **Configuration via `app/core/config.py`** using `pydantic-settings`. No `os.environ.get` scattered.

### Domain exception mapping

| Domain exception              | HTTP                          |
| ----------------------------- | ----------------------------- |
| `NotFoundError`               | 404                           |
| `ValidationError`             | 422                           |
| `AuthenticationError`         | 401                           |
| `AuthorizationError`          | 403                           |
| `ConflictError`               | 409                           |
| `RateLimitError`              | 429                           |
| Anything else                 | 500 (logged + sanitized)      |

## Frontend — Feature-Based + Atomic Architecture

```
frontend/
├── app/                  # Next.js App Router (routes only)
├── features/             # Feature modules (the heart of the app)
│   └── <feature>/
│       ├── components/
│       ├── hooks/
│       ├── api/          # TanStack Query hooks + axios calls
│       ├── store/        # Zustand slice (if needed)
│       ├── schemas/      # Zod schemas
│       ├── types/
│       └── index.ts
├── components/           # Cross-feature, atomic
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Header, Footer, Sidebar
│   └── shared/           # Buttons, cards used everywhere
├── hooks/                # Cross-feature hooks
├── lib/                  # Pure utilities, configured clients (axios)
├── providers/            # React providers (Query, Theme, Auth)
├── services/             # External SDK wrappers (Stripe, maps)
├── store/                # Global Zustand stores
├── styles/               # Tailwind + global CSS
├── types/                # Global TS types
├── utils/                # Pure helpers
└── public/
```

### Frontend rules

1. **Routes in `app/` are thin.** They import from `features/`. No business logic inside route files.
2. **One Zustand store per concern.** Cross-cutting state only — server data belongs in TanStack Query.
3. **Server data via TanStack Query.** No `useEffect(fetch)` patterns.
4. **All forms use React Hook Form + Zod.** Zod schemas live in `features/<f>/schemas/`.
5. **All API calls go through `lib/api.ts` axios instance.** Auth interceptor centralized.
6. **No prop drilling > 2 levels.** Use context or co-locate.
7. **Components are server components by default.** Add `"use client"` only when needed (state, effects, events).
8. **Shared UI primitives come from `components/ui/`** (shadcn/ui). Don't reinvent.

### Component tiers (atomic)

| Tier        | Lives in                           | Examples                       |
| ----------- | ---------------------------------- | ------------------------------ |
| **Atoms**   | `components/ui/`                   | `Button`, `Input`, `Badge`     |
| **Molecules** | `components/shared/`             | `SearchBar`, `RatingDisplay`   |
| **Organisms** | `features/<f>/components/`       | `OrderCard`, `LaundryListItem` |
| **Templates** | `app/**/layout.tsx`              | Dashboard shells, marketing    |
| **Pages**   | `app/**/page.tsx`                  | Route entry points             |

## Forbidden patterns

❌ FastAPI logic inside services
❌ Direct DB calls from API endpoints
❌ Business logic inside React components
❌ Mixing server + client state (TanStack Query handles server)
❌ Ad-hoc `fetch()` calls — always use the axios instance
❌ Default exports for shared UI (named exports only, except Next.js pages/layouts)
❌ "any" type (use `unknown` then narrow)
❌ Mutable global state outside Zustand
