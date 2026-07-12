import { api, type ApiEnvelope } from '@/lib/api';
import type { ListQueryState, PaginatedList } from '@/lib/pagination/types';

export type TrustScoreLevel = 'gold' | 'silver' | 'bronze' | 'high_risk';

export const TRUST_LEVEL_LABELS: Record<TrustScoreLevel, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  high_risk: 'High Risk',
};

export interface TrustScoreEvent {
  id: string;
  user_id: string;
  event_type: string;
  label: string;
  delta: number;
  score_before: number;
  score_after: number;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CustomerTrustScoreSummary {
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  trust_score: number;
  level: TrustScoreLevel;
  level_label: string;
  risk_level: string | null;
  delivered_orders: number;
  dispute_count: number;
  refund_count: number;
  status: string;
  created_at: string;
}

export interface CustomerTrustScoreDetail extends CustomerTrustScoreSummary {
  events: TrustScoreEvent[];
}

export interface TrustScoreListFilters {
  role?: string;
  risk_level?: string;
  trust_score_min?: number;
  trust_score_max?: number;
  status?: string;
  created_from?: string;
  created_to?: string;
}

export type TrustScoreListParams = ListQueryState & TrustScoreListFilters;

export async function listAdminTrustScores(
  params: TrustScoreListParams = {},
): Promise<PaginatedList<CustomerTrustScoreSummary>> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<CustomerTrustScoreSummary>>>(
    '/admin/trust-scores',
    { params },
  );
  return data.data;
}

export async function getAdminTrustScoreDetail(userId: string): Promise<CustomerTrustScoreDetail> {
  const { data } = await api.get<ApiEnvelope<CustomerTrustScoreDetail>>(`/admin/trust-scores/${userId}`);
  return data.data;
}
