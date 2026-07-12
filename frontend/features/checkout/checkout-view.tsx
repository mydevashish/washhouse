'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';

import { CheckoutSkeleton } from '@/features/checkout/checkout-skeleton';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useOnlineBookingEnabled } from '@/lib/hooks/use-online-booking-enabled';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckoutStepper } from '@/features/checkout/checkout-stepper';
import {
  clearCheckoutCart,
  loadCheckoutCart,
} from '@/features/checkout/lib/cart-storage';
import {
  buildDeliverySlots,
  buildPickupSlots,
  findSlot,
  formatSlotSummary,
} from '@/features/checkout/lib/slots';
import {
  CHECKOUT_STEPS,
  type CheckoutFieldErrors,
  type CheckoutFormState,
  type CheckoutStepIndex,
  validateCheckoutStep,
} from '@/features/checkout/lib/validation';
import { AddressStep } from '@/features/checkout/steps/address-step';
import { DeliverySlotStep } from '@/features/checkout/steps/delivery-slot-step';
import { PaymentStep } from '@/features/checkout/steps/payment-step';
import { PickupSlotStep } from '@/features/checkout/steps/pickup-slot-step';
import { computeOrderQuote } from '@/features/discover/detail/order-pricing';
import { OrderSummarySidebar } from '@/features/discover/detail/order-summary-sidebar';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { createOrder } from '@/services/orders';
import { createRazorpayOrder, selectCod } from '@/services/payments';
import { getLaundry } from '@/services/laundries';
import { listAddresses } from '@/services/users';

const STEP_HEADINGS: Record<CheckoutStepIndex, { title: string; hint: string }> = {
  0: { title: 'Where should we pick up?', hint: 'Saved addresses from your account' },
  1: { title: 'Pickup time', hint: 'Choose a convenient window' },
  2: { title: 'Delivery time', hint: 'When to return your clothes' },
  3: { title: 'Payment', hint: 'Last step — then you are done' },
};

