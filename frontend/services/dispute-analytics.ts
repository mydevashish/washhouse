import { api, type ApiEnvelope } from '@/lib/api';

export type DisputeAnalyticsPeriod =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DisputeAnalyticsFilters {
  period?: DisputeAnalyticsPeriod;
  date_from?: string;
  date_to?: string;
}

export interface DisputeAnalyticsOverview {
  open_disputes: number;
  resolved_disputes: number;
  avg_resolution_hours: string;
  dispute_rate_pct: string;
  refund_amount_inr: string;
  total_disputes_period: number;
  total_orders_period: number;
  period_label: string;
  date_from: string;
  date_to: string;
}

export interface DisputeTypeBreakdown {
  complaint_type: string;
  type_label: string;
  count: number;
  pct: string;
}

export interface HighRiskCustomerRow {
  user_id: string;
  full_name: string;
  email: string | null;
  risk_level: string;
  risk_label: string;
  trust_score: number;
  dispute_count: number;
  refund_rate_pct: string;
}

export interface HighRiskLaundryRow {
  laundry_id: string;
  laundry_name: string;
  city: string;
  state: string;
  risk_level: string;
  risk_label: string;
  trust_score: number;
  complaint_count: number;
  complaint_rate_pct: string;
}

export interface DisputeMonthlyTrendPoint {
  month: string;
  disputes: number;
  resolved: number;
  refund_amount_inr: string;
}

export interface ChartDataPoint {
  label: string;
  value: string;
  orders: number;
}

export interface DisputeAnalyticsDashboard {
  overview: DisputeAnalyticsOverview;
  top_dispute_types: DisputeTypeBreakdown[];
  high_risk_customers: HighRiskCustomerRow[];
  high_risk_laundries: HighRiskLaundryRow[];
}

export interface DisputeAnalyticsCharts {
  disputes_by_laundry: ChartDataPoint[];
  disputes_by_customer: ChartDataPoint[];
  disputes_by_type: ChartDataPoint[];
  disputes_by_region: ChartDataPoint[];
  monthly_trend: DisputeMonthlyTrendPoint[];
}

function buildParams(filters: DisputeAnalyticsFilters): Record<string, string> {
  const p: Record<string, string> = {};
  if (filters.period) p.period = filters.period;
  if (filters.date_from) p.date_from = filters.date_from;
  if (filters.date_to) p.date_to = filters.date_to;
  return p;
}

export async function getDisputeAnalyticsDashboard(
  filters: DisputeAnalyticsFilters = {},
): Promise<DisputeAnalyticsDashboard> {
  const { data } = await api.get<ApiEnvelope<DisputeAnalyticsDashboard>>(
    '/admin/dispute-analytics/dashboard',
    { params: buildParams(filters) },
  );
  return data.data;
}

export async function getDisputeAnalyticsCharts(
  filters: DisputeAnalyticsFilters = {},
): Promise<DisputeAnalyticsCharts> {
  const { data } = await api.get<ApiEnvelope<DisputeAnalyticsCharts>>(
    '/admin/dispute-analytics/charts',
    { params: buildParams(filters) },
  );
  return data.data;
}

export async function downloadDisputeAnalyticsExport(
  filters: DisputeAnalyticsFilters = {},
  format: 'csv' | 'xlsx' | 'pdf' = 'csv',
): Promise<void> {
  const { data } = await api.get<Blob>('/admin/dispute-analytics/export', {
    params: { ...buildParams(filters), format },
    responseType: 'blob',
  });
  const ext = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xls' : 'txt';
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dispute-analytics.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
