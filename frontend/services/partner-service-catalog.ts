import { api, type ApiEnvelope } from '@/lib/api';
import type { ServiceCatalogItem } from '@/services/customer-experience';

export type { ServiceCatalogItem };

export async function listPartnerServices(): Promise<ServiceCatalogItem[]> {
  const { data } = await api.get<ApiEnvelope<ServiceCatalogItem[]>>('/partner/services');
  return data.data;
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
