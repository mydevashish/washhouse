import { api, type ApiEnvelope } from '@/lib/api';
import type { PaginatedList } from '@/lib/pagination/types';
import type {
  AssistedOrderCreatePayload,
  AssistedOrderCreateResult,
  AssistedOrderQuote,
  CustomerDeskLookupParams,
  CustomerDeskOrdersFilters,
  CustomerDeskOrdersPage,
  CustomerDeskProfile,
} from '@/features/partner/customer-desk/types';

function buildOrderParams(filters: CustomerDeskOrdersFilters = {}): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p[k] = v as string | number;
  });
  return p;
}

/** Slice 1b — search by name / phone (laundry-scoped, max 20). */
export async function searchPartnerCustomers(q: string): Promise<CustomerDeskProfile[]> {
  const { data } = await api.get<ApiEnvelope<CustomerDeskProfile[]>>('/partner/customers/search', {
    params: { q, limit: 20 },
  });
  return data.data;
}

export async function lookupPartnerCustomer(
  params: CustomerDeskLookupParams,
): Promise<CustomerDeskProfile> {
  const { data } = await api.get<ApiEnvelope<CustomerDeskProfile>>('/partner/customers/lookup', {
    params: 'phone' in params ? { phone: params.phone } : { user_id: params.user_id },
  });
  return data.data;
}

export async function listPartnerCustomerOrdersByUser(
  userId: string,
  filters: CustomerDeskOrdersFilters = {},
): Promise<CustomerDeskOrdersPage> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<CustomerDeskOrdersPage['items'][number]>>>(
    `/partner/customers/${userId}/orders`,
    { params: buildOrderParams(filters) },
  );
  return data.data;
}

export async function listPartnerCustomerOrdersByPhone(
  phone: string,
  filters: CustomerDeskOrdersFilters = {},
): Promise<CustomerDeskOrdersPage> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<CustomerDeskOrdersPage['items'][number]>>>(
    '/partner/customers/orders',
    { params: { phone, ...buildOrderParams(filters) } },
  );
  return data.data;
}

/** Slice 2 — quote assisted doorstep order (partner laundry locked server-side). */
export async function quotePartnerAssistedOrder(
  payload: AssistedOrderCreatePayload,
): Promise<AssistedOrderQuote> {
  const { data } = await api.post<ApiEnvelope<AssistedOrderQuote>>(
    '/partner/customer-desk/orders/quote',
    payload,
  );
  return data.data;
}

/** Slice 2 — create assisted doorstep order (Idempotency-Key required). */
export async function createPartnerAssistedOrder(
  payload: AssistedOrderCreatePayload,
  idempotencyKey: string,
): Promise<AssistedOrderCreateResult> {
  const { data } = await api.post<ApiEnvelope<AssistedOrderCreateResult>>(
    '/partner/customer-desk/orders',
    payload,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return data.data;
}
