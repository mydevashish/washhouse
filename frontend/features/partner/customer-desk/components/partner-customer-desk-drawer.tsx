'use client';

import { useEffect, useId, useState } from 'react';
import { MessageCircle, Phone, Store, UserRound } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerCustomerDeskBookingRequestsTab } from '@/features/partner/customer-desk/components/partner-customer-desk-booking-requests-tab';
import { PartnerCustomerDeskOrdersTab } from '@/features/partner/customer-desk/components/partner-customer-desk-orders-tab';
import { PartnerCustomerDeskPlaceOrderForm } from '@/features/partner/customer-desk/components/partner-customer-desk-place-order-form';
import { buildCustomerWhatsAppUrl, buildWalkInPrefillHref } from '@/features/partner/customer-desk/phone';
import { usePartnerCustomerDeskLookup } from '@/features/partner/customer-desk/hooks';
import type {
  CustomerDeskLookupParams,
  ReorderPrefill,
} from '@/features/partner/customer-desk/types';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildTelHref } from '@/features/marketing/contact/contact-constants';
import { cn } from '@/lib/utils';

export type PartnerDeskTab = 'orders' | 'booking-requests' | 'place-order';

type Props = {
  lookup: CustomerDeskLookupParams | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: PartnerDeskTab;
  onCreateBookingRequest: (phone: string, name?: string | null) => void;
};

const TABS: { id: PartnerDeskTab; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'place-order', label: 'New order' },
  { id: 'booking-requests', label: 'Requests' },
];

export function PartnerCustomerDeskDrawer({
  lookup,
  open,
  onOpenChange,
  initialTab = 'orders',
  onCreateBookingRequest,
}: Props) {
  const [tab, setTab] = useState<PartnerDeskTab>(initialTab);
  const [reorder, setReorder] = useState<ReorderPrefill | null>(null);
  const tablistId = useId();
  const profileQ = usePartnerCustomerDeskLookup(lookup, open);
  const profile = profileQ.data;

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      if (initialTab !== 'place-order') setReorder(null);
    }
  }, [open, initialTab, lookup]);

  const whatsappMessage = profile
    ? `Hi${profile.name ? ` ${profile.name}` : ''} — this is ${profile.name ? 'your laundry' : 'WashHouse'} regarding your order.`
    : undefined;
  const whatsappUrl = profile
    ? buildCustomerWhatsAppUrl(profile.phone, whatsappMessage)
    : null;
  const walkInHref = profile
    ? buildWalkInPrefillHref(profile.phone, profile.name)
    : '/partner/walk-in-orders';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[96vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl',
          'left-0 right-0 top-auto max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl',
          'bottom-0 sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl',
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 px-4 pb-3 pt-4 sm:px-5">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <UserRound className="h-4 w-4 shrink-0" aria-hidden />
            Customer Desk
          </DialogTitle>
          <DialogDescription className="sr-only">
            Customer profile, your laundry&apos;s past orders, and assisted order create
          </DialogDescription>

          {profileQ.isLoading ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : null}

          {profileQ.isError ? (
            <InfoBanner variant="destructive" title="Lookup failed">
              {getApiErrorMessage(profileQ.error)}
            </InfoBanner>
          ) : null}

          {profile ? (
            <div className="space-y-2 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold text-foreground">
                  {profile.name?.trim() || 'Guest caller'}
                </p>
                <Badge variant={profile.registered ? 'success' : 'secondary'}>
                  {profile.registered ? 'Registered' : 'Guest'}
                </Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">{profile.phone || '—'}</p>
              <p className="text-xs text-muted-foreground">
                {profile.order_count} order{profile.order_count === 1 ? '' : 's'} at your laundry
                {profile.last_order_at
                  ? ` · last ${new Date(profile.last_order_at).toLocaleDateString('en-IN')}`
                  : ''}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Other shops&apos; orders for this customer are hidden.
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {whatsappUrl && profile.phone ? (
                  <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`WhatsApp ${profile.name ?? profile.phone}`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                      WhatsApp
                    </a>
                  </Button>
                ) : null}
                {profile.phone ? (
                  <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 text-xs">
                    <a href={buildTelHref(profile.phone)} aria-label={`Call ${profile.phone}`}>
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      Call
                    </a>
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 text-xs">
                  <Link
                    href={walkInHref}
                    aria-label={`Record walk-in order for ${profile.name ?? profile.phone ?? 'customer'}`}
                  >
                    <Store className="h-3.5 w-3.5" aria-hidden />
                    Walk-in
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogHeader>

        {profile ? (
          <>
            <div
              id={tablistId}
              role="tablist"
              aria-label="Customer desk sections"
              className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-border/60 bg-muted/40 px-2 py-1.5"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`${tablistId}-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`${tablistId}-panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => {
                    setTab(t.id);
                    if (t.id !== 'place-order') setReorder(null);
                  }}
                  onKeyDown={(e) => {
                    const idx = TABS.findIndex((x) => x.id === tab);
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      const next = TABS[(idx + 1) % TABS.length]!;
                      setTab(next.id);
                      if (next.id !== 'place-order') setReorder(null);
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      const next = TABS[(idx - 1 + TABS.length) % TABS.length]!;
                      setTab(next.id);
                      if (next.id !== 'place-order') setReorder(null);
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      setTab(TABS[0]!.id);
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      setTab(TABS[TABS.length - 1]!.id);
                    }
                  }}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    tab === t.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
              <div
                role="tabpanel"
                id={`${tablistId}-panel-orders`}
                aria-labelledby={`${tablistId}-orders`}
                hidden={tab !== 'orders'}
              >
                {tab === 'orders' ? (
                  <PartnerCustomerDeskOrdersTab
                    profile={profile}
                    open={open && tab === 'orders'}
                    onPlaceFirstOrder={() => {
                      setReorder(null);
                      setTab('place-order');
                    }}
                    onReorder={(prefill) => {
                      setReorder(prefill);
                      setTab('place-order');
                    }}
                  />
                ) : null}
              </div>
              <div
                role="tabpanel"
                id={`${tablistId}-panel-place-order`}
                aria-labelledby={`${tablistId}-place-order`}
                hidden={tab !== 'place-order'}
              >
                {tab === 'place-order' ? (
                  <PartnerCustomerDeskPlaceOrderForm
                    profile={profile}
                    reorder={reorder}
                    onCreateBookingRequest={() =>
                      onCreateBookingRequest(profile.phone, profile.name)
                    }
                    onCreated={() => {
                      setReorder(null);
                      setTab('orders');
                    }}
                  />
                ) : null}
              </div>
              <div
                role="tabpanel"
                id={`${tablistId}-panel-booking-requests`}
                aria-labelledby={`${tablistId}-booking-requests`}
                hidden={tab !== 'booking-requests'}
              >
                {tab === 'booking-requests' ? (
                  <PartnerCustomerDeskBookingRequestsTab
                    phone={profile.phone || null}
                    open={open && tab === 'booking-requests'}
                    onCreateBookingRequest={() =>
                      onCreateBookingRequest(profile.phone, profile.name)
                    }
                  />
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
