'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import { GlobalNavbar } from '@/components/layout/global-navbar';
import { getCustomerPageTitle } from '@/lib/navigation/customer-title';

const FloatingContactActions = dynamic(
  () =>
    import('@/components/marketing/floating-contact-actions').then((m) => ({
      default: m.FloatingContactActions,
    })),
  { ssr: false },
);

/** Client chrome for marketing pages — navbar + deferred FAB contact actions. */
export function MarketingShellChrome() {
  const pathname = usePathname();

  return (
    <>
      <GlobalNavbar
        app="customer"
        pageTitle={getCustomerPageTitle(pathname)}
        notificationsHref="/orders"
        settingsHref="/account"
      />
      <FloatingContactActions />
    </>
  );
}
