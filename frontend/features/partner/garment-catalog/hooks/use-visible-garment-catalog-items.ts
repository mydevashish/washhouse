'use client';

import { useQuery } from '@tanstack/react-query';

import { fetchVisibleGarmentCatalogItems } from '@/features/partner/garment-catalog/lib/fetch-visible-garments';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';

/** Visible garment rows for Cloth Wall bridge (Prompt 8). */
export function useVisibleGarmentCatalogItems() {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerGarmentCatalogClothWall(),
    queryFn: fetchVisibleGarmentCatalogItems,
    enabled,
    staleTime: STALE.partnerAnalytics,
  });
}
