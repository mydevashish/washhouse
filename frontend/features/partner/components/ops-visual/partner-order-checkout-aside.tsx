'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { PARTNER_CHECKOUT_CTA } from '@/features/partner/lib/partner-compact';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export type PartnerDeliveryType = 'Pickup' | 'Delivery' | 'Both' | 'Walk-in';

export type PartnerCheckoutTotals = {
  subtotal: number;
  discount: number;
  pickupCharge: number;
  deliveryCharge: number;
  expressCharge: number;
  advancePaid: number;
  balanceDue: number;
  grandTotal: number;
  serviceCount: number;
  itemCount: number;
};

export function computePartnerCheckoutTotals(input: {
  subtotal: number;
  couponApplied: boolean;
  couponDiscountType?: 'percent' | 'flat';
  couponDiscountInr?: number;
  discountType?: 'none' | 'percent' | 'flat';
  discountValue?: number;
  deliveryType: PartnerDeliveryType;
  lineCount: number;
  itemQty: number;
  expressOrder?: boolean;
  pickupChargeOverride?: number;
  deliveryChargeOverride?: number;
  advancePaid?: number;
  expressChargeOverride?: number;
}): PartnerCheckoutTotals {
  const manualDiscount =
    input.discountType === 'none'
      ? 0
      : input.discountValue != null && input.discountValue > 0
      ? input.discountType === 'percent'
        ? Math.min(
            input.subtotal,
            Math.round((input.subtotal * Math.min(100, Number(input.discountValue || 0))) / 100),
          )
        : Math.min(input.subtotal, Math.round(Number(input.discountValue || 0)))
      : 0;
  const discount = input.couponApplied
    ? input.couponDiscountInr != null
      ? Math.min(
          input.subtotal,
          input.couponDiscountType === 'percent'
            ? Math.round((input.subtotal * input.couponDiscountInr) / 100)
            : Math.round(input.couponDiscountInr),
        )
      : Math.min(100, Math.round(input.subtotal * 0.07))
    : manualDiscount;
  const pickupCharge =
    input.pickupChargeOverride ??
    (input.deliveryType === 'Delivery' || input.deliveryType === 'Walk-in'
      ? 0
      : input.lineCount > 0
        ? 30
        : 0);
  const deliveryCharge =
    input.deliveryChargeOverride ??
    (input.deliveryType === 'Pickup' || input.deliveryType === 'Walk-in'
      ? 0
      : input.lineCount > 0
        ? 30
        : 0);
  const expressCharge = input.expressOrder ? (input.expressChargeOverride ?? 100) : 0;
  const subtotalWithExtras = Math.max(
    0,
    input.subtotal - discount + pickupCharge + deliveryCharge + expressCharge,
  );
  const advancePaid = Math.max(0, input.advancePaid ?? 0);
  const grandTotal = subtotalWithExtras;
  const balanceDue = Math.max(0, grandTotal - advancePaid);

  return {
    subtotal: input.subtotal,
    discount,
    pickupCharge,
    deliveryCharge,
    expressCharge,
    advancePaid,
    balanceDue,
    grandTotal,
    serviceCount: input.lineCount,
    itemCount: input.itemQty,
  };
}

type Props = {
  totals: PartnerCheckoutTotals;
  couponCode: string;
  onCouponCodeChange: (value: string) => void;
  couponApplied: boolean;
  onToggleCoupon: () => void;
  onApplyCoupon?: () => void;
  applyCouponPending?: boolean;
  couponError?: string | null;
  discountType: 'none' | 'percent' | 'flat';
  onDiscountTypeChange: (value: 'none' | 'percent' | 'flat') => void;
  discountValue: number;
  onDiscountValueChange: (value: number) => void;
  deliveryType: PartnerDeliveryType;
  onDeliveryTypeChange: (value: PartnerDeliveryType) => void;
  deliveryDate: string;
  onDeliveryDateChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  pickupCharge: number;
  onPickupChargeChange: (value: number) => void;
  deliveryCharge: number;
  onDeliveryChargeChange: (value: number) => void;
  expressCharge?: number;
  onExpressChargeChange?: (value: number) => void;
  advancePaid: number;
  onAdvancePaidChange: (value: number) => void;
  expressOrder: boolean;
  onExpressOrderChange: (value: boolean) => void;
  submitPending?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  onSubmit?: () => void;
  className?: string;
  hideSubmitButton?: boolean;
};

