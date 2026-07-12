# Doorstep Laundry Marketplace (DLM)

> A modern, youth-focused doorstep laundry marketplace connecting customers, laundry partners, and admins through a premium, mobile-first experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Overview

**Doorstep Laundry Marketplace (DLM)** is a multi-sided marketplace platform that lets customers discover, compare, and book nearby laundries with doorstep pickup and delivery. The platform empowers laundry partners with order, inventory, and analytics tools while giving admins a full operational dashboard.

### Three Personas

| Persona              | Capabilities                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Customer**         | Discover laundries, compare pricing, view reviews, schedule pickup/delivery, track orders, subscribe to plans |
| **Laundry Partner**  | Register laundry, manage orders, track inventory, update statuses, manage pricing, view analytics            |
| **Admin**            | Approve laundries, manage commissions, view dashboards, monitor complaints, track business analytics        |

---

## Key Features

- 🔍 **Discovery** — Geo-aware laundry search with filters, ratings, and price comparison
- 📦 **Order Lifecycle** — Pickup scheduling → washing → delivery with real-time tracking
- 💳 **Subscriptions** — Monthly plans with recurring billing
- ⭐ **Reviews & Ratings** — Verified customer reviews
- 📊 **Analytics Dashboards** — Partner and admin insights
- 🔐 **Role-Based Access** — JWT auth with customer / partner / admin roles
- 🌑 **Dark Mode** — First-class dark theme
- 📱 **Mobile-First** — Optimized for phones, scales beautifully to desktop

---

## Tech Stack

### Frontend

| Layer        | Technology                                        |
| ------------ | ------------------------------------------------- |
| Framework    | **Next.js 15** (App Router, RSC, Server Actions)  |
| Language     | **TypeScript** (strict)                           |
| Styling      | **Tailwind CSS** + **shadcn/ui**                  |
| State        | **Zustand** (client) + **TanStack Query** (server) |
| Forms        | **React Hook Form** + **Zod**                     |
| HTTP         | **Axios** (with interceptors)                     |
| Motion       | **Framer Motion**                                 |
| 3D           | **React Three Fiber** + **Drei** (hero only)      |
| Testing      | **Playwright** + **Jest** + **React Testing Library** |

### Backend

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | **FastAPI** (async)                         |
| ORM           | **SQLAlchemy 2.x** (async)                  |
| Database      | **PostgreSQL 16**                           |
| Migrations    | **Alembic**                                 |
| Cache / Queue | **Redis** + **Celery**                      |
| Auth          | **JWT** (access + refresh) + **bcrypt**     |
| Validation    | **Pydantic v2**                             |
| Testing       | **Pytest** + **pytest-asyncio** + **httpx** |

### Infrastructure

| Concern    | Provider                |
| ---------- | ----------------------- |
| Frontend   | **Vercel**              |
| Backend    | **Railway**             |
| Database   | **Neon (PostgreSQL)**   |
| Redis      | **Upstash Redis**       |
| CI/CD      | **GitHub Actions**      |
| Containers | **Docker / Docker Compose** |

---

## Project Structure

```
DLM/
├── backend/              # FastAPI service (Python)
├── frontend/             # Next.js application (TypeScript)
├── docs/                 # Architecture, API, business docs
├── logs/                 # Implementation, bug, perf, security logs
├── scripts/              # Dev/ops/seed scripts
├── infrastructure/       # IaC, Railway/Vercel configs
├── docker/               # Dockerfiles + compose overrides
├── .cursor/              # Cursor AI workspace (rules/agents/workflows)
├── .github/              # CI/CD workflows + issue templates
├── docker-compose.yml
├── .gitignore
└── README.md
```

See [`docs/architecture/overview.md`](docs/architecture/overview.md) for a deep dive.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (or npm/yarn)
- **Python** ≥ 3.11
- **PostgreSQL** ≥ 16 (or use Docker)
- **Redis** ≥ 7 (or use Docker)
- **Docker** + **Docker Compose** (recommended for local dev)

### 1. Clone

```bash
git clone https://github.com/your-org/dlm.git
cd dlm
```

### 2. Spin Up with Docker (recommended)

```bash
docker compose up -d --build
```

This boots:

- `db` — PostgreSQL on `:5432`
- `redis` — Redis on `:6379`
- `backend` — FastAPI on `:8000`
- `frontend` — Next.js on `:3000`
- `worker` — Celery worker

### 3. Manual Setup (alternative)

#### Backend

```bash
cd backend
python -m venv DLM_env
# Windows
DLM_env\Scripts\activate
# macOS/Linux
source DLM_env/bin/activate

pip install -r requirements/dev.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

### 4. Open

- Frontend: <http://localhost:3000>
- API docs (Swagger): <http://localhost:8000/api/v1/docs>
- API docs (ReDoc): <http://localhost:8000/api/v1/redoc>

---

## Development Workflow

1. **Pick a task** from `logs/feature-progress.md`
2. **Create a branch**: `feat/<scope>-<short-name>` (see [`.cursor/rules/12-git-commits.md`](.cursor/rules/12-git-commits.md))
3. **Implement** following the relevant Cursor agent (frontend, backend, etc.)
4. **Test** locally — unit + integration + lint
5. **Update logs** in `logs/` and `docs/`
6. **Open a PR** using `.github/pull_request_template.md`
7. **Pass CI** (lint, type-check, tests, build)
8. **Merge** after review

> Cursor will automatically suggest log updates and follow `.cursor/workflows/feature-development.md`.

---

## Deployment

| Environment | Frontend             | Backend            | Database      |
| ----------- | -------------------- | ------------------ | ------------- |
| Production  | Vercel (`main`)      | Railway (`main`)   | Neon (prod)   |
| Staging     | Vercel (`develop`)   | Railway (staging)  | Neon (staging) |

See [`docs/deployment/`](docs/deployment/) for full guides.

---

## Documentation

| Topic             | Path                                                   |
| ----------------- | ------------------------------------------------------ |
| Architecture      | [`docs/architecture/`](docs/architecture/)             |
| API Reference     | [`docs/api/`](docs/api/)                               |
| Database Schema   | [`docs/database/`](docs/database/)                     |
| UI/UX Guidelines  | [`docs/ui-ux/`](docs/ui-ux/)                           |
| Security          | [`docs/security/`](docs/security/)                     |
| Roadmap           | [`docs/roadmap/`](docs/roadmap/)                       |
| ADRs              | [`docs/decisions/`](docs/decisions/)                   |
| Cursor / agents   | [`AGENTS.md`](AGENTS.md), [`.cursorignore`](.cursorignore) |

---

## Contributing

1. Read [`AGENTS.md`](AGENTS.md) and [`.cursor/rules/`](.cursor/rules/) before contributing
2. Follow the active workflow in [`.cursor/workflows/`](.cursor/workflows/)
3. All PRs must update relevant logs in [`logs/`](logs/)
4. Use [conventional commits](https://www.conventionalcommits.org/)

---

## License

MIT © Doorstep Laundry Marketplace
