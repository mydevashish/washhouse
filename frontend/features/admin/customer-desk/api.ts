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
} from '@/features/admin/customer-desk/types';

function buildOrderParams(filters: CustomerDeskOrdersFilters = {}): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p[k] = v as string | number;
  });
  return p;
}

/** Slice 1b — search by name / phone / user_id (max 20). */
export async function searchAdminCustomers(q: string): Promise<CustomerDeskProfile[]> {
  const { data } = await api.get<ApiEnvelope<CustomerDeskProfile[]>>('/admin/customers/search', {
    params: { q, limit: 20 },
  });
  return data.data;
}

export async function lookupAdminCustomer(
  params: CustomerDeskLookupParams,
): Promise<CustomerDeskProfile> {
  const { data } = await api.get<ApiEnvelope<CustomerDeskProfile>>('/admin/customers/lookup', {
    params: 'phone' in params ? { phone: params.phone } : { user_id: params.user_id },
  });
  return data.data;
}

export async function listAdminCustomerOrdersByUser(
  userId: string,
  filters: CustomerDeskOrdersFilters = {},
): Promise<CustomerDeskOrdersPage> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<CustomerDeskOrdersPage['items'][number]>>>(
    `/admin/customers/${userId}/orders`,
    { params: buildOrderParams(filters) },
  );
  return data.data;
}

export async function listAdminCustomerOrdersByPhone(
  phone: string,
  filters: CustomerDeskOrdersFilters = {},
): Promise<CustomerDeskOrdersPage> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<CustomerDeskOrdersPage['items'][number]>>>(
    '/admin/customers/orders',
    { params: { phone, ...buildOrderParams(filters) } },
  );
  return data.data;
}

/** Slice 2 — quote assisted doorstep order. */
export async function quoteAdminAssistedOrder(
  payload: AssistedOrderCreatePayload,
): Promise<AssistedOrderQuote> {
  const { data } = await api.post<ApiEnvelope<AssistedOrderQuote>>(
    '/admin/customer-desk/orders/quote',
    payload,
  );
  return data.data;
}

/** Slice 2 — create assisted doorstep order (Idempotency-Key required). */
export async function createAdminAssistedOrder(
  payload: AssistedOrderCreatePayload,
  idempotencyKey: string,
): Promise<AssistedOrderCreateResult> {
  const { data } = await api.post<ApiEnvelope<AssistedOrderCreateResult>>(
    '/admin/customer-desk/orders',
    payload,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return data.data;
}
