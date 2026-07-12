# Post-Deploy Checklist

Run within 15 minutes of every prod deploy.

## Health

- [ ] `GET /api/v1/health` returns 200
- [ ] `GET /api/v1/health/db` returns 200
- [ ] `GET /api/v1/health/redis` returns 200
- [ ] Frontend home renders < 3s

## Smoke flows

- [ ] Customer can register, log in, log out
- [ ] Customer can search and view a laundry detail
- [ ] Customer can place an order (test partner)
- [ ] Partner can log in and view their orders
- [ ] Admin can log in and view dashboard

## Errors

- [ ] No new Sentry issues in last 5 min above baseline
- [ ] No spike in 5xx error rate

## Performance

- [ ] p95 latency unchanged
- [ ] LCP unchanged on landing
- [ ] Background queue lag normal

## Logs

- [ ] Entry appended to `logs/deployment-log.md`

## Rollback readiness

- [ ] Previous Vercel deployment identified
- [ ] Previous Railway image identified
- [ ] Database PITR window confirmed

## If something is wrong

1. Triage in #dlm-incidents
2. Decide rollback vs roll-forward (typically rollback if < 30 min)
3. Roll back Vercel + Railway to previous version
4. Append incident to `logs/security-log.md` (or appropriate)
5. File a post-mortem
