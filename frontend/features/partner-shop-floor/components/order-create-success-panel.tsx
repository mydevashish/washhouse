'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Check, Loader2, Plus, Tag, Waves } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { PrintOrderActions } from '@/features/partner-shop-floor/components/print-order-actions';
import { usePartnerFloorVoice } from '@/features/partner-shop-floor/hooks/use-partner-floor-voice';
import { buildPartnerPrintPath } from '@/features/partner-shop-floor/lib/print-lifecycle';
import { FLOOR_VOICE_SUCCESS } from '@/features/partner-shop-floor/lib/floor-voice';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { buildPartnerCreateOrderHref } from '@/features/partner/customer-desk/phone';
import { cn } from '@/lib/utils';

export type OrderCreateSuccessOrder = {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_phone: string;
  total_inr: string | number;
  color_token?: string | null;
  token_code?: string | null;
  status?: string;
};

type OrderCreateSuccessPanelProps = {
  order: OrderCreateSuccessOrder;
  /** Walk-in / Cloth Wall: start wash after tags. */
  onStartWash?: () => void;
  startWashPending?: boolean;
  showStartWash?: boolean;
  anotherOrderHref?: string;
  /** Optional English subtitle under the heading. */
  subtitle?: string;
};

/**
 * Post-create success — primary Print tags (Customers & Orders print lifecycle).
 */
export function OrderCreateSuccessPanel({
  order,
  onStartWash,
  startWashPending,
  showStartWash = false,
  anotherOrderHref = buildPartnerCreateOrderHref(),
  subtitle = 'Print garment tags now so bags stay matched on the floor.',
}: OrderCreateSuccessPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const { speak, hydrated } = usePartnerFloorVoice();
  const spokenRef = useRef(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!hydrated || spokenRef.current) return;
    spokenRef.current = true;
    speak(FLOOR_VOICE_SUCCESS);
  }, [hydrated, speak]);

  return (
    <div data-testid="walk-in-success-panel">
      <PartnerPanel
        title="Order saved"
        description={`#${order.tracking_code}`}
        bodyClassName="space-y-4 p-4"
      >
        <div
          className={cn(
            'rounded-2xl bg-success-muted/40 p-5 text-center',
            !reduceMotion && 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500',
          )}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="relative mx-auto mb-3 block h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-border/50">
            <Image
              src="/catalog/heroes/fresh-laundry.webp"
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center bg-success/20 text-success',
                !reduceMotion &&
                  'motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-400',
              )}
              aria-hidden
            >
              <Check className="h-8 w-8 stroke-[2.5] drop-shadow-sm" strokeLinecap="round" />
            </span>
          </span>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold text-foreground outline-none sm:text-2xl"
            data-testid="walk-in-success-heading"
          >
            Order saved
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.customer_name} · {order.customer_phone}
          </p>
          {order.token_code ? (
            <div className="mt-3 flex justify-center">
              <ColorTokenChip
                colorToken={order.color_token}
                tokenCode={order.token_code}
                size="lg"
                showLabel
              />
            </div>
          ) : null}
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatInr(Number(order.total_inr))}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="space-y-2">
          <Button type="button" size="lg" className="min-h-14 w-full gap-2 text-base" asChild>
            <Link
              href={buildPartnerPrintPath(order.id, 'tags')}
              data-testid="walk-in-success-print-tags"
              aria-label={`Print tags for order ${order.tracking_code}`}
            >
              <Tag className="h-5 w-5" aria-hidden />
              Print tags
            </Link>
          </Button>
          <PrintOrderActions
            orderId={order.id}
            size="default"
            showTags={false}
            className="justify-center"
          />
        </div>

        {showStartWash && onStartWash ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-14 w-full gap-2 text-base sm:w-auto"
            onClick={onStartWash}
            disabled={startWashPending || order.status === 'washing'}
            aria-busy={startWashPending}
          >
            {startWashPending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Waves className="h-5 w-5" aria-hidden />
            )}
            Start wash
          </Button>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="ghost" asChild>
            <Link href={`/partner/orders/${order.id}`} data-testid="walk-in-success-view-order">
              View order
            </Link>
          </Button>
          <Button type="button" variant="ghost" className="gap-1.5" asChild>
            <Link href={anotherOrderHref} data-testid="walk-in-success-another">
              <Plus className="h-4 w-4" aria-hidden />
              New another order
            </Link>
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/partner/orders">Back to orders</Link>
          </Button>
        </div>
      </PartnerPanel>
    </div>
  );
}
