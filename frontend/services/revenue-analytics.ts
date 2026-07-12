import { api, type ApiEnvelope } from '@/lib/api';

export type RevenuePeriod =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface RevenueAnalyticsFilters {
  period?: RevenuePeriod;
  date_from?: string;
  date_to?: string;
  laundry_id?: string;
  partner_id?: string;
  city?: string;
  state?: string;
  status?: string;
  revenue_min?: number;
  revenue_max?: number;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface RevenueOverview {
  total_platform_revenue_inr: string;
  platform_commission_inr: string;
  total_orders: number;
  delivered_orders: number;
  average_order_value_inr: string;
  active_laundries: number;
  top_laundry_name: string | null;
  top_laundry_revenue_inr: string | null;
  period_label: string;
  date_from: string;
  date_to: string;
}

export interface RevenueInsight {
  text: string;
  severity: 'info' | 'warning' | 'success';
}

export interface TopLaundryLeaderboardRow {
  rank: number;
  laundry_id: string;
  laundry_name: string;
  partner_name: string;
  city: string;
  revenue_inr: string;
  orders_count: number;
  growth_pct: string;
  commission_inr: string;
}

export interface LaundryRevenueRow {
  laundry_id: string;
  laundry_name: string;
  partner_id: string;
  partner_name: string;
  city: string;
  state: string;
  orders_count: number;
  revenue_inr: string;
  commission_inr: string;
  net_payout_inr: string;
  refund_amount_inr: string;
  disputes_count: number;
  average_rating: string;
  status: string;
  growth_pct: string;
}

export interface PaginatedLaundryRevenue {
  items: LaundryRevenueRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ChartDataPoint {
  label: string;
  value: string;
  orders: number;
}

export interface MonthlyTrendPoint {
  month: string;
  revenue_inr: string;
  orders: number;
  commission_inr: string;
}

export interface CommissionAnalytics {
  total_laundry_revenue_inr: string;
  average_commission_pct: string;
  total_commission_earned_inr: string;
  total_net_partner_earnings_inr: string;
  pending_settlements_inr: string;
  completed_settlements_inr: string;
}

export interface RefundAnalytics {
  refund_amount_inr: string;
  refund_count: number;
  refund_pct: string;
  by_reason: Array<{ reason: string; count: number; amount_inr: string }>;
  by_laundry: ChartDataPoint[];
}

export interface DisputeAnalytics {
  open_disputes: number;
  resolved_disputes: number;
  dispute_rate_pct: string;
  common_issues: ChartDataPoint[];
}

export interface RevenueAnalyticsDashboard {
  overview: RevenueOverview;
  insights: RevenueInsight[];
  top_laundries: TopLaundryLeaderboardRow[];
  commission: CommissionAnalytics;
  refunds: RefundAnalytics;
  disputes: DisputeAnalytics;
}

export interface RevenueCharts {
  revenue_by_laundry: ChartDataPoint[];
  orders_by_laundry: ChartDataPoint[];
  commission_by_laundry: ChartDataPoint[];
  revenue_growth: ChartDataPoint[];
  monthly_trend: MonthlyTrendPoint[];
}

export interface BranchRevenueRow {
  laundry_id: string;
  laundry_name: string;
  city: string;
  revenue_inr: string;
  orders_count: number;
  commission_inr: string;
  net_payout_inr: string;
  growth_pct: string;
}

export interface PartnerBranchSummary {
  partner_id: string;
  partner_name: string;
  branch_count: number;
  total_revenue_inr: string;
  total_orders: number;
  total_commission_inr: string;
  branches: BranchRevenueRow[];
}

export interface LaundryRevenueDetail {
  laundry_id: string;
  laundry_name: string;
  partner_id: string;
  partner_name: string;
  city: string;
  state: string;
  status: string;
  average_rating: string;
  commission_rate: string;
  overview: RevenueOverview;
  commission: CommissionAnalytics;
  refunds: RefundAnalytics;
  disputes: DisputeAnalytics;
  monthly_trend: MonthlyTrendPoint[];
  partner_branches: PartnerBranchSummary | null;
}

function buildParams(filters: RevenueAnalyticsFilters): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  if (filters.period) p.period = filters.period;
  if (filters.date_from) p.date_from = filters.date_from;
  if (filters.date_to) p.date_to = filters.date_to;
  if (filters.laundry_id) p.laundry_id = filters.laundry_id;
  if (filters.partner_id) p.partner_id = filters.partner_id;
  if (filters.city) p.city = filters.city;
  if (filters.state) p.state = filters.state;
  if (filters.status) p.status = filters.status;
  if (filters.revenue_min != null) p.revenue_min = filters.revenue_min;
  if (filters.revenue_max != null) p.revenue_max = filters.revenue_max;
  if (filters.page) p.page = filters.page;
  if (filters.page_size) p.page_size = filters.page_size;
  if (filters.sort_by) p.sort_by = filters.sort_by;
  if (filters.sort_dir) p.sort_dir = filters.sort_dir;
  return p;
}

export async function getRevenueAnalyticsDashboard(
  filters: RevenueAnalyticsFilters = {},
): Promise<RevenueAnalyticsDashboard> {
  const { data } = await api.get<ApiEnvelope<RevenueAnalyticsDashboard>>(
    '/admin/revenue-analytics/dashboard',
    { params: buildParams(filters) },
  );
  return data.data;
}

export async function getLaundryRevenueTable(
  filters: RevenueAnalyticsFilters = {},
): Promise<PaginatedLaundryRevenue> {
  const { data } = await api.get<ApiEnvelope<PaginatedLaundryRevenue>>(
    '/admin/revenue-analytics/laundries',
    { params: buildParams(filters) },
  );
  return data.data;
}

export async function getRevenueCharts(
  filters: RevenueAnalyticsFilters = {},
): Promise<RevenueCharts> {
  const { data } = await api.get<ApiEnvelope<RevenueCharts>>('/admin/revenue-analytics/charts', {
    params: buildParams(filters),
  });
  return data.data;
}

export async function getLaundryRevenueDetail(
  laundryId: string,
  filters: RevenueAnalyticsFilters = {},
): Promise<LaundryRevenueDetail> {
  const { data } = await api.get<ApiEnvelope<LaundryRevenueDetail>>(
    `/admin/revenue-analytics/laundries/${laundryId}`,
    { params: buildParams(filters) },
  );
  return data.data;
}

export function getRevenueExportUrl(
  filters: RevenueAnalyticsFilters = {},
  format: 'csv' | 'xlsx' | 'pdf' = 'csv',
): string {
  const params = new URLSearchParams({ ...buildParams(filters), format } as Record<string, string>);
  const base = api.defaults.baseURL ?? '';
  return `${base}/admin/revenue-analytics/export?${params.toString()}`;
}

export async function downloadRevenueExport(
  filters: RevenueAnalyticsFilters = {},
  format: 'csv' | 'xlsx' | 'pdf' = 'csv',
): Promise<void> {
  const { data } = await api.get<Blob>('/admin/revenue-analytics/export', {
    params: { ...buildParams(filters), format },
    responseType: 'blob',
  });
  const ext = format === 'csv' ? 'csv' : format === 'xlsx' ? 'xls' : 'txt';
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laundry-revenue.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
