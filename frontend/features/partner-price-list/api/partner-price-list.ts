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

export type PartnerPriceItemPatch = {
  dry_clean_inr?: string | null;
  press_inr?: string | null;
  price_inr?: string | null;
  is_offered?: boolean;
  sort_order?: number;
};

export async function patchPartnerPriceItem(
  catalogItemId: string,
  body: PartnerPriceItemPatch,
): Promise<PartnerPriceListResponse['items'][number]> {
  const { data } = await api.patch<ApiEnvelope<PartnerPriceListResponse['items'][number]>>(
    `/partner/price-list/${catalogItemId}`,
    body,
  );
  return data.data;
}
