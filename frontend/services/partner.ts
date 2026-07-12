import { api, type ApiEnvelope } from '@/lib/api';
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

export async function listPartnerOrders(): Promise<PartnerOrder[]> {
  const { data } = await api.get<ApiEnvelope<PartnerOrder[]>>('/partner/orders');
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
