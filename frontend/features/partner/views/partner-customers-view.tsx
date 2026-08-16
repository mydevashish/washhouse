'use client';

import { useQuery } from '@tanstack/react-query';
import { Headset, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { buildPartnerCreateOrderHref } from '@/features/partner/customer-desk/phone';
import {
  canRunPartnerCustomerSearch,
  formatPhoneInputDisplay,
  getPartnerCustomerSearchError,
} from '@/features/partner/lib/partner-phone-schema';
import {
  OWNER_IMAGES,
  OwnerEmptyState,
  OwnerSectionHeader,
} from '@/features/partner/components/owner';
import { OwnerCustomerCard } from '@/features/partner/components/owner/owner-customer-card';
import {
  PartnerOpsKpiGrid,
  PartnerOpsSectionLabel,
  PartnerOpsSurface,
  type PartnerOpsKpiItem,
} from '@/features/partner/components/ops-visual';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PARTNER_CARD } from '@/features/partner/lib/partner-compact';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { cn } from '@/lib/utils';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  getPartnerCustomerInsightsDashboard,
  listPartnerCustomerInsights,
  type CustomerInsightRow,
  type CustomerSegment,
} from '@/services/customer-insights';

const SEGMENT_OPTIONS: { value: CustomerSegment | ''; label: string }[] = [
  { value: '', label: 'All soft tags' },
  { value: 'new', label: 'New' },
  { value: 'active', label: 'Regular (active)' },
  { value: 'vip', label: 'Regular (VIP)' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'inactive', label: 'At risk (inactive)' },
];

