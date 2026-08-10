'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { cn } from '@/lib/utils';

export type PartnerDeliveryType = 'Pickup' | 'Delivery' | 'Both';

export type PartnerCheckoutTotals = {
  subtotal: number;
  discount: number;
  pickupCharge: number;
  deliveryCharge: number;
  packingCharge: number;
  sgst: number;
  cgst: number;
  grandTotal: number;
  serviceCount: number;
  itemCount: number;
};

export function computePartnerCheckoutTotals(input: {
  subtotal: number;
  couponApplied: boolean;
  /** Fixed discount in INR when coupon validated; falls back to 7% cap when omitted. */
  couponDiscountInr?: number;
  deliveryType: PartnerDeliveryType;
  lineCount: number;
  itemQty: number;
}): PartnerCheckoutTotals {
  const discount = input.couponApplied
    ? input.couponDiscountInr != null
      ? Math.min(input.subtotal, Math.round(input.couponDiscountInr))
      : Math.min(100, Math.round(input.subtotal * 0.07))
    : 0;
  const packingCharge = input.lineCount > 0 ? 10 : 0;
  const pickupCharge = input.deliveryType === 'Delivery' ? 0 : input.lineCount > 0 ? 30 : 0;
  const deliveryCharge = input.deliveryType === 'Pickup' ? 0 : input.lineCount > 0 ? 30 : 0;
  const taxable = Math.max(
    0,
    input.subtotal - discount + pickupCharge + deliveryCharge + packingCharge,
  );
  const sgst = Math.round(taxable * 0.025 * 100) / 100;
  const cgst = sgst;
  const grandTotal = taxable + sgst + cgst;

  return {
    subtotal: input.subtotal,
    discount,
    pickupCharge,
    deliveryCharge,
    packingCharge,
    sgst,
    cgst,
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
  deliveryType: PartnerDeliveryType;
  onDeliveryTypeChange: (value: PartnerDeliveryType) => void;
  deliveryDate: string;
  onDeliveryDateChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
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
  deliveryType,
  onDeliveryTypeChange,
  deliveryDate,
  onDeliveryDateChange,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
  submitPending,
  submitDisabled,
  submitLabel = 'Create order & generate tags',
  onSubmit,
  className,
  hideSubmitButton,
}: Props) {
  const breakdown = [
    { label: 'Sub total', value: formatInr(totals.subtotal) },
    { label: 'Discount', value: `- ${formatInr(totals.discount)}` },
    { label: 'Pickup charge', value: formatInr(totals.pickupCharge) },
    { label: 'Delivery charge', value: formatInr(totals.deliveryCharge) },
    { label: 'Packing charge', value: formatInr(totals.packingCharge) },
    { label: 'SGST 2.5%', value: formatInr(totals.sgst) },
    { label: 'CGST 2.5%', value: formatInr(totals.cgst) },
  ];

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
          {!hideSubmitButton ? (
            <>
              <Button
                type={onSubmit ? 'button' : 'submit'}
                size="lg"
                className="min-h-12 w-full text-base"
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
              {submitDisabled && !submitPending ? (
                <p className="text-center text-xs text-muted-foreground">
                  Add at least one service in the line items table, then tap create order.
                </p>
              ) : null}
            </>
          ) : null}
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-3 rounded-3xl bg-muted/40 p-4">
            <div>
              <Label htmlFor="po-coupon">Coupon discount</Label>
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
              </div>
              {couponError ? (
                <p className="mt-1 text-[11px] text-danger" role="alert">
                  {couponError}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Shop coupons from the sidebar — discount applies on save.
                </p>
              )}
            </div>

            <div>
              <Label>Pickup / Delivery</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(['Pickup', 'Delivery', 'Both'] as const).map((type) => (
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
                Pick-up charged when not Delivery only; delivery charged when not Pickup only.
              </p>
            </div>

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

            <div>
              <Label htmlFor="po-notes">Notes</Label>
              <Textarea
                id="po-notes"
                rows={2}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-3xl bg-muted/10 p-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                {totals.serviceCount} service{totals.serviceCount === 1 ? '' : 's'}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'}
              </span>
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
          <div className="flex w-full items-center justify-between rounded-3xl bg-muted p-4 text-base font-semibold">
            <span>Grand total</span>
            <span className="tabular-nums">{formatInr(totals.grandTotal)}</span>
          </div>
        </CardFooter>
      </Card>
    </aside>
  );
}
