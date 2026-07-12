# Railway

Hosts FastAPI backend + Celery worker + Celery beat.

## Services

| Service       | Start command                                                                 |
| ------------- | ----------------------------------------------------------------------------- |
| `dlm-backend` | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`    |
| `dlm-worker`  | `celery -A app.tasks.celery_app worker -l INFO -Q default,emails,payments`     |
| `dlm-beat`    | `celery -A app.tasks.celery_app beat -l INFO`                                  |

## Env variables

See `docs/deployment/railway.md` for the full list.

## Health check

- Path: `/api/v1/health`
- Timeout: 10s
- Retries: 5

## Scaling

- Backend: 2 → autoscale on CPU
- Worker: 1 → scale on queue lag
- Beat: **always 1**

## Deploy

- Push to `main` → CI green → Railway picks up
- Migrations run as part of release command

See `docs/deployment/railway.md`.
