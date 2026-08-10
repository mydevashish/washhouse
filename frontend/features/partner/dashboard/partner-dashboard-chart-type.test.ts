import {
  PARTNER_DASHBOARD_CHART_TYPE_KEY,
  readPartnerDashboardChartType,
} from '@/features/partner/dashboard/partner-dashboard-chart-type';

describe('partner dashboard chart type', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to bar when unset', () => {
    expect(readPartnerDashboardChartType()).toBe('bar');
  });

  it('persists valid chart type from localStorage', () => {
    window.localStorage.setItem(PARTNER_DASHBOARD_CHART_TYPE_KEY, 'area');
    expect(readPartnerDashboardChartType()).toBe('area');
  });

  it('falls back to bar for invalid stored value', () => {
    window.localStorage.setItem(PARTNER_DASHBOARD_CHART_TYPE_KEY, 'scatter');
    expect(readPartnerDashboardChartType()).toBe('bar');
  });
});
