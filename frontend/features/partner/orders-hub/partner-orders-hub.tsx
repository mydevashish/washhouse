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
import {
  PartnerOpsSurface,
  PartnerWalkInOrderWorkspace,
} from '@/features/partner/components/ops-visual';
import { PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import { PartnerCustomerDeskView } from '@/features/partner/customer-desk';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { HubMotionBlock } from '@/features/partner/orders-hub/partner-hub-motion';
import { PartnerOrdersFilterBar } from '@/features/partner/orders-hub/partner-orders-filter-bar';
import { PartnerCustomerScopeBar } from '@/features/partner/orders-hub/partner-customer-scope-bar';
import { PartnerOrdersHubSection } from '@/features/partner/orders-hub/partner-orders-hub-section';
import { PartnerOrdersNewOrderSheet } from '@/features/partner/orders-hub/partner-orders-new-order-sheet';
import { PartnerRecentCustomersStrip } from '@/features/partner/orders-hub/partner-recent-customers-strip';
import { PartnerOrdersShortcutChips } from '@/features/partner/orders-hub/partner-orders-shortcut-chips';
import { PartnerOrdersTodayPanel } from '@/features/partner/orders-hub/partner-orders-today-panel';
import { PARTNER_ORDERS_PRINT_HREF } from '@/features/partner/orders-hub/partner-orders-hub-queue';
import { usePartnerOrdersQueueState } from '@/features/partner/orders-hub/use-partner-orders-queue-state';
import { PartnerCustomersView } from '@/features/partner/views/partner-customers-view';
import { OrdersHubTabs } from '@/features/orders-hub/orders-hub-tabs';
import {
  buildOrdersHubPath,
  parsePartnerOrdersHubTab,
  PARTNER_ORDERS_HUB_TABS,
  PARTNER_ORDERS_HUB_TAB_LABELS,
  type PartnerOrdersHubTab,
} from '@/lib/navigation/orders-hub';
import { cn } from '@/lib/utils';

const HUB_TAB_DETAILS: Record<
  PartnerOrdersHubTab,
  { summary: string; panelTitle: string; panelDescription: string }
> = {
  orders: {
    summary: 'Run the live queue — snapshot, customer lookup, filters, and paginated orders.',
    panelTitle: 'Orders workspace',
    panelDescription:
      'Everything on this tab stays in sync with the chips and filters below the list.',
  },
  create: {
    summary: 'Phone, name, gender — add services or garments, then print color-coded tags.',
    panelTitle: 'Create walk-in order',
    panelDescription:
      'Uses your live service catalog and garment prices. Mix-up safety: color token, M/F on tags, per-piece labels.',
  },
  desk: {
    summary: 'Full customer desk — lookup, order history, assisted placement, and booking requests.',
    panelTitle: 'Customer desk',
    panelDescription:
      'Same desk as counter staff use; search by phone or name to open a customer record.',
  },
  requests: {
    summary: 'Assign riders, mark contacted, and convert doorstep requests into shop orders.',
    panelTitle: 'Booking requests inbox',
    panelDescription: 'Sorted by SLA. Badges on the Requests tab show how many need attention.',
  },
  directory: {
    summary: 'Customer insights, segments, and order history across your registered clients.',
    panelTitle: 'Customer directory',
    panelDescription: 'Browse and filter your customer base; open a row to see lifetime value and visits.',
  },
};

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
      <PartnerOrdersHubSection
        id="hub-orders-recent-customers"
        title="Recent customers today"
        description="Phones you served today on this device — tap to reopen the desk with the number prefilled."
        bordered={false}
      >
        <PartnerRecentCustomersStrip />
      </PartnerOrdersHubSection>

      {customerScope ? (
        <PartnerCustomerScopeBar scope={customerScope} onClear={clearCustomerScope} />
      ) : null}

      <PartnerOrdersHubSection
        id="hub-orders-queue-lens"
        title="Queue shortcuts & filters"
        description="Pick a chip for a saved lens, then narrow further with search and dropdowns. Filters combine with AND logic."
        bordered={false}
      >
        <PartnerOpsSurface className="space-y-3 !p-3 sm:!p-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Shortcut chips</p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Needs action, ready today, walk-in, unpaid, print queue, and more.
            </p>
            <PartnerOrdersShortcutChips selected={urlState.chip} onSelect={setChip} />
          </div>
          <div className="space-y-2 border-t border-border/50 pt-3">
            <p className="text-xs font-medium text-foreground">Refine list</p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Search by phone, name, tracking code, or bag token. Status, source, and payment stack
              on top of the active chip.
            </p>
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
          </div>
        </PartnerOpsSurface>
      </PartnerOrdersHubSection>

      <PartnerOrdersHubSection
        id="hub-orders-list"
        title="Order list"
        description="Advance status, print tags or bills, upload pickup proof, and open full order detail."
        bordered={false}
      >
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
      </PartnerOrdersHubSection>
    </div>
  );
}

