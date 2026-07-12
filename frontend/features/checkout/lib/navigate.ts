import { saveCheckoutCart } from '@/features/checkout/lib/cart-storage';
import { isOnlineBookingEnabledFromEnv } from '@/lib/online-booking';

type RouterLike = { push: (href: string) => void };

export function goToCheckout(
  router: RouterLike,
  laundryId: string,
  quantities: Record<string, number>,
  options?: { signedIn: boolean },
): void {
  if (!isOnlineBookingEnabledFromEnv()) return;
  saveCheckoutCart(laundryId, quantities);
  const path = `/checkout/${laundryId}`;
  if (options?.signedIn === false) {
    router.push(`/login?next=${encodeURIComponent(path)}`);
    return;
  }
  router.push(path);
}
