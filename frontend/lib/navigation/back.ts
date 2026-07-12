import type { AppContext } from '@/lib/navigation/types';

const TOP_LEVEL_EXACT = new Set([
  '/',
  '/discover',
  '/orders',
  '/account',
  '/login',
  '/register',
  '/partners',
  '/admin',
  '/partner',
]);

/** Show back control on deep screens and detail routes. */
export function shouldShowBack(pathname: string, app: AppContext): boolean {
  if (TOP_LEVEL_EXACT.has(pathname)) return false;

  const segments = pathname.split('/').filter(Boolean);

  if (app === 'customer') {
    if (pathname.startsWith('/checkout')) return true;
    if (pathname.startsWith('/discover/') && segments.length >= 2) return true;
    if (pathname.startsWith('/orders/') && segments.length >= 2) return true;
    if (pathname === '/account') return false;
    return segments.length >= 2;
  }

  if (app === 'partner' || app === 'admin') {
    if (pathname.includes('/settings')) return true;
    return segments.length >= 2;
  }

  return segments.length >= 2;
}

export function getBackFallbackHref(pathname: string, app: AppContext): string {
  const segments = pathname.split('/').filter(Boolean);

  if (app === 'admin') {
    if (segments[0] === 'admin' && segments.length >= 2) return `/admin/${segments[1]}`;
    return '/admin';
  }

  if (app === 'partner') {
    if (segments[0] === 'partner' && segments.length >= 2) return `/partner/${segments[1]}`;
    return '/partner';
  }

  if (pathname.startsWith('/checkout')) return pathname.replace(/\/checkout.*$/, '/discover');
  if (pathname.startsWith('/discover/')) return '/discover';
  if (pathname.startsWith('/orders/')) return '/orders';

  return '/discover';
}

export function getBackAriaLabel(pathname: string, app: AppContext): string {
  const parent = getBackFallbackHref(pathname, app);
  if (parent === '/discover') return 'Back to Discover';
  if (parent === '/orders') return 'Back to Orders';
  if (parent === '/admin') return 'Back to Dashboard';
  if (parent === '/partner') return 'Back to Dashboard';
  if (parent.startsWith('/admin/')) return 'Back';
  if (parent.startsWith('/partner/')) return 'Back';
  return 'Go back';
}
