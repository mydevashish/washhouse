'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
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
import { PartnerOrdersTodayPanel } from '@/features/partner/orders-hub/partner-orders-today-panel';
import { PartnerCustomersView } from '@/features/partner/views/partner-customers-view';
import { OrdersHubTabs } from '@/features/orders-hub/orders-hub-tabs';
import { buildOrdersHubPath, parseOrdersHubTab } from '@/lib/navigation/orders-hub';

function HubFallback() {
  return <Skeleton className="h-48 w-full rounded-2xl" />;
}

function PartnerOrdersQueue() {
  const enabled = usePartnerQueriesEnabled();

  return (
    <>
      {!enabled && <Skeleton className="h-96 w-full rounded-2xl" />}
      {enabled && <PartnerOrdersTable />}
    </>
  );
}

function PartnerOrdersHubBody() {
  const searchParams = useSearchParams();
  const tab = parseOrdersHubTab(searchParams.get('tab'));

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
        labels={{ directory: 'Customers' }}
      />

      {tab === 'orders' ? (
        <div className="space-y-5" data-testid="orders-hub-panel-orders">
          <Suspense fallback={<HubFallback />}>
            <PartnerOrdersTodayPanel />
          </Suspense>
          <PartnerOrdersQueue />
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
