'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarClock, Printer } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerBookingRequestsInbox } from '@/features/partner/booking-requests';
import { usePartnerBookingRequestsBadge } from '@/features/partner/booking-requests/hooks';
import { partnerBookingRequestsBadgeCount } from '@/features/partner/booking-requests/lib/partner-booking-status';
import { PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import { PartnerCustomerDeskView } from '@/features/partner/customer-desk';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { HubMotionBlock } from '@/features/partner/orders-hub/partner-hub-motion';
import { PartnerOrdersFilterBar } from '@/features/partner/orders-hub/partner-orders-filter-bar';
import { PartnerCustomerScopeBar } from '@/features/partner/orders-hub/partner-customer-scope-bar';
import { PartnerOrdersNewOrderSheet } from '@/features/partner/orders-hub/partner-orders-new-order-sheet';
import { PartnerRecentCustomersStrip } from '@/features/partner/orders-hub/partner-recent-customers-strip';
import { PartnerOrdersShortcutChips } from '@/features/partner/orders-hub/partner-orders-shortcut-chips';
import { PartnerOrdersTodayPanel } from '@/features/partner/orders-hub/partner-orders-today-panel';
import { PARTNER_ORDERS_PRINT_HREF } from '@/features/partner/orders-hub/partner-orders-hub-queue';
import { usePartnerOrdersQueueState } from '@/features/partner/orders-hub/use-partner-orders-queue-state';
import { PartnerCustomersView } from '@/features/partner/views/partner-customers-view';
import { OrdersHubTabs } from '@/features/orders-hub/orders-hub-tabs';
import { buildOrdersHubPath, parseOrdersHubTab } from '@/lib/navigation/orders-hub';

function HubFallback() {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

function PartnerOrdersQueue() {
  const enabled = usePartnerQueriesEnabled();
  const {
    urlState,
    customerScope,
    apiFilters,
    searchInput,
    setSearchInput,
    setChip,
    setStatus,
    setSource,
    setPayment,
    clearQueueFilters,
    clearCustomerScope,
  } = usePartnerOrdersQueueState();

  const hasActiveLens = useMemo(() => {
    return (
      urlState.chip !== 'all' ||
      Boolean(urlState.q) ||
      Boolean(urlState.status) ||
      Boolean(urlState.source) ||
      Boolean(urlState.payment) ||
      Boolean(customerScope)
    );
  }, [urlState, customerScope]);

  return (
    <div className="space-y-3">
      <PartnerRecentCustomersStrip />
      {customerScope ? (
        <PartnerCustomerScopeBar scope={customerScope} onClear={clearCustomerScope} />
      ) : null}
      <PartnerOrdersShortcutChips selected={urlState.chip} onSelect={setChip} />
      <PartnerOrdersFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        status={urlState.status}
        onStatusChange={setStatus}
        source={urlState.source}
        onSourceChange={setSource}
        payment={urlState.payment}
        onPaymentChange={setPayment}
      />
      {!enabled && (
        <div role="status" aria-busy="true">
          <span className="sr-only">Loading orders</span>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      )}
      {enabled && (
        <HubMotionBlock key={`${urlState.chip}-${urlState.q}-${urlState.status}-${urlState.source}`}>
          <PartnerOrdersTable
            filters={apiFilters}
            search={urlState.q}
            hasActiveLens={hasActiveLens}
            onClearFilters={clearQueueFilters}
          />
        </HubMotionBlock>
      )}
    </div>
  );
}

function PartnerOrdersHubBody() {
  const searchParams = useSearchParams();
  const tab = parseOrdersHubTab(searchParams.get('tab'));
  const panelRef = useRef<HTMLDivElement>(null);
  const previousTabRef = useRef(tab);

  const badgeQ = usePartnerBookingRequestsBadge();
  const requestsBadge = partnerBookingRequestsBadgeCount({
    assignedTotal: badgeQ.data?.total,
    inbox: badgeQ.data?.inbox,
  });

  useEffect(() => {
    if (previousTabRef.current === tab) return;
    previousTabRef.current = tab;
    // Move focus into the active panel after tab change (keyboard / SR).
    panelRef.current?.focus({ preventScroll: true });
  }, [tab]);

  return (
    <>
      <PartnerPageHeader
        title="Customers & Orders"
        description="Find customers, run the queue, print tags and bills."
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Button asChild variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5">
              <Link
                href={PARTNER_ORDERS_PRINT_HREF}
                aria-label="Open print center"
                data-testid="partner-orders-print-center"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden />
                Print
              </Link>
            </Button>
            <PartnerOrdersNewOrderSheet variant="header" />
            {requestsBadge > 0 ? (
              <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 px-2.5">
                <Link
                  href={buildOrdersHubPath('/partner/orders', 'requests')}
                  aria-label={`${requestsBadge} open booking requests`}
                >
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                  Requests
                  <Badge
                    variant="destructive"
                    className="min-w-[1.25rem] justify-center px-1.5 text-[10px]"
                    data-testid="orders-hub-header-requests-badge"
                  >
                    {requestsBadge > 99 ? '99+' : requestsBadge}
                  </Badge>
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <OrdersHubTabs
        basePath="/partner/orders"
        active={tab}
        badges={requestsBadge > 0 ? { requests: requestsBadge } : undefined}
        labels={{ orders: 'Orders', directory: 'Customers' }}
      />

      {tab === 'orders' ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="tabpanel"
          id="orders-hub-panel-orders"
          aria-labelledby="orders-hub-tab-orders"
          className="space-y-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="orders-hub-panel-orders"
        >
          <Suspense fallback={<HubFallback />}>
            <PartnerOrdersTodayPanel />
          </Suspense>
          <Suspense fallback={<HubFallback />}>
            <PartnerOrdersQueue />
          </Suspense>
        </div>
      ) : null}

      {tab === 'desk' ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="tabpanel"
          id="orders-hub-panel-desk"
          aria-labelledby="orders-hub-tab-desk"
          className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="orders-hub-panel-desk"
        >
          <Suspense fallback={<HubFallback />}>
            <PartnerCustomerDeskView embedded />
          </Suspense>
        </div>
      ) : null}

      {tab === 'requests' ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="tabpanel"
          id="orders-hub-panel-requests"
          aria-labelledby="orders-hub-tab-requests"
          className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="orders-hub-panel-requests"
        >
          <Suspense fallback={<HubFallback />}>
            <PartnerBookingRequestsInbox />
          </Suspense>
        </div>
      ) : null}

      {tab === 'directory' ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="tabpanel"
          id="orders-hub-panel-directory"
          aria-labelledby="orders-hub-tab-directory"
          className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="orders-hub-panel-directory"
        >
          <PartnerCustomersView embedded />
        </div>
      ) : null}
    </>
  );
}

/** Partner Customers & Orders Hub — queue + CRM tabs + intake FAB (P2/P3). */
export function PartnerOrdersHub() {
  return (
    <div className="relative space-y-4 pb-20 md:pb-0" data-testid="partner-orders-hub">
      <Suspense fallback={<HubFallback />}>
        <PartnerOrdersHubBody />
      </Suspense>
      <PartnerOrdersNewOrderSheet variant="fab" />
    </div>
  );
}
