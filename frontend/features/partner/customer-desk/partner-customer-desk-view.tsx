'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Headset } from 'lucide-react';
import { isAxiosError } from 'axios';

import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { PartnerBookingRequestCreateDialog } from '@/features/partner/booking-requests/partner-booking-request-create-dialog';
import type { PartnerBookingCreatePrefill } from '@/features/partner/booking-requests/types';
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
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { PartnerRecentCustomersStrip } from '@/features/partner/orders-hub/partner-recent-customers-strip';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';

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

type PartnerCustomerDeskViewProps = {
  /** When true, omit page chrome — mounted inside Orders Hub `tab=desk`. */
  embedded?: boolean;
};

export function PartnerCustomerDeskView({ embedded = false }: PartnerCustomerDeskViewProps) {
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

  const syncUrl = useCallback(
    (next: CustomerDeskLookupParams | null) => {
      const params = new URLSearchParams();
      if (next && 'phone' in next) params.set('phone', next.phone);
      if (next && 'user_id' in next) params.set('user_id', next.user_id);
      router.replace(buildOrdersHubPath('/partner/orders', 'desk', params), { scroll: false });
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

  function handleSelectResult(profile: CustomerDeskProfile, tab: PartnerDeskTab = 'orders') {
    if (profile.user_id) {
      openWithLookup({ user_id: profile.user_id }, tab);
    } else {
      openWithLookup({ phone: profile.phone }, tab);
    }
  }

  function handleDeskOpenChange(open: boolean) {
    setDeskOpen(open);
  }

  function openBookingRequest(phone: string, name?: string | null) {
    setBrPrefill({ phone, customer_name: name ?? undefined });
    setBrOpen(true);
  }

  const noMatchGuest =
    previewQ.isSuccess &&
    previewQ.data &&
    !previewQ.data.registered &&
    previewQ.data.order_count === 0;

  const body = (
    <>
      <PartnerPanel
        title="Counter search"
        description="Name or mobile — exact phone opens immediately; name shows matches at your shop."
        bodyClassName="p-4 sm:p-5"
      >
        <div className="mx-auto w-full max-w-xl space-y-4">
          <PartnerRecentCustomersStrip />
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-50">
              <Headset className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <PartnerCustomerDeskSearch
                initialQuery={searchQuery || phoneParam || ''}
                isLookingUp={
                  (deskOpen && previewQ.isFetching) || (Boolean(activeSearch) && searchQ.isFetching)
                }
                onNewOrder={(v) => handleSubmit(v, 'place-order')}
                onOpenDesk={(v) => handleSubmit(v, 'orders')}
              />
            </div>
          </div>

          <InfoBanner variant="default" title="Your laundry only">
            Order history is always scoped to your shop. You will never see another laundry&apos;s
            rows for the same customer.
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

          {!lookup && !deskOpen && !activeSearch ? (
            <EmptyState
              icon={Headset}
              title="Waiting for a name or phone"
              description="When a regular calls, search here to reorder or book doorstep pickup."
            />
          ) : null}

          {previewQ.isError && deskOpen ? (
            <InfoBanner variant="destructive" title="Could not look up customer">
              {getApiErrorMessage(previewQ.error)}
            </InfoBanner>
          ) : null}

          {noMatchGuest && deskOpen ? (
            <InfoBanner variant="default" title="No past orders at your laundry">
              You can still place a doorstep order or record a walk-in for this phone.
            </InfoBanner>
          ) : null}
        </div>
      </PartnerPanel>

      <PartnerCustomerDeskDrawer
        lookup={lookup}
        open={deskOpen && Boolean(lookup)}
        onOpenChange={handleDeskOpenChange}
        initialTab={initialTab}
        onCreateBookingRequest={openBookingRequest}
      />

      <PartnerBookingRequestCreateDialog
        open={brOpen}
        onOpenChange={setBrOpen}
        prefill={brPrefill}
      />
    </>
  );

  if (embedded) {
    return <div className="space-y-5">{body}</div>;
  }

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Customer Desk"
        description="Search by name or phone — see only your laundry’s past orders, place doorstep or walk-in."
      />
      {body}
    </PartnerContent>
  );
}
