'use client';

import Link from 'next/link';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PARTNER_DASHBOARD_CREATE_ORDER_HREF,
  PARTNER_DASHBOARD_CUSTOMERS_VIEW_ALL_HREF,
  PARTNER_DASHBOARD_RECENT_VIEW_ALL_HREF,
  type PartnerDashboardCustomerRow,
  type PartnerDashboardRecentOrderRow,
} from '@/features/partner/lib/partner-dashboard-lists';
import { cn } from '@/lib/utils';

const STATUS_PILL_STYLE: Record<string, string> = {
  'In Process': 'bg-info-muted text-info',
  Ready: 'bg-success-muted text-success',
  'Out for Delivery': 'bg-primary/15 text-primary',
  Completed: 'bg-muted text-foreground',
  Pending: 'bg-warning-muted text-warning',
  Cancelled: 'bg-danger-muted text-danger',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium',
        STATUS_PILL_STYLE[status] ?? 'bg-muted text-foreground',
      )}
    >
      {status}
    </span>
  );
}

const viewAllClass =
  'inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function PartnerLaundryRecentOrdersCard({
  rows,
  loading,
  error,
  onRetry,
  isRetrying,
}: {
  rows: PartnerDashboardRecentOrderRow[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Card className="rounded-[18px] shadow-sm">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Recent Orders</h3>
          <Link href={PARTNER_DASHBOARD_RECENT_VIEW_ALL_HREF} className={viewAllClass} aria-label="View all recent orders">
            View all
          </Link>
        </div>
        {error ? (
          <QueryErrorState title="Could not load recent orders" message={error} onRetry={onRetry} isRetrying={isRetrying} />
        ) : loading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading recent orders">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[10rem] flex-col items-start justify-center gap-3">
            <p className="text-sm text-muted-foreground">No recent orders yet.</p>
            <div className="flex flex-wrap gap-3">
              <Link href={PARTNER_DASHBOARD_CREATE_ORDER_HREF} className={viewAllClass}>
                Create order
              </Link>
              <Link href={PARTNER_DASHBOARD_RECENT_VIEW_ALL_HREF} className={viewAllClass}>
                View orders
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <caption className="sr-only">Recent orders</caption>
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Order ID</th>
                  <th className="px-3 py-2.5 font-medium">Customer</th>
                  <th className="px-3 py-2.5 font-medium">Service</th>
                  <th className="px-3 py-2.5 font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {rows.map((row) => (
                  <tr key={row.id} className="relative hover:bg-muted/50">
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      <Link
                        href={row.href}
                        className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {row.trackingCode}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{row.customer}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{row.service}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground">{row.amount}</td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={row.statusPill} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PartnerLaundryTopCustomersCard({
  rows,
  loading,
  error,
  onRetry,
  isRetrying,
}: {
  rows: PartnerDashboardCustomerRow[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Card className="rounded-[18px] shadow-sm">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Top Customers</h3>
          <Link href={PARTNER_DASHBOARD_CUSTOMERS_VIEW_ALL_HREF} className={viewAllClass} aria-label="View all customers">
            View all
          </Link>
        </div>
        {error ? (
          <QueryErrorState title="Could not load customers" message={error} onRetry={onRetry} isRetrying={isRetrying} />
        ) : loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading top customers">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[10rem] flex-col items-start justify-center gap-3">
            <p className="text-sm text-muted-foreground">No customers yet.</p>
            <Link href={PARTNER_DASHBOARD_CUSTOMERS_VIEW_ALL_HREF} className={viewAllClass}>
              View customers
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((customer) => (
              <Link
                key={customer.userId}
                href={customer.href}
                className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2.5 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary dark:bg-primary/20">
                    {customer.initial}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">{customer.ordersLabel}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-foreground">{customer.spent}</div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
