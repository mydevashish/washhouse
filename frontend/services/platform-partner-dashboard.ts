import { api, type ApiEnvelope } from '@/lib/api';

export interface PlatformPartnerMetrics {
  total_revenue_inr: string;
  platform_commission_inr: string;
  active_customers: number;
  active_laundries: number;
  orders_total: number;
  revenue_growth_pct: number | null;
  orders_growth_pct: number | null;
}

export interface PlatformPartnerChartPoint {
  date: string;
  value: number;
  label: string | null;
}

export interface PlatformPartnerMonthPoint {
  month: string;
  count: number;
}

export interface PlatformPartnerCharts {
  revenue_trend: PlatformPartnerChartPoint[];
  orders_trend: PlatformPartnerChartPoint[];
  customer_growth: PlatformPartnerMonthPoint[];
  laundry_growth: PlatformPartnerMonthPoint[];
}

export interface PlatformPartnerTopLaundry {
  name: string;
  city: string;
  revenue_inr: string;
  orders: number;
}

export interface PlatformPartnerTopCity {
  city: string;
  revenue_inr: string;
  orders: number;
}

export interface PlatformPartnerTopService {
  service_name: string;
  revenue_inr: string;
  quantity: number;
}

export interface PlatformPartnerDashboard {
  metrics: PlatformPartnerMetrics;
  charts: PlatformPartnerCharts;
  tables: {
    top_laundries: PlatformPartnerTopLaundry[];
    top_cities: PlatformPartnerTopCity[];
    top_services: PlatformPartnerTopService[];
  };
  generated_at: string;
}

export async function getPlatformPartnerDashboard(): Promise<PlatformPartnerDashboard> {
  const { data } = await api.get<ApiEnvelope<PlatformPartnerDashboard>>('/platform-partner/dashboard');
  return data.data;
}

export function formatGrowthPct(pct: number | null | undefined): string {
  if (pct == null) return '—';
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}
