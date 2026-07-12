import axios from 'axios';

import { env } from '@/lib/env';

/** Axios failed before receiving an HTTP response (wrong host/port, API down, offline). */
export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response === undefined;
}

export function getNetworkErrorMessage(): string {
  return `Cannot reach API at ${env.NEXT_PUBLIC_API_URL}. Ensure the backend is running and the port matches backend PORT in .env.`;
}
