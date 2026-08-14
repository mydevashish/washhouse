import {
  CHART_PREVIOUS_PERIOD_LABEL,
  getChartTheme,
  mapPartnerDashboardChartSeries,
  sumChartSeries,
} from '@/features/partner/lib/partner-dashboard-chart';
import { formatKpiDeltaPct, kpiGrowth } from '@/features/partner/lib/partner-dashboard-kpi-cards';

describe('mapPartnerDashboardChartSeries', () => {
  it('maps INR strings onto Recharts current/previous points', () => {
    const points = mapPartnerDashboardChartSeries([
      { bucket_label: 'Mon', current_revenue_inr: '42000.00', previous_revenue_inr: '36000.00' },
      { bucket_label: 'Tue', current_revenue_inr: '100.50', previous_revenue_inr: '0.00' },
    ]);
    expect(points).toEqual([
      { label: 'Mon', current: 42000, previous: 36000 },
      { label: 'Tue', current: 100.5, previous: 0 },
    ]);
    expect(sumChartSeries(points, 'current')).toBe(42100.5);
    expect(sumChartSeries(points, 'previous')).toBe(36000);
  });

  it('keeps 12 year buckets and 5 month weeks', () => {
    const year = mapPartnerDashboardChartSeries(
      Array.from({ length: 12 }, (_, i) => ({
        bucket_label: `M${i + 1}`,
        current_revenue_inr: '0.00',
        previous_revenue_inr: '0.00',
      })),
    );
    expect(year).toHaveLength(12);
    const month = mapPartnerDashboardChartSeries(
      ['W1', 'W2', 'W3', 'W4', 'W5'].map((label) => ({
        bucket_label: label,
        current_revenue_inr: '1.00',
        previous_revenue_inr: '0.00',
      })),
    );
    expect(month.map((p) => p.label)).toEqual(['W1', 'W2', 'W3', 'W4', 'W5']);
  });

  it('empty series stays empty (no invented buckets)', () => {
    expect(mapPartnerDashboardChartSeries(undefined)).toEqual([]);
    expect(mapPartnerDashboardChartSeries([])).toEqual([]);
  });
});

describe('getChartTheme', () => {
  it('returns light palette by default and dark palette when requested', () => {
    expect(getChartTheme(false).gridStroke).toBe('#dbeafe');
    expect(getChartTheme(false).axisTickFill).toBe('#64748b');
    expect(getChartTheme(true).gridStroke).toBe('#334155');
    expect(getChartTheme(true).axisTickFill).toBe('#94a3b8');
    expect(getChartTheme(true).tooltip.backgroundColor).toBe('#111827');
  });
});

describe('chart comparison from summed series', () => {
  it('does not invent growth when previous total is 0', () => {
    expect(kpiGrowth(500, 0).deltaPct).toBeNull();
    expect(formatKpiDeltaPct(null, true)).toBe('—');
    expect(CHART_PREVIOUS_PERIOD_LABEL.week).toBe('Last Week');
    expect(CHART_PREVIOUS_PERIOD_LABEL.year).toBe('Last Year');
  });
});
