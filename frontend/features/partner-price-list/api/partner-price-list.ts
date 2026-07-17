import { api, type ApiEnvelope } from '@/lib/api';
import type {
  ApplySuggestedResult,
  CatalogCategory,
  PartnerPriceItemUpsert,
  PartnerPriceListResponse,
} from '@/features/partner-price-list/types';

export async function getPartnerPriceList(
  category?: CatalogCategory,
): Promise<PartnerPriceListResponse> {
  const { data } = await api.get<ApiEnvelope<PartnerPriceListResponse>>('/partner/price-list', {
    params: category ? { category } : undefined,
  });
  return data.data;
}

export async function putPartnerPriceList(
  items: PartnerPriceItemUpsert[],
): Promise<PartnerPriceListResponse> {
  const { data } = await api.put<ApiEnvelope<PartnerPriceListResponse>>('/partner/price-list', {
    items,
  });
  return data.data;
}

export async function applySuggestedPartnerPrices(): Promise<ApplySuggestedResult> {
  const { data } = await api.post<ApiEnvelope<ApplySuggestedResult>>(
    '/partner/price-list/apply-suggested',
  );
  return data.data;
}
