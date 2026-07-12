/** Duplicate seed rows for local perf testing (see docs/TABLE_VIRTUALIZATION.md). */
export function maybeExpandRowsForPerfMock<T>(
  rows: T[],
  synthesize: (seed: T, index: number) => T,
): T[] {
  const target = Number(process.env.NEXT_PUBLIC_TABLE_PERF_MOCK_ROWS ?? 0);
  if (!Number.isFinite(target) || target <= rows.length) return rows;

  const out: T[] = [...rows];
  let i = 0;
  while (out.length < target) {
    out.push(synthesize(rows[i % rows.length]!, out.length));
    i += 1;
  }
  return out;
}
