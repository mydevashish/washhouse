import type { PartnerAnalyticsDashboardKpis } from '@/services/partner';

export type PartnerDashboardKpiKind = 'orders' | 'revenue';

export type PartnerDashboardKpiCard = {
  kind: PartnerDashboardKpiKind;
  title: string;
  value: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
  accent: string;
  /** Null when previous is 0 — UI must show "—" not +0% or fake 100%. */
  deltaPct: number | null;
  up: boolean;
};

export function parseDashboardInr(value: string | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function kpiGrowth(current: number, previous: number): { deltaPct: number | null; up: boolean } {
  if (previous === 0) return { deltaPct: null, up: true };
  const diff = ((current - previous) / previous) * 100;
  return { deltaPct: Math.abs(diff), up: diff >= 0 };
}

export function formatKpiDeltaPct(deltaPct: number | null, up: boolean): string {
  if (deltaPct === null) return '—';
  return `${up ? '+' : '-'}${deltaPct.toFixed(1)}%`;
}

/** Welcome heading. Never invent a shop name. */
export function partnerDashboardWelcomeTitle(
  laundryName: string | null | undefined,
  userFullName: string | null | undefined,
): string {
  const name = (laundryName ?? '').trim() || (userFullName ?? '').trim();
  if (!name) return 'Welcome';
  return `Welcome, ${name}`;
}

const ORDER_ACCENTS = {
  today: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300',
  week: 'bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
  month: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
} as const;

const REVENUE_ACCENTS = {
  today: 'bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#4f46e5] text-white',
  week: 'bg-gradient-to-br from-[#8b5cf6] via-[#6366f1] to-[#4f46e5] text-white',
  month: 'bg-gradient-to-br from-[#7c3aed] via-[#5b4df7] to-[#4338ca] text-white',
} as const;

export function mapPartnerDashboardKpiCards(kpis: PartnerAnalyticsDashboardKpis): PartnerDashboardKpiCard[] {
  const ordersToday = kpis.orders_today;
  const ordersYesterday = kpis.orders_yesterday;
  const ordersWeek = kpis.orders_week;
  const ordersPrevWeek = kpis.orders_prev_week;
  const ordersMonth = kpis.orders_month;
  const ordersPrevMonth = kpis.orders_prev_month;
  const revenueToday = parseDashboardInr(kpis.revenue_today_inr);
  const revenueYesterday = parseDashboardInr(kpis.revenue_yesterday_inr);
  const revenueWeek = parseDashboardInr(kpis.revenue_week_inr);
  const revenuePrevWeek = parseDashboardInr(kpis.revenue_prev_week_inr);
  const revenueMonth = parseDashboardInr(kpis.revenue_month_inr);
  const revenuePrevMonth = parseDashboardInr(kpis.revenue_prev_month_inr);

  const orderCards: PartnerDashboardKpiCard[] = [
    {
      kind: 'orders',
      title: "Today's Orders",
      value: ordersToday,
      previous: ordersYesterday,
      currentLabel: 'Today',
      previousLabel: 'Yesterday',
      accent: ORDER_ACCENTS.today,
      ...kpiGrowth(ordersToday, ordersYesterday),
    },
    {
      kind: 'orders',
      title: 'This Week Orders',
      value: ordersWeek,
      previous: ordersPrevWeek,
      currentLabel: 'This Week',
      previousLabel: 'Last Week',
      accent: ORDER_ACCENTS.week,
      ...kpiGrowth(ordersWeek, ordersPrevWeek),
    },
    {
      kind: 'orders',
      title: 'This Month Orders',
      value: ordersMonth,
      previous: ordersPrevMonth,
      currentLabel: 'This Month',
      previousLabel: 'Last Month',
      accent: ORDER_ACCENTS.month,
      ...kpiGrowth(ordersMonth, ordersPrevMonth),
    },
  ];

  const revenueCards: PartnerDashboardKpiCard[] = [
    {
      kind: 'revenue',
      title: "Today's Revenue",
      value: revenueToday,
      previous: revenueYesterday,
      currentLabel: 'Today',
      previousLabel: 'Yesterday',
      accent: REVENUE_ACCENTS.today,
      ...kpiGrowth(revenueToday, revenueYesterday),
    },
    {
      kind: 'revenue',
      title: 'This Week Revenue',
      value: revenueWeek,
      previous: revenuePrevWeek,
      currentLabel: 'This Week',
      previousLabel: 'Last Week',
      accent: REVENUE_ACCENTS.week,
      ...kpiGrowth(revenueWeek, revenuePrevWeek),
    },
    {
      kind: 'revenue',
      title: 'This Month Revenue',
      value: revenueMonth,
      previous: revenuePrevMonth,
      currentLabel: 'This Month',
      previousLabel: 'Last Month',
      accent: REVENUE_ACCENTS.month,
      ...kpiGrowth(revenueMonth, revenuePrevMonth),
    },
  ];

  return [...orderCards, ...revenueCards];
}
