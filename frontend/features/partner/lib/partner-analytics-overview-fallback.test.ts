import { partnerAnalyticsOverviewFromSummary } from '@/features/partner/lib/partner-analytics-overview-fallback';
import type { PartnerAnalytics } from '@/services/partner';

const summary: PartnerAnalytics = {
  laundry_id: 'l1',
  laundry_name: 'Test Laundry',
  avg_rating: '4.5',
  review_count: 2,
  orders_total: 10,
  orders_today: 3,
  orders_pending: 1,
  orders_in_progress: 0,
  orders_ready: 0,
  pickup_requests: 0,
  orders_delivered: 9,
  customers_count: 4,
  revenue_inr: '1000.00',
  revenue_today_inr: '100.00',
  revenue_this_month_inr: '500.00',
  revenue_week_inr: '200.00',
  revenue_yesterday_inr: '80.00',
  revenue_prev_week_inr: '150.00',
  revenue_prev_month_inr: '400.00',
  growth_today_pct: '25.00',
  growth_week_pct: null,
  growth_month_pct: '10.00',
  effective_commission_rate: '10.00',
  commission_today_inr: '10.00',
  commission_week_inr: '20.00',
  commission_month_inr: '50.00',
  partner_net_today_inr: '90.00',
  partner_net_week_inr: '180.00',
  partner_net_month_inr: '450.00',
  revenue_walk_in_today_inr: '60.00',
  revenue_doorstep_today_inr: '40.00',
  revenue_walk_in_week_inr: '120.00',
  revenue_doorstep_week_inr: '80.00',
  revenue_walk_in_month_inr: '300.00',
  revenue_doorstep_month_inr: '200.00',
};

describe('partnerAnalyticsOverviewFromSummary', () => {
  it('maps today revenue and order count from summary', () => {
    const overview = partnerAnalyticsOverviewFromSummary('today', summary);
    expect(overview.period).toBe('today');
    expect(overview.orders_count).toBe(3);
    expect(overview.revenue_gross_inr).toBe('100.00');
    expect(overview.revenue_net_inr).toBe('90.00');
    expect(overview.chart_series).toHaveLength(1);
  });

  it('maps week revenue from summary', () => {
    const overview = partnerAnalyticsOverviewFromSummary('week', summary);
    expect(overview.revenue_gross_inr).toBe('200.00');
    expect(overview.revenue_net_inr).toBe('180.00');
  });
});
