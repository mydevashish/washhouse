'use client';

import Link from 'next/link';
import { CalendarClock, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  computeOrderQuote,
  formatDeliveryEstimate,
  formatInr,
} from '@/features/discover/detail/order-pricing';
import type { LaundryServiceItem } from '@/services/laundries';
import { cn } from '@/lib/utils';

type OrderSummarySidebarProps = {
  services: LaundryServiceItem[];
  quantities: Record<string, number>;
  className?: string;
  children?: React.ReactNode;
  compact?: boolean;
};

export function OrderSummarySidebar({
  services,
  quantities,
  className,
  children,
  compact = false,
}: OrderSummarySidebarProps) {
  const quote = computeOrderQuote(services, quantities);
  const hasItems = quote.lines.length > 0;

  if (!hasItems) {
    return (
      <Card className={cn('border-dashed', className)} aria-label="Order summary">
        <CardContent className={cn('text-center', compact ? 'py-8' : 'py-10')}>
          <p className="font-medium text-foreground">Your order</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a service and set quantity to see pricing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn('border-primary/25 shadow-pop', className)}
      aria-label="Order summary"
      aria-live="polite"
    >
      <CardContent className={cn(compact ? 'p-4' : 'p-6')}>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Order summary</p>
        <h3 className="mt-1 text-lg font-bold text-foreground">Price breakdown</h3>

        <ul className={cn('space-y-3', compact ? 'mt-4' : 'mt-5')}>
          {quote.lines.map(({ service, quantity, unitPrice, lineTotal }) => (
            <li key={service.id} className="text-sm">
              <div className="flex justify-between gap-2 font-medium text-foreground">
                <span className="truncate">{service.name}</span>
                <span className="shrink-0 tabular-nums">{formatInr(lineTotal)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatInr(unitPrice)} × {quantity}
              </p>
            </li>
          ))}
        </ul>

        <div className="my-4 border-t border-border" role="separator" />

        <dl className="space-y-2.5 text-sm">
          <Row label="Service price" value={formatInr(quote.subtotal)} />
          <Row label="Delivery fee" value={formatInr(quote.deliveryFee)} hint="Pickup & drop" />
          <Row
            label={`Taxes (GST ${quote.cgst > 0 ? '18%' : ''})`}
            value={formatInr(quote.taxesTotal)}
            hint="CGST + SGST"
          />
        </dl>

        <div className="mt-4 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-foreground">Total</span>
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {formatInr(quote.total)}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
          <p className="flex items-start gap-2 text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Turnaround:</span> up to{' '}
              {quote.maxDeliveryHours} hours after pickup
            </span>
          </p>
          <p className="flex items-start gap-2 text-muted-foreground">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Est. delivery:</span>{' '}
              {formatDeliveryEstimate(quote.estimatedDeliveryBy)}
            </span>
          </p>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {quote.itemCount} {quote.itemCount === 1 ? 'item' : 'items'} · Estimate only; final bill at
          checkout
        </p>

        {children}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">
        {label}
        {hint && <span className="block text-xs">{hint}</span>}
      </dt>
      <dd className="shrink-0 font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export function SignInPrompt() {
  return (
    <Button asChild className="mt-4 w-full" variant="outline">
      <Link href="/login">Sign in to book pickup</Link>
    </Button>
  );
}
