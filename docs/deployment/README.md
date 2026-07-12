# Deployment

## Provider map

| Layer    | Provider | Doc                  |
| -------- | -------- | -------------------- |
| Frontend | Vercel   | [`vercel.md`](vercel.md) |
| PR quality | Lighthouse CI | [`lighthouse-ci.md`](lighthouse-ci.md) |
| Backend  | Railway  | [`railway.md`](railway.md) |
| Database | Neon     | [`neon.md`](neon.md) |
| Redis    | Upstash  | `../infrastructure/upstash/README.md` |
| Errors   | Sentry   | `../infrastructure/sentry/README.md` |

## Environments

| Env         | Branch       | URL                            | Promotion       |
| ----------- | ------------ | ------------------------------ | --------------- |
| development | local        | `localhost`                    | -               |
| preview     | PR branches  | Vercel preview / Neon branch   | auto on PR      |
| staging     | `develop`    | `staging.dlm.app`              | auto on merge   |
| production  | `main`       | `dlm.app`                      | tag-based       |

## Release flow

1. Cut PR → CI + Lighthouse + Playwright green.
2. Reviews per CODEOWNERS.
3. Squash-merge to `develop` (or `main` for trunk PRs).
4. Staging deploys automatically.
5. Smoke + a11y + perf checks on staging.
6. Tag `vX.Y.Z` → production deploy.
7. Update `logs/deployment-log.md`.

## Rollback

- **Frontend:** Vercel → previous deployment → "Promote to production".
- **Backend:** Railway → previous deploy → "Redeploy".
- **DB:** Reversible migrations only; otherwise PITR + forward-fix.

## Feature flags

- Lightweight in-house flags (env-driven) for now.
- Adopt LaunchDarkly / Unleash once we have > 10 flags.

## Observability

- Sentry — errors + perf
- Better Stack — logs
- UptimeRobot / Better Stack Heartbeats — uptime
- PostHog — product analytics

See per-provider docs for env variables.
