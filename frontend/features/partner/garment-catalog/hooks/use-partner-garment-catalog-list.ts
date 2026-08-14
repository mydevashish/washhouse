'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  GARMENT_CATALOG_DEFAULT_PAGE_SIZE,
  listPartnerGarments,
  type GarmentCategory,
} from '@/services/partner-garment-catalog';

export type GarmentCatalogCategoryFilter = GarmentCategory | 'all';

export function usePartnerGarmentCatalogList(options: {
  category: GarmentCatalogCategoryFilter;
  search: string;
  page: number;
}) {
  const enabled = usePartnerQueriesEnabled();
  const debouncedSearch = useDebouncedValue(options.search.trim(), 300);
  const apiCategory = options.category === 'all' ? undefined : options.category;

  return useQuery({
    queryKey: queryKeys.partnerGarmentCatalog({
      category: apiCategory,
      search: debouncedSearch || undefined,
      page: options.page,
      page_size: GARMENT_CATALOG_DEFAULT_PAGE_SIZE,
    }),
    queryFn: () =>
      listPartnerGarments({
        category: apiCategory,
        search: debouncedSearch || undefined,
        page: options.page,
        page_size: GARMENT_CATALOG_DEFAULT_PAGE_SIZE,
      }),
    enabled,
    staleTime: STALE.partnerAnalytics,
    placeholderData: keepPreviousData,
  });
}
