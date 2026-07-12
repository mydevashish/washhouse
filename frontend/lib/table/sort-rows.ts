export type SortDirection = 'asc' | 'desc';

export function compareValues(
  a: string | number | boolean | null | undefined,
  b: string | number | boolean | null | undefined,
  direction: SortDirection,
): number {
  const empty = (v: typeof a) => v === null || v === undefined || v === '';
  if (empty(a) && empty(b)) return 0;
  if (empty(a)) return direction === 'asc' ? 1 : -1;
  if (empty(b)) return direction === 'asc' ? -1 : 1;

  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }

  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  const cmp = sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' });
  return direction === 'asc' ? cmp : -cmp;
}

export function sortRows<T>(
  rows: T[],
  getValue: (row: T) => string | number | boolean | null | undefined,
  direction: SortDirection,
): T[] {
  if (rows.length < 2) return rows;
  return [...rows].sort((a, b) => compareValues(getValue(a), getValue(b), direction));
}
