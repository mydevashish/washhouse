'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, Headset } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { BookingRequestCreateDialog } from '@/features/admin/booking-requests/booking-request-create-dialog';
import type { CreatePrefill } from '@/features/admin/booking-requests/booking-request-phone-timeline';
import { useAdminBookingRequestsList } from '@/features/admin/booking-requests/hooks';
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
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listLaundryOptions } from '@/services/admin';
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

/** Soft-merge Today strip: phone search + waiting requests preview on `tab=orders`. */
export function AdminOrdersTodayPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone');
  const userIdParam = searchParams.get('user_id');
  const rawTab = searchParams.get('tab');
  const tabParam =
    rawTab === 'place-order' || rawTab === 'booking-requests' || rawTab === 'orders'
      ? (rawTab as DeskTab)
      : null;

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
    if (tabParam === 'place-order' || tabParam === 'booking-requests') {
      setInitialTab(tabParam);
    }
  }, [urlLookup, tabParam]);

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

  const requestsQ = useAdminBookingRequestsList({
    page: 1,
    page_size: 5,
    status: 'new',
    sort: 'sla',
  });

  const laundriesQ = useQuery({
    queryKey: queryKeys.adminLaundries(),
    queryFn: listLaundryOptions,
    staleTime: STALE.adminDashboard,
  });

  const syncUrl = useCallback(
    (next: CustomerDeskLookupParams | null) => {
      const params = new URLSearchParams();
      if (next && 'phone' in next) params.set('phone', next.phone);
      if (next && 'user_id' in next) params.set('user_id', next.user_id);
      router.replace(buildOrdersHubPath('/admin/orders', 'orders', params), { scroll: false });
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
      openDesk({ user_id: profile.user_id }, 'place-order');
    } else {
      openDesk({ phone: profile.phone }, 'place-order');
    }
  }

  function openBookingRequest(phone: string, name?: string | null) {
    setBrPrefill({ phone, customer_name: name ?? undefined });
    setBrOpen(true);
  }

  const requestRows = requestsQ.data?.items ?? [];
  const waitingRequests = requestsQ.data?.total ?? requestRows.length;

  return (
    <div className="space-y-4" data-testid="admin-orders-today-panel">
      <AdminPanel
        title="Find customer"
        description="Search by phone or name, open history, and place a doorstep order from Orders."
        toolbar={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-1.5">
              <Link href={buildOrdersHubPath('/admin/orders', 'desk')}>
                <Headset className="h-3.5 w-3.5" aria-hidden />
                Full Customer Desk
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-1.5">
              <Link href={buildOrdersHubPath('/admin/orders', 'requests')}>
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                All requests
              </Link>
            </Button>
          </div>
        }
        bodyClassName="space-y-4 p-4 sm:p-5"
      >
        <CustomerDeskSearch
          initialQuery={searchQuery || phoneParam || ''}
          isLookingUp={
            (deskOpen && previewQ.isFetching) || (Boolean(activeSearch) && searchQ.isFetching)
          }
          onSubmit={handleSearchSubmit}
        />

        {activeSearch ? (
          <CustomerDeskResults
            query={activeSearch}
            results={searchQ.data ?? []}
            isLoading={searchQ.isFetching}
            onSelect={handleSelectResult}
            onCreateGuest={() => openBookingRequest(activeSearch ?? '')}
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
      </AdminPanel>

      <AdminPanel
        title="Waiting requests"
        description="Newest open booking requests across the platform."
        toolbar={
          <Button asChild variant="ghost" size="sm" className="min-h-[44px]">
            <Link href={buildOrdersHubPath('/admin/orders', 'requests')}>View all</Link>
          </Button>
        }
        bodyClassName="p-0"
        meta={waitingRequests ? `${waitingRequests} open` : undefined}
      >
        {requestsQ.isLoading ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading requests…</p>
        ) : requestRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No open requests right now. Book Now leads appear here and in Booking requests.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {requestRows.map((row) => (
              <li key={row.id}>
                <Link
                  href={buildOrdersHubPath('/admin/orders', 'requests', {
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
                    {row.assigned_laundry_name ? ` · ${row.assigned_laundry_name}` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <CustomerDeskDrawer
        lookup={lookup}
        open={deskOpen && Boolean(lookup)}
        onOpenChange={setDeskOpen}
        initialTab={initialTab}
        onCreateBookingRequest={openBookingRequest}
      />

      <BookingRequestCreateDialog
        open={brOpen}
        onOpenChange={setBrOpen}
        laundries={laundriesQ.data ?? []}
        prefill={brPrefill}
      />
    </div>
  );
}
