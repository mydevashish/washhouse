import type { AxiosError } from 'axios';

import type { ApiError } from '@/lib/api';

/** Extract a human-readable message from a failed API call (for UI — do not swallow errors). */
export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (!error || typeof error !== 'object') return fallback;
  const ax = error as AxiosError<{ error?: ApiError }>;
  const apiMsg = ax.response?.data?.error?.message;
  if (apiMsg) return apiMsg;
  const status = ax.response?.status;
  const url = ax.config?.url;
  if (status && url) return `HTTP ${status} on ${url}`;
  if (ax.message) return ax.message;
  return fallback;
}
