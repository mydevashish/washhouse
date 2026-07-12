'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DataTableSortState } from '@/lib/table/use-data-table-state';

import { DEFAULT_PAGE_SIZE, normalizePageSize, type ListQueryState, type PaginatedList } from './types';

const SEARCH_DEBOUNCE_MS = 300;

export type UseServerListOptions<T, F extends object = Record<string, never>> = {
  queryKey: readonly unknown[];
  fetcher: (params: ListQueryState & F) => Promise<PaginatedList<T>>;
  filters?: F;
  defaultSort?: { sort_by: string; sort_order: 'asc' | 'desc' };
  defaultPageSize?: number;
  enabled?: boolean;
};

export function useServerList<T, F extends object = Record<string, never>>({
  queryKey,
  fetcher,
  filters,
  defaultSort,
  defaultPageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseServerListOptions<T, F>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(normalizePageSize(defaultPageSize));
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState(defaultSort?.sort_by ?? 'created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSort?.sort_order ?? 'desc');

  const filterKey = useMemo(() => JSON.stringify(filters ?? {}), [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize, sortBy, sortOrder, filterKey]);

  const requestParams = useMemo(
    () =>
      ({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(filters ?? {}),
      }) as ListQueryState & F,
    [page, pageSize, debouncedSearch, sortBy, sortOrder, filters],
  );

  const query = useQuery({
    queryKey: [...queryKey, requestParams],
    queryFn: () => fetcher(requestParams),
    enabled,
  });

  const data = query.data;

  const toggleSort = useCallback((columnId: string) => {
    setSortBy((prev) => {
      if (prev !== columnId) {
        setSortOrder('asc');
        return columnId;
      }
      setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
      return columnId;
    });
    setPage(1);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(normalizePageSize(size));
    setPage(1);
  }, []);

  const sort: DataTableSortState = { columnId: sortBy, direction: sortOrder };
  const totalRecords = data?.total_records ?? 0;
  const pageStart = totalRecords === 0 ? 0 : ((data?.page ?? 1) - 1) * (data?.page_size ?? pageSize);
  const pageEnd = Math.min((data?.page ?? page) * (data?.page_size ?? pageSize), totalRecords);

  return {
    ...query,
    rows: data?.items ?? [],
    page: data?.page ?? page,
    pageSize: data?.page_size ?? pageSize,
    pageCount: data?.total_pages ?? 1,
    totalRecords,
    hasNext: data?.has_next ?? false,
    hasPrevious: data?.has_previous ?? false,
    pageStart,
    pageEnd,
    search: searchInput,
    setSearch: setSearchInput,
    sort,
    toggleSort,
    setPage,
    setPageSize,
    requestParams,
    refetch: query.refetch,
  };
}
