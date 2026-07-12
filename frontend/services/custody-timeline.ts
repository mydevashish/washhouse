import { api, type ApiEnvelope } from '@/lib/api';

export type CustodyEventType =
  | 'order_confirmed'
  | 'pickup_assigned'
  | 'pickup_photos_uploaded'
  | 'inventory_recorded'
  | 'inventory_confirmed'
  | 'pickup_completed'
  | 'washing_started'
  | 'ironing_started'
  | 'packaging_completed'
  | 'delivery_assigned'
  | 'delivery_proof_uploaded'
  | 'otp_verified'
  | 'delivered'
  | 'order_cancelled';

export type CustodyActorRole = 'customer' | 'partner' | 'admin' | 'system' | 'delivery';

export interface CustodyEvent {
  id: string;
  order_id: string;
  event_type: CustodyEventType;
  label: string;
  actor_user_id: string | null;
  actor_role: CustodyActorRole;
  actor_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CustodyTimeline {
  order_id: string;
  events: CustodyEvent[];
}

export async function getCustomerCustodyTimeline(orderId: string): Promise<CustodyTimeline> {
  const { data } = await api.get<ApiEnvelope<CustodyTimeline>>(`/orders/${orderId}/custody-timeline`);
  return data.data;
}

export async function getPartnerCustodyTimeline(orderId: string): Promise<CustodyTimeline> {
  const { data } = await api.get<ApiEnvelope<CustodyTimeline>>(
    `/partner/orders/${orderId}/custody-timeline`,
  );
  return data.data;
}

export async function getAdminCustodyTimeline(orderId: string): Promise<CustodyTimeline> {
  const { data } = await api.get<ApiEnvelope<CustodyTimeline>>(
    `/admin/orders/${orderId}/custody-timeline`,
  );
  return data.data;
}

export const CUSTODY_ROLE_LABELS: Record<CustodyActorRole, string> = {
  customer: 'Customer',
  partner: 'Partner',
  admin: 'Admin',
  system: 'System',
  delivery: 'Delivery agent',
};
