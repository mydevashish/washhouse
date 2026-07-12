'use client';

import { useMemo, useState } from 'react';
import { Camera, Package, PackageCheck, Shield } from 'lucide-react';

import { ServerListToolbar } from '@/components/data-table/server-list-toolbar';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPickupEvidenceDialog } from '@/features/admin/admin-pickup-evidence-dialog';
import { AdminDeliveryProofDialog } from '@/features/admin/admin-delivery-proof-dialog';
import { CustodyTimelineDialog } from '@/features/chain-of-custody';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { OrderStatusBadge } from '@/features/admin/lib/admin-badges';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listAdminOrders, type AdminOrderRow } from '@/services/admin';
import { getAdminCustodyTimeline } from '@/services/custody-timeline';

export function AdminOrdersTable() {
  const [evidenceOrder, setEvidenceOrder] = useState<AdminOrderRow | null>(null);
  const [deliveryProofOrder, setDeliveryProofOrder] = useState<AdminOrderRow | null>(null);
  const [custodyOrder, setCustodyOrder] = useState<AdminOrderRow | null>(null);

  const columns = useMemo<VirtualColumnDef<AdminOrderRow>[]>(
    () => [
      {
        id: 'tracking_code',
        header: 'Code',
        sortable: true,
        cell: (o) => <span className="font-mono text-xs font-medium">#{o.tracking_code}</span>,
      },
      {
        id: 'customer_name',
        header: 'Customer',
        sortable: true,
        cell: (o) => o.customer_name,
      },
      {
        id: 'laundry_name',
        header: 'Laundry',
        sortable: true,
        className: 'max-w-[140px] truncate',
        cell: (o) => o.laundry_name,
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        cell: (o) => <OrderStatusBadge status={o.status} />,
      },
      {
        id: 'total_inr',
        header: 'Total',
        sortable: true,
        headerClassName: 'text-right',
        className: 'text-right font-medium tabular-nums',
        cell: (o) => formatInr(Number(o.total_inr)),
      },
      {
        id: 'created_at',
        header: 'Date',
        sortable: true,
        className: 'whitespace-nowrap text-xs text-muted-foreground',
        cell: (o) => <ClientDate iso={o.created_at} mode="date" />,
      },
      {
        id: 'evidence',
        header: 'Evidence',
        cell: (o) => (
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setEvidenceOrder(o)}
              aria-label={`View pickup evidence for order ${o.tracking_code}`}
            >
              <Camera className="h-3.5 w-3.5" aria-hidden />
              Pickup
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setDeliveryProofOrder(o)}
              aria-label={`View delivery proof for order ${o.tracking_code}`}
            >
              <PackageCheck className="h-3.5 w-3.5" aria-hidden />
              Delivery
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setCustodyOrder(o)}
              aria-label={`View chain of custody for order ${o.tracking_code}`}
            >
              <Shield className="h-3.5 w-3.5" aria-hidden />
              Custody
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const list = useServerList({
    queryKey: queryKeys.adminOrders(),
    fetcher: listAdminOrders,
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
  });

  if (list.isLoading && list.rows.length === 0) {
    return <Skeleton className="h-80 w-full rounded-2xl" />;
  }

  if (list.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load orders">
        Try refreshing the page.
      </InfoBanner>
    );
  }

  return (
    <>
      <AdminPanel
        meta={<span className="tabular-nums">{list.totalRecords.toLocaleString()} orders</span>}
        toolbar={
          <ServerListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder="Tracking code, customer, laundry…"
            totalRecords={list.totalRecords}
            isLoading={list.isFetching}
            onRefresh={() => void list.refetch()}
          />
        }
        bodyClassName="p-0"
      >
        <VirtualDataTable
          tableId="admin-orders"
          columns={columns}
          rows={list.rows}
          getRowId={(o) => o.id}
          sort={list.sort}
          onToggleSort={list.toggleSort}
          page={list.page}
          pageCount={list.pageCount}
          pageSize={list.pageSize}
          pageStart={list.pageStart}
          pageEnd={list.pageEnd}
          filteredCount={list.totalRecords}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          emptyState={
            <div className="p-6">
              <EmptyState
                icon={Package}
                title={list.search ? 'No matches' : 'No orders yet'}
                description={
                  list.search ? 'Try a different search term.' : 'Orders appear as customers book.'
                }
              />
            </div>
          }
        />
      </AdminPanel>

      <AdminPickupEvidenceDialog
        orderId={evidenceOrder?.id ?? null}
        trackingCode={evidenceOrder?.tracking_code ?? null}
        open={Boolean(evidenceOrder)}
        onOpenChange={(open) => !open && setEvidenceOrder(null)}
      />

      <AdminDeliveryProofDialog
        orderId={deliveryProofOrder?.id ?? null}
        trackingCode={deliveryProofOrder?.tracking_code ?? null}
        open={Boolean(deliveryProofOrder)}
        onOpenChange={(open) => !open && setDeliveryProofOrder(null)}
      />

      <CustodyTimelineDialog
        orderId={custodyOrder?.id ?? null}
        trackingCode={custodyOrder?.tracking_code ?? null}
        open={Boolean(custodyOrder)}
        onOpenChange={(open) => !open && setCustodyOrder(null)}
        queryFn={getAdminCustodyTimeline}
        scope="admin"
      />
    </>
  );
}
