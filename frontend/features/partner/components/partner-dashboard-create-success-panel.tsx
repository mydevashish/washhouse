'use client';

import Link from 'next/link';
import { forwardRef, useEffect, useRef } from 'react';
import { Check, Plus, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { formatOrderItemsSummary } from '@/features/partner/lib/format-order-items-summary';
import { ColorTokenBar } from '@/features/partner-shop-floor/components/color-token-bar';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { PartnerCreateWhatsAppNotice } from '@/features/partner/components/partner-create-whatsapp-notice';
import {
  buildPartnerPrintPath,
} from '@/features/partner-shop-floor/lib/print-lifecycle';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import type { WalkInOrder } from '@/services/partner-walk-in-orders';
import { cn } from '@/lib/utils';

type PartnerDashboardCreateSuccessPanelProps = {
  order: WalkInOrder;
  onAddAnother?: () => void;
  className?: string;
};

function tagsPrintHref(orderId: string): string {
  return buildPartnerPrintPath(orderId, 'tags');
}

function bagLabelPrintHref(orderId: string): string {
  return `${buildPartnerPrintPath(orderId, 'tags')}#tag-bag-master`;
}

/**
 * Post-create success on `/partner` — prominent bag token + print CTAs (hub-compatible URLs).
 */
export const PartnerDashboardCreateSuccessPanel = forwardRef<
  HTMLDivElement,
  PartnerDashboardCreateSuccessPanelProps
>(function PartnerDashboardCreateSuccessPanel({ order, onAddAnother, className }, ref) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const itemSummary = formatOrderItemsSummary(order.items);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    const node = typeof ref === 'function' ? null : ref?.current;
    node?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [order.id, reduceMotion, ref]);

  return (
    <section
      ref={ref}
      className={cn(
        'rounded-3xl border border-success/30 bg-success-muted/30 p-5 shadow-sm sm:p-6',
        !reduceMotion && 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500',
        className,
      )}
      aria-labelledby="partner-dashboard-create-success-heading"
      data-testid="partner-dashboard-create-success"
    >
      <div
        className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success',
                !reduceMotion &&
                  'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-300',
              )}
              aria-hidden
            >
              <Check className="h-6 w-6 stroke-[2.5]" strokeLinecap="round" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2
                id="partner-dashboard-create-success-heading"
                ref={headingRef}
                tabIndex={-1}
                className="text-lg font-semibold outline-none sm:text-xl"
              >
                Order saved
              </h2>
              <p className="text-sm text-muted-foreground">
                {order.customer_name} · {order.customer_phone}
              </p>
              <p className="font-mono text-sm font-medium text-foreground">
                #{order.tracking_code}
              </p>
              {itemSummary ? (
                <p className="text-sm text-foreground" data-testid="partner-dashboard-item-summary">
                  {itemSummary}
                </p>
              ) : null}
              <p className="text-base font-semibold tabular-nums">{formatInr(Number(order.total_inr))}</p>
            </div>
          </div>

          {order.token_code ? (
            <div
              className="rounded-2xl border border-border/80 bg-background/90 p-4 text-center sm:p-5"
              data-testid="partner-dashboard-bag-token-hero"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Bag token — say this aloud
              </p>
              <div className="mx-auto mt-3 max-w-xs">
                <ColorTokenBar
                  colorToken={order.color_token}
                  variant="bar"
                  className="h-10 rounded-lg sm:h-12"
                  label={`${order.token_code} color bar`}
                />
              </div>
              <p
                className="mt-3 font-mono text-5xl font-extrabold leading-none tracking-tight text-foreground sm:text-6xl"
                data-testid="partner-dashboard-token-code"
              >
                {order.token_code}
              </p>
              <div className="mt-3 flex justify-center">
                <ColorTokenChip
                  colorToken={order.color_token}
                  tokenCode={order.token_code}
                  size="lg"
                  showLabel
                />
              </div>
            </div>
          ) : null}

          <PartnerCreateWhatsAppNotice order={order} className="pt-1" />
        </div>

        <div className="flex w-full shrink-0 flex-col gap-2 lg:max-w-xs">
          <Button type="button" size="lg" className="min-h-12 w-full gap-2" asChild>
            <Link
              href={tagsPrintHref(order.id)}
              data-testid="partner-dashboard-print-tags"
              aria-label={`Print tags now for order ${order.tracking_code}`}
            >
              <Tag className="h-5 w-5" aria-hidden />
              Print tags now
            </Link>
          </Button>
          <Button type="button" variant="outline" className="min-h-11 w-full" asChild>
            <Link
              href={bagLabelPrintHref(order.id)}
              data-testid="partner-dashboard-print-bag-label"
            >
              Print bag label
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full gap-1.5"
            onClick={() => onAddAnother?.()}
            disabled={!onAddAnother}
            data-testid="partner-dashboard-add-another-order"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add another order
          </Button>
          <Button type="button" variant="ghost" className="min-h-11 w-full" asChild>
            <Link
              href={`/partner/orders/${order.id}`}
              data-testid="partner-dashboard-open-order-detail"
            >
              Open order detail
            </Link>
          </Button>
        </div>
      </div>
      <p className="sr-only">
        Order {order.tracking_code} saved.
        {order.token_code ? ` Bag token ${order.token_code}.` : ''}
        {itemSummary ? ` Items: ${itemSummary}.` : ''}
        Total {formatInr(Number(order.total_inr))}.
        Primary action: print tags.
      </p>
    </section>
  );
});
