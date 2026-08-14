import { buildPartnerOrdersQueuePath } from '@/features/partner/orders-hub/partner-orders-hub-queue';
import type {
  PartnerAnalyticsDashboardPeriod,
  PartnerAnalyticsDashboardStatusDonut,
  PartnerAnalyticsDashboardStatusSnapshot,
} from '@/services/partner';

export type PartnerDashboardStatusCardKey = 'in_process' | 'ready_for_delivery' | 'completed';

export type PartnerDashboardStatusCard = {
  key: PartnerDashboardStatusCardKey;
  label: string;
  value: number;
  tone: 'blue' | 'green' | 'teal';
  href: string;
};

export type PartnerLaundryDashboardChartChip = 'Today' | 'Week' | 'Month' | 'Year';

export type PartnerDashboardDonutSlice = {
  key: 'in_process' | 'ready' | 'completed';
  label: string;
  value: number;
  percentage: number;
  tone: 'blue' | 'green' | 'teal';
  color: string;
};

const DONUT_COLORS = {
  blue: '#3b82f6',
  green: '#10b981',
  teal: '#14b8a6',
} as const;

/**
 * Canonical Prompt 0 hrefs. Hub has no in-process chip — do not add one.
 * Ready card count includes `out_for_delivery`; href is `status=ready` only.
 */
export function partnerDashboardStatusViewAllHref(key: PartnerDashboardStatusCardKey): string {
  switch (key) {
    case 'in_process':
      return buildPartnerOrdersQueuePath({ chip: null });
    case 'ready_for_delivery':
      return '/partner/orders?status=ready';
    case 'completed':
      return '/partner/orders?status=delivered';
  }
}

export function chartChipToDashboardPeriod(
  chip: PartnerLaundryDashboardChartChip,
): PartnerAnalyticsDashboardPeriod {
  switch (chip) {
    case 'Today':
      return 'today';
    case 'Week':
      return 'week';
    case 'Month':
      return 'month';
    case 'Year':
      return 'year';
  }
}

export function dashboardPeriodToChartChip(
  period: PartnerAnalyticsDashboardPeriod,
): PartnerLaundryDashboardChartChip {
  switch (period) {
    case 'today':
      return 'Today';
    case 'week':
      return 'Week';
    case 'month':
      return 'Month';
    case 'year':
      return 'Year';
  }
}

export function mapPartnerDashboardStatusCards(
  snapshot: PartnerAnalyticsDashboardStatusSnapshot,
): PartnerDashboardStatusCard[] {
  return [
    {
      key: 'in_process',
      label: 'In Process Orders',
      value: snapshot.in_process,
      tone: 'blue',
      href: partnerDashboardStatusViewAllHref('in_process'),
    },
    {
      key: 'ready_for_delivery',
      label: 'Ready for Delivery',
      value: snapshot.ready_for_delivery,
      tone: 'green',
      href: partnerDashboardStatusViewAllHref('ready_for_delivery'),
    },
    {
      key: 'completed',
      label: 'Completed Orders',
      value: snapshot.completed,
      tone: 'teal',
      href: partnerDashboardStatusViewAllHref('completed'),
    },
  ];
}

export function mapPartnerDashboardDonut(donut: PartnerAnalyticsDashboardStatusDonut): {
  total: number;
  isEmpty: boolean;
  slices: PartnerDashboardDonutSlice[];
  gradient: string;
} {
  const raw: Array<Omit<PartnerDashboardDonutSlice, 'percentage'>> = [
    {
      key: 'in_process',
      label: 'In Process',
      value: donut.in_process,
      tone: 'blue',
      color: DONUT_COLORS.blue,
    },
    {
      key: 'ready',
      label: 'Ready',
      value: donut.ready,
      tone: 'green',
      color: DONUT_COLORS.green,
    },
    {
      key: 'completed',
      label: 'Completed',
      value: donut.completed,
      tone: 'teal',
      color: DONUT_COLORS.teal,
    },
  ];
  const total = raw.reduce((sum, slice) => sum + slice.value, 0);
  const slices: PartnerDashboardDonutSlice[] = raw.map((slice) => ({
    ...slice,
    percentage: total ? (slice.value / total) * 100 : 0,
  }));
  const gradient = slices.reduce<{ acc: string; cumulative: number }>(
    (result, item) => {
      const start = result.cumulative;
      const end = result.cumulative + item.percentage;
      const nextSegment = `${item.color} ${start}% ${end}%`;
      return { acc: result.acc ? `${result.acc}, ${nextSegment}` : nextSegment, cumulative: end };
    },
    { acc: '', cumulative: 0 },
  ).acc;

  return { total, isEmpty: total === 0, slices, gradient };
}
