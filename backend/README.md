# DLM Backend (FastAPI)

The async FastAPI service powering Doorstep Laundry Marketplace.

## Stack

- Python 3.12 · FastAPI · SQLAlchemy 2.x async · PostgreSQL · Redis · Celery · Alembic · Pydantic v2

## Quick start

```bash
# 1. Create the virtual env (name MUST be DLM_env)
python -m venv DLM_env

# Windows
DLM_env\Scripts\activate
# macOS/Linux
source DLM_env/bin/activate

# 2. Install deps
pip install --upgrade pip
pip install -r requirements/dev.txt

# 3. Env file
cp .env.example .env
# edit DATABASE_URL etc.

# 4. Database (auto-runs on startup when AUTO_RUN_MIGRATIONS=true; or manual: alembic upgrade head)

# 5. Run (port 8001 if something else already uses 8000)
uvicorn app.main:app --reload --port 8001
```

Open <http://localhost:8001/api/v1/docs>. The title should be **Doorstep Laundry Marketplace API** — if you see another app (e.g. DMS POC), stop that process or pick a free port and set `NEXT_PUBLIC_API_URL` in `frontend/.env` to match.

## Project layout

See `.cursor/rules/03-folder-structure.md`. TL;DR:

```
backend/
├── app/
│   ├── api/v1/endpoints/    # thin routers, OpenAPI-complete
│   ├── core/                # config, security, logging, exceptions
│   ├── db/                  # base + session
│   ├── middleware/          # request id, error handler, rate limit, headers
│   ├── models/              # SQLAlchemy
│   ├── repositories/        # all DB access
│   ├── schemas/             # Pydantic v2
│   ├── services/            # business logic
│   ├── tasks/               # Celery
│   ├── utils/
│   └── main.py
├── alembic/                 # migrations
├── tests/                   # pytest
├── requirements/            # pinned reqs
├── scripts/                 # seeds, admin utilities
├── .env.example
├── Dockerfile
└── pyproject.toml
```

## Common commands

```bash
# Tests
pytest
pytest -k orders
pytest --cov=app --cov-report=term-missing

# Lint + format
ruff check . --fix
ruff format .
mypy app

# Migrations
alembic revision --autogenerate -m "add orders.notes column"
alembic upgrade head
alembic downgrade -1

# Celery
celery -A app.tasks.celery_app worker --loglevel=info
celery -A app.tasks.celery_app beat --loglevel=info
```

## Architecture rules

- API → Service → Repository → Model
- All I/O async
- Domain errors raised in services, mapped to HTTP at edge
- Long work goes to Celery
- See `.cursor/rules/01-architecture.md`

## Tests

- Live in `tests/`
- Real Postgres via fixtures (rolled back per test)
- See `.cursor/rules/08-testing.md`

## Deployment

- Railway hosts this service
- See `.cursor/rules/17-deployment-workflow.md`

## Useful links

- API docs (local): <http://localhost:8000/api/v1/docs>
- Architecture: `docs/architecture/backend.md`
- Database schema: `docs/database/schema.md`
- Agent guides: `.cursor/agents/backend-architect.md`
