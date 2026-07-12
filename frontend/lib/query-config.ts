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
