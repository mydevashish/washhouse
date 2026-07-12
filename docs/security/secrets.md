# Secrets Management

## Where secrets live

| Env       | Store                                  |
| --------- | -------------------------------------- |
| Local     | `backend/.env`, `frontend/.env.local`  |
| Preview   | Vercel + Railway encrypted env stores  |
| Staging   | Vercel + Railway encrypted env stores  |
| Production | Vercel + Railway encrypted env stores  |

`.env*` are git-ignored (except `.env.example`).

## Names + owners (no values)

Stored in `infrastructure/vercel/env.md` and `infrastructure/railway/env.md`.

## Rotation

| Secret               | Cadence              | Owner          |
| -------------------- | -------------------- | -------------- |
| `JWT_PRIVATE_KEY`    | Quarterly            | Security       |
| Stripe keys          | On team change       | Finance + Eng  |
| Twilio token         | On team change       | Eng            |
| Webhook secrets      | Every endpoint replacement | Eng       |
| Database password    | On compromise        | DBA            |

## Loading

- Backend: `app.core.config.Settings` via `pydantic-settings`
- Frontend: `frontend/lib/env.ts` via Zod validation
- Never `os.environ.get` or `process.env.X` outside these modules

## Forbidden

❌ Hardcoded keys
❌ Logging tokens
❌ Sharing secrets via chat / email
❌ Reusing secrets across environments

## On compromise

1. Rotate immediately
2. Revoke all sessions (if auth secret)
3. Audit logs for misuse
4. Disclose if user data accessed
5. Post-mortem in `docs/decisions/`
