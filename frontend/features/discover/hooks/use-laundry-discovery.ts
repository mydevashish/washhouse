'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  applyClientFilters,
  DEFAULT_FILTERS,
  type LaundryFilters,
  mapSortToApi,
} from '@/features/discover/listing/filter-laundries';
import { enrichLaundry } from '@/features/discover/lib/laundry-meta';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listLaundries, searchLaundries, type LaundryListItem } from '@/services/laundries';

export function useLaundryDiscovery(filters: LaundryFilters = DEFAULT_FILTERS) {
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);
  const isSearching = debouncedSearch.length > 0;
  const isDebouncing = filters.search.trim() !== debouncedSearch;

  const listQuery = useQuery({
    queryKey: queryKeys.laundries(),
    queryFn: () => listLaundries(),
    enabled: !isSearching,
    staleTime: STALE.laundries,
  });

  const searchQuery = useQuery({
    queryKey: queryKeys.laundrySearch({
      q: debouncedSearch,
      sort: mapSortToApi(filters.sort),
      minRating: filters.minRating,
    }),
    queryFn: () =>
      searchLaundries({
        q: debouncedSearch,
        sort: mapSortToApi(filters.sort),
        min_rating: filters.minRating > 0 ? filters.minRating : undefined,
        limit: 50,
        offset: 0,
      }),
    enabled: isSearching,
    staleTime: STALE.laundrySearch,
    placeholderData: (prev) => prev,
  });

  const baseItems: LaundryListItem[] = useMemo(() => {
    if (isSearching) {
      return searchQuery.data?.items ?? [];
    }
    return listQuery.data ?? [];
  }, [isSearching, searchQuery.data, listQuery.data]);

  const enriched = useMemo(
    () => baseItems.map((l, i) => enrichLaundry(l, i)),
    [baseItems],
  );

  const filtered = useMemo(() => applyClientFilters(enriched, filters), [enriched, filters]);

  const isLoading = isSearching
    ? searchQuery.isLoading && !searchQuery.data
    : listQuery.isLoading;
  const isFetching = isSearching ? searchQuery.isFetching : listQuery.isFetching;
  const isError = isSearching ? searchQuery.isError : listQuery.isError;
  const refetch = isSearching ? searchQuery.refetch : listQuery.refetch;
  const total = isSearching ? (searchQuery.data?.total ?? 0) : enriched.length;

  return {
    filters,
    filtered,
    enriched,
    isLoading: isLoading || isDebouncing,
    isFetching,
    isError,
    refetch,
    isSearching,
    isDebouncing,
    total,
  };
}
