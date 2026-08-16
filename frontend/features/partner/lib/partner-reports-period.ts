/**
 * IST date ranges for partner Reports CSV exports.
 * Mirrors backend partner_analytics_period calendar windows.
 */

import { kolkataDayKey } from '@/features/partner/lib/partner-recent-customers';

export type PartnerReportsPeriod = 'week' | 'month' | 'year' | 'custom';

export type PartnerReportsDateRange = {
  date_from: string;
  date_to: string;
  label: string;
  slug: string;
};

export const PARTNER_REPORTS_PERIOD_OPTIONS: ReadonlyArray<{
  value: PartnerReportsPeriod;
  label: string;
}> = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom' },
];

/** High page_size cap when date filters are set — matches backend export limit. */
export const PARTNER_ORDERS_EXPORT_PAGE_SIZE = 5000;

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const parts = ymd.split('-').map(Number);
  return { y: parts[0] ?? 0, m: parts[1] ?? 0, d: parts[2] ?? 0 };
}

function ymdFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/** Add calendar days in IST (ymd strings). */
export function addIstDays(ymd: string, days: number): string {
  const anchor = new Date(`${ymd}T12:00:00+05:30`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return kolkataDayKey(anchor);
}

/** ISO weekday in IST: 0 = Monday … 6 = Sunday. */
function istIsoWeekday(ymd: string): number {
  const jsDay = new Date(`${ymd}T12:00:00+05:30`).getUTCDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function mondayOfIstWeek(todayYmd: string): string {
  return addIstDays(todayYmd, -istIsoWeekday(todayYmd));
}

function monthStartYmd(todayYmd: string): string {
  const { y, m } = parseYmd(todayYmd);
  return ymdFromParts(y, m, 1);
}

function monthEndYmd(todayYmd: string): string {
  const { y, m } = parseYmd(todayYmd);
  return ymdFromParts(y, m, daysInMonth(y, m));
}

function yearStartYmd(todayYmd: string): string {
  const { y } = parseYmd(todayYmd);
  return ymdFromParts(y, 1, 1);
}

function yearEndYmd(todayYmd: string): string {
  const { y } = parseYmd(todayYmd);
  return ymdFromParts(y, 12, 31);
}

export function reportsRangeSlug(dateFrom: string, dateTo: string): string {
  return `${dateFrom}_${dateTo}`;
}

export function resolvePartnerReportsDateRange(
  period: PartnerReportsPeriod,
  customFrom?: string,
  customTo?: string,
  now: Date = new Date(),
): PartnerReportsDateRange {
  const today = kolkataDayKey(now);

  if (period === 'custom') {
    const date_from = customFrom?.slice(0, 10) ?? today;
    const date_to = customTo?.slice(0, 10) ?? today;
    return {
      date_from,
      date_to,
      label: `${date_from} – ${date_to} (IST)`,
      slug: reportsRangeSlug(date_from, date_to),
    };
  }

  if (period === 'week') {
    const date_from = mondayOfIstWeek(today);
    const date_to = addIstDays(date_from, 6);
    return {
      date_from,
      date_to,
      label: `This week (${date_from} – ${date_to}, IST)`,
      slug: reportsRangeSlug(date_from, date_to),
    };
  }

  if (period === 'month') {
    const date_from = monthStartYmd(today);
    const date_to = monthEndYmd(today);
    return {
      date_from,
      date_to,
      label: `This month (${date_from} – ${date_to}, IST)`,
      slug: reportsRangeSlug(date_from, date_to),
    };
  }

  const date_from = yearStartYmd(today);
  const date_to = yearEndYmd(today);
  return {
    date_from,
    date_to,
    label: `This year (${parseYmd(today).y}, IST)`,
    slug: reportsRangeSlug(date_from, date_to),
  };
}

export function isValidCustomReportsRange(customFrom: string, customTo: string): boolean {
  if (!customFrom || !customTo) return false;
  return customFrom.slice(0, 10) <= customTo.slice(0, 10);
}
