import type { PartnerAnalyticsDashboardKpis } from '@/services/partner';
import {
  formatKpiDeltaPct,
  kpiGrowth,
  mapPartnerDashboardKpiCards,
  partnerDashboardWelcomeTitle,
} from '@/features/partner/lib/partner-dashboard-kpi-cards';

const zeros: PartnerAnalyticsDashboardKpis = {
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
};

describe('kpiGrowth', () => {
  it('returns null delta when previous is 0 (no fake +0% or 100%)', () => {
    expect(kpiGrowth(10, 0)).toEqual({ deltaPct: null, up: true });
    expect(kpiGrowth(0, 0)).toEqual({ deltaPct: null, up: true });
    expect(formatKpiDeltaPct(null, true)).toBe('—');
  });

  it('computes absolute percent vs previous', () => {
    expect(kpiGrowth(150, 100)).toEqual({ deltaPct: 50, up: true });
    expect(kpiGrowth(10, 20)).toEqual({ deltaPct: 50, up: false });
    expect(formatKpiDeltaPct(50, true)).toBe('+50.0%');
    expect(formatKpiDeltaPct(50, false)).toBe('-50.0%');
  });
});

describe('mapPartnerDashboardKpiCards', () => {
  it('maps six cards with locked labels in order-then-revenue order', () => {
    const cards = mapPartnerDashboardKpiCards({
      ...zeros,
      orders_today: 10,
      orders_yesterday: 20,
      orders_week: 150,
      orders_prev_week: 100,
      orders_month: 1750,
      orders_prev_month: 1000,
      revenue_today_inr: '7500.00',
      revenue_yesterday_inr: '15000.00',
      revenue_week_inr: '30000.00',
      revenue_prev_week_inr: '20000.00',
      revenue_month_inr: '100000.00',
      revenue_prev_month_inr: '150000.00',
    });

    expect(cards).toHaveLength(6);
    expect(cards.map((c) => c.title)).toEqual([
      "Today's Orders",
      'This Week Orders',
      'This Month Orders',
      "Today's Revenue",
      'This Week Revenue',
      'This Month Revenue',
    ]);
    expect(cards[0]).toMatchObject({
      kind: 'orders',
      value: 10,
      previous: 20,
      currentLabel: 'Today',
      previousLabel: 'Yesterday',
      deltaPct: 50,
      up: false,
    });
    expect(cards[3]).toMatchObject({
      kind: 'revenue',
      value: 7500,
      previous: 15000,
      deltaPct: 50,
      up: false,
    });
    expect(cards[1]?.deltaPct).toBe(50);
    expect(cards[1]?.up).toBe(true);
    expect(cards[0]?.accent).toContain('dark:bg-indigo-950/50');
    expect(cards[1]?.accent).toContain('dark:bg-sky-950/50');
    expect(cards[2]?.accent).toContain('dark:bg-emerald-950/50');
    expect(cards[3]?.accent).toContain('bg-gradient-to-br');
  });

  it('zeros stay zeros with em-dash growth', () => {
    const cards = mapPartnerDashboardKpiCards(zeros);
    expect(cards.every((c) => c.value === 0 && c.previous === 0 && c.deltaPct === null)).toBe(true);
  });
});

describe('partnerDashboardWelcomeTitle', () => {
  it('prefers laundry name from the dashboard API', () => {
    expect(partnerDashboardWelcomeTitle('Sunrise Wash', 'Anita')).toBe('Welcome, Sunrise Wash');
  });

  it('falls back to user full_name when laundry name is empty', () => {
    expect(partnerDashboardWelcomeTitle('', 'Anita Sharma')).toBe('Welcome, Anita Sharma');
    expect(partnerDashboardWelcomeTitle('  ', '  ')).toBe('Welcome');
    expect(partnerDashboardWelcomeTitle(null, null)).toBe('Welcome');
  });
});
