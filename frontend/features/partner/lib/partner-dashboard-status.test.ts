import { partnerDashboardRecentOrdersViewAllHref } from '@/features/partner/dashboard/partner-dashboard-recent-orders-filter';
import {
  chartChipToDashboardPeriod,
  dashboardPeriodToChartChip,
  mapPartnerDashboardDonut,
  mapPartnerDashboardStatusCards,
  partnerDashboardStatusViewAllHref,
} from '@/features/partner/lib/partner-dashboard-status';

describe('partnerDashboardStatusViewAllHref', () => {
  it('uses locked hub hrefs and does not invent an in-process chip', () => {
    expect(partnerDashboardStatusViewAllHref('in_process')).toBe('/partner/orders');
    expect(partnerDashboardStatusViewAllHref('in_process')).toBe(
      partnerDashboardRecentOrdersViewAllHref('all'),
    );
    expect(partnerDashboardStatusViewAllHref('ready_for_delivery')).toBe(
      '/partner/orders?status=ready',
    );
    expect(partnerDashboardStatusViewAllHref('completed')).toBe(
      '/partner/orders?status=delivered',
    );
    expect(partnerDashboardStatusViewAllHref('in_process')).not.toContain('chip=');
    expect(partnerDashboardStatusViewAllHref('ready_for_delivery')).not.toContain('chip=');
  });
});

describe('mapPartnerDashboardStatusCards', () => {
  it('maps snapshot buckets without putting ready inside In Process', () => {
    const cards = mapPartnerDashboardStatusCards({
      in_process: 3,
      ready_for_delivery: 7,
      completed: 11,
    });
    expect(cards.map((c) => c.key)).toEqual([
      'in_process',
      'ready_for_delivery',
      'completed',
    ]);
    expect(cards[0]).toMatchObject({
      label: 'In Process Orders',
      value: 3,
      href: '/partner/orders',
    });
    expect(cards[1]).toMatchObject({
      label: 'Ready for Delivery',
      value: 7,
      href: '/partner/orders?status=ready',
    });
    expect(cards[2]).toMatchObject({
      label: 'Completed Orders',
      value: 11,
      href: '/partner/orders?status=delivered',
    });
    expect(cards[0]?.value).not.toBe(cards[1]?.value);
  });
});

describe('mapPartnerDashboardDonut', () => {
  it('sums three slices and computes share vs that total', () => {
    const mapped = mapPartnerDashboardDonut({ in_process: 2, ready: 2, completed: 6 });
    expect(mapped.total).toBe(10);
    expect(mapped.isEmpty).toBe(false);
    expect(mapped.slices.map((s) => s.label)).toEqual(['In Process', 'Ready', 'Completed']);
    expect(mapped.slices[2]?.percentage).toBe(60);
  });

  it('treats all-zero as empty (no fake pie)', () => {
    const mapped = mapPartnerDashboardDonut({ in_process: 0, ready: 0, completed: 0 });
    expect(mapped.total).toBe(0);
    expect(mapped.isEmpty).toBe(true);
  });
});

describe('chartChipToDashboardPeriod', () => {
  it('maps franchise chips onto dashboard API periods', () => {
    expect(chartChipToDashboardPeriod('Today')).toBe('today');
    expect(chartChipToDashboardPeriod('Week')).toBe('week');
    expect(chartChipToDashboardPeriod('Month')).toBe('month');
    expect(chartChipToDashboardPeriod('Year')).toBe('year');
    expect(dashboardPeriodToChartChip('week')).toBe('Week');
    expect(dashboardPeriodToChartChip('year')).toBe('Year');
  });
});
