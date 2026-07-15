import axios, { type AxiosError, type AxiosResponse } from 'axios';
import { env } from './env';
import { logger } from './logger';
import {
  extractServerInstanceId,
  isServerInstanceMismatch,
  readStoredServerInstanceId,
  storeServerInstanceId,
} from '@/lib/session-instance';

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; issue: string }>;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: { request_id: string; timestamp: string; pagination?: unknown };
}

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let getAccessToken: () => string | null = () => null;
export function setAccessTokenGetter(fn: () => string | null) {
  getAccessToken = fn;
}

let onApiActivity: (() => void) | null = null;
export function setApiActivityCallback(fn: () => void) {
  onApiActivity = fn;
}

let handlingSessionInvalidation = false;
let refreshInFlight: Promise<string | null> | null = null;

const RETRIABLE_AUTH_CODES = new Set(['AUTH_TOKEN_EXPIRED', 'AUTH_FAILED']);

async function refreshAccessTokenOnce(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const { refreshSession } = await import('@/services/auth');
        const { useAuthStore } = await import('@/store/auth.store');
        const tokens = await refreshSession();
        useAuthStore.getState().setAccessToken(tokens.access_token);
        return tokens.access_token;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function handleResponseHeaders(response: AxiosResponse) {
  const instanceId = extractServerInstanceId(response.headers as Record<string, unknown>);
  if (!instanceId) return;

  const url = String(response.config?.url ?? '');

  if (getAccessToken()) {
    if (isServerInstanceMismatch(instanceId)) {
      if (handlingSessionInvalidation) return;
      handlingSessionInvalidation = true;
      logger.warn('session.server_instance_mismatch', {
        incomingId: instanceId,
        storedId: readStoredServerInstanceId(),
        url,
      });
      void import('@/lib/session-logout').then((m) =>
        m.performSessionLogout({ reason: 'server_restart', skipServer: true }),
      );
      return;
    }
    storeServerInstanceId(instanceId);
    return;
  }

  if (/\/auth\/(login|register|otp\/verify|refresh)/.test(url)) {
    storeServerInstanceId(instanceId);
  }
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    onApiActivity?.();
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    handleResponseHeaders(response);
    return response;
  },
  async (error: AxiosError<{ error: ApiError }>) => {
    if (error.response) {
      handleResponseHeaders(error.response);
    }

    const status = error.response?.status;
    const code = error.response?.data?.error?.code;
    const url = error.config?.url ?? '';
    const isStaleRefresh =
      url.includes('/auth/refresh') &&
      status === 401 &&
      (code === 'AUTH_INVALID_CREDENTIALS' ||
        code === 'AUTH_TOKEN_EXPIRED' ||
        code === 'AUTH_TOKEN_REUSE' ||
        code === 'AUTH_SESSION_INVALIDATED');

    if (code === 'AUTH_SESSION_INVALIDATED' && getAccessToken() && !handlingSessionInvalidation) {
      handlingSessionInvalidation = true;
      logger.warn('session.auth_invalidated', {
        url,
        status,
        storedServerInstanceId: readStoredServerInstanceId(),
      });
      void import('@/lib/session-logout').then((m) =>
        m.performSessionLogout({ reason: 'server_restart', skipServer: true }),
      );
    }

    const config = error.config;
    const canRetry =
      config &&
      !('_authRetried' in config && (config as { _authRetried?: boolean })._authRetried) &&
      status === 401 &&
      code &&
      RETRIABLE_AUTH_CODES.has(code) &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/register') &&
      !url.includes('/auth/refresh');

    if (canRetry) {
      const newToken = await refreshAccessTokenOnce();
      if (newToken) {
        (config as { _authRetried?: boolean })._authRetried = true;
        config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(config);
      }
    }

    if (!isStaleRefresh) {
      logger.warn('api.error', { url, status, code });
    }
    return Promise.reject(error);
  },
);

export function isApiError(err: unknown): err is { code: string; message: string; details?: ApiError['details'] } {
  if (!err || typeof err !== 'object') return false;
  const maybe = err as { response?: { data?: { error?: ApiError } } };
  return Boolean(maybe.response?.data?.error?.code);
}
