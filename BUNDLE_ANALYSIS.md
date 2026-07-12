# Bundle Analysis — DLM Frontend

**Audit date:** 2026-06-02

## Tooling

```bash
cd frontend
npm run analyze   # ANALYZE=true next build — opens @next/bundle-analyzer report
npm run build     # route-level sizes in build output (when ESLint passes)
```

---

## Dependencies audit

| Package | Size impact | Used in app code? | Action |
| ------- | ----------- | ----------------- | ------ |
| `three` | ~600KB+ pre-gzip | **No** | **Removed** |
| `@react-three/fiber` | Large | **No** | **Removed** |
| `@react-three/drei` | Large | **No** | **Removed** |
| `@types/three` | Dev only | **No** | **Removed** |
| `framer-motion` | Moderate | Yes (`hero-section.tsx`) | Kept; in `optimizePackageImports` |
| `lucide-react` | Moderate | Wide | Kept; tree-shaken via optimizeImports |
| `@tanstack/react-virtual` | Small | **No** | Keep for planned virtualization OR remove |
| `date-fns` | Moderate | Yes | optimizeImports |
| `axios` | Moderate | Yes (`lib/api.ts`) | Required |
| `vaul` | Small | Drawer UI | Kept |

**Estimated savings from removing Three/R3F:** ~150–250 KB gzip (typical for unused 3D stack).

---

## Code splitting

| Pattern | Status |
| ------- | ------ |
| Next.js App Router automatic route splitting | Active |
| `next/dynamic()` for heavy features | **Not used** in `app/` or `features/` |
| R3F landing scene | Deferred; not in bundle |
| Admin / partner dashboards | Client bundles per route — candidate for `dynamic(..., { ssr: false })` |

### Recommended dynamic imports

```tsx
// Example: defer admin dashboard
const AdminDashboard = dynamic(
  () => import('@/features/admin/admin-dashboard').then((m) => m.AdminDashboard),
  { loading: () => <AdminDashboardSkeleton /> },
);
```

---

## `next.config.mjs` optimizations

Already enabled:

- `experimental.optimizePackageImports` for `lucide-react`, `date-fns`, `framer-motion`, Radix primitives
- `images.formats`: AVIF, WebP
- `poweredByHeader: false`

---

## Client component surface

- `app/` route files: mostly **Server Components** (no `"use client"` in `app/`)
- `features/*`: client modules for hooks, React Query, forms
- Root `Providers` client wrapper: required for Query + theme

This matches DLM architecture rules (thin routes, fat features).

---

## Network ↔ bundle coupling

Duplicate React Query keys caused **repeat JSON downloads** of the same laundry list — worse than raw JS size for repeat navigators. Fixed via `lib/query-keys.ts`.

---

## Verification steps

1. `npm install` after `package.json` change (Three removed)
2. `npm run analyze` — confirm no `three` chunk
3. Compare First Load JS for `/` and `/discover` before/after
4. Lighthouse → **Total Blocking Time** and **JS bootup time**

---

## Target: Lighthouse Performance > 90

Blockers to address separately:

- ESLint build failures (unrelated files)
- Run Lighthouse on production build over HTTPS
- Reduce client JS on homepage (defer below-fold sections)
