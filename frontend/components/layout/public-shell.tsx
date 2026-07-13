'use client';

import { usePathname } from 'next/navigation';

import { SkipToContent } from '@/components/accessibility/skip-to-content';
import { GlobalNavbar } from '@/components/layout/global-navbar';
import { MarketingFooter } from '@/components/layout/marketing-footer';
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
    <div className="marketing-readable flex min-h-screen flex-col bg-muted/30">
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
      <MarketingFooter />
    </div>
  );
}
