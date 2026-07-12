# Vercel — Frontend Deployment

## Project setup

- Source: GitHub repo
- Root directory: `frontend/`
- Framework preset: **Next.js**
- Install command: `pnpm install`
- Build command: `pnpm build`
- Output directory: `.next`
- Node: 20.x

## Environments

| Branch        | Env             |
| ------------- | --------------- |
| `main`        | Production      |
| `develop`     | Preview (promoted to staging via custom domain) |
| PRs           | Preview         |

## Env variables

Set in Vercel dashboard per environment:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `SENTRY_AUTH_TOKEN` *(build-time only)*

Documented (names only) in `infrastructure/vercel/env.md`.

## Regions

- Primary: `bom1` (Mumbai)
- Secondary: `iad1` (Washington)

## Headers / redirects

In `next.config.mjs` `headers()` — security headers.

## Sourcemaps

Uploaded to Sentry during build via `SENTRY_AUTH_TOKEN`.

## Rollback

- Vercel → Deployments → Previous → Promote
- Update `logs/deployment-log.md`

## Smoke test

After each prod deploy:

- `/` renders
- `/discover` renders
- Login flow works
- Lighthouse mobile ≥ 90 on `/`
