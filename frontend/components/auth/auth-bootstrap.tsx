'use client';

import { setAccessTokenGetter } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

/**
 * Wires Zustand access token into Axios interceptors.
 * Must run synchronously on render — child useEffects (e.g. RoleGuard) run before
 * parent useEffects, so deferring this to useEffect caused fetchMe() without Bearer.
 */
export function AuthBootstrap() {
  setAccessTokenGetter(() => useAuthStore.getState().accessToken);
  return null;
}
