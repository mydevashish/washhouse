'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DoorOpen, Phone, Store, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { OWNER_IMAGES } from '@/features/partner/components/owner';
import { buildNewOrderHref } from '@/features/partner/customer-desk/phone';
import { telHref } from '@/features/partner/lib/owner-customer-crm';
import type { PartnerCustomerScope } from '@/features/partner/orders-hub/partner-orders-hub-queue';

type Props = {
  scope: NonNullable<PartnerCustomerScope>;
  onClear: () => void;
};

/** Sticky handoff when desk/directory scopes the Orders queue to one customer. */
export function PartnerCustomerScopeBar({ scope, onClear }: Props) {
  const label = scope.name || scope.phone;
  const walkInHref = buildNewOrderHref(scope.phone, scope.name || null, 'walk_in');
  const doorstepHref = buildNewOrderHref(scope.phone, scope.name || null, 'assisted');
  const callHref = telHref(scope.phone);

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border border-brand-200/70 bg-brand-50/50 p-2.5 dark:border-brand-800/50 dark:bg-brand-950/30 sm:flex-row sm:items-center sm:justify-between"
      data-testid="partner-customer-scope-bar"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/60">
          <Image
            src={OWNER_IMAGES.people}
            alt=""
            fill
            className="object-cover"
            sizes="36px"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Orders for {label}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">{scope.phone}</p>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={`Actions for ${label}`}
      >
        <Button asChild size="sm" className="h-9 gap-1.5">
          <Link href={walkInHref} aria-label={`New walk-in order for ${label}`}>
            <Store className="h-3.5 w-3.5" aria-hidden />
            Walk-in
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary" className="h-9 gap-1.5">
          <Link href={doorstepHref} aria-label={`New doorstep order for ${label}`}>
            <DoorOpen className="h-3.5 w-3.5" aria-hidden />
            Doorstep
          </Link>
        </Button>
        {callHref ? (
          <Button asChild size="sm" variant="outline" className="h-9 gap-1.5">
            <a href={callHref} aria-label={`Call ${label}`}>
              <Phone className="h-3.5 w-3.5" aria-hidden />
              Call
            </a>
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 gap-1.5"
          onClick={onClear}
          aria-label="Clear customer filter"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Clear
        </Button>
      </div>
    </div>
  );
}
