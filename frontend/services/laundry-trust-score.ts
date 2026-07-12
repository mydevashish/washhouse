import { api, type ApiEnvelope } from '@/lib/api';

export type LaundryTrustLevel = 'premium' | 'trusted' | 'verified' | 'under_review';

export const LAUNDRY_TRUST_LEVEL_LABELS: Record<LaundryTrustLevel, string> = {
  premium: 'Premium',
  trusted: 'Trusted',
  verified: 'Verified',
  under_review: 'Under Review',
};

export interface LaundryTrustMetrics {
  on_time_delivery_pct: number;
  complaint_rate_pct: number;
  refund_rate_pct: number;
  dispute_rate_pct: number;
  avg_rating: number;
  review_count: number;
  completed_orders: number;
}

export interface LaundryTrustScoreSummary {
  laundry_id: string;
  laundry_name: string;
  city: string;
  owner_name: string | null;
  trust_score: number;
  level: LaundryTrustLevel;
  level_label: string;
  metrics: LaundryTrustMetrics;
  calculated_at: string;
}

export interface LaundryTrustScoreDetail extends LaundryTrustScoreSummary {
  score_breakdown: Record<string, number>;
}

export async function getPartnerTrustScore(): Promise<LaundryTrustScoreSummary> {
  const { data } = await api.get<ApiEnvelope<LaundryTrustScoreSummary>>('/partner/trust-score');
  return data.data;
}

export async function listAdminLaundryTrustScores(): Promise<LaundryTrustScoreSummary[]> {
  const { data } = await api.get<ApiEnvelope<LaundryTrustScoreSummary[]>>('/admin/laundry-trust-scores');
  return data.data;
}

export async function getAdminLaundryTrustScoreDetail(
  laundryId: string,
): Promise<LaundryTrustScoreDetail> {
  const { data } = await api.get<ApiEnvelope<LaundryTrustScoreDetail>>(
    `/admin/laundry-trust-scores/${laundryId}`,
  );
  return data.data;
}
