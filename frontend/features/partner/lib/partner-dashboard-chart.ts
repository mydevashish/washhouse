import { parseDashboardInr } from '@/features/partner/lib/partner-dashboard-kpi-cards';
import type {
  PartnerAnalyticsDashboardChartPoint,
  PartnerAnalyticsDashboardPeriod,
} from '@/services/partner';

export type PartnerDashboardChartPoint = {
  label: string;
  current: number;
  previous: number;
};

export const CHART_PREVIOUS_PERIOD_LABEL: Record<PartnerAnalyticsDashboardPeriod, string> = {
  today: 'Yesterday',
  week: 'Last Week',
  month: 'Last Month',
  year: 'Last Year',
};

export function mapPartnerDashboardChartSeries(
  series: PartnerAnalyticsDashboardChartPoint[] | undefined,
): PartnerDashboardChartPoint[] {
  return (series ?? []).map((point) => ({
    label: point.bucket_label,
    current: parseDashboardInr(point.current_revenue_inr),
    previous: parseDashboardInr(point.previous_revenue_inr),
  }));
}

export function sumChartSeries(
  points: PartnerDashboardChartPoint[],
  key: 'current' | 'previous',
): number {
  return points.reduce((sum, point) => sum + point[key], 0);
}

export type PartnerDashboardChartTheme = {
  gridStroke: string;
  axisTickFill: string;
  tooltip: {
    borderColor: string;
    backgroundColor: string;
    color: string;
  };
};

/** Recharts SVG props do not inherit Tailwind tokens — use explicit light/dark colors. */
export function getChartTheme(isDark: boolean): PartnerDashboardChartTheme {
  if (isDark) {
    return {
      gridStroke: '#334155',
      axisTickFill: '#94a3b8',
      tooltip: {
        borderColor: '#334155',
        backgroundColor: '#111827',
        color: '#f1f5f9',
      },
    };
  }

  return {
    gridStroke: '#dbeafe',
    axisTickFill: '#64748b',
    tooltip: {
      borderColor: '#e2e8f0',
      backgroundColor: '#ffffff',
      color: '#0f172a',
    },
  };
}
