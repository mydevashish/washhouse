import { findSlot, type TimeSlot } from '@/features/checkout/lib/slots';

export const CHECKOUT_STEPS = ['Address', 'Pickup', 'Delivery', 'Payment'] as const;
export type CheckoutStepIndex = 0 | 1 | 2 | 3;

export type CheckoutFormState = {
  addressId: string;
  pickupSlotId: string;
  deliverySlotId: string;
  payment: 'cod' | 'razorpay' | '';
};

export type CheckoutFieldErrors = Partial<
  Record<'address' | 'pickup' | 'delivery' | 'payment' | 'submit', string>
>;

type ValidateContext = {
  pickupSlots: TimeSlot[];
  deliverySlots: TimeSlot[];
};

export function validateCheckoutStep(
  step: CheckoutStepIndex,
  state: CheckoutFormState,
  ctx: ValidateContext,
): CheckoutFieldErrors {
  switch (step) {
    case 0:
      if (!state.addressId.trim()) {
        return { address: 'Select a pickup address to continue.' };
      }
      return {};
    case 1:
      if (!state.pickupSlotId || !findSlot(ctx.pickupSlots, state.pickupSlotId)) {
        return { pickup: 'Choose a pickup time slot.' };
      }
      return {};
    case 2:
      if (!state.deliverySlotId || !findSlot(ctx.deliverySlots, state.deliverySlotId)) {
        return { delivery: 'Choose a delivery time slot.' };
      }
      return {};
    case 3:
      if (state.payment !== 'cod' && state.payment !== 'razorpay') {
        return { payment: 'Select how you want to pay.' };
      }
      return {};
    default:
      return {};
  }
}

export function validateAllSteps(
  state: CheckoutFormState,
  ctx: ValidateContext,
): CheckoutFieldErrors {
  return {
    ...validateCheckoutStep(0, state, ctx),
    ...validateCheckoutStep(1, state, ctx),
    ...validateCheckoutStep(2, state, ctx),
    ...validateCheckoutStep(3, state, ctx),
  };
}
