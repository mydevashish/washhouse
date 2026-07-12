'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

import { IdleWarningOverlay } from '@/components/session/idle-warning-overlay';
import { startActivityTracker } from '@/lib/idle/activity-tracker';
import { publishSessionSync, subscribeSessionSync } from '@/lib/idle/tab-sync';
import { logger } from '@/lib/logger';
import { sessionConfig } from '@/lib/session-config';
import { performSessionLogout } from '@/lib/session-logout';
import { setApiActivityCallback } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

type IdlePhase = 'active' | 'warning';

/**
 * Global idle detection + seasonal overlay for every route (public and authenticated).
 * Mounted once from root Providers — not inside role-specific layouts.
 */
export function GlobalIdleManager() {
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = Boolean(accessToken);
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<IdlePhase>('active');
  const [warningEndsAt, setWarningEndsAt] = useState(0);

  const lastActivityRef = useRef(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggingOutRef = useRef(false);
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  useEffect(() => {
    logger.info('idle.config', {
      idleMinutes: sessionConfig.idleMinutes,
      warningMinutes: sessionConfig.warningMinutes,
      idleMs: sessionConfig.idleMs,
      warningMs: sessionConfig.warningMs,
      enableIdleAnimations: sessionConfig.enableIdleAnimations,
      seasonMode: sessionConfig.seasonMode,
      idleAnimation: sessionConfig.idleAnimation,
    });
  }, []);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    idleTimerRef.current = null;
    warningTimerRef.current = null;
  }, []);

  const dismissWarning = useCallback(() => {
    setPhase('active');
    setWarningEndsAt(0);
    clearTimers();
  }, [clearTimers]);

  const scheduleIdleCheckRef = useRef<() => void>(() => {});

  const scheduleIdleCheck = useCallback(() => {
    clearTimers();

    const elapsed = Date.now() - lastActivityRef.current;
    const untilIdle = Math.max(0, sessionConfig.idleMs - elapsed);

    idleTimerRef.current = setTimeout(() => {
      setPhase('warning');
      const ends = Date.now() + sessionConfig.warningMs;
      setWarningEndsAt(ends);

      warningTimerRef.current = setTimeout(() => {
        if (isAuthenticatedRef.current) {
          if (loggingOutRef.current) return;
          loggingOutRef.current = true;
          void performSessionLogout({
            reason: 'idle_expired',
            queryClient,
          });
        } else {
          lastActivityRef.current = Date.now();
          setPhase('active');
          setWarningEndsAt(0);
          clearTimers();
          scheduleIdleCheckRef.current();
        }
      }, sessionConfig.warningMs);
    }, untilIdle);
  }, [clearTimers, queryClient]);

  scheduleIdleCheckRef.current = scheduleIdleCheck;

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (phase !== 'active') {
      dismissWarning();
    }
    scheduleIdleCheck();
  }, [phase, dismissWarning, scheduleIdleCheck]);

  useEffect(() => {
    setApiActivityCallback(() => resetActivity());
    return () => setApiActivityCallback(() => {});
  }, [resetActivity]);

  useEffect(() => {
    loggingOutRef.current = false;
    resetActivity();

    const stopTracker = startActivityTracker(resetActivity);
    const stopSync = subscribeSessionSync((msg) => {
      if (msg.type === 'activity' || msg.type === 'continue') {
        lastActivityRef.current = Date.now();
        resetActivity();
      }
      if (msg.type === 'logout' && isAuthenticated) {
        loggingOutRef.current = true;
      }
    });

    return () => {
      stopTracker();
      stopSync();
      clearTimers();
    };
  }, [pathname, resetActivity, clearTimers, isAuthenticated]);

  if (phase !== 'warning') return null;

  return (
    <IdleWarningOverlay
      isAuthenticated={isAuthenticated}
      warningEndsAt={warningEndsAt}
      onContinue={resetActivity}
      onLogout={
        isAuthenticated
          ? () => {
              loggingOutRef.current = true;
              publishSessionSync({ type: 'logout', reason: 'manual' });
              void performSessionLogout({ reason: 'manual', queryClient });
            }
          : undefined
      }
    />
  );
}
