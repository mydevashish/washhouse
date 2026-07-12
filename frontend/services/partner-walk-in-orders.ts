import { api, type ApiEnvelope } from '@/lib/api';
import type { OrderItem } from '@/services/orders';

export interface WalkInOrder {
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
  customer_phone: string;
  partner_notes: string | null;
  user_id: string | null;
  expected_ready_at: string | null;
  items: OrderItem[];
}

export interface WalkInOrderLineItem {
  service_id: string;
  quantity: number;
}

export async function listWalkInOrders(): Promise<WalkInOrder[]> {
  const { data } = await api.get<ApiEnvelope<WalkInOrder[]>>('/partner/walk-in-orders');
  return data.data;
}

export async function createWalkInOrder(body: {
  customer_name: string;
  customer_phone: string;
  items: WalkInOrderLineItem[];
  notes?: string;
  expected_ready_at?: string;
}): Promise<WalkInOrder> {
  const { data } = await api.post<ApiEnvelope<WalkInOrder>>('/partner/walk-in-orders', body);
  return data.data;
}

export async function advanceWalkInOrderStatus(orderId: string, status: string): Promise<void> {
  await api.patch(`/partner/orders/${orderId}/status`, { status });
}
