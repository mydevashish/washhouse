import { saveCheckoutCart } from '@/features/checkout/lib/cart-storage';

type RouterLike = { push: (href: string) => void };

/**
 * Persist cart and navigate to checkout.
 * Callers must gate on online booking (runtime `/config` via useOnlineBookingEnabled).
 */
export function goToCheckout(
  router: RouterLike,
  laundryId: string,
  quantities: Record<string, number>,
  options?: { signedIn: boolean },
): void {
  saveCheckoutCart(laundryId, quantities);
  const path = `/checkout/${laundryId}`;
  if (options?.signedIn === false) {
    router.push(`/login?next=${encodeURIComponent(path)}`);
    return;
  }
  router.push(path);
}
