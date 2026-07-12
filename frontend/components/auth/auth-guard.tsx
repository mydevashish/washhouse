'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { PageSpinner } from '@/components/feedback/page-spinner';
import { tryRefreshSession } from '@/lib/session';
import { useAuthStore } from '@/store/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  useEffect(() => {
    let cancelled = false;
    async function ensure() {
      if (accessToken) return;
      const tokens = await tryRefreshSession();
      if (cancelled) return;
      if (tokens) {
        setAccessToken(tokens.access_token);
        return;
      }
      router.replace('/login');
    }
    void ensure();
    return () => {
      cancelled = true;
    };
  }, [accessToken, router, setAccessToken]);

  if (!accessToken) {
    return <PageSpinner label="Signing you in…" />;
  }

  return <>{children}</>;
}
