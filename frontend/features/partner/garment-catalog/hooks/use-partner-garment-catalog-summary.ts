'use client';

import { useQuery } from '@tanstack/react-query';

import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getPartnerGarmentCatalogSummary } from '@/services/partner-garment-catalog';

export function usePartnerGarmentCatalogSummary() {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerGarmentCatalogSummary(),
    queryFn: getPartnerGarmentCatalogSummary,
    enabled,
    staleTime: STALE.partnerAnalytics,
  });
}

/** KPI strip + orders hub pillar metrics. */
export function usePartnerGarmentCatalogKpis() {
  const q = usePartnerGarmentCatalogSummary();
  return {
    total: q.data?.total ?? 0,
    visible: q.data?.visible ?? 0,
    categories: q.data?.categories ?? 0,
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  };
}
