import { api, type ApiEnvelope } from '@/lib/api';

export type DeliveryOtpStatus = 'active' | 'verified' | 'expired' | 'locked';

export interface DeliveryVerificationStatus {
  order_id: string;
  status: DeliveryOtpStatus;
  generated_at: string | null;
  expires_at: string | null;
  verified_at: string | null;
  delivery_agent_user_id: string | null;
  verification_latitude: string | null;
  verification_longitude: string | null;
  failed_attempts: number;
  is_verified: boolean;
  otp_available: boolean;
}

export interface CustomerDeliveryOtp {
  order_id: string;
  otp_code: string;
  expires_at: string;
  status: DeliveryOtpStatus;
}

export interface DeliveryVerifyResult {
  order_id: string;
  status: string;
  verified_at: string;
  delivery_agent_user_id: string;
}

export async function getCustomerDeliveryOtp(orderId: string): Promise<CustomerDeliveryOtp> {
  const { data } = await api.get<ApiEnvelope<CustomerDeliveryOtp>>(`/orders/${orderId}/delivery-otp`);
  return data.data;
}

export async function getPartnerDeliveryVerification(orderId: string): Promise<DeliveryVerificationStatus | null> {
  const { data } = await api.get<ApiEnvelope<DeliveryVerificationStatus | null>>(
    `/partner/orders/${orderId}/delivery-verification`,
  );
  return data.data;
}

export async function verifyDeliveryOtp(
  orderId: string,
  body: { code: string; latitude?: number; longitude?: number },
): Promise<DeliveryVerifyResult> {
  const { data } = await api.post<ApiEnvelope<DeliveryVerifyResult>>(
    `/partner/orders/${orderId}/delivery/verify`,
    body,
  );
  return data.data;
}
