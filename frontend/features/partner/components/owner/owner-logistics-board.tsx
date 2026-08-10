'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PackageCheck, Phone, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import {
  OWNER_IMAGES,
  OwnerEmptyState,
  OwnerSectionHeader,
} from '@/features/partner/components/owner';
import { OwnerLogisticsRunCard } from '@/features/partner/components/owner/owner-logistics-run-card';
import {
  filterLogisticsRuns,
  flattenQueueOrders,
  logisticsRunImage,
  type LogisticsBoardTab,
} from '@/features/partner/lib/owner-logistics';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildPartnerCreateOrderHref } from '@/features/partner/customer-desk/phone';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import {
  getDeliveryQueue,
  getDoneToday,
  getPickupQueue,
  listOperationsDrivers,
} from '@/services/operations';

const TABS: { id: LogisticsBoardTab; label: string }[] = [
  { id: 'pickups', label: 'Needs pickup' },
  { id: 'deliveries', label: 'Out for delivery' },
  { id: 'done', label: 'Done today' },
];

const ACTIVE_PICKUP_STATUSES = ['scheduled', 'assigned', 'in_progress'] as const;
const ACTIVE_DELIVERY_STATUSES = [
  'ready',
  'assigned',
  'out_for_delivery',
  'failed',
  'returned',
] as const;

function parseLogisticsTab(raw: string | null, fallback: LogisticsBoardTab): LogisticsBoardTab {
  if (raw === 'deliveries' || raw === 'done' || raw === 'pickups') return raw;
  return fallback;
}

