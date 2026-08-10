'use client';

import { useQuery } from '@tanstack/react-query';

import {
  PARTNER_TAGS_ORDER_SEARCH_DEBOUNCE_MS,
  normalizePartnerTagsSearchQuery,
  partnerTagsOrderSearchListParams,
  shouldRunPartnerTagsSearch,
} from '@/features/partner/dashboard/partner-tags-order-search';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { STALE } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerOrders, type PartnerOrder } from '@/services/partner';

export function usePartnerTagsOrderSearch(rawQuery: string) {
  const debouncedRaw = useDebouncedValue(rawQuery, PARTNER_TAGS_ORDER_SEARCH_DEBOUNCE_MS);
  const search = normalizePartnerTagsSearchQuery(debouncedRaw);
  const shouldSearch = shouldRunPartnerTagsSearch(search);
  const partnerEnabled = usePartnerQueriesEnabled();
  const listParams = partnerTagsOrderSearchListParams(search);

  const ordersQuery = useQuery({
    queryKey: queryKeys.partnerOrders({
      ...listParams,
      surface: 'tags-order-search',
    }),
    queryFn: () => listPartnerOrders(listParams),
    staleTime: STALE.partnerAnalytics,
    enabled: partnerEnabled && shouldSearch,
  });

  const orders: PartnerOrder[] = shouldSearch ? (ordersQuery.data?.items ?? []) : [];

  return {
    search,
    shouldSearch,
    orders,
    ...ordersQuery,
  };
}
