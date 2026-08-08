'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Headset, Package } from 'lucide-react';
import Link from 'next/link';
import { isAxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { PartnerBookingRequestCreateDialog } from '@/features/partner/booking-requests/partner-booking-request-create-dialog';
import type { PartnerBookingCreatePrefill } from '@/features/partner/booking-requests/types';
import { usePartnerBookingRequestsList } from '@/features/partner/booking-requests/hooks';
import {
  PartnerCustomerDeskDrawer,
  type PartnerDeskTab,
} from '@/features/partner/customer-desk/components/partner-customer-desk-drawer';
import { PartnerCustomerDeskResults } from '@/features/partner/customer-desk/components/partner-customer-desk-results';
import {
  PartnerCustomerDeskSearch,
  type PartnerDeskSearchSubmit,
} from '@/features/partner/customer-desk/components/partner-customer-desk-search';
import { lookupPartnerCustomer, searchPartnerCustomers } from '@/features/partner/customer-desk/api';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/partner/customer-desk/phone';
import type {
  CustomerDeskLookupParams,
  CustomerDeskProfile,
} from '@/features/partner/customer-desk/types';
import { customerDeskLookupKey, guestDeskProfile } from '@/features/partner/customer-desk/types';
import {
  usePartnerOrders,
  usePartnerQueriesEnabled,
} from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';

function parseLookupFromSearch(
  phoneParam: string | null,
  userIdParam: string | null,
): CustomerDeskLookupParams | null {
  if (userIdParam?.trim()) return { user_id: userIdParam.trim() };
  if (phoneParam?.trim()) {
    const phone = normalizeIndianPhoneInput(phoneParam);
    if (isValidIndianMobileE164(phone)) return { phone };
  }
  return null;
}

type PartnerOrdersTodayPanelProps = {
  /** @deprecated Ignored — counts come from paginated APIs. */
  orders?: unknown;
};

/** Soft-merge Today strip: phone search + waiting requests preview on `tab=orders`. */
export function PartnerOrdersTodayPanel(_props: PartnerOrdersTodayPanelProps = {}) {
  const router = useRouter();
  const enabled = usePartnerQueriesEnabled();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone');
  const userIdParam = searchParams.get('user_id');
  const rawTab = searchParams.get('tab');
  const tabParam =
    rawTab === 'place-order' || rawTab === 'booking-requests' || rawTab === 'orders'
      ? (rawTab as PartnerDeskTab)
      : null;

  const urlLookup = useMemo(
    () => parseLookupFromSearch(phoneParam, userIdParam),
    [phoneParam, userIdParam],
  );

  const [lookup, setLookup] = useState<CustomerDeskLookupParams | null>(urlLookup);
  const [deskOpen, setDeskOpen] = useState(Boolean(urlLookup));
  const [initialTab, setInitialTab] = useState<PartnerDeskTab>(
    tabParam === 'place-order' || tabParam === 'booking-requests' ? tabParam : 'orders',
  );
  const [searchQuery, setSearchQuery] = useState(
    urlLookup && 'phone' in urlLookup ? urlLookup.phone : '',
  );
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [brOpen, setBrOpen] = useState(false);
  const [brPrefill, setBrPrefill] = useState<PartnerBookingCreatePrefill | null>(null);

  useEffect(() => {
    if (!urlLookup) return;
    setLookup(urlLookup);
    setDeskOpen(true);
    if ('phone' in urlLookup) setSearchQuery(urlLookup.phone);
    if (tabParam === 'place-order' || tabParam === 'booking-requests') {
      setInitialTab(tabParam);
    }
  }, [urlLookup, tabParam]);

  const previewQ = useQuery({
    queryKey: queryKeys.partnerCustomerDeskLookup(lookup ? customerDeskLookupKey(lookup) : ''),
    queryFn: async () => {
      try {
        return await lookupPartnerCustomer(lookup!);
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404 && lookup && 'phone' in lookup) {
          return guestDeskProfile(lookup.phone);
        }
        throw err;
      }
    },
    enabled: Boolean(enabled && lookup && deskOpen),
    staleTime: STALE.partnerAnalytics,
    retry: false,
  });

  const searchQ = useQuery({
    queryKey: queryKeys.partnerCustomerDeskSearch(activeSearch ?? ''),
    queryFn: () => searchPartnerCustomers(activeSearch!),
    enabled: Boolean(enabled && activeSearch && activeSearch.length >= 2),
    staleTime: 15_000,
    retry: false,
  });

  const requestsQ = usePartnerBookingRequestsList({
    page: 1,
    page_size: 5,
    status: 'assigned',
    sort: 'sla',
  });

  const actionQ = usePartnerOrders({ bucket: 'action', page: 1, page_size: 10 });
  const openQ = usePartnerOrders({ bucket: 'active', page: 1, page_size: 10 });
  const needsAction = actionQ.data?.total_records ?? 0;
  const activeCount = (actionQ.data?.total_records ?? 0) + (openQ.data?.total_records ?? 0);
  const waitingRequests = requestsQ.data?.total ?? requestsQ.data?.items?.length ?? 0;

  const syncUrl = useCallback(
    (next: CustomerDeskLookupParams | null) => {
      const params = new URLSearchParams();
      if (next && 'phone' in next) params.set('phone', next.phone);
      if (next && 'user_id' in next) params.set('user_id', next.user_id);
      router.replace(buildOrdersHubPath('/partner/orders', 'orders', params), { scroll: false });
    },
    [router],
  );

  function openWithLookup(next: CustomerDeskLookupParams, tab: PartnerDeskTab) {
    setLookup(next);
    setInitialTab(tab);
    setDeskOpen(true);
    setActiveSearch(null);
    if ('phone' in next) setSearchQuery(next.phone);
    syncUrl(next);
  }

  function handleSubmit(value: PartnerDeskSearchSubmit, tab: PartnerDeskTab) {
    if (value.kind === 'phone') {
      openWithLookup({ phone: value.phone }, tab);
      return;
    }
    if (value.kind === 'user_id') {
      openWithLookup({ user_id: value.user_id }, tab);
      return;
    }
    setSearchQuery(value.q);
    setActiveSearch(value.q);
    setDeskOpen(false);
  }

  function handleSelectResult(profile: CustomerDeskProfile, tab: PartnerDeskTab = 'place-order') {
    if (profile.user_id) {
      openWithLookup({ user_id: profile.user_id }, tab);
    } else {
      openWithLookup({ phone: profile.phone }, tab);
    }
  }

  function openBookingRequest(phone: string, name?: string | null) {
    setBrPrefill({ phone, customer_name: name ?? undefined });
    setBrOpen(true);
  }

  const requestRows = requestsQ.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        aria-label="Today snapshot"
        data-testid="partner-orders-today-strip"
      >
        <TodayChip icon={Package} label="Needs action" value={needsAction} />
        <TodayChip icon={Package} label="Active orders" value={activeCount} />
        <TodayChip icon={CalendarClock} label="Waiting requests" value={waitingRequests} />
      </div>

      <PartnerPanel
        title="Find customer"
        description="Type a mobile number to see past orders and place a new one — without leaving Orders."
        toolbar={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-1.5">
              <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>
                <Headset className="h-3.5 w-3.5" aria-hidden />
                Full Customer Desk
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-1.5">
              <Link href={buildOrdersHubPath('/partner/orders', 'requests')}>
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                All requests
              </Link>
            </Button>
          </div>
        }
        bodyClassName="p-4 sm:p-5 space-y-4"
      >
        <PartnerCustomerDeskSearch
          initialQuery={searchQuery || phoneParam || ''}
          isLookingUp={
            (deskOpen && previewQ.isFetching) || (Boolean(activeSearch) && searchQ.isFetching)
          }
          onNewOrder={(v) => handleSubmit(v, 'place-order')}
          onOpenDesk={(v) => handleSubmit(v, 'orders')}
        />

        <InfoBanner variant="default" title="Your laundry only">
          History and new doorstep orders stay scoped to your shop.
        </InfoBanner>

        {activeSearch ? (
          <PartnerCustomerDeskResults
            query={activeSearch}
            results={searchQ.data ?? []}
            isLoading={searchQ.isFetching}
            onSelect={(p) => handleSelectResult(p, 'place-order')}
          />
        ) : null}

        {searchQ.isError && activeSearch ? (
          <InfoBanner variant="destructive" title="Search failed">
            {getApiErrorMessage(searchQ.error)}
          </InfoBanner>
        ) : null}

        {previewQ.isError && deskOpen ? (
          <InfoBanner variant="destructive" title="Could not look up customer">
            {getApiErrorMessage(previewQ.error)}
          </InfoBanner>
        ) : null}
      </PartnerPanel>

      <PartnerPanel
        title="Waiting requests"
        description="Open booking requests that need a first reply."
        toolbar={
          <Button asChild variant="ghost" size="sm" className="min-h-[44px]">
            <Link href={buildOrdersHubPath('/partner/orders', 'requests')}>View all</Link>
          </Button>
        }
        bodyClassName="p-0"
        meta={waitingRequests ? `${waitingRequests} waiting` : undefined}
      >
        {requestsQ.isLoading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading requests…</p>
        ) : requestRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No waiting requests. New leads appear here and in Booking requests.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {requestRows.map((row) => (
              <li key={row.id}>
                <Link
                  href={buildOrdersHubPath('/partner/orders', 'requests', {
                    phone: row.phone_e164,
                  })}
                  className={cn(
                    'flex min-h-[52px] flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-muted/40',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <span className="text-sm font-medium text-foreground">
                    {row.customer_name || 'Customer'} · {row.phone_e164}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {row.public_code} · {row.service_type} · {row.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PartnerPanel>

      <PartnerCustomerDeskDrawer
        lookup={lookup}
        open={deskOpen && Boolean(lookup)}
        onOpenChange={setDeskOpen}
        initialTab={initialTab}
        onCreateBookingRequest={openBookingRequest}
      />

      <PartnerBookingRequestCreateDialog
        open={brOpen}
        onOpenChange={setBrOpen}
        prefill={brPrefill}
      />
    </div>
  );
}

function TodayChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-h-[44px] min-w-[9.5rem] flex-1 items-center gap-2 rounded-lg bg-card px-3 py-2 shadow-soft ring-1 ring-border/60 sm:flex-none">
      <Icon className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-50" aria-hidden />
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none tabular-nums text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