export function PartnerOrderCheckoutAside({
  totals,
  couponCode,
  onCouponCodeChange,
  couponApplied,
  onToggleCoupon,
  onApplyCoupon,
  applyCouponPending,
  couponError,
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  deliveryType,
  onDeliveryTypeChange,
  deliveryDate,
  onDeliveryDateChange,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
  pickupCharge,
  onPickupChargeChange,
  deliveryCharge,
  onDeliveryChargeChange,
  advancePaid,
  onAdvancePaidChange,
  expressOrder,
  onExpressOrderChange,
  expressCharge,
  onExpressChargeChange,
  submitPending,
  submitDisabled,
  submitLabel = 'Create order & generate tags',
  onSubmit,
  className,
  hideSubmitButton,
}: Props) {
  const breakdown = [
    { label: 'Sub total', value: formatInr(totals.subtotal) },
    ...(totals.discount > 0
      ? [{ label: 'Discount', value: `- ${formatInr(totals.discount)}` }]
      : []),
    ...(deliveryType !== 'Walk-in'
      ? [
          { label: 'Pickup charge', value: formatInr(totals.pickupCharge) },
          { label: 'Delivery charge', value: formatInr(totals.deliveryCharge) },
        ]
      : []),
    ...(expressOrder ? [{ label: 'Express service', value: formatInr(totals.expressCharge) }] : []),
    { label: 'Advance paid', value: `- ${formatInr(totals.advancePaid)}` },
    { label: 'Balance due', value: formatInr(totals.balanceDue) },
  ];

  useEffect(() => {
    if (deliveryType === 'Walk-in') {
      if (pickupCharge !== 0) {
        onPickupChargeChange(0);
      }

      if (deliveryCharge !== 0) {
        onDeliveryChargeChange(0);
      }
    }
  }, [
    deliveryType,
    pickupCharge,
    deliveryCharge,
    onPickupChargeChange,
    onDeliveryChargeChange,
  ]);

  return (
    <aside
      className={cn(
        'flex flex-col lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start',
        className,
      )}
    >
      <Card className="flex min-h-0 flex-1 flex-col border-border">
        <CardHeader className="shrink-0 space-y-3">
          <CardTitle>Order summary</CardTitle>
          <div className="flex gap-2">
            {!hideSubmitButton ? (
              <Button
                type={onSubmit ? 'button' : 'submit'}
                size="lg"
                className={cn(PARTNER_CHECKOUT_CTA, 'flex-1 text-base')}
                disabled={submitDisabled || submitPending}
                aria-busy={submitPending}
                data-testid="partner-create-order-submit"
                onClick={onSubmit}
              >
                {submitPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  submitLabel
                )}
              </Button>
            ) : (
              <div className="flex-1" />
            )}
          </div>
          {submitDisabled && !submitPending && !hideSubmitButton ? (
            <p className="text-center text-xs text-muted-foreground">
              Add at least one service in the line items table, then tap create order.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-3 rounded-xl bg-muted/40 p-4">
            <div>
              {/* <Label htmlFor="po-coupon">Coupon discount</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="po-coupon"
                  value={couponCode}
                  onChange={(e) => onCouponCodeChange(e.target.value)}
                  placeholder="WELCOME10"
                  className="min-h-9"
                />
                <Button
                  type="button"
                  size="sm"
                  variant={couponApplied ? 'success' : 'outline'}
                  className="min-h-9 shrink-0"
                  disabled={applyCouponPending || !couponCode.trim()}
                  aria-busy={applyCouponPending}
                  onClick={() => {
                    if (couponApplied) {
                      onToggleCoupon();
                      return;
                    }
                    onApplyCoupon?.();
                  }}
                >
                  {applyCouponPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : couponApplied ? (
                    'Remove'
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div> */}
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="po-discount-type">Discount type</Label>
                  <Select
                    id="po-discount-type"
                    value={discountType}
                    onChange={(e) => {
                      const value = e.target.value as 'none' | 'percent' | 'flat';
                      onDiscountTypeChange(value);
                      if (value === 'none') {
                        onDiscountValueChange(0);
                      }
                    }}
                    // onChange={(e) => onDiscountTypeChange(e.target.value as 'percent' | 'flat')}
                    className="mt-1 min-h-9"
                  >
                    <option value="none">None</option>
                    <option value="percent">By %</option>
                    <option value="flat">Flat amount</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="po-discount-value">
                    {discountType === 'percent' ? 'Percent' : 'Amount'}
                  </Label>
                  <Input
                    id="po-discount-value"
                    type="number"
                    min="0"
                    step={discountType === 'percent' ? '1' : '10'}
                    max={discountType === 'percent' ? '100' : undefined}
                    value={discountValue}
                    onChange={(e) => onDiscountValueChange(Number(e.target.value || 0))}
                    className="mt-1 min-h-9"
                  />
                </div>
              </div>
              {couponError ? (
                <p className="mt-1 text-[11px] text-danger" role="alert">
                  {couponError}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Use a % discount or a flat amount directly in the order summary.
                </p>
              )}
            </div>

            <div>
              <Label>Pickup / Delivery</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                {(['Pickup', 'Delivery', 'Both', 'Walk-in'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant={deliveryType === type ? 'default' : 'outline'}
                    className="min-h-9"
                    onClick={() => onDeliveryTypeChange(type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Use Walk-in for in-store service; pick-up and delivery are editable below.
              </p>
            </div>
            
            {deliveryType !== 'Walk-in' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="po-pickup-charge">Pickup charge</Label>
                  <Input
                    id="po-pickup-charge"
                    type="number"
                    min="0"
                    step="10"
                    value={pickupCharge}
                    onChange={(e) => onPickupChargeChange(Number(e.target.value || 0))}
                    className="mt-2 min-h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="po-delivery-charge">Delivery charge</Label>
                  <Input
                    id="po-delivery-charge"
                    type="number"
                    min="0"
                    step="10"
                    value={deliveryCharge}
                    onChange={(e) => onDeliveryChargeChange(Number(e.target.value || 0))}
                    className="mt-2 min-h-9"
                  />
                </div>
              </div>
            ) : null}  

            <div>
              <Label htmlFor="po-advance-paid">Advance payment</Label>
              <Input
                id="po-advance-paid"
                type="number"
                min="0"
                step="10"
                value={advancePaid}
                onChange={(e) => onAdvancePaidChange(Number(e.target.value || 0))}
                className="mt-2 min-h-9"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={expressOrder}
                onChange={(e) => onExpressOrderChange(e.target.checked)}
              />
              Express service (+₹100)
            </label>

            {expressOrder ? (
              <div className="mt-2">
                <Label htmlFor="po-express-charge">Express charge</Label>
                <Input
                  id="po-express-charge"
                  type="number"
                  min="0"
                  step={10}
                  value={expressCharge ?? totals.expressCharge}
                  onChange={(e) => onExpressChargeChange?.(Number(e.target.value || 0))}
                  className="mt-2 min-h-9"
                />
              </div>
            ) : null}

            <div>
              <Label htmlFor="po-delivery-date">Preferred delivery date</Label>
              <Input
                id="po-delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => onDeliveryDateChange(e.target.value)}
                className="mt-2 min-h-9"
              />
            </div>

            <div>
              <Label htmlFor="po-payment">Payment method</Label>
              <Select
                id="po-payment"
                value={paymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
                className="mt-2 min-h-9"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </Select>
            </div>

            {/* <div>
              <Label htmlFor="po-notes">Notes</Label>
              <Textarea
                id="po-notes"
                rows={2}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
              />
            </div> */}
          </div>

          <div className="space-y-3 rounded-xl bg-muted/10 p-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                {totals.serviceCount} service{totals.serviceCount === 1 ? '' : 's'}
              </span>
              {/* <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'}
              </span> */}
            </div>
            {breakdown.map((row) => (
              <div key={row.label} className="flex justify-between text-sm text-muted-foreground">
                <span>{row.label}</span>
                <span className="tabular-nums text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="shrink-0 flex-col gap-3 border-t border-border bg-card">
          <div className="flex w-full items-center justify-between rounded-xl bg-muted p-4 text-base font-semibold">
            <span>Grand total</span>
            <span className="tabular-nums">{formatInr(totals.grandTotal)}</span>
          </div>
        </CardFooter>
      </Card>
    </aside>
  );
}
