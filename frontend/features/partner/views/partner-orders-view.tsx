'use client';

import { Suspense } from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import {
  PartnerHubCreateOrderProvider,
  PartnerHubCreateOrderUrlListener,
  usePartnerHubCreateOrder,
} from '@/features/partner/orders-hub/workspace/partner-hub-create-order';
import { PartnerHubWorkspaceModals } from '@/features/partner/orders-hub/workspace/partner-hub-customers-pillar';
import { usePartnerHubLegacyHubRedirect } from '@/features/partner/orders-hub/workspace/use-partner-hub-workspace-url';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerOrders, type PartnerOrder } from '@/services/partner';

function PartnerOrdersNewOrderButton() {
  const { openCreateOrder } = usePartnerHubCreateOrder();

  return (
    <Button
      type="button"
      size="sm"
      className="h-9 min-h-9"
      data-testid="partner-orders-page-new-order"
      onClick={() => openCreateOrder()}
    >
      New order
    </Button>
  );
}

function PartnerOrdersHubUrlEffects() {
  usePartnerHubLegacyHubRedirect();
  return (
    <>
      <PartnerHubCreateOrderUrlListener />
      <PartnerHubWorkspaceModals />
    </>
  );
}

function PartnerOrdersViewBody() {
  const enabled = usePartnerQueriesEnabled();
  const list = useServerList<PartnerOrder>({
    queryKey: queryKeys.partnerOrders({ surface: 'partner-page' }),
    fetcher: (params) =>
      listPartnerOrders({
        page: params.page,
        page_size: params.page_size,
        sort_by: params.sort_by ?? 'created_at',
        sort_order: params.sort_order ?? 'desc',
        bucket: 'all',
        search: params.search,
      }),
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
    defaultPageSize: 10,
    enabled,
  });

  const hasActiveLens = Boolean(list.search.trim());

  return (
    <PartnerContent className="space-y-4">
      <Suspense fallback={null}>
        <PartnerOrdersHubUrlEffects />
      </Suspense>

      <PartnerPageHeader
        title="Orders"
        description="Search orders, filter by customer or tracking code, and manage the day’s queue."
        actions={<PartnerOrdersNewOrderButton />}
      />

      <div className="rounded-2xl border border-border bg-background p-3 shadow-sm">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={list.search}
            onChange={(e) => list.setSearch(e.target.value)}
            placeholder="Search tracking, phone, or customer name…"
            className="h-10 pl-9"
            aria-label="Search orders"
          />
        </div>
      </div>

      <PartnerOrdersTable
        search={list.search}
        hasActiveLens={hasActiveLens}
        onClearFilters={() => list.setSearch('')}
        serverList={list}
      />
    </PartnerContent>
  );
}

export function PartnerOrdersView() {
  return (
    <PartnerHubCreateOrderProvider>
      <PartnerOrdersViewBody />
    </PartnerHubCreateOrderProvider>
  );
}
