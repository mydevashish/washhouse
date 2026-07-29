import { goToCheckout } from '@/features/checkout/lib/navigate';

jest.mock('@/features/checkout/lib/cart-storage', () => ({
  saveCheckoutCart: jest.fn(),
}));

import { saveCheckoutCart } from '@/features/checkout/lib/cart-storage';

describe('goToCheckout (BUG-2026-07-28-013)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to checkout without re-checking env feature flag', () => {
    const push = jest.fn();
    goToCheckout({ push }, 'laundry-1', { 'svc-1': 2 }, { signedIn: true });

    expect(saveCheckoutCart).toHaveBeenCalledWith('laundry-1', { 'svc-1': 2 });
    expect(push).toHaveBeenCalledWith('/checkout/laundry-1');
  });

  it('sends unsigned users to login with next=checkout', () => {
    const push = jest.fn();
    goToCheckout({ push }, 'laundry-2', { 'svc-9': 1 }, { signedIn: false });

    expect(push).toHaveBeenCalledWith(
      `/login?next=${encodeURIComponent('/checkout/laundry-2')}`,
    );
  });
});
