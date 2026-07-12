# Vercel environment variables — washhouse

Set in **Vercel → washhouse → Settings → Environment Variables** for **Production**, **Preview**, and **Development**.

| Variable | Production value |
| -------- | ---------------- |
| `NEXT_PUBLIC_API_URL` | `https://washhouse.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | `https://washhouse.vercel.app` |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING` | `true` |

Optional (omit entirely — do not set empty strings):

| Variable | Notes |
| -------- | ----- |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry browser DSN |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | e.g. `https://app.posthog.com` |
| `SENTRY_AUTH_TOKEN` | Build-time only, for sourcemaps |

## Backend CORS (Render)

On **Render → washhouse → Environment**:

```
CORS_ALLOW_ORIGINS=http://localhost:3000,https://washhouse.vercel.app
```

## After changing env vars

**Deployments → latest → ⋮ → Redeploy** (required for `NEXT_PUBLIC_*` to take effect).
