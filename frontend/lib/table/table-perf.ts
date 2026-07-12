export type TablePerfSnapshot = {
  tableId: string;
  rowCount: number;
  visibleRowCount: number;
  renderCount: number;
  lastRenderMs: number;
};

declare global {
  interface Window {
    __dlmTablePerf?: Record<string, TablePerfSnapshot>;
  }
}

const renderCounts = new Map<string, number>();

export function recordTableRender(
  tableId: string,
  rowCount: number,
  visibleRowCount: number,
): void {
  if (typeof window === 'undefined') return;
  const renderCount = (renderCounts.get(tableId) ?? 0) + 1;
  renderCounts.set(tableId, renderCount);
  const snapshot: TablePerfSnapshot = {
    tableId,
    rowCount,
    visibleRowCount,
    renderCount,
    lastRenderMs: performance.now(),
  };
  window.__dlmTablePerf = { ...window.__dlmTablePerf, [tableId]: snapshot };
}

/** Call from DevTools: `window.__dlmTablePerf` after scrolling a virtual table. */
export function measureScrollFrame(tableId: string, scrollFn: () => void): void {
  const start = performance.now();
  scrollFn();
  requestAnimationFrame(() => {
    const ms = performance.now() - start;
    // eslint-disable-next-line no-console -- intentional perf probe
    console.info(`[table-perf:${tableId}] scroll→paint ${ms.toFixed(2)}ms`);
  });
}
