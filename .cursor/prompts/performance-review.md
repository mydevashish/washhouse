# Prompt: Performance review

Act as **performance-optimizer**.

Subject: **<route / endpoint / feature>**

## Steps

1. Read `.cursor/rules/11-performance.md`, `.cursor/agents/performance-optimizer.md`, `.cursor/checklists/performance.md`.
2. **Measure first.**
   - Frontend: Lighthouse mobile, `pnpm analyze`, devtools profiler.
   - Backend: k6 smoke, Sentry traces, `EXPLAIN ANALYZE`.
3. Identify the **biggest** hit (Pareto principle — find the 20% causing 80%).
4. List 3 options + ROI estimate. Pick one.
5. Apply the optimization; re-measure.
6. Capture before/after in `logs/performance-log.md`:
   ```
   ## YYYY-MM-DD — <Title>
   - Before: LCP X, p95 Y
   - After:  LCP X, p95 Y
   - Cost: bundle +Z, complexity +
   ```
7. Run `.cursor/checklists/post-flight.md`.

Do not optimize without measuring. Do not micro-optimize without justification.
