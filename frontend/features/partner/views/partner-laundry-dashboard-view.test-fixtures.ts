import type { PartnerAnalyticsDashboard } from '@/services/partner';

export function buildPartnerDashboardFixture(
  overrides: Partial<PartnerAnalyticsDashboard> = {},
): PartnerAnalyticsDashboard {
  return {
    laundry_id: '00000000-0000-4000-8000-000000000001',
    laundry_name: 'Demo Laundry',
    period: 'week',
    period_label_ist: 'This week (IST)',
    kpis: {
      orders_today: 3,
      orders_yesterday: 2,
      orders_week: 15,
      orders_prev_week: 12,
      orders_month: 42,
      orders_prev_month: 38,
      revenue_today_inr: '1200.00',
      revenue_yesterday_inr: '900.00',
      revenue_week_inr: '8500.00',
      revenue_prev_week_inr: '7200.00',
      revenue_month_inr: '28000.00',
      revenue_prev_month_inr: '25000.00',
    },
    status_snapshot: {
      in_process: 4,
      ready_for_delivery: 2,
      completed: 10,
    },
    chart_series: [
      { bucket_label: 'Mon', current_revenue_inr: '1000.00', previous_revenue_inr: '800.00' },
      { bucket_label: 'Tue', current_revenue_inr: '1200.00', previous_revenue_inr: '900.00' },
    ],
    status_donut: {
      in_process: 4,
      ready: 2,
      completed: 10,
    },
    top_services: [{ name: 'Wash & Iron', order_lines: 12, share_pct: '40.0' }],
    payment_summary: {
      cash_paid_inr: '500.00',
      upi_paid_inr: '300.00',
      wallet_tracked: false,
      pending_inr: '100.00',
    },
    bottom: {
      customers_total: 40,
      customers_new_week: 5,
      customers_repeat: 35,
      avg_order_value_inr: '476.00',
      avg_delivery_minutes: 144,
      avg_rating: '4.70',
      review_count: 2191,
    },
    ...overrides,
  };
}

export function buildEmptyPartnerDashboardFixture(): PartnerAnalyticsDashboard {
  return buildPartnerDashboardFixture({
    laundry_name: 'Empty Shop',
    kpis: {
      orders_today: 0,
      orders_yesterday: 0,
      orders_week: 0,
      orders_prev_week: 0,
      orders_month: 0,
      orders_prev_month: 0,
      revenue_today_inr: '0.00',
      revenue_yesterday_inr: '0.00',
      revenue_week_inr: '0.00',
      revenue_prev_week_inr: '0.00',
      revenue_month_inr: '0.00',
      revenue_prev_month_inr: '0.00',
    },
    status_snapshot: { in_process: 0, ready_for_delivery: 0, completed: 0 },
    chart_series: [],
    status_donut: { in_process: 0, ready: 0, completed: 0 },
    top_services: [],
    payment_summary: {
      cash_paid_inr: '0.00',
      upi_paid_inr: '0.00',
      wallet_tracked: false,
      pending_inr: '0.00',
    },
    bottom: {
      customers_total: 0,
      customers_new_week: 0,
      customers_repeat: 0,
      avg_order_value_inr: '0.00',
      avg_delivery_minutes: null,
      avg_rating: '0.00',
      review_count: 0,
    },
  });
}
