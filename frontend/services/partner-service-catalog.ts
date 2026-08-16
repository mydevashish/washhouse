import { api, type ApiEnvelope } from '@/lib/api';
import { DEFAULT_PAGE_SIZE, type PaginatedList } from '@/lib/pagination/types';
import type { ServiceCatalogItem } from '@/services/customer-experience';

export type { ServiceCatalogItem };

export const PARTNER_SERVICE_CATALOG_DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export type PartnerServiceListParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export type PaginatedPartnerServices = PaginatedList<ServiceCatalogItem>;

function buildListParams(params: PartnerServiceListParams = {}) {
  const { search, page = 1, page_size = PARTNER_SERVICE_CATALOG_DEFAULT_PAGE_SIZE } = params;
  return {
    page,
    page_size,
    ...(search?.trim() ? { search: search.trim() } : {}),
  };
}

export async function listPartnerServices(
  params: PartnerServiceListParams = {},
): Promise<PaginatedPartnerServices> {
  const { data } = await api.get<ApiEnvelope<PaginatedPartnerServices>>('/partner/services', {
    params: buildListParams(params),
  });
  return data.data;
}

/** Fetch all services (order flows) — paginates with page_size=100. */
export async function listAllPartnerServices(): Promise<ServiceCatalogItem[]> {
  const first = await listPartnerServices({ page: 1, page_size: 100 });
  const items = [...first.items];
  if (first.total_pages <= 1) return items;

  for (let page = 2; page <= first.total_pages; page += 1) {
    const next = await listPartnerServices({ page, page_size: 100 });
    items.push(...next.items);
  }
  return items;
}

export async function createPartnerService(input: {
  name: string;
  category: string;
  unit?: string;
  price_inr: number;
  description?: string;
  estimated_duration_minutes?: number;
  express_available?: boolean;
  pickup_available?: boolean;
  delivery_available?: boolean;
  catalog_status?: string;
  sort_order?: number;
}): Promise<ServiceCatalogItem> {
  const { data } = await api.post<ApiEnvelope<ServiceCatalogItem>>('/partner/services', input);
  return data.data;
}

export async function updatePartnerService(
  id: string,
  input: Partial<{
    name: string;
    category: string;
    unit: string;
    price_inr: number;
    description: string;
    estimated_duration_minutes: number;
    express_available: boolean;
    pickup_available: boolean;
    delivery_available: boolean;
    catalog_status: string;
    sort_order: number;
    is_active: boolean;
  }>,
): Promise<ServiceCatalogItem> {
  const { data } = await api.patch<ApiEnvelope<ServiceCatalogItem>>(`/partner/services/${id}`, input);
  return data.data;
}

export async function deletePartnerService(id: string): Promise<void> {
  await api.delete(`/partner/services/${id}`);
}
