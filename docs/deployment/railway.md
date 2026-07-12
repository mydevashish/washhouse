# Railway — Backend Deployment

## Services

| Service         | Image / process                                              |
| --------------- | ------------------------------------------------------------ |
| `dlm-backend`   | FastAPI (uvicorn) — `backend/Dockerfile` target `prod`       |
| `dlm-worker`    | Celery worker                                                |
| `dlm-beat`      | Celery beat                                                  |

## Env variables

Set per environment (production / staging):

- `APP_ENV=production`
- `LOG_LEVEL=INFO`
- `DATABASE_URL`, `DATABASE_URL_DIRECT`
- `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_ALG=RS256`
- `JWT_ISSUER=dlm`
- `CORS_ALLOW_ORIGINS=https://dlm.app,https://www.dlm.app`
- `SENTRY_DSN`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `TWILIO_*`, `SMTP_*`

## Release command (migrations)

```
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

For worker / beat services, omit migrations (already applied by the API service).

## Health check

- Path: `/api/v1/health`
- Interval: 30 s
- Timeout: 5 s
- Retries: 5

## Logs

- Drain logs to Better Stack / Datadog (configured per env)
- Sentry tracks errors + performance

## Scaling

- API: start at 2 replicas; horizontal autoscale by CPU
- Worker: 1 replica; scale on queue lag
- Beat: 1 replica (don't scale; single source of truth)

## Rollback

- Deployments → Previous → Redeploy
- Update `logs/deployment-log.md`
