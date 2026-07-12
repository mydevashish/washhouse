'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { shouldRedirectPartnerFromCustomerApp } from '@/lib/auth-routing';
import { useAuthStore } from '@/store/auth.store';

/**
 * If a partner lands on the customer app (e.g. after old login redirect to /discover),
 * send them to the partner console.
 */
export function PartnerBrowseRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role === 'partner' && shouldRedirectPartnerFromCustomerApp(pathname)) {
      router.replace('/partner');
    }
  }, [user?.role, pathname, router]);

  return null;
}
