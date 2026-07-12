'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SkipToContent } from '@/components/accessibility/skip-to-content';
import { WashhouseLogo } from '@/components/brand/washhouse-logo';
import { GlobalNavbar } from '@/components/layout/global-navbar';
import { getCustomerPageTitle } from '@/lib/navigation/customer-title';

export function PublicShell({
  children,
  showBack: _showBack,
}: {
  children: React.ReactNode;
  /** @deprecated Back is handled by GlobalNavbar */
  showBack?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SkipToContent />
      <GlobalNavbar
        app="customer"
        pageTitle={getCustomerPageTitle(pathname)}
        notificationsHref="/orders"
        settingsHref="/account"
      />
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        {children}
      </main>
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex max-w-full justify-center overflow-hidden rounded-md p-1 dark:bg-white/90">
            <WashhouseLogo href="/discover" className="max-w-full" />
          </div>
          <Link href="/discover" className="font-medium text-primary hover:underline">
            Back to Discover
          </Link>
        </div>
      </footer>
    </div>
  );
}
