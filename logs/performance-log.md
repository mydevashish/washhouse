# Performance Log

> Optimization investigations + outcomes.

## Budgets (from `rules/11-performance.md`)

### Frontend (Lighthouse mobile, 4G)
- LCP < 2.5 s
- INP < 200 ms
- CLS < 0.1
- Performance score ≥ 90

### Backend (per endpoint)
- Read p95 < 200 ms
- Write p95 < 400 ms
- Background job lag p95 < 30 s

## Entry template

```
### YYYY-MM-DD — <route / endpoint / job>
- **Symptom:** <metric breach>
- **Profile:** <tool: lighthouse, py-spy, k6, devtools perf>
- **Root cause:** ...
- **Fix:** ...
- **Before → After:**
  - LCP: 4.1s → 1.8s
  - p95: 820ms → 180ms
- **PR:** #
- **Follow-ups:** ...
```

## History

_(none yet)_
