'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import Link from 'next/link';
import { ListOrdered, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  OWNER_IMAGES,
  OwnerEmptyState,
} from '@/features/partner/components/owner';
import {
  PartnerCustomerSnapshotCards,
  PartnerOpsSurface,
} from '@/features/partner/components/ops-visual';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
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
import { usePartnerCustomerInsightRow } from '@/features/partner/customer-desk/hooks';
import {
  buildCustomerScopedOrdersHref,
  buildNewOrderHref,
  buildPartnerCreateOrderHref,
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
  type DeskUrlTab = PartnerDeskTab | 'place-order';
  const tabParam: DeskUrlTab | null =
    rawTab === 'place-order' || rawTab === 'booking-requests' || rawTab === 'orders'
      ? rawTab
      : null;

  const urlLookup = useMemo(
    () => parseLookupFromSearch(phoneParam, userIdParam),
    [phoneParam, userIdParam],
  );

  const [lookup, setLookup] = useState<CustomerDeskLookupParams | null>(urlLookup);
  const [deskOpen, setDeskOpen] = useState(Boolean(urlLookup));
  const [initialTab, setInitialTab] = useState<PartnerDeskTab>(
    tabParam === 'booking-requests' ? 'booking-requests' : 'orders',
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
    if ('phone' in urlLookup) setSearchQuery(urlLookup.phone);
    if (tabParam === 'place-order') {
      router.replace(
        buildPartnerCreateOrderHref('phone' in urlLookup ? { phone: urlLookup.phone } : {}),
      );
      return;
    }
    setDeskOpen(true);
    if (tabParam === 'booking-requests') {
      setInitialTab('booking-requests');
    }
  }, [urlLookup, tabParam, router]);

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
    enabled: Boolean(enabled && lookup),
    staleTime: STALE.partnerAnalytics,
    retry: false,
  });

  const profile = previewQ.data ?? null;
  const insightQ = usePartnerCustomerInsightRow(profile, Boolean(lookup && previewQ.isSuccess));

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

  function handleSubmit(value: PartnerDeskSearchSubmit, tab: PartnerDeskTab | 'place-order') {
    if (tab === 'place-order') {
      if (value.kind === 'phone') {
        router.push(buildPartnerCreateOrderHref({ phone: value.phone }));
        return;
      }
      if (value.kind === 'user_id') {
        router.push(buildOrdersHubPath('/partner/orders', 'create'));
        return;
      }
      setSearchQuery(value.q);
      setActiveSearch(value.q);
      setDeskOpen(false);
      return;
    }
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

  function handleSelectResult(
    profile: CustomerDeskProfile,
    tab: PartnerDeskTab | 'place-order' = 'orders',
  ) {
    if (tab === 'place-order') {
      router.push(
        buildPartnerCreateOrderHref({ phone: profile.phone, name: profile.name }),
      );
      return;
    }
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

  const newOrderHref =
    profile?.phone != null
      ? buildNewOrderHref(profile.phone, profile.name, 'walk_in')
      : buildPartnerCreateOrderHref();
  const ordersHref =
    profile?.phone != null
      ? buildCustomerScopedOrdersHref(profile.phone, profile.name)
      : null;

  const body = (
    <>
      <PartnerOpsSurface variant="default" className="mx-auto w-full max-w-3xl space-y-4">
        <div className="grid gap-4 rounded-3xl border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Search customer</p>
              <p className="text-xs text-muted-foreground">
                Search by name, mobile or customer ID.
              </p>
            </div>
          </div>

        <PartnerRecentCustomersStrip />

        <PartnerCustomerDeskSearch
          initialQuery={searchQuery || phoneParam || ''}
          isLookingUp={
            (Boolean(lookup) && previewQ.isFetching) ||
            (Boolean(activeSearch) && searchQ.isFetching)
          }
          onNewOrder={(v) => handleSubmit(v, 'place-order')}
          onOpenDesk={(v) => handleSubmit(v, 'orders')}
        />

        {lookup && previewQ.isFetching && !previewQ.data ? (
          <Skeleton className="h-40 w-full rounded-3xl" data-testid="partner-desk-snapshot-loading" />
        ) : null}

        {lookup && profile ? (
          <div className="space-y-4" data-testid="partner-desk-customer-snapshot">
            <PartnerCustomerSnapshotCards
              profile={profile}
              stats={
                insightQ.data
                  ? {
                      lifetime_spend_inr: insightQ.data.lifetime_spend_inr,
                      segment_label: insightQ.data.segment_label,
                    }
                  : null
              }
            />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Customer actions">
              <Button asChild size="sm" className="min-h-[44px] gap-1.5">
                <Link href={newOrderHref}>
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  New order
                </Link>
              </Button>
              {ordersHref ? (
                <Button asChild variant="secondary" size="sm" className="min-h-[44px] gap-1.5">
                  <Link href={ordersHref}>
                    <ListOrdered className="h-3.5 w-3.5" aria-hidden />
                    View orders
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

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

        {!lookup && !activeSearch ? (
          <OwnerEmptyState
            title="Waiting for a name or phone"
            description="When a regular calls, search here to reorder or book doorstep pickup."
            imageSrc={OWNER_IMAGES.people}
            imageAlt="Laundry shop counter"
          />
        ) : null}

        {previewQ.isError && lookup ? (
          <InfoBanner variant="destructive" title="Could not look up customer">
            {getApiErrorMessage(previewQ.error)}
          </InfoBanner>
        ) : null}

        {noMatchGuest && lookup ? (
          <InfoBanner variant="default" title="No past orders at your laundry">
            You can still place a doorstep order or record a walk-in for this phone.
          </InfoBanner>
        ) : null}
        </div>

        <InfoBanner variant="default" title="Your laundry only">
          Order history is always scoped to your shop. You will never see another laundry&apos;s
          rows for the same customer.
        </InfoBanner>
      </PartnerOpsSurface>

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
