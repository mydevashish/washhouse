'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarClock, Package } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerBookingRequestsInbox } from '@/features/partner/booking-requests';
import { usePartnerBookingRequestsBadge } from '@/features/partner/booking-requests/hooks';
import { partnerBookingRequestsBadgeCount } from '@/features/partner/booking-requests/lib/partner-booking-status';
import { PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import { PartnerCustomerDeskView } from '@/features/partner/customer-desk';
import {
  usePartnerOrders,
  usePartnerQueriesEnabled,
} from '@/features/partner/hooks/use-partner-operations';
import { PartnerOrdersTodayPanel } from '@/features/partner/orders-hub/partner-orders-today-panel';
import { PartnerCustomersView } from '@/features/partner/views/partner-customers-view';
import { OrdersHubTabs } from '@/features/orders-hub/orders-hub-tabs';
import { buildOrdersHubPath, parseOrdersHubTab } from '@/lib/navigation/orders-hub';
import type { PartnerOrder } from '@/services/partner';

function HubFallback() {
  return <Skeleton className="h-48 w-full rounded-2xl" />;
}

function PartnerOrdersQueue({
  orders,
  isLoading,
  isError,
}: {
  orders: PartnerOrder[];
  isLoading: boolean;
  isError: boolean;
}) {
  const enabled = usePartnerQueriesEnabled();

  return (
    <>
      {isLoading && <Skeleton className="h-96 w-full rounded-2xl" />}
      {enabled && isError && (
        <InfoBanner variant="destructive" title="Could not load orders">
          Refresh the page to try again.
        </InfoBanner>
      )}
      {enabled && !isLoading && orders.length === 0 && (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Type a customer phone above to place the first order, or wait for online bookings."
        />
      )}
      {enabled && orders.length > 0 && <PartnerOrdersTable orders={orders} />}
    </>
  );
}

function PartnerOrdersHubBody() {
  const searchParams = useSearchParams();
  const tab = parseOrdersHubTab(searchParams.get('tab'));
  const ordersQ = usePartnerOrders();

  const badgeQ = usePartnerBookingRequestsBadge();
  const requestsBadge = partnerBookingRequestsBadgeCount({
    assignedTotal: badgeQ.data?.total,
    inbox: badgeQ.data?.inbox,
  });

  return (
    <>
      <PartnerPageHeader
        title="Orders"
        description="Find a customer, place a new order, triage requests, and work your queue — all in one place."
        actions={
          requestsBadge > 0 ? (
            <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-2">
              <Link
                href={buildOrdersHubPath('/partner/orders', 'requests')}
                aria-label={`${requestsBadge} open booking requests`}
              >
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                Requests
                <Badge
                  variant="destructive"
                  className="min-w-[1.25rem] justify-center px-1.5"
                  data-testid="orders-hub-header-requests-badge"
                >
                  {requestsBadge > 99 ? '99+' : requestsBadge}
                </Badge>
              </Link>
            </Button>
          ) : null
        }
      />

      <OrdersHubTabs
        basePath="/partner/orders"
        active={tab}
        badges={requestsBadge > 0 ? { requests: requestsBadge } : undefined}
      />

      {tab === 'orders' ? (
        <div className="space-y-5" data-testid="orders-hub-panel-orders">
          <Suspense fallback={<HubFallback />}>
            <PartnerOrdersTodayPanel orders={ordersQ.data ?? []} />
          </Suspense>
          <PartnerOrdersQueue
            orders={ordersQ.data ?? []}
            isLoading={ordersQ.isLoading}
            isError={ordersQ.isError}
          />
        </div>
      ) : null}

      {tab === 'desk' ? (
        <div data-testid="orders-hub-panel-desk">
          <Suspense fallback={<HubFallback />}>
            <PartnerCustomerDeskView embedded />
          </Suspense>
        </div>
      ) : null}

      {tab === 'requests' ? (
        <div data-testid="orders-hub-panel-requests">
          <Suspense fallback={<HubFallback />}>
            <PartnerBookingRequestsInbox />
          </Suspense>
        </div>
      ) : null}

      {tab === 'directory' ? (
        <div data-testid="orders-hub-panel-directory">
          <PartnerCustomersView embedded />
        </div>
      ) : null}
    </>
  );
}

/** Partner Orders Hub — single ops home with URL-driven tabs (mirrors Admin IA). */
export function PartnerOrdersHub() {
  return (
    <div className="space-y-5" data-testid="partner-orders-hub">
      <Suspense fallback={<HubFallback />}>
        <PartnerOrdersHubBody />
      </Suspense>
    </div>
  );
}
