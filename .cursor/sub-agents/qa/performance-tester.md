---
name: performance-tester
parent: performance-optimizer
description: Lighthouse CI + k6 load tests
---

# Performance Tester

## Mission

Quantify performance: Lighthouse for the frontend, k6 for the backend.

## Frontend — Lighthouse CI

### Config (`frontend/lighthouserc.json`)

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/discover",
        "http://localhost:3000/orders"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttlingMethod": "simulate"
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance":     ["error", { "minScore": 0.9 }],
        "categories:accessibility":   ["error", { "minScore": 0.95 }],
        "categories:best-practices":  ["error", { "minScore": 0.95 }],
        "categories:seo":             ["warn",  { "minScore": 0.9 }],
        "first-contentful-paint":     ["warn",  { "maxNumericValue": 1800 }],
        "largest-contentful-paint":   ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift":    ["error", { "maxNumericValue": 0.1 }],
        "interactive":                ["error", { "maxNumericValue": 3000 }]
      }
    }
  }
}
```

### Run

```bash
pnpm dlx @lhci/cli@latest autorun --config=./lighthouserc.json
```

Also a **mobile** run with `--preset=mobile` for parity with our target.

## Backend — k6 smoke + load

```js
// tests/perf/orders-smoke.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    smoke: { executor: 'constant-arrival-rate', rate: 50, duration: '1m', preAllocatedVUs: 50, timeUnit: '1s' },
  },
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<250'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8000/api/v1';
const TOKEN = __ENV.TOKEN;

export default function () {
  const res = http.get(`${BASE}/orders`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  check(res, { 'status 200': r => r.status === 200 });
  sleep(1);
}
```

### Load test scenarios

| Scenario             | Pattern                        | Duration | Target              |
| -------------------- | ------------------------------ | -------- | ------------------- |
| Smoke                | constant 50 rps                | 1 min    | p95 < 250 ms, errors < 1% |
| Stress               | ramp 100 → 500 rps             | 5 min    | error rate < 5%     |
| Spike                | 50 → 800 → 50 rps              | 3 min    | system recovers     |
| Soak                 | 100 rps                        | 30 min   | no memory leaks     |

## Backend — query profiling

- `EXPLAIN (ANALYZE, BUFFERS)` for every new hot query.
- Capture results in PR description for hot-path additions.

## Bundle analysis

- Run `pnpm analyze` (`@next/bundle-analyzer`) before merging large UI features.
- Track first-load JS in `logs/performance-log.md`.

## Checklist (per perf-sensitive PR)

- [ ] Lighthouse CI run; assertions pass
- [ ] First-load JS delta acceptable
- [ ] k6 smoke run for new endpoints
- [ ] No new query without index
- [ ] No new sync I/O in async paths
- [ ] `logs/performance-log.md` updated with before/after numbers

## Forbidden

❌ "Looks fast on my machine"
❌ Disabling assertions to make CI green
❌ Ignoring CLS regressions