function HubTabContextBanner({ tab }: { tab: PartnerOrdersHubTab }) {
  const detail = HUB_TAB_DETAILS[tab];
  return (
    <div
      className="rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5 sm:px-4"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-foreground">{detail.panelTitle}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail.summary}</p>
    </div>
  );
}

function PartnerOrdersHubBody() {
  const searchParams = useSearchParams();
  const tab = parsePartnerOrdersHubTab(searchParams.get('tab'));
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
    panelRef.current?.focus({ preventScroll: true });
  }, [tab]);

  const headerActions = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 px-2.5">
        <Link
          href={PARTNER_ORDERS_PRINT_HREF}
          aria-label="Open print queue"
          data-testid="partner-orders-print-center"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden />
          Print queue
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
  );

  const tabDetail = HUB_TAB_DETAILS[tab];

  return (
    <div className="space-y-3">
      <PartnerPageHeader
        title="Customers & Orders"
        description="Queue, customer desk, booking requests, and directory — one workplace for counter and owner."
        actions={headerActions}
      />

      <OrdersHubTabs
        basePath="/partner/orders"
        active={tab}
        tabs={PARTNER_ORDERS_HUB_TABS}
        badges={requestsBadge > 0 ? { requests: requestsBadge } : undefined}
        labels={{
          orders: 'Orders',
          create: PARTNER_ORDERS_HUB_TAB_LABELS.create,
          directory: 'Customers',
        }}
      />

      <HubTabContextBanner tab={tab} />

      {tab === 'create' ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="tabpanel"
          id="orders-hub-panel-create"
          aria-labelledby="orders-hub-tab-create"
          className="space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="orders-hub-panel-create"
        >
          <PartnerOrdersHubSection
            id="hub-create-intake"
            title={tabDetail.panelTitle}
            description={tabDetail.panelDescription}
            bordered={false}
          >
            <Suspense fallback={<HubFallback />}>
              <PartnerWalkInOrderWorkspace
                embedded
                initialName={searchParams.get('name') ?? ''}
                initialPhone={searchParams.get('phone') ?? ''}
                initialFulfillment={
                  searchParams.get('fulfillment') === 'doorstep' ? 'doorstep' : 'walk_in'
                }
              />
            </Suspense>
          </PartnerOrdersHubSection>
        </div>
      ) : null}

      {tab === 'orders' ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="tabpanel"
          id="orders-hub-panel-orders"
          aria-labelledby="orders-hub-tab-orders"
          className={cn(
            'space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
          data-testid="orders-hub-panel-orders"
        >
          <p className="sr-only">{tabDetail.panelDescription}</p>
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
          className="space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="orders-hub-panel-desk"
        >
          <PartnerOrdersHubSection
            id="hub-desk-detail"
            title={tabDetail.panelTitle}
            description={tabDetail.panelDescription}
            bordered={false}
          >
            <Suspense fallback={<HubFallback />}>
              <PartnerCustomerDeskView embedded />
            </Suspense>
          </PartnerOrdersHubSection>
        </div>
      ) : null}

      {tab === 'requests' ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="tabpanel"
          id="orders-hub-panel-requests"
          aria-labelledby="orders-hub-tab-requests"
          className="space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="orders-hub-panel-requests"
        >
          <PartnerOrdersHubSection
            id="hub-requests-detail"
            title={tabDetail.panelTitle}
            description={tabDetail.panelDescription}
            bordered={false}
          >
            <Suspense fallback={<HubFallback />}>
              <PartnerBookingRequestsInbox />
            </Suspense>
          </PartnerOrdersHubSection>
        </div>
      ) : null}

      {tab === 'directory' ? (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="tabpanel"
          id="orders-hub-panel-directory"
          aria-labelledby="orders-hub-tab-directory"
          className="space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="orders-hub-panel-directory"
        >
          <PartnerOrdersHubSection
            id="hub-directory-detail"
            title={tabDetail.panelTitle}
            description={tabDetail.panelDescription}
            bordered={false}
          >
            <PartnerCustomersView embedded />
          </PartnerOrdersHubSection>
        </div>
      ) : null}
    </div>
  );
}

/** Partner Customers & Orders Hub — queue + CRM tabs + intake FAB (P2/P3). */
export function PartnerOrdersHub() {
  return (
    <div className="relative pb-20 md:pb-0" data-testid="partner-orders-hub">
      <Suspense fallback={<HubFallback />}>
        <PartnerOrdersHubBody />
      </Suspense>
      <PartnerOrdersNewOrderSheet variant="fab" />
    </div>
  );
}
