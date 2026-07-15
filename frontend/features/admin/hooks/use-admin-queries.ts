'use client';

import { useMounted } from '@/lib/hooks/use-mounted';
import { useAuthStore } from '@/store/auth.store';

/** Admin APIs require a bearer token — skip fetches during SSR / before auth. */
export function useAdminQueriesEnabled() {
  const mounted = useMounted();
  const accessToken = useAuthStore((s) => s.accessToken);
  return mounted && Boolean(accessToken);
}
