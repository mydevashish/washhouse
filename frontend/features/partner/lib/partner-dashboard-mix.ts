import { formatInr } from '@/features/discover/detail/order-pricing';
import { parseDashboardInr } from '@/features/partner/lib/partner-dashboard-kpi-cards';
import type {
  PartnerAnalyticsDashboardPaymentSummary,
  PartnerAnalyticsDashboardTopService,
} from '@/services/partner';

export const PARTNER_DASHBOARD_SERVICES_HREF = '/partner/services';
export const PARTNER_DASHBOARD_PAYMENTS_VIEW_ALL_HREF = '/partner/revenue';

export type PartnerDashboardTopServiceRow = {
  name: string;
  orderLines: number;
  linesLabel: string;
  sharePct: number;
  shareLabel: string;
};

export type PartnerDashboardPaymentRow = {
  key: 'cash' | 'upi' | 'wallet' | 'pending';
  label: string;
  value: string;
  hint: string | null;
  tone: string;
};

/** Wallet is not a payment_method. Never format ₹ when untracked. */
export function formatDashboardWalletDisplay(
  walletTracked: boolean,
  amountInr?: string,
): { value: string; hint: string | null } {
  if (!walletTracked) {
    return { value: '—', hint: 'Not tracked' };
  }
  if (amountInr == null || amountInr === '') {
    return { value: '—', hint: 'Not tracked' };
  }
  return { value: formatInr(parseDashboardInr(amountInr)), hint: null };
}

export function mapPartnerDashboardTopServices(
  items: PartnerAnalyticsDashboardTopService[] | undefined,
): PartnerDashboardTopServiceRow[] {
  return (items ?? []).map((item) => {
    const parsed = Number(item.share_pct);
    const sharePct = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
    return {
      name: item.name,
      orderLines: item.order_lines,
      linesLabel: `${item.order_lines.toLocaleString('en-IN')} Orders`,
      sharePct,
      shareLabel: `${sharePct.toFixed(1)}%`,
    };
  });
}

export function mapPartnerDashboardPaymentRows(
  summary: PartnerAnalyticsDashboardPaymentSummary,
): PartnerDashboardPaymentRow[] {
  const wallet = formatDashboardWalletDisplay(summary.wallet_tracked);
  return [
    {
      key: 'cash',
      label: 'Cash',
      value: formatInr(parseDashboardInr(summary.cash_paid_inr)),
      hint: null,
      tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      key: 'upi',
      label: 'UPI',
      value: formatInr(parseDashboardInr(summary.upi_paid_inr)),
      hint: null,
      tone: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    },
    {
      key: 'wallet',
      label: 'Wallet',
      value: wallet.value,
      hint: wallet.hint,
      tone: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300',
    },
    {
      key: 'pending',
      label: 'Pending Payments',
      value: formatInr(parseDashboardInr(summary.pending_inr)),
      hint: null,
      tone: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    },
  ];
}
