import { api, type ApiEnvelope } from '@/lib/api';

export interface OrderInvoiceLine {
  service_name: string;
  quantity: number;
  unit_price_inr: string;
  line_total_inr: string;
}

export interface OrderInvoicePayload {
  order_id: string;
  laundry_id: string;
  laundry_name: string;
  laundry_address?: string | null;
  laundry_city?: string | null;
  laundry_gstin?: string | null;
  invoice_number: string;
  color_token?: string | null;
  token_code?: string | null;
  token_day_number?: number | null;
  token_assigned_on?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_phone_last4: string;
  tracking_code: string;
  created_at: string;
  currency: string;
  subtotal_inr: string;
  delivery_fee_inr: string;
  gst_rate: string;
  cgst_inr: string;
  sgst_inr: string;
  total_inr: string;
  payment_status: string;
  lines: OrderInvoiceLine[];
}

export type InvoicePrintVariant = 'bill' | 'gst';

export async function getPartnerOrderInvoice(orderId: string): Promise<OrderInvoicePayload> {
  const { data } = await api.get<ApiEnvelope<OrderInvoicePayload>>(
    `/partner/orders/${orderId}/invoice`,
  );
  return data.data;
}
