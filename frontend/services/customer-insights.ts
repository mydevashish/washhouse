import { api, type ApiEnvelope } from '@/lib/api';
import type { ListQueryState, PaginatedList } from '@/lib/pagination/types';

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
  /** Customers whose first order at this laundry was in the last 7 days. */
  new_this_week?: number;
}

export interface CustomerInsightRow {
  user_id: string;
  name: string;
  /** E.164 or local mobile when available from user profile. */
  phone?: string | null;
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

export type CustomerInsightsListResponse = PaginatedList<CustomerInsightRow>;

export type ListPartnerCustomerInsightsParams = ListQueryState & {
  list_type?: CustomerListType;
  segment?: CustomerSegment;
};

export async function getPartnerCustomerInsightsDashboard(): Promise<CustomerInsightsDashboard> {
  const { data } = await api.get<ApiEnvelope<CustomerInsightsDashboard>>('/partner/customer-insights/dashboard');
  return data.data;
}

export async function listPartnerCustomerInsights(
  params?: ListPartnerCustomerInsightsParams,
): Promise<CustomerInsightsListResponse> {
  const { data } = await api.get<ApiEnvelope<CustomerInsightsListResponse>>('/partner/customer-insights/customers', {
    params,
  });
  return data.data;
}
