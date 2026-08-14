import { formatInr } from '@/features/discover/detail/order-pricing';
import { parseDashboardInr } from '@/features/partner/lib/partner-dashboard-kpi-cards';
import type { PartnerAnalyticsDashboardBottom } from '@/services/partner';

export type PartnerDashboardBottomStatKey =
  | 'customers_total'
  | 'customers_new_week'
  | 'customers_repeat'
  | 'avg_order_value'
  | 'avg_delivery'
  | 'customer_rating';

export type PartnerDashboardBottomStatIcon = 'users' | 'shirt' | 'truck' | 'star';

export type PartnerDashboardBottomStat = {
  key: PartnerDashboardBottomStatKey;
  label: string;
  value: string;
  /** Muted footnote (review count, “This week”) — never a fake growth %. */
  subtitle: string | null;
  icon: PartnerDashboardBottomStatIcon;
};

const EMPTY_BOTTOM: PartnerAnalyticsDashboardBottom = {
  customers_total: 0,
  customers_new_week: 0,
  customers_repeat: 0,
  avg_order_value_inr: '0.00',
  avg_delivery_minutes: null,
  avg_rating: '0.00',
  review_count: 0,
};

/** Minutes → “X.X hrs” or em dash when unknown. */
export function formatDashboardAvgDeliveryHours(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return '—';
  return `${(minutes / 60).toFixed(1)} hrs`;
}

export function formatDashboardRatingDisplay(avgRating: string | null | undefined): string {
  const n = Number(avgRating);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${n.toFixed(1)} / 5`;
}

export function formatDashboardReviewCountSubtitle(reviewCount: number): string | null {
  if (reviewCount <= 0) return null;
  return reviewCount.toLocaleString('en-IN');
}

export function mapPartnerDashboardBottomStats(
  bottom: PartnerAnalyticsDashboardBottom | undefined,
): PartnerDashboardBottomStat[] {
  const b = bottom ?? EMPTY_BOTTOM;

  return [
    {
      key: 'customers_total',
      label: 'Total Customers',
      value: b.customers_total.toLocaleString('en-IN'),
      subtitle: null,
      icon: 'users',
    },
    {
      key: 'customers_new_week',
      label: 'New Customers',
      value: b.customers_new_week.toLocaleString('en-IN'),
      subtitle: 'This week',
      icon: 'users',
    },
    {
      key: 'customers_repeat',
      label: 'Repeat Customers',
      value: b.customers_repeat.toLocaleString('en-IN'),
      subtitle: null,
      icon: 'users',
    },
    {
      key: 'avg_order_value',
      label: 'Average Order Value',
      value: formatInr(parseDashboardInr(b.avg_order_value_inr)),
      subtitle: null,
      icon: 'shirt',
    },
    {
      key: 'avg_delivery',
      label: 'Avg. Delivery Time',
      value: formatDashboardAvgDeliveryHours(b.avg_delivery_minutes),
      subtitle: null,
      icon: 'truck',
    },
    {
      key: 'customer_rating',
      label: 'Customer Rating',
      value: formatDashboardRatingDisplay(b.avg_rating),
      subtitle: formatDashboardReviewCountSubtitle(b.review_count),
      icon: 'star',
    },
  ];
}
