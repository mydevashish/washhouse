# Vercel environment variables — DLM frontend

Set in **Vercel → Project → Settings → Environment Variables**.

Mirror names only here — **never commit values**.

## Required (all environments)

Validated at build time by `frontend/lib/env.ts`.

| Variable | Production | Staging (Preview / `develop`) | Local dev |
| -------- | ---------- | ----------------------------- | --------- |
| `NEXT_PUBLIC_API_URL` | `https://api.dlm.app/api/v1` *(or current Render URL: `https://washhouse.onrender.com/api/v1`)* | `https://api-staging.dlm.app/api/v1` *(or staging backend URL)* | `http://localhost:8000/api/v1` in `.env.local` |
| `NEXT_PUBLIC_APP_URL` | `https://dlm.app` *(current: `https://washhouse.vercel.app`)* | `https://staging.dlm.app` | `http://localhost:3000` |
| `NEXT_TELEMETRY_DISABLED` | `1` | `1` | `1` |

## Feature flags

| Variable | Production | Staging | Notes |
| -------- | ---------- | ------- | ----- |
| `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING` | `true` | `true` | Set `false` for call-to-book / offline-booking launch |

## Session / idle (optional — defaults in code)

| Variable | Typical value |
| -------- | ------------- |
| `NEXT_PUBLIC_SESSION_IDLE_MINUTES` | `10` |
| `NEXT_PUBLIC_SESSION_WARNING_MINUTES` | `2` |
| `NEXT_PUBLIC_ENABLE_IDLE_ANIMATIONS` | `true` |
| `NEXT_PUBLIC_SEASON_MODE` | `auto` |
| `NEXT_PUBLIC_IDLE_ANIMATION` | `auto` |

## Public contact (marketing `/contact`)

Omit entirely if unset — do **not** set empty strings.

| Variable | Example |
| -------- | ------- |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `support@washhouse.in` |
| `NEXT_PUBLIC_SUPPORT_PHONE` | `+91 98765 43210` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `+91 98765 43210` |
| `NEXT_PUBLIC_BUSINESS_HOURS` | `Mon–Sat, 9:00 AM – 7:00 PM IST` |
| `NEXT_PUBLIC_OFFICE_ADDRESS` | Multi-line address (use `\n`) |

## Observability (optional)

| Variable | Scope | Notes |
| -------- | ----- | ----- |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser | Sentry project DSN |
| `NEXT_PUBLIC_POSTHOG_KEY` | Browser | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Browser | e.g. `https://app.posthog.com` |
| `SENTRY_AUTH_TOKEN` | **Build only** | Upload source maps on deploy |

## Dev / perf (do not set in production)

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_TABLE_PERF_MOCK_ROWS` | Table virtualization stress test (`0` in prod) |

## Backend CORS (Railway / Render)

After setting frontend URLs, update backend `CORS_ALLOW_ORIGINS`:

```
# Production
CORS_ALLOW_ORIGINS=https://dlm.app,https://www.dlm.app,https://washhouse.vercel.app

# Staging
CORS_ALLOW_ORIGINS=https://staging.dlm.app,http://localhost:3000
```

## Environment scoping in Vercel

| Git branch | Vercel environment | Custom domain |
| ---------- | ------------------- | ------------- |
| `main` | Production | `dlm.app` / `washhouse.vercel.app` |
| `develop` | Preview (promoted) | `staging.dlm.app` |
| PR branches | Preview | `*.vercel.app` |

## After changing `NEXT_PUBLIC_*`

**Deployments → latest → ⋮ → Redeploy** — client env vars are baked at build time.

## Reference

- Template: `frontend/.env.example`
- Deploy workflow: `.cursor/rules/17-deployment-workflow.md`
- Vercel project config: `infrastructure/vercel/vercel.json`