export function OwnerLogisticsBoard({
  initialTab = 'pickups',
  showTabNav = true,
  showBoardHeader = true,
}: {
  initialTab?: LogisticsBoardTab;
  /** When false, lock to initialTab (used by /partner/pickups wrappers). */
  showTabNav?: boolean;
  showBoardHeader?: boolean;
}) {
  const enabled = usePartnerQueriesEnabled();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = parseLogisticsTab(searchParams.get('tab'), initialTab);
  const [tab, setTab] = useState<LogisticsBoardTab>(showTabNav ? urlTab : initialTab);
  const [query, setQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState('');

  useEffect(() => {
    if (!showTabNav) return;
    setTab(urlTab);
  }, [showTabNav, urlTab]);

  const activeTab = showTabNav ? tab : initialTab;

  const setActiveTab = (next: LogisticsBoardTab) => {
    setTab(next);
    if (!showTabNav) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'pickups') params.delete('tab');
    else params.set('tab', next);
    const qs = params.toString();
    router.replace(qs ? `/partner/logistics?${qs}` : '/partner/logistics', { scroll: false });
  };

  const pickupsQ = useQuery({
    queryKey: queryKeys.partnerOperationsPickups(),
    queryFn: getPickupQueue,
    enabled,
    staleTime: STALE.partnerAnalytics,
  });
  const deliveriesQ = useQuery({
    queryKey: queryKeys.partnerOperationsDeliveries(),
    queryFn: getDeliveryQueue,
    enabled,
    staleTime: STALE.partnerAnalytics,
  });
  const doneQ = useQuery({
    queryKey: queryKeys.partnerOperationsDoneToday(),
    queryFn: getDoneToday,
    enabled: enabled && (activeTab === 'done' || showTabNav),
    staleTime: STALE.partnerAnalytics,
  });
  const driversQ = useQuery({
    queryKey: queryKeys.partnerOperationsDrivers(),
    queryFn: listOperationsDrivers,
    enabled,
    staleTime: STALE.partnerAnalytics,
  });

  const pickupRows = useMemo(
    () => flattenQueueOrders(pickupsQ.data?.buckets, ACTIVE_PICKUP_STATUSES),
    [pickupsQ.data?.buckets],
  );
  const deliveryRows = useMemo(
    () => flattenQueueOrders(deliveriesQ.data?.buckets, ACTIVE_DELIVERY_STATUSES),
    [deliveriesQ.data?.buckets],
  );
  const doneRows = useMemo(() => {
    const rows = doneQ.data?.orders ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((o) => {
      const phone = o.customer_phone ?? '';
      return `${o.customer_name} ${o.tracking_code} ${phone}`.toLowerCase().includes(q);
    });
  }, [doneQ.data?.orders, query]);

  const filteredPickups = useMemo(
    () =>
      filterLogisticsRuns(
        pickupRows,
        query,
        staffFilter || null,
        (row) => row.assignment?.staff_name,
      ),
    [pickupRows, query, staffFilter],
  );
  const filteredDeliveries = useMemo(
    () =>
      filterLogisticsRuns(
        deliveryRows,
        query,
        staffFilter || null,
        (row) => row.assignment?.staff_name,
      ),
    [deliveryRows, query, staffFilter],
  );

  const drivers = driversQ.data ?? [];
  const staffNames = useMemo(() => {
    const names = new Set<string>();
    for (const row of [...pickupRows, ...deliveryRows]) {
      if (row.assignment?.staff_name) names.add(row.assignment.staff_name);
    }
    return Array.from(names).sort();
  }, [pickupRows, deliveryRows]);

  const loading =
    !enabled ||
    (activeTab === 'pickups' && pickupsQ.isPending) ||
    (activeTab === 'deliveries' && deliveriesQ.isPending) ||
    (activeTab === 'done' && doneQ.isPending);

  const error =
    (activeTab === 'pickups' && pickupsQ.isError && pickupsQ.error) ||
    (activeTab === 'deliveries' && deliveriesQ.isError && deliveriesQ.error) ||
    (activeTab === 'done' && doneQ.isError && doneQ.error) ||
    null;

  const counts = {
    pickups: pickupRows.length,
    deliveries: deliveryRows.length,
    done: doneQ.data?.total ?? 0,
  };

  return (
    <div className="space-y-4">
      {showBoardHeader ? (
        <OwnerSectionHeader
          title="Logistics"
          description="Clear morning pickups and afternoon deliveries from one board."
          action={
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/partner/operations">Operations center</Link>
            </Button>
          }
        />
      ) : null}
      {showTabNav ? (
        <div
          className="flex flex-wrap gap-1.5 rounded-xl bg-muted/50 p-1 ring-1 ring-border/50"
          role="tablist"
          aria-label="Logistics boards"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={cn(
                'rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm',
                activeTab === t.id
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-border/60'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums text-muted-foreground">({counts[t.id]})</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search runs</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, or tracking code"
            className="h-11 pl-9"
          />
        </label>
        {activeTab !== 'done' ? (
          <Select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="h-11 sm:w-48"
            aria-label="Filter by rider"
          >
            <option value="">All riders</option>
            {staffNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        ) : null}
      </div>

      {error ? (
        <QueryErrorState
          title="Could not load logistics"
          message={getApiErrorMessage(error, 'Logistics queue failed')}
          onRetry={() => {
            if (activeTab === 'pickups') void pickupsQ.refetch();
            if (activeTab === 'deliveries') void deliveriesQ.refetch();
            if (activeTab === 'done') void doneQ.refetch();
          }}
        />
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : null}

      {!loading && !error && activeTab === 'pickups' && filteredPickups.length === 0 ? (
        <OwnerEmptyState
          title="No pickups waiting"
          description="New doorstep orders needing collection will show here."
          imageSrc={OWNER_IMAGES.logistics}
          imageAlt="Pickup van"
          action={{ label: 'New Order', href: buildPartnerCreateOrderHref() }}
        />
      ) : null}

      {!loading && !error && activeTab === 'deliveries' && filteredDeliveries.length === 0 ? (
        <OwnerEmptyState
          title="No deliveries in queue"
          description="Ready and out-for-delivery orders will land on this board."
          imageSrc={OWNER_IMAGES.emptyLogistics}
          imageAlt="Delivery"
        />
      ) : null}

      {!loading && !error && activeTab === 'done' && doneRows.length === 0 ? (
        <OwnerEmptyState
          title="Nothing completed today yet"
          description="Delivered orders from today will appear here for a quick wrap-up."
          imageSrc={OWNER_IMAGES.calm}
          imageAlt="Calm laundry"
        />
      ) : null}

      {!loading && !error && activeTab === 'pickups' ? (
        <ul className="space-y-3">
          {filteredPickups.map((order) => (
            <li key={order.order_id}>
              <OwnerLogisticsRunCard
                order={order}
                taskType="pickup"
                drivers={drivers}
                phone={order.customer_phone ?? undefined}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && !error && activeTab === 'deliveries' ? (
        <ul className="space-y-3">
          {filteredDeliveries.map((order) => (
            <li key={order.order_id}>
              <OwnerLogisticsRunCard
                order={order}
                taskType="delivery"
                drivers={drivers}
                phone={order.customer_phone ?? undefined}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && !error && activeTab === 'done' ? (
        <div className="space-y-3">
          {doneQ.data?.capped ? (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground ring-1 ring-border/50">
              Showing the latest {doneQ.data.cap} delivered orders from today.
            </p>
          ) : null}
          <ul className="space-y-3">
            {doneRows.map((order) => {
              const image = logisticsRunImage('done');
              return (
                <li key={order.order_id}>
                  <article className="flex overflow-hidden rounded-xl bg-card ring-1 ring-border/60">
                    <div className="relative hidden w-24 shrink-0 sm:block">
                      <Image src={image.src} alt={image.alt} fill sizes="96px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <PartnerStatusBadge status={order.status} />
                        <PackageCheck className="h-4 w-4 text-success" aria-hidden />
                      </div>
                      <h3 className="mt-1.5 truncate text-base font-semibold">{order.customer_name}</h3>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        #{order.tracking_code}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Delivered{' '}
                        <ClientDate iso={order.delivered_at ?? order.delivery_at} mode="datetime" /> ·{' '}
                        {formatInr(Number(order.total_inr))}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.customer_phone ? (
                          <Button type="button" size="sm" variant="outline" className="min-h-11" asChild>
                            <a href={`tel:${order.customer_phone}`}>
                              <Phone className="mr-1.5 h-4 w-4" aria-hidden />
                              Call
                            </a>
                          </Button>
                        ) : null}
                        <Button type="button" size="sm" variant="outline" className="min-h-11" asChild>
                          <Link href={`/partner/orders/${order.order_id}`}>Open order</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
