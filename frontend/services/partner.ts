import { api, type ApiEnvelope } from '@/lib/api';
import { buildListQueryParams } from '@/lib/pagination/build-query';
import type { ListQueryState, PaginatedList } from '@/lib/pagination/types';
import type { OrderItem } from '@/services/orders';

export interface PartnerAnalytics {
  laundry_id: string | null;
  laundry_name: string;
  avg_rating: string;
  review_count: number;
  orders_total: number;
  orders_today: number;
  orders_pending: number;
  orders_in_progress: number;
  orders_ready: number;
  pickup_requests: number;
  orders_delivered: number;
  customers_count: number;
  revenue_inr: string;
  revenue_today_inr: string;
  revenue_this_month_inr: string;
  revenue_week_inr: string;
  /** Money intelligence (Owner Command Center P3). Rate is percent e.g. "10.00". */
  revenue_yesterday_inr: string;
  revenue_prev_week_inr: string;
  revenue_prev_month_inr: string;
  growth_today_pct: string | null;
  growth_week_pct: string | null;
  growth_month_pct: string | null;
  effective_commission_rate: string;
  commission_today_inr: string;
  commission_week_inr: string;
  commission_month_inr: string;
  partner_net_today_inr: string;
  partner_net_week_inr: string;
  partner_net_month_inr: string;
  revenue_walk_in_today_inr: string;
  revenue_doorstep_today_inr: string;
  revenue_walk_in_week_inr: string;
  revenue_doorstep_week_inr: string;
  revenue_walk_in_month_inr: string;
  revenue_doorstep_month_inr: string;
}

export interface PartnerStaff {
  id: string;
  name: string;
  phone: string | null;
  role: string;
}

export interface PartnerCustomer {
  user_id: string;
  name: string;
  order_count: number;
  total_spent_inr: string;
  last_order_at: string | null;
}

export interface PartnerOrder {
  id: string;
  laundry_id: string;
  status: string;
  tracking_code: string;
  color_token?: string | null;
  token_code?: string | null;
  token_day_number?: number | null;
  pickup_at: string;
  delivery_at: string;
  subtotal_inr: string;
  delivery_fee_inr: string;
  cgst_inr: string;
  sgst_inr: string;
  total_inr: string;
  payment_status: string;
  customer_name: string;
  customer_phone?: string | null;
  order_source?: 'online' | 'walk_in';
  items: OrderItem[];
}

export type PartnerOrdersBucket = 'action' | 'active' | 'done' | 'all';

export type PartnerOrdersListParams = ListQueryState & {
  bucket?: PartnerOrdersBucket;
  status?: string;
  order_source?: 'online' | 'walk_in' | 'doorstep' | string;
  payment_status?: string;
  created_today?: boolean;
};

export async function listPartnerOrders(
  params: PartnerOrdersListParams = {},
): Promise<PaginatedList<PartnerOrder>> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<PartnerOrder>>>('/partner/orders', {
    params: buildListQueryParams({
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
      search: params.search,
      sort_by: params.sort_by ?? 'created_at',
      sort_order: params.sort_order ?? 'desc',
      bucket: params.bucket ?? 'all',
      status: params.status,
      order_source: params.order_source,
      payment_status: params.payment_status,
      created_today: params.created_today ? true : undefined,
    }),
  });
  return data.data;
}

export async function getPartnerOrder(orderId: string): Promise<PartnerOrder> {
  const { data } = await api.get<ApiEnvelope<PartnerOrder>>(`/partner/orders/${orderId}`);
  return data.data;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<PartnerOrder> {
  const { data } = await api.patch<ApiEnvelope<PartnerOrder>>(`/partner/orders/${orderId}/status`, {
    status,
  });
  return data.data;
}

export async function acceptOrder(orderId: string): Promise<PartnerOrder> {
  const { data } = await api.post<ApiEnvelope<PartnerOrder>>(`/partner/orders/${orderId}/accept`, {});
  return data.data;
}

export async function rejectOrder(orderId: string): Promise<PartnerOrder> {
  const { data } = await api.post<ApiEnvelope<PartnerOrder>>(`/partner/orders/${orderId}/reject`, {});
  return data.data;
}

export async function getPartnerAnalytics(): Promise<PartnerAnalytics> {
  const { data } = await api.get<ApiEnvelope<PartnerAnalytics>>('/partner/analytics/summary');
  return data.data;
}

export async function listPartnerCustomers(): Promise<PartnerCustomer[]> {
  const { data } = await api.get<ApiEnvelope<PartnerCustomer[]>>('/partner/customers');
  return data.data;
}

export async function listPartnerStaff(): Promise<PartnerStaff[]> {
  const { data } = await api.get<ApiEnvelope<PartnerStaff[]>>('/partner/staff');
  return data.data;
}

export async function createPartnerStaff(body: {
  name: string;
  phone?: string;
  role: string;
}): Promise<PartnerStaff> {
  const { data } = await api.post<ApiEnvelope<PartnerStaff>>('/partner/staff', body);
  return data.data;
}

export async function deletePartnerStaff(staffId: string): Promise<void> {
  await api.delete(`/partner/staff/${staffId}`);
}
