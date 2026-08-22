import { api, type ApiEnvelope } from '@/lib/api';
import { buildListQueryParams } from '@/lib/pagination/build-query';
import type { ListQueryState, PaginatedList } from '@/lib/pagination/types';
import type { OrderItem } from '@/services/orders';
import { isAxiosError } from 'axios';
import { partnerAnalyticsOverviewFromSummary } from '@/features/partner/lib/partner-analytics-overview-fallback';

export type PartnerRevenuePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface PartnerAnalytics {
  laundry_id: string | null;
  laundry_name: string;
  avg_rating: string;
  review_count: number;
  orders_total: number;
  orders_today: number;
  orders_pending: number;
  orders_in_progress: number;
  orders_ready: number;
  pickup_requests: number;
  orders_delivered: number;
  customers_count: number;
  revenue_inr: string;
  revenue_today_inr: string;
  revenue_this_month_inr: string;
  revenue_week_inr: string;
  /** Money intelligence (Owner Command Center P3). Rate is percent e.g. "10.00". */
  revenue_yesterday_inr: string;
  revenue_prev_week_inr: string;
  revenue_prev_month_inr: string;
  growth_today_pct: string | null;
  growth_week_pct: string | null;
  growth_month_pct: string | null;
  effective_commission_rate: string;
  commission_today_inr: string;
  commission_week_inr: string;
  commission_month_inr: string;
  partner_net_today_inr: string;
  partner_net_week_inr: string;
  partner_net_month_inr: string;
  revenue_walk_in_today_inr: string;
  revenue_doorstep_today_inr: string;
  revenue_walk_in_week_inr: string;
  revenue_doorstep_week_inr: string;
  revenue_walk_in_month_inr: string;
  revenue_doorstep_month_inr: string;
  period_scope?: PartnerAnalyticsPeriodScope | null;
}

export interface PartnerAnalyticsPeriodChartPoint {
  bucket_label: string;
  revenue_gross_inr: string;
  partner_net_inr: string;
}

export interface PartnerAnalyticsPeriodScope {
  period: PartnerRevenuePeriod;
  period_label_ist: string;
  date_from: string | null;
  date_to: string | null;
  revenue_gross_inr: string;
  commission_inr: string;
  partner_net_inr: string;
  revenue_walk_in_inr: string;
  revenue_doorstep_inr: string;
  growth_pct: string | null;
  prior_period_label: string;
  chart_series: PartnerAnalyticsPeriodChartPoint[];
}

export type PartnerAnalyticsParams = {
  period: PartnerRevenuePeriod;
  date_from?: string;
  date_to?: string;
};

export interface PartnerStaff {
  id: string;
  name: string;
  phone: string | null;
  role: string;
}

export interface PartnerCustomer {
  user_id: string;
  name: string;
  order_count: number;
  total_spent_inr: string;
  last_order_at: string | null;
}

export interface PartnerOrder {
  id: string;
  laundry_id: string;
  status: string;
  tracking_code: string;
  color_token?: string | null;
  token_code?: string | null;
  token_day_number?: number | null;
  pickup_at: string;
  delivery_at: string;
  created_at?: string;
  address_line1?: string | null;
  address_line2?: string | null;
  address_city?: string | null;
  address_pincode?: string | null;
  subtotal_inr: string;
  delivery_fee_inr: string;
  // cgst_inr: string;
  // sgst_inr: string;
  total_inr: string;
  paid_inr: string;
  pending_inr: string;
  payment_status: string;
  customer_name: string;
  customer_phone?: string | null;
  order_source?: 'online' | 'walk_in';
  items: OrderItem[];
}

export type PartnerOrdersBucket = 'action' | 'active' | 'done' | 'all';

export type PartnerOrdersListParams = ListQueryState & {
  bucket?: PartnerOrdersBucket;
  status?: string;
  order_source?: 'online' | 'walk_in' | 'doorstep' | string;
  payment_status?: string;
  created_today?: boolean;
  date_from?: string;
  date_to?: string;
};

export async function listPartnerOrders(
  params: PartnerOrdersListParams = {},
): Promise<PaginatedList<PartnerOrder>> {
  const { data } = await api.get<ApiEnvelope<PaginatedList<PartnerOrder>>>('/partner/orders', {
    params: buildListQueryParams({
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
      search: params.search,
      sort_by: params.sort_by ?? 'created_at',
      sort_order: params.sort_order ?? 'desc',
      bucket: params.bucket ?? 'all',
      status: params.status,
      order_source: params.order_source,
      payment_status: params.payment_status,
      created_today: params.created_today ? true : undefined,
      date_from: params.date_from,
      date_to: params.date_to,
    }),
  });
  return data.data;
}

export async function getPartnerOrder(orderId: string): Promise<PartnerOrder> {
  const { data } = await api.get<ApiEnvelope<PartnerOrder>>(`/partner/orders/${orderId}`);
  return data.data;
}

export async function updateOrderStatus(orderId: string, status: string): Promise<PartnerOrder> {
  const { data } = await api.patch<ApiEnvelope<PartnerOrder>>(`/partner/orders/${orderId}/status`, {
    status,
  });
  return data.data;
}

export async function acceptOrder(orderId: string): Promise<PartnerOrder> {
  const { data } = await api.post<ApiEnvelope<PartnerOrder>>(`/partner/orders/${orderId}/accept`, {});
  return data.data;
}

