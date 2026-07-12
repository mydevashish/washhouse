import { api, type ApiEnvelope } from '@/lib/api';
import type { CustodyTimeline } from '@/services/custody-timeline';
import type { DeliveryProofPhoto } from '@/services/delivery-proof';
import type { PickupEvidencePhoto } from '@/services/pickup-evidence';
import type { InventoryVerification } from '@/services/inventory-verification';
import type { DeliveryVerificationStatus } from '@/services/delivery-otp';

export interface OrderItem {
  service_name: string;
  quantity: number;
  line_total_inr: string;
}

/** List endpoint — no line items (lighter payload). */
export interface OrderListItem {
  id: string;
  laundry_id: string;
  status: string;
  tracking_code: string;
  pickup_at: string;
  delivery_at: string;
  total_inr: string;
  payment_status: string;
}

export interface Order extends OrderListItem {
  subtotal_inr: string;
  delivery_fee_inr: string;
  cgst_inr: string;
  sgst_inr: string;
  items: OrderItem[];
  events?: OrderStatusEvent[];
  pickup_evidence?: PickupEvidencePhoto[];
  inventory_verification?: InventoryVerification | null;
  delivery_verification?: DeliveryVerificationStatus | null;
  delivery_proof?: DeliveryProofPhoto | null;
  custody_timeline?: CustodyTimeline | null;
}

export interface OrderStatusEvent {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
}

export interface CreateOrderInput {
  laundry_id: string;
  address_id: string;
  pickup_at: string;
  delivery_at: string;
  items: { service_id: string; quantity: number }[];
  notes?: string;
}

export async function listOrders(params?: {
  limit?: number;
  offset?: number;
}): Promise<OrderListItem[]> {
  const { data } = await api.get<ApiEnvelope<OrderListItem[]>>('/orders', { params });
  return data.data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get<ApiEnvelope<Order>>(`/orders/${id}`);
  return data.data;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data } = await api.post<ApiEnvelope<Order>>('/orders', input);
  return data.data;
}

export async function listOrderEvents(orderId: string): Promise<OrderStatusEvent[]> {
  const { data } = await api.get<ApiEnvelope<OrderStatusEvent[]>>(`/orders/${orderId}/events`);
  return data.data;
}