export function CheckoutView({ laundryId }: { laundryId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { enabled: onlineBookingEnabled, isLoading: bookingConfigLoading } = useOnlineBookingEnabled();
  const [step, setStep] = useState<CheckoutStepIndex>(0);
  const [cart, setCart] = useState<Record<string, number> | null>(null);
  const [form, setForm] = useState<CheckoutFormState>({
    addressId: '',
    pickupSlotId: '',
    deliverySlotId: '',
    payment: 'cod',
  });
  const [errors, setErrors] = useState<CheckoutFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const quantities = loadCheckoutCart(laundryId);
    if (!quantities) {
      router.replace(`/discover/${laundryId}`);
      return;
    }
    setCart(quantities);
  }, [laundryId, router]);

  useEffect(() => {
    if (bookingConfigLoading || onlineBookingEnabled || !cart) return;
    router.replace(`/discover/${laundryId}`);
  }, [bookingConfigLoading, onlineBookingEnabled, cart, laundryId, router]);

  const laundryQ = useQuery({
    queryKey: queryKeys.laundry(laundryId),
    queryFn: () => getLaundry(laundryId),
    enabled: Boolean(cart),
    staleTime: STALE.laundryDetail,
  });

  const addressesQ = useQuery({
    queryKey: queryKeys.addresses(),
    queryFn: listAddresses,
    enabled: Boolean(cart),
    staleTime: STALE.addresses,
  });

  const services = useMemo(
    () => laundryQ.data?.services.filter((s) => s.is_active) ?? [],
    [laundryQ.data],
  );

  const quote = useMemo(
    () => (cart ? computeOrderQuote(services, cart) : null),
    [cart, services],
  );

  const mounted = useMounted();
  const pickupSlots = useMemo(() => (mounted ? buildPickupSlots() : []), [mounted]);
  const deliverySlots = useMemo(() => {
    if (!mounted) return [];
    const pickup = findSlot(pickupSlots, form.pickupSlotId);
    if (!pickup || !quote) return [];
    return buildDeliverySlots(pickup.startsAt, quote.maxDeliveryHours);
  }, [mounted, form.pickupSlotId, pickupSlots, quote]);

  const pickupSlot = findSlot(pickupSlots, form.pickupSlotId);
  const deliverySlot = findSlot(deliverySlots, form.deliverySlotId);

  useEffect(() => {
    const list = addressesQ.data;
    if (!list?.length || form.addressId) return;
    const def = list.find((a) => a.is_default) ?? list[0];
    if (def) setForm((f) => ({ ...f, addressId: def.id }));
  }, [addressesQ.data, form.addressId]);

  useEffect(() => {
    if (!form.deliverySlotId) return;
    if (!deliverySlots.some((s) => s.id === form.deliverySlotId)) {
      setForm((f) => ({ ...f, deliverySlotId: '' }));
    }
  }, [deliverySlots, form.deliverySlotId]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!cart || !pickupSlot || !deliverySlot) throw new Error('Incomplete checkout');
      const items = Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([service_id, quantity]) => ({ service_id, quantity }));
      const order = await createOrder({
        laundry_id: laundryId,
        address_id: form.addressId,
        pickup_at: pickupSlot.startsAt.toISOString(),
        delivery_at: deliverySlot.startsAt.toISOString(),
        items,
      });
      if (form.payment === 'razorpay') await createRazorpayOrder(order.id);
      else await selectCod(order.id);
      return order;
    },
    onSuccess: (order) => {
      clearCheckoutCart();
      toast.success('Order placed!');
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      router.push(`/orders/${order.id}`);
    },
    onError: (err: unknown) => {
      const axiosMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
              ?.message
          : undefined;
      const msg = axiosMsg ?? 'Could not place order. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  function patchForm<K extends keyof CheckoutFormState>(key: K, value: CheckoutFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      const fieldMap: Record<string, keyof CheckoutFieldErrors> = {
        addressId: 'address',
        pickupSlotId: 'pickup',
        deliverySlotId: 'delivery',
        payment: 'payment',
      };
      const errKey = fieldMap[key as string];
      if (errKey) delete next[errKey];
      return next;
    });
    setSubmitError(null);
  }

  function validateCurrent(): boolean {
    const ctx = { pickupSlots, deliverySlots };
    const stepErrors = validateCheckoutStep(step, form, ctx);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }

  function goNext() {
    if (!validateCurrent()) return;
    if (step < 3) setStep((s) => (s + 1) as CheckoutStepIndex);
  }

  function goBack() {
    setErrors({});
    if (step > 0) setStep((s) => (s - 1) as CheckoutStepIndex);
    else router.push(`/discover/${laundryId}`);
  }

  function handlePrimary() {
    if (step < 3) {
      goNext();
      return;
    }
    if (!validateCurrent()) return;
    setSubmitError(null);
    bookMutation.mutate();
  }

  if (!cart || laundryQ.isLoading || bookingConfigLoading || !onlineBookingEnabled) {
    return <CheckoutSkeleton />;
  }

  if (laundryQ.error || !laundryQ.data || !quote?.lines.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to checkout"
          description="Add services from the laundry page first."
          action={{ label: 'Back to laundry', href: `/discover/${laundryId}` }}
        />
      </div>
    );
  }

  const laundry = laundryQ.data;
  const heading = STEP_HEADINGS[step];
  const isLastStep = step === 3;
  const primaryLabel = isLastStep
    ? bookMutation.isPending
      ? 'Placing order…'
      : 'Place order'
    : 'Continue';

  return (
    <div className="min-h-screen bg-surface-gradient pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom,0px)))]">
      <div className="bg-hero-gradient px-4 py-5 text-on-hero sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav>
            <Link
              href={`/discover/${laundryId}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-on-hero-muted hover:text-on-hero"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to {laundry.name}
            </Link>
          </nav>
          <h1 className="page-title mt-3 text-on-hero">Complete your booking</h1>
          <p className="mt-1.5 max-w-xl text-sm text-on-hero-muted">
            Schedule pickup, choose delivery, and confirm — usually under 2 minutes.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
              <CardContent className="p-4 sm:p-5">
                <CheckoutStepper currentStep={step} className="mb-8" />

                <header className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {CHECKOUT_STEPS[step]}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-foreground">{heading.title}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{heading.hint}</p>
                </header>

                {step === 0 && (
                  <AddressStep
                    addresses={addressesQ.data}
                    isLoading={addressesQ.isLoading}
                    isError={addressesQ.isError}
                    value={form.addressId}
                    onChange={(id) => patchForm('addressId', id)}
                    error={errors.address}
                  />
                )}

                {step === 1 && (
                  <PickupSlotStep
                    slots={pickupSlots}
                    value={form.pickupSlotId}
                    onChange={(id) => patchForm('pickupSlotId', id)}
                    error={errors.pickup}
                  />
                )}

                {step === 2 && (
                  <DeliverySlotStep
                    slots={deliverySlots}
                    value={form.deliverySlotId}
                    onChange={(id) => patchForm('deliverySlotId', id)}
                    error={errors.delivery}
                    pickupSummary={pickupSlot ? formatSlotSummary(pickupSlot) : null}
                    minHours={quote.maxDeliveryHours}
                  />
                )}

                {step === 3 && (
                  <PaymentStep
                    value={form.payment}
                    onChange={(p) => patchForm('payment', p)}
                    total={quote.total}
                    error={errors.payment}
                    submitError={submitError ?? undefined}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="mt-8 lg:mt-0">
            <div className="sticky top-24">
              <OrderSummarySidebar services={services} quantities={cart} />
            </div>
          </aside>
        </div>
      </div>

      <footer className="bottom-above-nav fixed left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Button type="button" variant="outline" size="lg" onClick={goBack} disabled={bookMutation.isPending}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            type="button"
            size="lg"
            className="min-w-[8rem] flex-1 sm:flex-none"
            disabled={bookMutation.isPending}
            onClick={handlePrimary}
          >
            {bookMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            )}
            {primaryLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}
