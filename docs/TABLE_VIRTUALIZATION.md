# Virtual data tables (`@tanstack/react-virtual`)

Admin tables use a shared `VirtualDataTable` with client-side **filter**, **sort**, **pagination**, and **virtual scrolling** (sticky header).

## Tables

| UI | Component | Tab |
| --- | --- | --- |
| Orders | `AdminOrdersTable` | Orders |
| Customers (users) | `AdminUsersTable` | Users |
| Laundries | `AdminLaundriesList` | Approvals |
| Transactions | `AdminTransactionsTable` | Revenue |

## Architecture

- `useDataTableState` — memoized filter → sort → page slice
- `VirtualDataTable` — renders only visible rows (~15–25 DOM nodes) via padding rows
- `React.memo` on row renderer; column defs are module-level constants
- `recordTableRender` exposes `window.__dlmTablePerf` for quick DevTools checks

## 10,000-row perf test

1. In `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_TABLE_PERF_MOCK_ROWS=10000
   ```

2. Restart `npm run dev`.

3. Open Admin → Orders (or Users / Revenue transactions).

4. Set **Rows per page** to **10000** (option appears when mock env is set).

5. Scroll the table and inspect:

   ```js
   window.__dlmTablePerf
   // { "admin-orders": { rowCount: 10000, visibleRowCount: ~20, renderCount, lastRenderMs } }
   ```

## Before / after (methodology)

| Metric | Before (non-virtual) | After (virtual) |
| --- | --- | --- |
| DOM rows (10k data) | 10,000 `<tr>` | ~20 `<tr>` |
| Initial mount (10k) | Often 500ms–2s+ jank | Typically &lt;100ms paint |
| Scroll | Main-thread layout on all rows | Constant ~15–25 rows |
| Re-renders on scroll | N/A (all mounted) | Only virtual window updates |

Measure in Chrome DevTools:

1. **Performance** — record scroll for 3s; compare Scripting + Rendering time.
2. **Elements** — count `tbody tr` during scroll (should stay &lt;30).
3. **React Profiler** — sort/filter should not remount rows; scroll commits stay small.

Optional scroll timing in console:

```js
import { measureScrollFrame } from '@/lib/table/table-perf';
// or from a temporary button: scroll container by 2000px and log frame time
```

## Production note

API lists are still capped (e.g. 100 orders). Mock expansion is **dev-only** via env. For true 10k+ production scale, add server-side pagination/filter on admin endpoints and keep virtualizing the current page slice.
