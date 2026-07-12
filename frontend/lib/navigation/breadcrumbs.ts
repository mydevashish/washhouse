import { ADMIN_NAV_FLAT } from '@/features/admin/lib/admin-nav';
import { PARTNER_NAV_FLAT } from '@/features/partner/lib/partner-nav';
import type { AppContext, BreadcrumbItem } from '@/lib/navigation/types';

const CUSTOMER_ROOT: BreadcrumbItem = { label: 'Discover', href: '/discover' };

function matchNavItem(pathname: string, href: string): boolean {
  if (href === '/admin' || href === '/partner') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navBreadcrumbs(
  pathname: string,
  items: { href: string; label: string }[],
  root: BreadcrumbItem,
): BreadcrumbItem[] {
  const match = items.find((item) => matchNavItem(pathname, item.href));
  if (!match) {
    return [root, { label: 'Page' }];
  }
  if (pathname === match.href) {
    return [root, { label: match.label }];
  }
  return [root, { label: match.label, href: match.href }, { label: 'Details' }];
}

function customerBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === '/discover') return [{ label: 'Discover' }];
  if (pathname.startsWith('/discover/')) {
    return [CUSTOMER_ROOT, { label: 'Laundry shop' }];
  }
  if (pathname === '/orders') return [{ label: 'Orders' }];
  if (pathname.startsWith('/orders/')) {
    return [{ label: 'Orders', href: '/orders' }, { label: 'Order details' }];
  }
  if (pathname === '/account') return [{ label: 'Account' }];
  if (pathname.startsWith('/checkout')) {
    return [CUSTOMER_ROOT, { label: 'Checkout' }];
  }
  return [{ label: 'DLM' }];
}

export function buildBreadcrumbs(pathname: string, app: AppContext): BreadcrumbItem[] {
  if (app === 'admin') {
    return navBreadcrumbs(pathname, ADMIN_NAV_FLAT, { label: 'Dashboard', href: '/admin' });
  }
  if (app === 'partner') {
    return navBreadcrumbs(pathname, PARTNER_NAV_FLAT, { label: 'Dashboard', href: '/partner' });
  }
  return customerBreadcrumbs(pathname);
}
