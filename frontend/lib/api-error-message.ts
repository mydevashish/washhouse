import type { AxiosError } from 'axios';

import type { ApiError } from '@/lib/api';
import { getNetworkErrorMessage, isNetworkError } from '@/lib/api-errors';

/** Extract a human-readable message from a failed API call (for UI — do not swallow errors). */
export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (!error || typeof error !== 'object') return fallback;

  // No HTTP response (API down, wrong host, offline) — never leak bare "Network Error".
  if (isNetworkError(error)) {
    return getNetworkErrorMessage();
  }

  const ax = error as AxiosError<{ error?: ApiError }>;
  const apiMsg = ax.response?.data?.error?.message;
  if (apiMsg) return apiMsg;

  const status = ax.response?.status;
  const url = ax.config?.url;
  if (status === 429) {
    return 'Too many requests. Please try again later.';
  }
  if (status && url) return `HTTP ${status} on ${url}`;

  if (ax.code === 'ECONNABORTED' || /timeout/i.test(ax.message ?? '')) {
    return 'Request timed out. Please try again.';
  }

  // Skip cryptic axios defaults already covered above.
  if (ax.message && ax.message !== 'Network Error') return ax.message;
  return fallback;
}
