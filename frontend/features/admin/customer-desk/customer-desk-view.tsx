'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Headset, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { BookingRequestCreateDialog } from '@/features/admin/booking-requests/booking-request-create-dialog';
import type { CreatePrefill } from '@/features/admin/booking-requests/booking-request-phone-timeline';
import {
  CustomerDeskDrawer,
  type DeskTab,
} from '@/features/admin/customer-desk/components/customer-desk-drawer';
import { CustomerDeskResults } from '@/features/admin/customer-desk/components/customer-desk-results';
import {
  CustomerDeskSearch,
  type DeskSearchSubmit,
} from '@/features/admin/customer-desk/components/customer-desk-search';
import { lookupAdminCustomer, searchAdminCustomers } from '@/features/admin/customer-desk/api';
import {
  isValidIndianMobileE164,
  normalizeIndianPhoneInput,
} from '@/features/admin/customer-desk/phone';
import type { CustomerDeskLookupParams, CustomerDeskProfile } from '@/features/admin/customer-desk/types';
import { customerDeskLookupKey } from '@/features/admin/customer-desk/types';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { listAllLaundries } from '@/services/admin';
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

export function CustomerDeskView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone');
  const userIdParam = searchParams.get('user_id');
  const tabParam = searchParams.get('tab') as DeskTab | null;

  const urlLookup = useMemo(
    () => parseLookupFromSearch(phoneParam, userIdParam),
    [phoneParam, userIdParam],
  );

  const [lookup, setLookup] = useState<CustomerDeskLookupParams | null>(urlLookup);
  const [deskOpen, setDeskOpen] = useState(Boolean(urlLookup));
  const [initialTab, setInitialTab] = useState<DeskTab>(
    tabParam === 'place-order' || tabParam === 'booking-requests' ? tabParam : 'orders',
  );
  const [searchQuery, setSearchQuery] = useState(
    urlLookup && 'phone' in urlLookup ? urlLookup.phone : '',
  );
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [brOpen, setBrOpen] = useState(false);
  const [brPrefill, setBrPrefill] = useState<CreatePrefill | null>(null);

  useEffect(() => {
    if (!urlLookup) return;
    setLookup(urlLookup);
    setDeskOpen(true);
    if ('phone' in urlLookup) setSearchQuery(urlLookup.phone);
  }, [urlLookup]);

  const previewQ = useQuery({
    queryKey: queryKeys.adminCustomerDeskLookup(lookup ? customerDeskLookupKey(lookup) : ''),
    queryFn: () => lookupAdminCustomer(lookup!),
    enabled: Boolean(lookup && deskOpen),
    staleTime: STALE.adminDashboard,
    retry: false,
  });

  const searchQ = useQuery({
    queryKey: queryKeys.adminCustomerDeskSearch(activeSearch ?? ''),
    queryFn: () => searchAdminCustomers(activeSearch!),
    enabled: Boolean(activeSearch && activeSearch.length >= 2),
    staleTime: 15_000,
    retry: false,
  });

  const laundriesQ = useQuery({
    queryKey: queryKeys.adminLaundries(),
    queryFn: listAllLaundries,
    staleTime: STALE.adminDashboard,
  });

  const syncUrl = useCallback(
    (next: CustomerDeskLookupParams | null) => {
      const params = new URLSearchParams();
      if (next && 'phone' in next) params.set('phone', next.phone);
      if (next && 'user_id' in next) params.set('user_id', next.user_id);
      const qs = params.toString();
      router.replace(qs ? `/admin/customer-desk?${qs}` : '/admin/customer-desk', { scroll: false });
    },
    [router],
  );

  function openDesk(next: CustomerDeskLookupParams, tab: DeskTab = 'orders') {
    setLookup(next);
    setInitialTab(tab);
    setDeskOpen(true);
    setActiveSearch(null);
    if ('phone' in next) setSearchQuery(next.phone);
    syncUrl(next);
  }

  function handleSearchSubmit(value: DeskSearchSubmit) {
    if (value.kind === 'phone') {
      setSearchQuery(value.phone);
      openDesk({ phone: value.phone }, 'orders');
      return;
    }
    if (value.kind === 'user_id') {
      openDesk({ user_id: value.user_id }, 'orders');
      return;
    }
    setSearchQuery(value.q);
    setActiveSearch(value.q);
    setDeskOpen(false);
  }

  function handleSelectResult(profile: CustomerDeskProfile) {
    if (profile.user_id) {
      openDesk({ user_id: profile.user_id }, 'orders');
    } else {
      openDesk({ phone: profile.phone }, 'orders');
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

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Customer Desk"
        description="Search by name or phone, see past orders, and place a doorstep order on their behalf."
        actions={
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/admin/customers">
              <Users className="h-3.5 w-3.5" aria-hidden />
              All customers
            </Link>
          </Button>
        }
      />

      <AdminPanel
        title="Customer search"
        description="Primary ops action — name, Indian mobile, or user id."
        bodyClassName="p-4 sm:p-5"
      >
        <div className="mx-auto w-full max-w-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-50">
              <Headset className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <CustomerDeskSearch
                initialQuery={searchQuery || phoneParam || ''}
                isLookingUp={
                  (deskOpen && previewQ.isFetching) || (Boolean(activeSearch) && searchQ.isFetching)
                }
                onSubmit={handleSearchSubmit}
              />
            </div>
          </div>

          {activeSearch ? (
            <CustomerDeskResults
              query={activeSearch}
              results={searchQ.data ?? []}
              isLoading={searchQ.isFetching}
              onSelect={handleSelectResult}
              onCreateGuest={() => openBookingRequest('')}
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
              description="When a customer calls or WhatsApps, search here to open orders and assisted create."
            />
          ) : null}

          {previewQ.isError && deskOpen ? (
            <InfoBanner variant="destructive" title="Could not look up customer">
              {getApiErrorMessage(previewQ.error)}
            </InfoBanner>
          ) : null}

          {noMatchGuest && deskOpen ? (
            <InfoBanner variant="default" title="No registered account for this phone">
              You can still open the desk as a guest, place a doorstep order, or create a booking
              request.
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => setDeskOpen(true)}>
                  Open guest desk
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    openBookingRequest(previewQ.data!.phone, previewQ.data!.name)
                  }
                >
                  Create booking request
                </Button>
              </div>
            </InfoBanner>
          ) : null}
        </div>
      </AdminPanel>

      <CustomerDeskDrawer
        lookup={lookup}
        open={deskOpen && Boolean(lookup)}
        onOpenChange={handleDeskOpenChange}
        initialTab={initialTab}
        onCreateBookingRequest={openBookingRequest}
      />

      <BookingRequestCreateDialog
        open={brOpen}
        onOpenChange={setBrOpen}
        laundries={laundriesQ.data ?? []}
        prefill={brPrefill}
      />
    </AdminContent>
  );
}
