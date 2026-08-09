import { api, type ApiEnvelope } from '@/lib/api';

export type PartnerCoupon = {
  id: string;
  code: string;
  discount_percent: string;
  is_active: boolean;
};

export type PartnerCouponValidateResult = {
  code: string;
  discount_percent: string;
};

export async function listPartnerCoupons(): Promise<PartnerCoupon[]> {
  const { data } = await api.get<ApiEnvelope<PartnerCoupon[]>>('/api/v1/partner/coupons');
  return data.data;
}

export async function createPartnerCoupon(input: {
  code: string;
  discount_percent: number;
  is_active?: boolean;
}): Promise<PartnerCoupon> {
  const { data } = await api.post<ApiEnvelope<PartnerCoupon>>('/api/v1/partner/coupons', input);
  return data.data;
}

export async function updatePartnerCoupon(
  id: string,
  input: Partial<{ code: string; discount_percent: number; is_active: boolean }>,
): Promise<PartnerCoupon> {
  const { data } = await api.patch<ApiEnvelope<PartnerCoupon>>(
    `/api/v1/partner/coupons/${id}`,
    input,
  );
  return data.data;
}

export async function deletePartnerCoupon(id: string): Promise<void> {
  await api.delete(`/api/v1/partner/coupons/${id}`);
}

export async function validatePartnerCoupon(code: string): Promise<PartnerCouponValidateResult> {
  const { data } = await api.post<ApiEnvelope<PartnerCouponValidateResult>>(
    '/api/v1/partner/coupons/validate',
    { code },
  );
  return data.data;
}