function OwnerCustomerListSkeleton() {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="owner-customer-grid-skeleton"
      aria-hidden
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-44 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function PartnerCustomersView({ embedded = false }: { embedded?: boolean }) {
  const enabled = usePartnerQueriesEnabled();
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | ''>('');

  const dashboardQ = useQuery({
    queryKey: queryKeys.partnerCustomerInsightsDashboard(),
    queryFn: getPartnerCustomerInsightsDashboard,
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const list = useServerList<CustomerInsightRow, { segment?: CustomerSegment }>({
    queryKey: queryKeys.partnerCustomerInsights('directory', segmentFilter || 'all'),
    fetcher: (params) =>
      listPartnerCustomerInsights({
        page: params.page,
        page_size: params.page_size,
        search:
          params.search && canRunPartnerCustomerSearch(params.search)
            ? params.search
            : undefined,
        segment: params.segment,
      }),
    filters: segmentFilter ? { segment: segmentFilter } : {},
    defaultPageSize: 10,
    enabled,
  });

  const segmentKpiItems = useMemo((): PartnerOpsKpiItem[] => {
    const d = dashboardQ.data;
    if (!d) {
      return [
        { label: 'Total customers', value: '—' },
        { label: 'New', value: '—' },
        { label: 'Regular (active)', value: '—' },
        { label: 'VIP', value: '—' },
        { label: 'At risk', value: '—' },
      ];
    }
    const atRisk = d.segments.at_risk + d.segments.inactive;
    return [
      { label: 'Total customers', value: String(d.total_customers) },
      { label: 'New', value: String(d.segments.new) },
      { label: 'Regular (active)', value: String(d.segments.active) },
      { label: 'VIP', value: String(d.segments.vip) },
      { label: 'At risk', value: String(atRisk) },
    ];
  }, [dashboardQ.data]);

  const customers = list.rows;
  const awaitingAuth = !enabled;
  const dashboardBusy =
    awaitingAuth ||
    dashboardQ.isPending ||
    (dashboardQ.isFetching && dashboardQ.data === undefined && !dashboardQ.isError);
  const listBusy =
    awaitingAuth ||
    list.isPending ||
    (list.isFetching && list.rows.length === 0 && !list.isError);
  const hasAnyCustomers = (dashboardQ.data?.total_customers ?? customers.length) > 0;
  const searchActive = Boolean(list.search.trim());
  const directorySearchError = getPartnerCustomerSearchError(list.search);
  const directorySearchBlocked =
    Boolean(list.search.trim()) && !canRunPartnerCustomerSearch(list.search);
  const showListContent = enabled && !listBusy && !list.isError;
  const showEmptyStates = showListContent;

  const body = (
    <>
      {!embedded ? (
        <PartnerPageHeader
          title="Customers"
          description="Your laundry’s relationships — call, WhatsApp, view orders, or open Desk."
          actions={
            <Button asChild variant="outline" size="sm" className="h-9 min-h-9 gap-1.5">
              <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>
                <Headset className="h-3.5 w-3.5" aria-hidden />
                Find customer
              </Link>
            </Button>
          }
        />
      ) : (
        <OwnerSectionHeader
          title="Customers"
          description="Your laundry’s relationships — open Desk, view their orders, or start a new order."
          action={
            <Button asChild variant="outline" size="sm" className="h-9 min-h-9 gap-1.5">
              <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>
                <Headset className="h-3.5 w-3.5" aria-hidden />
                Find customer
              </Link>
            </Button>
          }
        />
      )}

      <section aria-label="Customer insights" data-testid="owner-customer-insights">
      <PartnerOpsSurface className="space-y-4">
        {!embedded ? (
          <PartnerOpsSectionLabel as="h2">Customer insights</PartnerOpsSectionLabel>
        ) : null}
        <PartnerOpsKpiGrid
          items={segmentKpiItems}
          loading={dashboardBusy}
          error={
            dashboardQ.isError ? getApiErrorMessage(dashboardQ.error) : undefined
          }
          onRetry={
            dashboardQ.isError ? () => void dashboardQ.refetch() : undefined
          }
        />
      </PartnerOpsSurface>
      </section>

      <div className={cn('grid gap-4 bg-muted/40', PARTNER_CARD)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Search customer</p>
            <p className="text-xs text-muted-foreground">Search by name or mobile number.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:min-w-[220px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={list.search}
                onChange={(e) => {
                  const next = e.target.value;
                  const digits = next.replace(/\D/g, '');
                  const looksPhone = digits.length > 0 && /^[\d\s+\-()+ ]+$/.test(next);
                  list.setSearch(looksPhone ? formatPhoneInputDisplay(next) : next);
                }}
                placeholder="Name or phone"
                aria-label="Search customers"
                aria-invalid={Boolean(directorySearchError)}
                aria-describedby={
                  directorySearchError ? 'owner-customer-search-error' : undefined
                }
                className="h-9 min-h-9 bg-background pl-9"
                data-testid="owner-customer-search"
              />
              {directorySearchError ? (
                <p
                  id="owner-customer-search-error"
                  className="mt-1 text-xs text-danger"
                  role="alert"
                >
                  {directorySearchError}
                </p>
              ) : null}
            </div>
            <div className="w-full sm:w-52">
              <Select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value as CustomerSegment | '')}
                aria-label="Filter by relationship tag"
                className="h-9 min-h-9 bg-background"
              >
                {SEGMENT_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </div>

      {listBusy ? <OwnerCustomerListSkeleton /> : null}

      {enabled && list.isError ? (
        <QueryErrorState
          title="Could not load customers"
          message={getApiErrorMessage(list.error)}
          onRetry={() => void list.refetch()}
          isRetrying={list.isFetching}
        />
      ) : null}

      {showEmptyStates && !hasAnyCustomers && !searchActive && !segmentFilter ? (
        <OwnerEmptyState
          title="No customers yet"
          description="First walk-in starts your book — take a phone number and place an order."
          imageSrc={OWNER_IMAGES.emptyCustomers}
          imageAlt="Quiet laundry shop ready for customers"
          action={{
            label: 'New walk-in order',
            href: buildPartnerCreateOrderHref(),
          }}
        />
      ) : null}

      {showEmptyStates &&
      customers.length === 0 &&
      (searchActive || segmentFilter || hasAnyCustomers) &&
      !directorySearchBlocked ? (
        <OwnerEmptyState
          title="No matches"
          description="Try another name, phone, or soft-tag filter."
          imageSrc={OWNER_IMAGES.people}
          imageAlt="Shop floor"
        />
      ) : null}

      {showListContent && customers.length > 0 ? (
        <>
          <div
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            data-testid="owner-customer-grid"
            aria-label={`${list.totalRecords} customers`}
          >
            {customers.map((c) => (
              <OwnerCustomerCard key={c.user_id} customer={c} />
            ))}
          </div>
          <DataTablePagination
            page={list.page}
            pageCount={list.pageCount}
            pageSize={list.pageSize}
            pageStart={list.pageStart}
            pageEnd={list.pageEnd}
            totalCount={list.totalRecords}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
          />
        </>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-4" data-testid="partner-customers-view">{body}</div>;
  }

  return (
    <PartnerContent className="space-y-4">
      <div data-testid="partner-customers-view">{body}</div>
    </PartnerContent>
  );
}