export async function rejectOrder(orderId: string): Promise<PartnerOrder> {
  const { data } = await api.post<ApiEnvelope<PartnerOrder>>(`/partner/orders/${orderId}/reject`, {});
  return data.data;
}

export async function getPartnerAnalytics(params?: PartnerAnalyticsParams): Promise<PartnerAnalytics> {
  const query =
    params?.period != null
      ? {
          period: params.period,
          ...(params.period === 'custom'
            ? { date_from: params.date_from, date_to: params.date_to }
            : {}),
        }
      : undefined;
  const { data } = await api.get<ApiEnvelope<PartnerAnalytics>>('/partner/analytics/summary', {
    params: query,
  });
  return data.data;
}

export type PartnerDashboardPeriodParam = 'today' | 'week' | 'month';

export interface PartnerAnalyticsOverviewChartPoint {
  bucket_label: string;
  bucket_start_utc: string;
  orders_count: number;
  pending_orders_count: number;
  pending_payment_count: number;
  pending_payment_inr: string;
  customers_count: number;
  revenue_gross_inr: string;
  revenue_net_inr: string;
}

export interface PartnerAnalyticsOverview {
  period: PartnerDashboardPeriodParam;
  period_label_ist: string;
  period_start_utc: string;
  period_end_utc: string;
  orders_count: number;
  pending_orders_count: number;
  revenue_gross_inr: string;
  revenue_net_inr: string;
  commission_inr: string;
  effective_commission_rate: string;
  pending_payment_count: number;
  pending_payment_inr: string;
  customers_count_period: number;
  customers_count_all_time: number;
  chart_series: PartnerAnalyticsOverviewChartPoint[];
}

export async function getPartnerAnalyticsOverview(
  period: PartnerDashboardPeriodParam,
): Promise<PartnerAnalyticsOverview> {
  try {
    const { data } = await api.get<ApiEnvelope<PartnerAnalyticsOverview>>(
      '/partner/analytics/overview',
      { params: { period } },
    );
    return data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      const summary = await getPartnerAnalytics();
      return partnerAnalyticsOverviewFromSummary(period, summary);
    }
    throw error;
  }
}

/** Chart / donut / payments period for `GET /partner/analytics/dashboard`. KPIs stay today/week/month. */
export type PartnerAnalyticsDashboardPeriod = 'today' | 'week' | 'month' | 'year';

export interface PartnerAnalyticsDashboardKpis {
  orders_today: number;
  orders_yesterday: number;
  orders_week: number;
  orders_prev_week: number;
  orders_month: number;
  orders_prev_month: number;
  revenue_today_inr: string;
  revenue_yesterday_inr: string;
  revenue_week_inr: string;
  revenue_prev_week_inr: string;
  revenue_month_inr: string;
  revenue_prev_month_inr: string;
}

export interface PartnerAnalyticsDashboardStatusSnapshot {
  in_process: number;
  ready_for_delivery: number;
  completed: number;
}

export interface PartnerAnalyticsDashboardChartPoint {
  bucket_label: string;
  current_revenue_inr: string;
  previous_revenue_inr: string;
}

export interface PartnerAnalyticsDashboardStatusDonut {
  in_process: number;
  ready: number;
  completed: number;
}

export interface PartnerAnalyticsDashboardTopService {
  name: string;
  order_lines: number;
  share_pct: string;
}

export interface PartnerAnalyticsDashboardPaymentSummary {
  cash_paid_inr: string;
  upi_paid_inr: string;
  wallet_tracked: boolean;
  pending_inr: string;
}

export interface PartnerAnalyticsDashboardBottom {
  customers_total: number;
  customers_new_week: number;
  customers_repeat: number;
  avg_order_value_inr: string;
  avg_delivery_minutes: number | null;
  avg_rating: string;
  review_count: number;
}

export interface PartnerAnalyticsDashboard {
  laundry_id: string | null;
  laundry_name: string;
  kpis: PartnerAnalyticsDashboardKpis;
  status_snapshot: PartnerAnalyticsDashboardStatusSnapshot;
  period: PartnerAnalyticsDashboardPeriod;
  period_label_ist: string;
  chart_series: PartnerAnalyticsDashboardChartPoint[];
  status_donut: PartnerAnalyticsDashboardStatusDonut;
  top_services: PartnerAnalyticsDashboardTopService[];
  payment_summary: PartnerAnalyticsDashboardPaymentSummary;
  bottom: PartnerAnalyticsDashboardBottom;
}

export async function getPartnerAnalyticsDashboard(
  period: PartnerAnalyticsDashboardPeriod = 'week',
): Promise<PartnerAnalyticsDashboard> {
  const { data } = await api.get<ApiEnvelope<PartnerAnalyticsDashboard>>(
    '/partner/analytics/dashboard',
    { params: { period } },
  );
  return data.data;
}

export async function listPartnerCustomers(): Promise<PartnerCustomer[]> {
  const { data } = await api.get<ApiEnvelope<PartnerCustomer[]>>('/partner/customers');
  return data.data;
}

export async function listPartnerStaff(): Promise<PartnerStaff[]> {
  const { data } = await api.get<ApiEnvelope<PartnerStaff[]>>('/partner/staff');
  return data.data;
}

export async function createPartnerStaff(body: {
  name: string;
  phone?: string;
  role: string;
}): Promise<PartnerStaff> {
  const { data } = await api.post<ApiEnvelope<PartnerStaff>>('/partner/staff', body);
  return data.data;
}

export async function deletePartnerStaff(staffId: string): Promise<void> {
  await api.delete(`/partner/staff/${staffId}`);
}
