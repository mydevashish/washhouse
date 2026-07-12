export function getCustomerPageTitle(pathname: string): string {
  if (pathname === '/') return 'Home';
  if (pathname === '/discover') return 'Discover';
  if (pathname === '/services') return 'Services';
  if (pathname === '/stores') return 'Stores';
  if (pathname === '/franchise') return 'Become a partner';
  if (pathname === '/about') return 'About us';
  if (pathname === '/contact') return 'Contact';
  if (pathname === '/terms') return 'Terms';
  if (pathname === '/privacy') return 'Privacy';
  if (pathname.startsWith('/discover/')) return 'Laundry shop';
  if (pathname === '/orders') return 'Orders';
  if (pathname.startsWith('/orders/')) return 'Order details';
  if (pathname === '/disputes') return 'Dispute center';
  if (pathname === '/account') return 'Account';
  if (pathname.startsWith('/checkout')) return 'Checkout';
  return 'DLM';
}
