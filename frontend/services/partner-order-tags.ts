import { api, type ApiEnvelope } from '@/lib/api';

export type OrderTagKind = 'bag_master' | 'item';

export interface OrderTagLine {
  kind: OrderTagKind;
  label: string;
  service_name?: string | null;
  quantity: number;
  qty_index?: string | null;
  piece_index?: number | null;
  piece_total?: number | null;
}

export interface OrderTagsPayload {
  order_id: string;
  laundry_id: string;
  laundry_name: string;
  color_token: string;
  token_code: string;
  token_day_number: number;
  token_assigned_on: string;
  customer_name: string;
  customer_phone: string;
  customer_phone_last4: string;
  tracking_code: string;
  piece_count: number;
  line_count: number;
  created_at: string;
  per_piece: boolean;
  tags: OrderTagLine[];
}

export async function getPartnerOrderTags(
  orderId: string,
  opts?: { perPiece?: boolean },
): Promise<OrderTagsPayload> {
  const { data } = await api.get<ApiEnvelope<OrderTagsPayload>>(
    `/partner/orders/${orderId}/tags`,
    { params: { per_piece: opts?.perPiece ? true : false } },
  );
  return data.data;
}
