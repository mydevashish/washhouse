import { api, type ApiEnvelope } from '@/lib/api';

export interface BusinessHealthMetrics {
  revenue_today_inr: string;
  revenue_month_inr: string;
  revenue_growth_pct: number | null;
  orders_today: number;
  orders_month: number;
  order_growth_pct: number | null;
  average_order_value_inr: string;
  active_customers: number;
  new_customers: number;
  returning_customers: number;
  active_laundries: number;
  top_laundry_name: string | null;
  top_laundry_revenue_inr: string | null;
  lowest_laundry_name: string | null;
  lowest_laundry_revenue_inr: string | null;
  total_customers: number;
  total_laundries: number;
}

export interface BusinessHealthOperational {
  open_disputes: number;
  pending_refunds: number;
  pending_settlements: number;
  failed_deliveries: number;
  delayed_orders: number;
  delayed_settlements: number;
}

export interface BusinessHealthGrowth {
  customer_growth_pct: number | null;
  laundry_growth_pct: number | null;
  order_growth_pct: number | null;
  revenue_growth_pct: number | null;
  new_customers_month: number;
  new_laundries_month: number;
}

export interface BusinessHealthAlert {
  id: string;
  severity: 'warning' | 'critical' | string;
  title: string;
  description: string;
  metric_value: string;
  href: string;
}

export interface BusinessHealthTrendPoint {
  date: string;
  revenue_inr: string;
  orders: number;
}

export interface BusinessHealthChartPoint {
  date: string;
  value: number;
  label: string | null;
}

export interface BusinessHealthMonthPoint {
  month: string;
  count: number;
}

export interface BusinessHealthCharts {
  revenue_trend: BusinessHealthChartPoint[];
  orders_trend: BusinessHealthChartPoint[];
  customer_growth: BusinessHealthMonthPoint[];
  laundry_growth: BusinessHealthMonthPoint[];
  commission_trend: BusinessHealthChartPoint[];
}

export interface BusinessHealthDashboard {
  metrics: BusinessHealthMetrics;
  operational: BusinessHealthOperational;
  growth: BusinessHealthGrowth;
  alerts: BusinessHealthAlert[];
  trend: BusinessHealthTrendPoint[];
  charts: BusinessHealthCharts;
  generated_at: string;
}

export async function getBusinessHealthDashboard(): Promise<BusinessHealthDashboard> {
  const { data } = await api.get<ApiEnvelope<BusinessHealthDashboard>>('/admin/business-health');
  return data.data;
}

export function formatGrowthPct(pct: number | null | undefined): string {
  if (pct == null) return '—';
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}
