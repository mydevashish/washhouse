# Prompt: Deploy

Act as **devops-engineer**.

Target: **staging | production**
Source ref: **<branch / sha>**

## Steps

1. Read `.cursor/rules/17-deployment-workflow.md`, `.cursor/agents/devops-engineer.md`, `.cursor/checklists/post-deploy.md`.
2. Confirm CI green on the source ref.
3. Confirm migrations are reviewed and reversible.
4. Confirm logs have a feature-progress entry transitioning to `shipping`.
5. Tag a release (`vMAJOR.MINOR.PATCH`) if production.
6. Promote in:
   - **Vercel** → Promote the build to prod (frontend)
   - **Railway** → Deploy the new image (backend, worker, beat)
   - **Neon** → migrations applied (release command auto)
7. Run **post-deploy checklist** within 15 minutes.
8. Append entry to `logs/deployment-log.md`:
   ```
   ## YYYY-MM-DD HH:MM — Release vX.Y.Z
   - Env:
   - Commit:
   - Migrations:
   - Risk:
   - Rollback:
   - Smoke test: PASS/FAIL
   ```
9. Monitor Sentry + p95 for 24h. File a follow-up if anything off.

If something breaks within the first 30 minutes, **roll back first, debug second**.
