export function getCustomerPageTitle(pathname: string): string {
  if (pathname === '/discover' || pathname === '/') return 'Discover';
  if (pathname.startsWith('/discover/')) return 'Laundry shop';
  if (pathname === '/orders') return 'Orders';
  if (pathname.startsWith('/orders/')) return 'Order details';
  if (pathname === '/disputes') return 'Dispute center';
  if (pathname === '/account') return 'Account';
  if (pathname.startsWith('/checkout')) return 'Checkout';
  return 'DLM';
}
