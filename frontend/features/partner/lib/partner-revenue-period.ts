/**
 * IST period helpers for partner Revenue view (?period= on analytics/summary).
 */

import {
  isValidCustomReportsRange,
  resolvePartnerReportsDateRange,
  type PartnerReportsDateRange,
} from '@/features/partner/lib/partner-reports-period';

export type PartnerRevenuePeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export const PARTNER_REVENUE_PERIOD_OPTIONS: ReadonlyArray<{
  value: PartnerRevenuePeriod;
  label: string;
}> = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

export function resolvePartnerRevenueCustomRange(
  customFrom: string,
  customTo: string,
  now: Date = new Date(),
): PartnerReportsDateRange {
  return resolvePartnerReportsDateRange('custom', customFrom, customTo, now);
}

export { isValidCustomReportsRange };
