'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Package } from 'lucide-react';
import Link from 'next/link';
import { isAxiosError } from 'axios';

import { InfoBanner } from '@/components/ui/info-banner';
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

  return (
    <div className="space-y-3">
      <div
        className="flex gap-1.5 overflow-x-auto sm:flex-wrap"
        aria-label="Today snapshot"
        data-testid="partner-orders-today-strip"
      >
        <TodayChip icon={Package} label="Needs action" value={needsAction} />
        <TodayChip icon={Package} label="Active" value={activeCount} />
        <TodayChip icon={CalendarClock} label="Waiting" value={waitingRequests} />
      </div>

      <div
        className="rounded-xl border border-border/60 bg-card p-3 shadow-soft"
        data-testid="partner-orders-find-strip"
      >
        <PartnerCustomerDeskSearch
          density="compact"
          initialQuery={searchQuery || phoneParam || ''}
          isLookingUp={
            (deskOpen && previewQ.isFetching) || (Boolean(activeSearch) && searchQ.isFetching)
          }
          onNewOrder={(v) => handleSubmit(v, 'place-order')}
          onOpenDesk={(v) => handleSubmit(v, 'orders')}
        />

        {activeSearch ? (
          <div className="mt-2">
            <PartnerCustomerDeskResults
              query={activeSearch}
              results={searchQ.data ?? []}
              isLoading={searchQ.isFetching}
              onSelect={(p) => handleSelectResult(p, 'place-order')}
            />
          </div>
        ) : null}

        {searchQ.isError && activeSearch ? (
          <div className="mt-2">
            <InfoBanner variant="destructive" title="Search failed">
              {getApiErrorMessage(searchQ.error)}
            </InfoBanner>
          </div>
        ) : null}

        {previewQ.isError && deskOpen ? (
          <div className="mt-2">
            <InfoBanner variant="destructive" title="Could not look up customer">
              {getApiErrorMessage(previewQ.error)}
            </InfoBanner>
          </div>
        ) : null}
      </div>

      <Link
        href={buildOrdersHubPath('/partner/orders', 'requests')}
        className={cn(
          'flex h-9 items-center justify-between gap-2 rounded-lg px-3 text-sm',
          'bg-muted/40 text-foreground ring-1 ring-border/50 transition-colors hover:bg-muted/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
        data-testid="partner-orders-waiting-link"
        aria-label={
          waitingRequests > 0
            ? `${waitingRequests} waiting booking requests`
            : 'Open booking requests'
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate font-medium">Waiting requests</span>
        </span>
        <span className="tabular-nums text-muted-foreground">
          {waitingRequests > 0 ? waitingRequests : 'View'}
        </span>
      </Link>

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
    <div className="inline-flex h-9 min-w-[7.5rem] flex-1 items-center gap-2 rounded-full bg-muted/40 px-3 ring-1 ring-border/50 sm:flex-none">
      <Icon className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-50" aria-hidden />
      <div className="flex min-w-0 items-baseline gap-1.5">
        <p className="text-sm font-semibold tabular-nums leading-none text-foreground">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
