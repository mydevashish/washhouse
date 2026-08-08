'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminOrdersTable } from '@/features/admin/admin-orders-table';
import { AdminBookingRequestsDatatable } from '@/features/admin/booking-requests';
import { useAdminBookingRequestsList } from '@/features/admin/booking-requests/hooks';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { CustomerDeskView } from '@/features/admin/customer-desk';
import { AdminOrdersTodayPanel } from '@/features/admin/orders-hub/admin-orders-today-panel';
import { AdminCustomersView } from '@/features/admin/views/admin-customers-view';
import { OrdersHubTabs } from '@/features/orders-hub/orders-hub-tabs';
import { buildOrdersHubPath, parseOrdersHubTab } from '@/lib/navigation/orders-hub';

function HubFallback() {
  return <Skeleton className="h-48 w-full rounded-2xl" />;
}

function openBookingRequestsCount(inbox: { new?: number; reviewing?: number } | undefined) {
  return (inbox?.new ?? 0) + (inbox?.reviewing ?? 0);
}

function AdminOrdersHubBody() {
  const searchParams = useSearchParams();
  const tab = parseOrdersHubTab(searchParams.get('tab'));

  const badgeQ = useAdminBookingRequestsList({
    page: 1,
    page_size: 1,
    sort: 'sla',
  });
  const requestsBadge = openBookingRequestsCount(badgeQ.data?.inbox);

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Find a customer, place assisted orders, triage requests, and review the platform queue."
        actions={
          requestsBadge > 0 ? (
            <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-2">
              <Link
                href={buildOrdersHubPath('/admin/orders', 'requests')}
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
        basePath="/admin/orders"
        active={tab}
        badges={requestsBadge > 0 ? { requests: requestsBadge } : undefined}
      />

      {tab === 'orders' ? (
        <div
          id="orders-hub-panel-orders"
          role="tabpanel"
          aria-labelledby="orders-hub-tab-orders"
          className="space-y-5"
          data-testid="orders-hub-panel-orders"
        >
          <Suspense fallback={<HubFallback />}>
            <AdminOrdersTodayPanel />
          </Suspense>
          <AdminOrdersTable />
        </div>
      ) : null}

      {tab === 'desk' ? (
        <div
          id="orders-hub-panel-desk"
          role="tabpanel"
          aria-labelledby="orders-hub-tab-desk"
          data-testid="orders-hub-panel-desk"
        >
          <Suspense fallback={<HubFallback />}>
            <CustomerDeskView embedded />
          </Suspense>
        </div>
      ) : null}

      {tab === 'requests' ? (
        <div
          id="orders-hub-panel-requests"
          role="tabpanel"
          aria-labelledby="orders-hub-tab-requests"
          data-testid="orders-hub-panel-requests"
        >
          <Suspense fallback={<HubFallback />}>
            <AdminBookingRequestsDatatable />
          </Suspense>
        </div>
      ) : null}

      {tab === 'directory' ? (
        <div
          id="orders-hub-panel-directory"
          role="tabpanel"
          aria-labelledby="orders-hub-tab-directory"
          data-testid="orders-hub-panel-directory"
        >
          <AdminCustomersView embedded />
        </div>
      ) : null}
    </>
  );
}

/** Admin Orders Hub — single ops home with URL-driven tabs. */
export function AdminOrdersHub() {
  return (
    <div className="space-y-5" data-testid="admin-orders-hub">
      <Suspense fallback={<HubFallback />}>
        <AdminOrdersHubBody />
      </Suspense>
    </div>
  );
}
