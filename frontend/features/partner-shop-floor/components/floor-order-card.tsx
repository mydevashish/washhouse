'use client';

import Link from 'next/link';
import { Loader2, Phone, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { FloorPhotoStack } from '@/features/partner-shop-floor/components/floor-photo-stack';
import {
  FLOOR_STATUS_LABELS,
  phoneLast4,
  toFloorStatus,
  type FloorAdvancePlan,
} from '@/features/partner-shop-floor/lib/floor-status';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { cn } from '@/lib/utils';
import type { PartnerOrder } from '@/services/partner';

const FLOOR_TONE: Record<string, string> = {
  received: 'border-l-[color:var(--floor-received)]',
  washing: 'border-l-[color:var(--floor-washing)]',
  ready: 'border-l-[color:var(--floor-ready)]',
  given: 'border-l-[color:var(--floor-given)]',
};

type FloorOrderCardProps = {
  order: PartnerOrder;
  plan: FloorAdvancePlan | null;
  onAdvance?: () => void;
  advancing?: boolean;
  /** Ready board: Give + Print Bill + Call instead of single advance. */
  variant?: 'today' | 'ready';
  onGive?: () => void;
  className?: string;
};

export function FloorOrderCard({
  order,
  plan,
  onAdvance,
  advancing = false,
  variant = 'today',
  onGive,
  className,
}: FloorOrderCardProps) {
  const floor = toFloorStatus(order.status, order.order_source);
  const last4 = phoneLast4(order.customer_phone);
  const telHref =
    order.customer_phone && order.customer_phone.replace(/\D/g, '').length >= 8
      ? `tel:+91${order.customer_phone.replace(/\D/g, '').slice(-10)}`
      : null;

  return (
    <li
      className={cn(
        'rounded-xl border border-border bg-card px-3 py-3 shadow-soft border-l-4',
        floor ? FLOOR_TONE[floor] : 'border-l-muted',
        className,
      )}
      data-testid={variant === 'ready' ? 'ready-order-card' : 'today-order-card'}
      data-floor-status={floor ?? undefined}
      data-order-id={order.id}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <ColorTokenChip
            colorToken={order.color_token}
            tokenCode={order.token_code}
            size="lg"
            showLabel
          />
          {floor ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {FLOOR_STATUS_LABELS[floor].hinglish}
            </p>
          ) : null}
        </div>
        <p className="text-lg font-bold tabular-nums">{formatInr(Number(order.total_inr))}</p>
      </div>

      <div className="mt-2 min-w-0">
        <p className="truncate text-base font-semibold text-foreground">{order.customer_name}</p>
        <p className="text-sm text-muted-foreground">
          {last4 ? `Phone ···${last4}` : null}
          {last4 ? ' · ' : null}
          <span className="font-mono text-xs">#{order.tracking_code}</span>
        </p>
      </div>

      <FloorPhotoStack items={order.items ?? []} className="mt-3" />

      {variant === 'today' && plan && onAdvance ? (
        <Button
          type="button"
          size="lg"
          className="mt-3 min-h-14 w-full text-base"
          disabled={advancing}
          onClick={onAdvance}
          data-testid="floor-advance-cta"
          data-floor-action={plan.action}
        >
          {advancing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden /> : null}
          {plan.label}
        </Button>
      ) : null}

      {variant === 'ready' ? (
        <div className="mt-3 flex flex-col gap-2" data-testid="ready-handoff-actions">
          <Button
            type="button"
            size="lg"
            className="min-h-14 w-full text-base"
            disabled={advancing || !onGive}
            onClick={onGive}
            data-testid="floor-give-cta"
          >
            {advancing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden /> : null}
            Give clothes / Diya
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" variant="outline" className="min-h-14 flex-1 gap-2" asChild>
              <Link
                href={`/partner/floor/print/${order.id}/bill`}
                data-testid="print-bill-link"
              >
                <Printer className="h-5 w-5" aria-hidden />
                Print Bill
              </Link>
            </Button>
            {telHref ? (
              <Button type="button" size="lg" variant="outline" className="min-h-14 flex-1 gap-2" asChild>
                <a href={telHref} data-testid="floor-call-link">
                  <Phone className="h-5 w-5" aria-hidden />
                  Call
                </a>
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="min-h-14 flex-1 gap-2"
                disabled
                data-testid="floor-call-link"
              >
                <Phone className="h-5 w-5" aria-hidden />
                Call
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}
