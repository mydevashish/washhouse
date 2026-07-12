# Vercel

Hosts the Next.js frontend (`frontend/`).

## Projects

- `dlm-frontend` — production (linked to `main`)
- Preview deployments — auto on PRs

## Env variables

Set per environment in the Vercel dashboard:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `SENTRY_AUTH_TOKEN` (server only)
- `STRIPE_SECRET_KEY` (server only, if Edge functions need it)

## Build settings

Vercel project **Root Directory** must be `frontend/`.

- Install: `npm ci` (see `frontend/vercel.json`)
- Build: `npm run build`
- Output: `.next`
- Production URL: `https://washhouse.vercel.app`

## Edge / regions

- Primary: `bom1` (Mumbai)
- Secondary: `sin1` (Singapore)

## Notes

- Image domains must be whitelisted in `frontend/next.config.mjs`
- Use Preview Protection (password) on staging
- Don't enable Edge on routes that use Node-only deps
