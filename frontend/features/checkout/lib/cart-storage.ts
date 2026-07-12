const STORAGE_KEY = 'dlm-checkout-cart';

export type CheckoutCart = {
  laundryId: string;
  quantities: Record<string, number>;
  updatedAt: string;
};

export function saveCheckoutCart(laundryId: string, quantities: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  const payload: CheckoutCart = {
    laundryId,
    quantities,
    updatedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadCheckoutCart(laundryId: string): Record<string, number> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutCart;
    if (parsed.laundryId !== laundryId) return null;
    const hasItems = Object.values(parsed.quantities).some((q) => q > 0);
    return hasItems ? parsed.quantities : null;
  } catch {
    return null;
  }
}

export function clearCheckoutCart(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
