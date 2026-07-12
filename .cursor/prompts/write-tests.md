# Prompt: Backfill tests

Act as **qa-engineer** with the relevant sub-agent (`api-tester`, `ui-tester`, etc.).

Subject: **<module / component / endpoint>**

## Steps

1. Read `.cursor/rules/08-testing.md`, `.cursor/agents/qa-engineer.md`, and the matching sub-agent.
2. List test cases first (do not write code yet):
   - Happy paths
   - Validation errors
   - Auth / authz (401 / 403 / IDOR)
   - Edge cases (empty, max length, boundaries)
   - Side effects (Celery, cache, audit)
3. Pick the appropriate **level** for each (unit / integration / E2E).
4. Implement. Use existing fixtures / factories where possible.
5. No `sleep`, no real third-party calls.
6. Re-run 3× to confirm not flaky.
7. Verify coverage thresholds still hold.
8. Update `logs/implementation-log.md`.

If coverage drops anywhere unexpectedly, investigate before declaring done.
