import { QueryClient } from '@tanstack/react-query';

import { logger } from '@/lib/logger';
import {
  SESSION_LOGOUT_MESSAGES,
  SESSION_SYNC_STORAGE_KEY,
  type SessionLogoutReason,
} from '@/lib/session-config';
import {
  clearStoredServerInstanceId,
  readStoredServerInstanceId,
} from '@/lib/session-instance';
import { logoutApi } from '@/services/auth';
import { useAuthStore } from '@/store/auth.store';

export type LogoutOptions = {
  reason: SessionLogoutReason;
  message?: string;
  skipServer?: boolean;
  queryClient?: QueryClient;
};

export async function performSessionLogout(options: LogoutOptions): Promise<void> {
  const { reason, skipServer = false, queryClient } = options;
  const message = options.message ?? SESSION_LOGOUT_MESSAGES[reason];
  const user = useAuthStore.getState().user;

  logger.warn('session.logout', {
    reason,
    message,
    skipServer,
    storedServerInstanceId: readStoredServerInstanceId(),
    userId: user?.id ?? null,
    userRole: user?.role ?? null,
  });

  if (!skipServer) {
    try {
      await logoutApi();
    } catch {
      /* local cleanup still runs */
    }
  }

  useAuthStore.getState().logout();
  clearStoredServerInstanceId();

  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_SYNC_STORAGE_KEY);
    try {
      localStorage.removeItem('dlm.auth');
    } catch {
      /* ignore */
    }
    queryClient?.clear();
    const params = new URLSearchParams({ reason, message });
    window.location.href = `/login?${params.toString()}`;
  }
}
