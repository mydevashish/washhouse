# Lighthouse CI

Automated Lighthouse runs on **every pull request** enforce category score floors and performance budgets before merge.

## Thresholds (CI fails if not met)

| Category | Minimum score |
| -------- | ------------- |
| Performance | **90** |
| Accessibility | **90** |
| Best Practices | **90** |
| SEO | **90** |

Configured in `frontend/.lighthouserc.json` (`minScore: 0.9` per category).

Additional **performance budget** checks live in:

- `frontend/lighthouse-budget.json` — resource sizes/counts and timing budgets
- Inline assertions in `.lighthouserc.json` — FCP, LCP, TBT, CLS, Speed Index caps

## URLs audited

Each PR audits the production build at:

| URL | Page |
| --- | ---- |
| `/` | Marketing home |
| `/login` | Auth |
| `/discover` | Marketplace browse |
| `/partners` | Partner landing |

Three runs per URL; Lighthouse CI uses the median run for assertions.

## GitHub Actions workflow

File: [`.github/workflows/lighthouse.yml`](../../.github/workflows/lighthouse.yml)

1. `npm ci` + `npm run build` in `frontend/`
2. `treosh/lighthouse-ci-action@v12` runs `lhci autorun` via `frontend/.lighthouserc.json`
3. Starts `npm run start`, waits for `Ready`, audits URLs
4. **Fails the job** if scores or budgets regress below thresholds
5. Uploads HTML reports as artifacts (`lighthouse-reports`) and to temporary public storage (linked in the Action log)

### Required secrets

None for the default setup (temporary public storage is anonymous).

Optional — persist history in [Lighthouse CI Server](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md#add-to-ci):

| Secret | Purpose |
| ------ | ------- |
| `LHCI_GITHUB_APP_TOKEN` | GitHub App status checks + PR comments |
| `LHCI_SERVER_BASE_URL` + `LHCI_BUILD_TOKEN` | Private LHCI server uploads |

## Local setup

### Prerequisites

- Node.js 20+
- Chrome/Chromium (installed automatically by `@lhci/cli` on first run)

### Install

```bash
cd frontend
npm install
```

`@lhci/cli` is a devDependency (see `package.json`).

### Run the same checks as CI

```bash
cd frontend
npm run build
npm run lighthouse:ci
```

This runs collect → assert → upload (upload may no-op locally without server config).

### Run collect only (no assertions)

```bash
npm run lighthouse:collect
```

Reports are written to `frontend/.lighthouseci/`.

### Environment for build

Match CI when testing locally:

```bash
export NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
export NEXT_PUBLIC_APP_URL=http://localhost:3000
export NEXT_TELEMETRY_DISABLED=1
```

## Performance budgets

`frontend/lighthouse-budget.json` uses **KiB** for `resourceSizes` and **milliseconds** for `timings`.

| Area | Example budget |
| ---- | ---------------- |
| Total transfer | ≤ 1400 KiB |
| JavaScript | ≤ 450 KiB |
| LCP | ≤ 3500 ms |
| TBT | ≤ 350 ms |
| CLS | ≤ 0.1 |

Tighten budgets as the app improves; loosen only with team review and an ADR note.

## Fixing a failed PR check

1. Open the **Lighthouse CI** job log → temporary storage link or **Artifacts → lighthouse-reports**.
2. Identify failing URL + audit (performance vs a11y vs budget).
3. Apply fixes (images, bundle size, meta tags, contrast, etc.).
4. Re-run locally with `npm run lighthouse:ci` before pushing.

Common performance wins for DLM: optimize discover images, lazy-load below-fold UI, reduce client JS on `/` and `/discover`, ensure each page has a unique `<title>` and meta description for SEO.

## Desktop vs mobile

CI uses the **desktop** Lighthouse preset for stabler PR signal. Scores are still strict (90+). For mobile-specific audits, run Chrome DevTools → Lighthouse locally with the mobile preset.

## Related docs

- [`../TABLE_VIRTUALIZATION.md`](../TABLE_VIRTUALIZATION.md) — admin table perf
- [`../../BUNDLE_ANALYSIS.md`](../../BUNDLE_ANALYSIS.md) — bundle size work
- [`README.md`](README.md) — release flow (step 1: CI + Lighthouse green)
