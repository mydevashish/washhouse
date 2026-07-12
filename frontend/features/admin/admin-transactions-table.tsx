'use client';

import { CreditCard } from 'lucide-react';
import { useMemo } from 'react';

import { ServerListToolbar } from '@/components/data-table/server-list-toolbar';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { PaymentStatusBadge } from '@/features/admin/lib/admin-badges';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listAdminOrders, type AdminOrderRow } from '@/services/admin';

const TRANSACTION_COLUMNS: VirtualColumnDef<AdminOrderRow>[] = [
  {
    id: 'tracking_code',
    header: 'Order',
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
    id: 'payment_status',
    header: 'Payment',
    sortable: true,
    cell: (o) => <PaymentStatusBadge status={o.payment_status} />,
  },
  {
    id: 'total_inr',
    header: 'Amount',
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
];

export function AdminTransactionsTable() {
  const list = useServerList({
    queryKey: [...queryKeys.adminOrders(), 'transactions'],
    fetcher: listAdminOrders,
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
  });

  const columns = useMemo(() => TRANSACTION_COLUMNS, []);

  if (list.isLoading && list.rows.length === 0) {
    return <Skeleton className="h-80 w-full rounded-2xl" />;
  }

  if (list.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load transactions">
        Try refreshing the page.
      </InfoBanner>
    );
  }

  return (
    <AdminPanel
      title="Transactions"
      meta={<span className="tabular-nums">{list.totalRecords.toLocaleString()} records</span>}
      toolbar={
        <ServerListToolbar
          search={list.search}
          onSearchChange={list.setSearch}
          searchPlaceholder="Order, customer, laundry…"
          totalRecords={list.totalRecords}
          isLoading={list.isFetching}
          onRefresh={() => void list.refetch()}
        />
      }
      bodyClassName="p-0"
    >
      <VirtualDataTable
        tableId="admin-transactions"
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
              icon={CreditCard}
              title={list.search ? 'No matches' : 'No transactions yet'}
              description={
                list.search
                  ? 'Try a different search term.'
                  : 'Payments appear as customers complete checkout.'
              }
            />
          </div>
        }
      />
    </AdminPanel>
  );
}
