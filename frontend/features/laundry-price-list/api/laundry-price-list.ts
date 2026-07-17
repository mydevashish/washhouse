import { api, type ApiEnvelope } from '@/lib/api';
import { DISCOVERY_API_TIMEOUT_MS } from '@/lib/query-config';
import type { LaundryPriceListResponse } from '@/features/laundry-price-list/types';

export async function getLaundryPriceList(laundryId: string): Promise<LaundryPriceListResponse> {
  const { data } = await api.get<ApiEnvelope<LaundryPriceListResponse>>(
    `/laundries/${laundryId}/price-list`,
    { timeout: DISCOVERY_API_TIMEOUT_MS },
  );
  return data.data;
}
