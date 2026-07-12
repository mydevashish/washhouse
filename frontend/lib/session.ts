import { extractServerInstanceId, storeServerInstanceId } from '@/lib/session-instance';
import type { TokenPair } from '@/services/auth';
import { refreshSession } from '@/services/auth';
import { useAuthStore } from '@/store/auth.store';

/** True when the client may have an httpOnly refresh cookie (logged-in before). */
export function shouldAttemptSessionRestore(): boolean {
  const { accessToken, user } = useAuthStore.getState();
  return Boolean(accessToken || user);
}

/** Refresh access token; clears local auth state and returns null on failure. */
export async function tryRefreshSession(): Promise<TokenPair | null> {
  try {
    const tokens = await refreshSession();
    return tokens;
  } catch (err: unknown) {
    const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error
      ?.code;
    if (code === 'AUTH_SESSION_INVALIDATED') {
      const { performSessionLogout } = await import('@/lib/session-logout');
      await performSessionLogout({ reason: 'server_restart', skipServer: true });
      return null;
    }
    useAuthStore.getState().logout();
    return null;
  }
}

/** After refresh/login — persist boot id from response headers. */
export function bindServerInstanceFromAxiosResponse(headers: unknown): void {
  const id = extractServerInstanceId(headers as Record<string, unknown>);
  if (id) storeServerInstanceId(id);
}
