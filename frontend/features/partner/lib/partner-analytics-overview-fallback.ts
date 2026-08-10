import type { PartnerDashboardPeriodParam, PartnerAnalyticsOverview } from '@/services/partner';
import type { PartnerAnalytics } from '@/services/partner';

const PERIOD_LABEL: Record<PartnerDashboardPeriodParam, string> = {
  today: 'Today (IST)',
  week: 'This week (IST)',
  month: 'This month (IST)',
};

/**
 * Degraded overview when `GET /partner/analytics/overview` is missing (older API deploy).
 * Revenue/net/commission match `analytics/summary`; order counts and chart buckets are approximate.
 */
export function partnerAnalyticsOverviewFromSummary(
  period: PartnerDashboardPeriodParam,
  summary: PartnerAnalytics,
): PartnerAnalyticsOverview {
  const nowIso = new Date().toISOString();

  let revenue_gross_inr: string;
  let revenue_net_inr: string;
  let commission_inr: string;
  let orders_count: number;

  switch (period) {
    case 'week':
      revenue_gross_inr = summary.revenue_week_inr;
      revenue_net_inr = summary.partner_net_week_inr;
      commission_inr = summary.commission_week_inr;
      orders_count = 0;
      break;
    case 'month':
      revenue_gross_inr = summary.revenue_this_month_inr;
      revenue_net_inr = summary.partner_net_month_inr;
      commission_inr = summary.commission_month_inr;
      orders_count = 0;
      break;
    default:
      revenue_gross_inr = summary.revenue_today_inr;
      revenue_net_inr = summary.partner_net_today_inr;
      commission_inr = summary.commission_today_inr;
      orders_count = summary.orders_today;
  }

  const chart_series = [
    {
      bucket_label: PERIOD_LABEL[period],
      bucket_start_utc: nowIso,
      orders_count,
      pending_orders_count: summary.orders_pending,
      pending_payment_count: 0,
      pending_payment_inr: '0.00',
      customers_count: summary.customers_count,
      revenue_gross_inr,
      revenue_net_inr,
    },
  ];

  return {
    period,
    period_label_ist: PERIOD_LABEL[period],
    period_start_utc: nowIso,
    period_end_utc: nowIso,
    orders_count,
    pending_orders_count: summary.orders_pending,
    revenue_gross_inr,
    revenue_net_inr,
    commission_inr,
    effective_commission_rate: summary.effective_commission_rate,
    pending_payment_count: 0,
    pending_payment_inr: '0.00',
    customers_count_period: summary.customers_count,
    customers_count_all_time: summary.customers_count,
    chart_series,
  };
}
