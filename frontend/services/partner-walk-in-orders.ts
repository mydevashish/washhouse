import { api, type ApiEnvelope } from '@/lib/api';
import type { ListQueryState, PaginatedList } from '@/lib/pagination/types';
import type { OrderItem } from '@/services/orders';

export interface WalkInOrder {
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
  customer_phone: string;
  partner_notes: string | null;
  user_id: string | null;
  expected_ready_at: string | null;
  items: OrderItem[];
}

export interface WalkInOrderLineItem {
  service_id?: string;
  catalog_item_id?: string;
  process?: 'dry_clean' | 'press' | 'single';
  quantity: number;
}

export type ListWalkInOrdersParams = ListQueryState;

export async function listWalkInOrders(
  params?: ListWalkInOrdersParams,
): Promise<PaginatedList<WalkInOrder>> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<WalkInOrder>>>('/partner/walk-in-orders', {
    params,
  });
  return data.data;
}

export async function createWalkInOrder(body: {
  customer_name: string;
  customer_phone: string;
  customer_gender?: 'male' | 'female';
  items: WalkInOrderLineItem[];
  notes?: string;
  expected_ready_at?: string;
  coupon_code?: string;
}): Promise<WalkInOrder> {
  const { data } = await api.post<ApiEnvelope<WalkInOrder>>('/partner/walk-in-orders', body);
  return data.data;
}

export async function advanceWalkInOrderStatus(orderId: string, status: string): Promise<void> {
  await api.patch(`/partner/orders/${orderId}/status`, { status });
}
