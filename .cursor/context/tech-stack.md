# Tech Stack — Authoritative

> If a tool isn't listed here, it isn't part of the stack. Adding a new tool requires an ADR.

## Frontend

| Concern              | Choice                                         |
| -------------------- | ---------------------------------------------- |
| Framework            | **Next.js 15** (App Router, RSC, Server Actions) |
| Language             | **TypeScript** strict                          |
| Styling              | **Tailwind CSS**                               |
| UI primitives        | **shadcn/ui**                                  |
| Icons                | **lucide-react**                               |
| Client state         | **Zustand**                                    |
| Server state         | **TanStack Query v5**                          |
| Forms                | **React Hook Form** + **Zod**                  |
| HTTP                 | **Axios** (single configured instance)         |
| Motion               | **Framer Motion**                              |
| 3D                   | **React Three Fiber** + **Drei** (landing only)|
| Charts               | **Recharts** *(approve via ADR if needed)*     |
| Date / time          | **date-fns**                                   |
| Test (unit)          | **Jest** + **React Testing Library**           |
| Test (mocks)         | **MSW**                                        |
| Test (E2E)           | **Playwright**                                 |
| Linter / formatter   | **ESLint** (`next/core-web-vitals`) + **Prettier** |
| Storybook            | **Storybook 8**                                |
| Analytics            | **PostHog** *(planned)*                        |
| Error tracking       | **Sentry**                                     |

## Backend

| Concern              | Choice                                  |
| -------------------- | --------------------------------------- |
| Framework            | **FastAPI**                             |
| Language             | **Python 3.12**                         |
| ORM                  | **SQLAlchemy 2.x** async                |
| DB driver            | **asyncpg**                             |
| Migrations           | **Alembic**                             |
| Validation           | **Pydantic v2** + `pydantic-settings`   |
| Auth                 | **python-jose** (JWT) + **passlib[bcrypt]** |
| Cache / queue        | **Redis** (redis.asyncio)               |
| Worker               | **Celery 5.x**                          |
| HTTP client          | **httpx**                               |
| Logging              | **structlog**                           |
| Testing              | **Pytest** + **pytest-asyncio** + **httpx**  |
| Linter / formatter   | **Ruff**                                |
| Type-check           | **Mypy** (strict)                       |
| Security scanning    | **Bandit**, **Semgrep**, **pip-audit**  |
| Error tracking       | **Sentry**                              |
| Email                | **Resend** *(planned)*                  |
| SMS                  | **Twilio** *(planned)*                  |
| Payments             | **Stripe** *(planned)*                  |

## Database

- **PostgreSQL 16** (Neon in prod, Postgres in Docker locally)
- **Redis 7** (Upstash in prod, Redis in Docker locally)

## Infrastructure

| Concern             | Provider                |
| ------------------- | ----------------------- |
| Frontend hosting    | **Vercel**              |
| Backend hosting     | **Railway**             |
| Database            | **Neon**                |
| Redis               | **Upstash**             |
| CI/CD               | **GitHub Actions**      |
| Containers          | **Docker** + Compose    |
| File storage        | **Cloudflare R2** *(planned)* |
| DNS / CDN           | **Cloudflare**          |
| Observability       | **Sentry**              |
| Email               | **Resend** *(planned)*  |

## Versions (frozen for first release)

```
node = 20.x
pnpm = 9.x
python = 3.12.x
postgres = 16.x
redis = 7.x
```

## Python virtual environment

Always named **`DLM_env`**. Commands in `backend/` assume it is activated.
