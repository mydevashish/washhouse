'use client';

import { Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import {
  usePartnerOrders,
  usePartnerQueriesEnabled,
} from '@/features/partner/hooks/use-partner-operations';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerOrders, type PartnerOrder } from '@/services/partner';

type HubOrdersFilters = {
  bucket: 'all';
};

export function usePartnerHubOrdersList() {
  const enabled = usePartnerQueriesEnabled();
  return useServerList<PartnerOrder, HubOrdersFilters>({
    queryKey: queryKeys.partnerOrders({ surface: 'hub-workspace' }),
    fetcher: (params) =>
      listPartnerOrders({
        page: params.page,
        page_size: 10,
        sort_by: params.sort_by ?? 'created_at',
        sort_order: params.sort_order ?? 'desc',
        bucket: 'all',
        search: params.search,
      }),
    filters: { bucket: 'all' },
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
    defaultPageSize: 10,
    enabled,
  });
}

export function usePartnerHubOrdersKpis() {
  const enabled = usePartnerQueriesEnabled();
  const actionQ = usePartnerOrders({ bucket: 'action', page: 1, page_size: 1 });
  return {
    needsAction: actionQ.data?.total_records ?? 0,
    isLoadingAction: actionQ.isLoading,
  };
}

export function PartnerHubOrdersWorkspaceToolbar({
  searchInput,
  onSearchChange,
  onNewOrder,
}: {
  searchInput: string;
  onSearchChange: (value: string) => void;
  onNewOrder: () => void;
}) {
  return (
    <>
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tracking, phone, name, token…"
          className="h-9 pl-9"
          aria-label="Search orders"
          data-testid="hub-orders-search"
        />
      </div>
      <Button
        type="button"
        className="h-9 shrink-0"
        data-testid="hub-orders-new"
        onClick={onNewOrder}
      >
        <Plus className="mr-1.5 h-4 w-4" aria-hidden />
        New order
      </Button>
    </>
  );
}

export function PartnerHubOrdersWorkspaceKpiStrip({
  weekCount,
  needsAction,
}: {
  weekCount?: number;
  needsAction: number;
}) {
  return (
    <div
      className="mb-3 flex flex-wrap items-center gap-2 text-sm"
      data-testid="hub-orders-kpi-strip"
    >
      {weekCount != null ? (
        <Badge variant="secondary" className="font-normal">
          This week: {weekCount}
        </Badge>
      ) : null}
      {needsAction > 0 ? (
        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 font-normal">
          Needs action: {needsAction}
        </Badge>
      ) : null}
    </div>
  );
}

export function PartnerHubOrdersWorkspaceBody({
  list,
  weekCount,
  needsAction,
}: {
  list: ReturnType<typeof usePartnerHubOrdersList>;
  weekCount?: number;
  needsAction: number;
}) {
  const hasActiveLens = Boolean(list.search.trim());

  return (
    <div data-testid="hub-orders-table-wrap">
      <PartnerHubOrdersWorkspaceKpiStrip weekCount={weekCount} needsAction={needsAction} />
      <PartnerOrdersTable
        filters={{ bucket: 'all' }}
        search={list.search}
        hasActiveLens={hasActiveLens}
        onClearFilters={() => list.setSearch('')}
        serverList={list}
        hidePagination
      />
    </div>
  );
}
