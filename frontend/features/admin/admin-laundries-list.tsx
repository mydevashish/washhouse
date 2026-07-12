'use client';

import { useQuery } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import { useMemo } from 'react';

import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { LaundryStatusBadge } from '@/features/admin/lib/admin-badges';
import { maybeExpandRowsForPerfMock } from '@/lib/table/expand-mock-rows';
import { useDataTableState } from '@/lib/table/use-data-table-state';
import { queryKeys } from '@/lib/query-keys';
import { listAllLaundries, type AdminLaundryRow } from '@/services/admin';

function filterLaundry(row: AdminLaundryRow, query: string): boolean {
  const q = query.toLowerCase();
  return (
    row.name.toLowerCase().includes(q) ||
    row.city.toLowerCase().includes(q) ||
    row.status.toLowerCase().includes(q)
  );
}

function getLaundrySortValue(row: AdminLaundryRow, columnId: string) {
  switch (columnId) {
    case 'name':
      return row.name;
    case 'city':
      return row.city;
    case 'status':
      return row.status;
    case 'is_verified':
      return row.is_verified;
    default:
      return '';
  }
}

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
  const laundriesQ = useQuery({
    queryKey: queryKeys.adminLaundries(),
    queryFn: listAllLaundries,
  });

  const data = useMemo(() => {
    const rows = laundriesQ.data ?? [];
    return maybeExpandRowsForPerfMock(rows, (seed, index) => ({
      ...seed,
      id: `${seed.id}-mock-${index}`,
      name: `${seed.name} (${index})`,
    }));
  }, [laundriesQ.data]);

  const table = useDataTableState({
    data,
    filterFn: filterLaundry,
    getSortValue: getLaundrySortValue,
    defaultSort: { columnId: 'name', direction: 'asc' },
    defaultPageSize: 50,
  });

  if (laundriesQ.isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (laundriesQ.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load laundries">
        Try again later.
      </InfoBanner>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">All laundries</h2>
          <p className="text-sm text-muted-foreground">{table.totalCount} registered</p>
        </div>
        <Input
          type="search"
          placeholder="Search name, city, status…"
          value={table.search}
          onChange={(e) => table.setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Search laundries"
        />
      </CardHeader>
      <CardContent className="p-0">
        <VirtualDataTable
          tableId="admin-laundries"
          columns={LAUNDRY_COLUMNS}
          rows={table.pageRows}
          getRowId={(l) => l.id}
          sort={table.sort}
          onToggleSort={table.toggleSort}
          page={table.page}
          pageCount={table.pageCount}
          pageSize={table.pageSize}
          pageStart={table.pageStart}
          pageEnd={table.pageEnd}
          filteredCount={table.filteredCount}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          emptyState={
            <div className="p-8">
              <EmptyState
                icon={Store}
                title={table.search ? 'No matches' : 'No laundries yet'}
                description={
                  table.search
                    ? 'Try a different search term.'
                    : 'Laundries will appear here after registration.'
                }
              />
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
