'use client';

import { Store } from 'lucide-react';
import { useMemo } from 'react';

import { ServerListToolbar } from '@/components/data-table/server-list-toolbar';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { LaundryStatusBadge } from '@/features/admin/lib/admin-badges';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listAllLaundries, type AdminLaundryRow } from '@/services/admin';

const LAUNDRY_COLUMNS: VirtualColumnDef<AdminLaundryRow>[] = [
  {
    id: 'name',
    header: 'Name',
    sortable: true,
    className: 'font-medium',
    cell: (l) => l.name,
  },
  {
    id: 'city',
    header: 'City',
    sortable: true,
    className: 'text-muted-foreground',
    cell: (l) => l.city,
  },
  {
    id: 'status',
    header: 'Status',
    sortable: true,
    cell: (l) => <LaundryStatusBadge status={l.status} />,
  },
  {
    id: 'is_verified',
    header: 'Verified',
    sortable: true,
    cell: (l) =>
      l.is_verified ? (
        <span className="text-sm text-success">Yes</span>
      ) : (
        <span className="text-sm text-muted-foreground">No</span>
      ),
  },
];

export function AdminLaundriesList() {
  const list = useServerList({
    queryKey: queryKeys.adminLaundries(),
    fetcher: listAllLaundries,
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
  });

  const columns = useMemo(() => LAUNDRY_COLUMNS, []);

  if (list.isLoading && list.rows.length === 0) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (list.isError) {
    return (
      <QueryErrorState
        title="Could not load laundries"
        onRetry={() => void list.refetch()}
        isRetrying={list.isFetching}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Laundries</h2>
          <p className="text-sm text-muted-foreground">All partner shops on the platform</p>
        </div>
        <ServerListToolbar
          search={list.search}
          onSearchChange={list.setSearch}
          searchPlaceholder="Search name, city, status…"
          totalRecords={list.totalRecords}
          isLoading={list.isFetching}
          onRefresh={() => void list.refetch()}
          className="w-full sm:w-auto"
        />
      </CardHeader>
      <CardContent className="p-0">
        <VirtualDataTable
          tableId="admin-laundries"
          columns={columns}
          rows={list.rows}
          getRowId={(l) => l.id}
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
            <div className="p-8">
              <EmptyState
                icon={Store}
                title={list.search ? 'No matches' : 'No laundries'}
                description={
                  list.search
                    ? 'Try another search term.'
                    : 'Partner shops will appear here after onboarding.'
                }
              />
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
