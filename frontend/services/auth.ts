import { api, type ApiEnvelope } from '@/lib/api';
import { extractServerInstanceId, storeServerInstanceId } from '@/lib/session-instance';
import type { User } from '@/types/user';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthPayload {
  user: User;
  tokens: TokenPair;
}

export async function register(input: {
  email: string;
  password: string;
  full_name: string;
}): Promise<AuthPayload> {
  const res = await api.post<ApiEnvelope<AuthPayload>>('/auth/register', input);
  captureServerInstanceFromResponse(res.headers);
  return res.data.data;
}

export async function login(input: { email: string; password: string }): Promise<AuthPayload> {
  const res = await api.post<ApiEnvelope<AuthPayload>>('/auth/login', input);
  captureServerInstanceFromResponse(res.headers);
  return res.data.data;
}

export async function sendOtp(phone: string): Promise<{ otp_debug?: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string; otp_debug?: string }>>(
    '/auth/otp/send',
    { phone },
  );
  return data.data;
}

export async function verifyOtp(input: {
  phone: string;
  code: string;
  full_name?: string;
}): Promise<AuthPayload> {
  const res = await api.post<ApiEnvelope<AuthPayload>>('/auth/otp/verify', input);
  captureServerInstanceFromResponse(res.headers);
  return res.data.data;
}

export async function refreshSession(): Promise<TokenPair> {
  const res = await api.post<ApiEnvelope<TokenPair>>('/auth/refresh', {});
  captureServerInstanceFromResponse(res.headers);
  return res.data.data;
}

function captureServerInstanceFromResponse(headers: unknown) {
  const id = extractServerInstanceId(headers as Record<string, unknown>);
  if (id) storeServerInstanceId(id);
}

export async function applyAuth(payload: AuthPayload, responseHeaders?: unknown): Promise<void> {
  const { useAuthStore } = await import('@/store/auth.store');
  useAuthStore.getState().setAccessToken(payload.tokens.access_token);
  useAuthStore.getState().setUser(payload.user);
  captureServerInstanceFromResponse(responseHeaders);
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<ApiEnvelope<User>>('/users/me');
  return data.data;
}

export async function logoutApi(): Promise<void> {
  try {
    await api.post('/auth/logout', {}, {
      validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
    });
  } catch {
    // Server unreachable or session already invalid — local logout still runs.
  }
}
