'use client';

import Link from 'next/link';
import { Headset, MessageCircle, Phone, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { formatInr } from '@/features/discover/detail/order-pricing';
import {
  customerInitials,
  customerSoftTag,
  newOrderPrefillHref,
  telHref,
  whatsappHref,
} from '@/features/partner/lib/owner-customer-crm';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { cn } from '@/lib/utils';
import type { CustomerInsightRow } from '@/services/customer-insights';

export function OwnerCustomerCard({ customer }: { customer: CustomerInsightRow }) {
  const tag = customerSoftTag(customer.segment);
  const call = telHref(customer.phone);
  const wa = whatsappHref(customer.phone);
  const deskHref = buildOrdersHubPath('/partner/orders', 'desk', { user_id: customer.user_id });
  const newOrderHref = newOrderPrefillHref(customer);

  return (
    <article
      className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm"
      data-testid="owner-customer-card"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold tracking-wide text-foreground ring-1 ring-border/60"
          aria-hidden
        >
          {customerInitials(customer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{customer.name}</h3>
            <span
              className={cn(
                'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                tag.className,
              )}
              title={tag.description}
            >
              <span className="sr-only">{tag.description}: </span>
              {tag.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {customer.phone ? (
              <a href={call ?? undefined} className={cn(call && 'hover:text-foreground hover:underline')}>
                {customer.phone}
              </a>
            ) : (
              <span>No phone on file</span>
            )}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center sm:text-left">
        <div className="rounded-lg bg-muted/40 px-2 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">LTV</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {formatInr(Number(customer.lifetime_spend_inr))}
          </dd>
        </div>
        <div className="rounded-lg bg-muted/40 px-2 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Orders</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{customer.order_count}</dd>
        </div>
        <div className="rounded-lg bg-muted/40 px-2 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Last</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">
            {customer.last_order_at ? <ClientDate iso={customer.last_order_at} mode="date" /> : '—'}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions for ${customer.name}`}>
        {call ? (
          <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-1.5">
            <a href={call}>
              <Phone className="h-3.5 w-3.5" aria-hidden />
              Call
            </a>
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" className="min-h-[44px] gap-1.5" disabled>
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Call
          </Button>
        )}
        {wa ? (
          <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-1.5">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              WhatsApp
            </a>
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" className="min-h-[44px] gap-1.5" disabled>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            WhatsApp
          </Button>
        )}
        <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-1.5">
          <Link href={newOrderHref}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New order
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="min-h-[44px] gap-1.5">
          <Link href={deskHref}>
            <Headset className="h-3.5 w-3.5" aria-hidden />
            History
          </Link>
        </Button>
      </div>
    </article>
  );
}
