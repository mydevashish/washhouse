import type { AxiosError } from 'axios';

/** Shared stale times (ms) for TanStack Query. */

export const STALE = {
  /** Discovery lists change infrequently during a session. */
  laundries: 5 * 60_000,
  laundrySearch: 30_000,
  laundryDetail: 2 * 60_000,
  reviews: 2 * 60_000,
  orders: 30_000,
  orderTracking: 15_000,
  addresses: 60_000,
  partnerAnalytics: 60_000,
  adminDashboard: 60_000,
} as const;

/** Longer timeout for public discovery lists (Render cold start). */
export const DISCOVERY_API_TIMEOUT_MS = 60_000;

/** Retry network/timeout failures while a hosted API wakes from sleep. */
export function discoveryQueryRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  const axiosError = error as AxiosError;
  return !axiosError.response;
}

export function discoveryQueryRetryDelay(attempt: number): number {
  return Math.min(2_000 * 2 ** attempt, 15_000);
}
