import { api, type ApiEnvelope } from '@/lib/api';

export type CustomerSegment = 'new' | 'active' | 'vip' | 'at_risk' | 'inactive';
export type CustomerListType = 'top' | 'repeat' | 'vip' | 'inactive' | 'high_risk';

export interface CustomerSegmentCounts {
  new: number;
  active: number;
  vip: number;
  at_risk: number;
  inactive: number;
}

export interface CustomerListCounts {
  top: number;
  repeat: number;
  vip: number;
  inactive: number;
  high_risk: number;
}

export interface CustomerInsightsDashboard {
  total_customers: number;
  segments: CustomerSegmentCounts;
  lists: CustomerListCounts;
  avg_retention_score: string;
  avg_lifetime_spend_inr: string;
  avg_order_value_inr: string;
}

export interface CustomerInsightRow {
  user_id: string;
  name: string;
  lifetime_spend_inr: string;
  order_count: number;
  avg_order_value_inr: string;
  last_order_at: string | null;
  first_order_at: string | null;
  retention_score: number;
  segment: CustomerSegment;
  segment_label: string;
  is_high_risk: boolean;
  dispute_count: number;
  risk_label: string;
}

export interface CustomerInsightsListResponse {
  items: CustomerInsightRow[];
  total: number;
  limit: number;
  offset: number;
}

export async function getPartnerCustomerInsightsDashboard(): Promise<CustomerInsightsDashboard> {
  const { data } = await api.get<ApiEnvelope<CustomerInsightsDashboard>>('/partner/customer-insights/dashboard');
  return data.data;
}

export async function listPartnerCustomerInsights(params?: {
  list_type?: CustomerListType;
  segment?: CustomerSegment;
  limit?: number;
  offset?: number;
}): Promise<CustomerInsightsListResponse> {
  const { data } = await api.get<ApiEnvelope<CustomerInsightsListResponse>>('/partner/customer-insights/customers', {
    params,
  });
  return data.data;
}
