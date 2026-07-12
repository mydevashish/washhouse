import { api, type ApiEnvelope } from '@/lib/api';

export async function createRazorpayOrder(orderId: string): Promise<{
  razorpay_order_id: string;
  amount_paise: number;
}> {
  const { data } = await api.post<ApiEnvelope<{ razorpay_order_id: string; amount_paise: number }>>(
    `/payments/orders/${orderId}/razorpay`,
    {},
  );
  return data.data;
}

export async function selectCod(orderId: string): Promise<{ status: string }> {
  const { data } = await api.post<ApiEnvelope<{ status: string }>>(
    `/payments/orders/${orderId}/cod`,
    {},
  );
  return data.data;
}
