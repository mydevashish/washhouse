'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { sortRows, type SortDirection } from '@/lib/table/sort-rows';

export type DataTableSortState = {
  columnId: string | null;
  direction: SortDirection;
};

export type UseDataTableStateOptions<T> = {
  data: T[];
  filterFn?: (row: T, query: string) => boolean;
  getSortValue?: (row: T, columnId: string) => string | number | boolean | null | undefined;
  defaultSort?: { columnId: string; direction: SortDirection };
  defaultPageSize?: number;
};

export function useDataTableState<T>({
  data,
  filterFn,
  getSortValue,
  defaultSort,
  defaultPageSize = 10,
}: UseDataTableStateOptions<T>) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<DataTableSortState>({
    columnId: defaultSort?.columnId ?? null,
    direction: defaultSort?.direction ?? 'asc',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q || !filterFn) return data;
    return data.filter((row) => filterFn(row, q));
  }, [data, search, filterFn]);

  const sorted = useMemo(() => {
    if (!sort.columnId || !getSortValue) return filtered;
    return sortRows(filtered, (row) => getSortValue(row, sort.columnId!), sort.direction);
  }, [filtered, sort.columnId, sort.direction, getSortValue]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, sort.columnId, sort.direction, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageStart = (page - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, sorted.length);

  const pageRows = useMemo(
    () => sorted.slice(pageStart, pageEnd),
    [sorted, pageStart, pageEnd],
  );

  const toggleSort = useCallback((columnId: string) => {
    setSort((prev) => {
      if (prev.columnId !== columnId) {
        return { columnId, direction: 'asc' };
      }
      return {
        columnId,
        direction: prev.direction === 'asc' ? 'desc' : 'asc',
      };
    });
  }, []);

  return {
    search,
    setSearch,
    sort,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pageStart,
    pageEnd,
    filteredCount: sorted.length,
    totalCount: data.length,
    pageRows,
    allRows: sorted,
  };
}
