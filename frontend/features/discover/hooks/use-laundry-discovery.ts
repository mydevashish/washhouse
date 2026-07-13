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
import {
  discoveryQueryRetry,
  discoveryQueryRetryDelay,
  STALE,
} from '@/lib/query-config';
import {
  listLaundries,
  parseLaundryListPayload,
  searchLaundries,
  type LaundryListItem,
} from '@/services/laundries';

export function useLaundryDiscovery(filters: LaundryFilters = DEFAULT_FILTERS) {
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);
  const isSearching = debouncedSearch.length > 0;
  const isDebouncing = filters.search.trim() !== debouncedSearch;

  const listQuery = useQuery({
    queryKey: queryKeys.laundries(),
    queryFn: () => listLaundries(),
    enabled: !isSearching,
    staleTime: STALE.laundries,
    retry: discoveryQueryRetry,
    retryDelay: discoveryQueryRetryDelay,
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
    retry: discoveryQueryRetry,
    retryDelay: discoveryQueryRetryDelay,
  });

  const baseItems: LaundryListItem[] = useMemo(() => {
    if (isSearching) {
      return searchQuery.data?.items ?? [];
    }
    return parseLaundryListPayload(listQuery.data);
  }, [isSearching, searchQuery.data, listQuery.data]);

  const enriched = useMemo(
    () => baseItems.map((l, i) => enrichLaundry(l, i)),
    [baseItems],
  );

  const filtered = useMemo(() => applyClientFilters(enriched, filters), [enriched, filters]);

  const isPending = isSearching ? searchQuery.isPending : listQuery.isPending;
  const isFetching = isSearching ? searchQuery.isFetching : listQuery.isFetching;
  const isError = isSearching ? searchQuery.isError : listQuery.isError;
  const isLoading =
    isPending || isDebouncing || (isFetching && !isError && enriched.length === 0);
  const refetch = isSearching ? searchQuery.refetch : listQuery.refetch;
  const total = isSearching ? (searchQuery.data?.total ?? 0) : enriched.length;

  return {
    filters,
    filtered,
    enriched,
    isLoading,
    isPending,
    isFetching,
    isError,
    refetch,
    isSearching,
    isDebouncing,
    total,
  };
}
