'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  isServerInstanceMismatch,
  readStoredServerInstanceId,
  storeServerInstanceId,
} from '@/lib/session-instance';
import { performSessionLogout } from '@/lib/session-logout';
import { logger } from '@/lib/logger';
import { fetchSessionInfo } from '@/services/session-info';
import { useAuthStore } from '@/store/auth.store';

/**
 * Authenticated-only: server restart detection (JWT boot id mismatch).
 * Idle UX is handled by GlobalIdleManager.
 */
export function AuthSessionMonitor() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const loggingOutRef = useRef(false);

  const handleServerRestart = useCallback(async () => {
    if (!accessToken || loggingOutRef.current) return;
    loggingOutRef.current = true;
    await performSessionLogout({
      reason: 'server_restart',
      skipServer: true,
      queryClient,
    });
  }, [accessToken, queryClient]);

  useEffect(() => {
    if (!accessToken) return;

    const check = async () => {
      try {
        const info = await fetchSessionInfo();
        const stored = readStoredServerInstanceId();
        logger.debug('session.info_check', {
          backendId: info.server_instance_id,
          storedId: stored,
          forceLogoutOnRestart: info.force_logout_on_restart,
        });
        if (info.force_logout_on_restart && isServerInstanceMismatch(info.server_instance_id)) {
          logger.warn('session.info_mismatch', {
            backendId: info.server_instance_id,
            storedId: stored,
          });
          await handleServerRestart();
          return;
        }
        storeServerInstanceId(info.server_instance_id);
      } catch {
        /* network — skip */
      }
    };

    void check();
    const id = setInterval(() => void check(), 60_000);
    return () => clearInterval(id);
  }, [accessToken, handleServerRestart]);

  return null;
}
