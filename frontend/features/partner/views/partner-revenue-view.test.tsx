import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PartnerRevenueView } from '@/features/partner/views/partner-revenue-view';
import type { PartnerAnalytics, PartnerRevenuePeriod } from '@/services/partner';

const getPartnerAnalytics = jest.fn();
const usePartnerQueriesEnabled = jest.fn(() => true);

jest.mock('@/services/partner', () => ({
  getPartnerAnalytics: (...args: unknown[]) => getPartnerAnalytics(...args),
}));

jest.mock('@/features/partner/hooks/use-partner-operations', () => ({
  usePartnerQueriesEnabled: () => usePartnerQueriesEnabled(),
  usePartnerRevenueAnalytics: (
    period: PartnerRevenuePeriod,
    customRange?: { date_from: string; date_to: string },
  ) => {
    const enabled = usePartnerQueriesEnabled();
    if (enabled) {
      void getPartnerAnalytics(
        period === 'custom' && customRange
          ? { period, ...customRange }
          : { period },
      );
    }
    const net = period === 'week' ? '900.00' : '85.00';
    const gross = period === 'week' ? '1000.00' : '100.00';
    return {
      data: buildAnalytics(net, gross, period),
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    };
  },
}));

jest.mock('next/dynamic', () => () => () => null);

function buildAnalytics(
  net: string,
  gross: string,
  period: PartnerRevenuePeriod = 'today',
): PartnerAnalytics {
  return {
    laundry_id: 'laundry-1',
    laundry_name: 'Test Laundry',
    avg_rating: '4.50',
    review_count: 1,
    orders_total: 1,
    orders_today: 0,
    orders_pending: 0,
    orders_in_progress: 0,
    orders_ready: 0,
    pickup_requests: 0,
    orders_delivered: 1,
    customers_count: 1,
    revenue_inr: gross,
    revenue_today_inr: gross,
    revenue_this_month_inr: gross,
    revenue_week_inr: gross,
    revenue_yesterday_inr: '0.00',
    revenue_prev_week_inr: '0.00',
    revenue_prev_month_inr: '0.00',
    growth_today_pct: null,
    growth_week_pct: null,
    growth_month_pct: null,
    effective_commission_rate: '10.00',
    commission_today_inr: '0.00',
    commission_week_inr: '0.00',
    commission_month_inr: '0.00',
    partner_net_today_inr: net,
    partner_net_week_inr: net,
    partner_net_month_inr: net,
    revenue_walk_in_today_inr: gross,
    revenue_doorstep_today_inr: '0.00',
    revenue_walk_in_week_inr: gross,
    revenue_doorstep_week_inr: '0.00',
    revenue_walk_in_month_inr: gross,
    revenue_doorstep_month_inr: '0.00',
    period_scope: {
      period,
      period_label_ist: period === 'week' ? 'This week' : 'Today',
      date_from: null,
      date_to: null,
      revenue_gross_inr: gross,
      commission_inr: '0.00',
      partner_net_inr: net,
      revenue_walk_in_inr: gross,
      revenue_doorstep_inr: '0.00',
      growth_pct: null,
      prior_period_label: period === 'week' ? 'last week' : 'yesterday',
      chart_series: [{ bucket_label: '09:00', revenue_gross_inr: gross, partner_net_inr: net }],
    },
  };
}

describe('PartnerRevenueView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-15T12:00:00+05:30'));
    getPartnerAnalytics.mockClear();
    usePartnerQueriesEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('requests analytics with the selected period', async () => {
    render(<PartnerRevenueView />);

    await waitFor(() => {
      expect(getPartnerAnalytics).toHaveBeenCalledWith({ period: 'today' });
    });

    fireEvent.click(screen.getByTestId('partner-revenue-period-week'));

    await waitFor(() => {
      expect(getPartnerAnalytics).toHaveBeenCalledWith({ period: 'week' });
    });
  });

  it('updates displayed net when switching period', async () => {
    render(<PartnerRevenueView />);

    await waitFor(() => {
      expect(screen.getByTestId('partner-revenue-net')).toHaveTextContent('₹85');
    });

    fireEvent.click(screen.getByTestId('partner-revenue-period-week'));

    await waitFor(() => {
      expect(screen.getByTestId('partner-revenue-net')).toHaveTextContent('₹900');
    });
  });
});
