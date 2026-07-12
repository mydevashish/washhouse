# Deployment Workflow

```
develop  ──►  staging (auto)  ──►  smoke + soak  ──►  PR → main  ──►  prod (auto)  ──►  post-deploy
```

## Pre-flight

- [ ] CI green on `develop`
- [ ] Migrations reviewed (forward + back)
- [ ] `logs/feature-progress.md` entries are correct
- [ ] No open SEV1/SEV2 bugs blocking
- [ ] Release notes drafted

## Staging

- Auto-deploy via Vercel + Railway on push to `develop`
- Wait for migration release command to finish on Railway
- Smoke run `.cursor/checklists/post-deploy.md` on staging
- Optional soak: 24h before promoting risky features

## Production

1. Open `develop → main` PR with release notes
2. Reviewer approves; squash-merge
3. Tag: `git tag v<MAJOR>.<MINOR>.<PATCH>` and push
4. Vercel + Railway auto-deploy
5. Run `.cursor/checklists/post-deploy.md` within 15 min
6. Append to `logs/deployment-log.md`:
   ```
   ## YYYY-MM-DD HH:MM — Release v0.x.y
   - Env: production
   - Commit: <sha>
   - Migrations: <list>
   - Risk: ...
   - Rollback: ...
   - Smoke test: PASS / FAIL
   ```

## Rollback

If something goes wrong within ~30 min:

- **Vercel:** Deployments → Promote previous
- **Railway:** Deployments → Redeploy previous image
- **DB:** roll forward via Alembic only; severe issues use Neon PITR
- Append rollback entry to `logs/deployment-log.md`

## Hotfix

- Branch from `main`: `fix/<slug>`
- Smallest patch
- PR straight to `main`
- Auto-deploys
- Cherry-pick back to `develop`

## Monitoring (first 24h)

- Sentry — new issues, error rate
- Vercel Analytics — Web Vitals
- Railway — CPU / memory / queue lag
- Customer support inbox

## Communication

- Internal channel ping for prod deploys
- Status page update for SEV1
- Release notes in `docs/roadmap/`
