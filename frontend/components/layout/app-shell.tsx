'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, Search, User } from 'lucide-react';

import { SkipToContent } from '@/components/accessibility/skip-to-content';
import { AnnouncementBannerStack } from '@/components/announcements/announcement-banner';
import { GlobalNavbar } from '@/components/layout/global-navbar';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { useMounted } from '@/lib/hooks/use-mounted';
import { getCustomerPageTitle } from '@/lib/navigation/customer-title';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/account', label: 'Account', icon: User },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);

  useScrollRestore();

  return (
    <div className="flex min-h-screen flex-col">
      <SkipToContent />
      <GlobalNavbar
        app="customer"
        pageTitle={getCustomerPageTitle(pathname)}
        userRole={mounted ? user?.role : undefined}
        notificationsHref="/orders"
        settingsHref="/account"
      />

      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        {mounted && user && <AnnouncementBannerStack />}
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur sm:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex max-w-screen-xl justify-around">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-[56px] min-w-[4.5rem] flex-col items-center justify-center gap-0.5 px-2 text-xs font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="pb-safe-nav sm:hidden" aria-hidden />
    </div>
  );
}
