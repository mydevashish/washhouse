'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PageSpinner } from '@/components/feedback/page-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getPostLoginPath } from '@/lib/auth-routing';
import { fetchMe } from '@/services/auth';
import { tryRefreshSession } from '@/lib/session';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/types/user';

export function RoleGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: UserRole[];
}) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let token = useAuthStore.getState().accessToken;
      if (!token) {
        const tokens = await tryRefreshSession();
        if (!tokens) {
          if (!cancelled) router.replace('/login');
          return;
        }
        token = tokens.access_token;
        if (!cancelled) setAccessToken(token);
      }
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        if (!roles.includes(me.role)) {
          setDenied(true);
          return;
        }
        setReady(true);
      } catch {
        const refreshed = await tryRefreshSession();
        if (cancelled) return;
        if (refreshed) {
          setAccessToken(refreshed.access_token);
          try {
            const me = await fetchMe();
            if (cancelled) return;
            setUser(me);
            if (!roles.includes(me.role)) {
              setDenied(true);
              return;
            }
            setReady(true);
            return;
          } catch {
            /* fall through to login */
          }
        }
        if (!cancelled) router.replace('/login');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [roles, router, setAccessToken, setUser]);

  if (denied) {
    const user = useAuthStore.getState().user;
    const home = user ? getPostLoginPath(user.role) : '/discover';
    const homeLabel =
      user?.role === 'platform_partner'
        ? 'Go to Platform Partner dashboard'
        : user?.role === 'partner' || user?.role === 'partner_staff'
        ? 'Go to Partner dashboard'
        : user?.role === 'admin' || user?.role === 'super_admin'
          ? 'Go to Admin'
          : 'Go to Discover';

    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md items-center px-4 py-12">
        <Card className="w-full">
          <CardContent className="space-y-4 p-6 text-center">
            <h1 className="text-lg font-bold text-foreground">Access not allowed</h1>
            <p className="text-sm text-muted-foreground">
              Your account does not have permission to view this page.
            </p>
            <Button asChild className="w-full">
              <Link href={home}>{homeLabel}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ready) {
    return <PageSpinner label="Checking access…" />;
  }

  const user = useAuthStore.getState().user;
  const token = useAuthStore.getState().accessToken;
  if (!token || !user || !roles.includes(user.role)) {
    return <PageSpinner label="Checking access…" />;
  }

  return <>{children}</>;
}
