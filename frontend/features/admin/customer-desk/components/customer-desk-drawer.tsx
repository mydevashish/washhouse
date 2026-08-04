'use client';

import { useEffect, useId, useState } from 'react';
import { MessageCircle, Phone, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

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
import { CustomerDeskBookingRequestsTab } from '@/features/admin/customer-desk/components/customer-desk-booking-requests-tab';
import { CustomerDeskOrdersTab } from '@/features/admin/customer-desk/components/customer-desk-orders-tab';
import { CustomerDeskPlaceOrderForm } from '@/features/admin/customer-desk/components/customer-desk-place-order-form';
import { buildCustomerWhatsAppUrl } from '@/features/admin/customer-desk/phone';
import { useAdminCustomerDeskLookup } from '@/features/admin/customer-desk/hooks';
import type { CustomerDeskLookupParams } from '@/features/admin/customer-desk/types';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildTelHref } from '@/features/marketing/contact/contact-constants';

export type DeskTab = 'orders' | 'booking-requests' | 'place-order';

type Props = {
  lookup: CustomerDeskLookupParams | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: DeskTab;
  onCreateBookingRequest: (phone: string, name?: string | null) => void;
};

const TABS: { id: DeskTab; label: string }[] = [
  { id: 'orders', label: 'Orders' },
  { id: 'booking-requests', label: 'Booking requests' },
  { id: 'place-order', label: 'Place order' },
];

export function CustomerDeskDrawer({
  lookup,
  open,
  onOpenChange,
  initialTab = 'orders',
  onCreateBookingRequest,
}: Props) {
  const [tab, setTab] = useState<DeskTab>(initialTab);
  const tablistId = useId();
  const profileQ = useAdminCustomerDeskLookup(lookup, open);
  const profile = profileQ.data;

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab, lookup]);

  const whatsappMessage = profile
    ? `Hi${profile.name ? ` ${profile.name}` : ''} — this is WashHouse ops regarding your laundry.`
    : undefined;
  const whatsappUrl = profile
    ? buildCustomerWhatsAppUrl(profile.phone, whatsappMessage)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[96vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl',
          // Mobile sheet: near full-height from bottom; desktop centered dialog
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
            Customer profile, past orders, booking requests, and assisted order create
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
              <p className="font-mono text-sm text-muted-foreground">{profile.phone}</p>
              <p className="text-xs text-muted-foreground">
                {profile.order_count} order{profile.order_count === 1 ? '' : 's'}
                {profile.last_order_at
                  ? ` · last ${new Date(profile.last_order_at).toLocaleDateString('en-IN')}`
                  : ''}
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {whatsappUrl ? (
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
                <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 text-xs">
                  <a href={buildTelHref(profile.phone)} aria-label={`Call ${profile.phone}`}>
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    Call
                  </a>
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
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => {
                    const idx = TABS.findIndex((x) => x.id === tab);
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      setTab(TABS[(idx + 1) % TABS.length]!.id);
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      setTab(TABS[(idx - 1 + TABS.length) % TABS.length]!.id);
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
                  <CustomerDeskOrdersTab
                    profile={profile}
                    open={open && tab === 'orders'}
                    onPlaceFirstOrder={() => setTab('place-order')}
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
                  <CustomerDeskBookingRequestsTab
                    phone={profile.phone}
                    open={open && tab === 'booking-requests'}
                    onCreateBookingRequest={() =>
                      onCreateBookingRequest(profile.phone, profile.name)
                    }
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
                  <CustomerDeskPlaceOrderForm
                    profile={profile}
                    onCreateBookingRequest={() =>
                      onCreateBookingRequest(profile.phone, profile.name)
                    }
                    onCreated={() => setTab('orders')}
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
