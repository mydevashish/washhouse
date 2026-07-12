import type { UserRole } from '@/types/user';

/** Default landing path after successful sign-in, by role. */
export function getPostLoginPath(role: string): string {
  switch (role as UserRole) {
    case 'admin':
    case 'super_admin':
      return '/admin';
    case 'partner':
    case 'partner_staff':
      return '/partner';
    case 'platform_partner':
      return '/platform-partner';
    case 'customer':
    default:
      return '/discover';
  }
}

/** Customer marketplace routes partners should not stay on after login. */
export function shouldRedirectPartnerFromCustomerApp(pathname: string): boolean {
  if (pathname.startsWith('/partner')) return false;
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) return false;
  return (
    pathname === '/' ||
    pathname.startsWith('/discover') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/checkout')
  );
}
