'use client';

import { useEffect } from 'react';

import { useStoreHydrated } from '@/lib/hooks/use-store-hydrated';
import { fetchMe } from '@/services/auth';
import { shouldAttemptSessionRestore, tryRefreshSession } from '@/lib/session';
import { useAuthStore } from '@/store/auth.store';

/** Silently restores session for returning users; skips refresh for guests. */
export function OptionalAuthRefresh() {
  const hydrated = useStoreHydrated(useAuthStore);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!hydrated) return;
    if (accessToken || !shouldAttemptSessionRestore()) return;
    let cancelled = false;
    async function restore() {
      const tokens = await tryRefreshSession();
      if (!tokens || cancelled) return;
      setAccessToken(tokens.access_token);
      try {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) useAuthStore.getState().logout();
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, [hydrated, accessToken, user, setAccessToken, setUser]);

  return null;
}
