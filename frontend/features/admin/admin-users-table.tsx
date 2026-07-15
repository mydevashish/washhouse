'use client';

import { Users } from 'lucide-react';
import { useMemo } from 'react';

import { ServerListToolbar } from '@/components/data-table/server-list-toolbar';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { ClientDate } from '@/components/ui/client-date';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRoleBadge } from '@/features/admin/lib/admin-badges';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listAdminUsers, type AdminUserRow } from '@/services/admin';

const USER_COLUMNS: VirtualColumnDef<AdminUserRow>[] = [
  {
    id: 'full_name',
    header: 'Name',
    sortable: true,
    className: 'font-medium',
    cell: (u) => u.full_name,
  },
  {
    id: 'email',
    header: 'Email',
    sortable: true,
    className: 'text-muted-foreground',
    cell: (u) => u.email ?? '—',
  },
  {
    id: 'role',
    header: 'Role',
    sortable: true,
    cell: (u) => <UserRoleBadge role={u.role} />,
  },
  {
    id: 'is_email_verified',
    header: 'Verified',
    sortable: true,
    cell: (u) =>
      u.is_email_verified ? (
        <span className="text-sm text-success">Yes</span>
      ) : (
        <span className="text-sm text-muted-foreground">No</span>
      ),
  },
  {
    id: 'created_at',
    header: 'Joined',
    sortable: true,
    className: 'whitespace-nowrap text-muted-foreground',
    cell: (u) => <ClientDate iso={u.created_at} mode="date" />,
  },
];

export function AdminUsersTable() {
  const list = useServerList({
    queryKey: queryKeys.adminUsers(),
    fetcher: listAdminUsers,
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
  });

  const columns = useMemo(() => USER_COLUMNS, []);

  if (list.isLoading && list.rows.length === 0) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (list.isError) {
    return (
      <QueryErrorState
        title="Could not load users"
        onRetry={() => void list.refetch()}
        isRetrying={list.isFetching}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Users</h2>
          <p className="text-sm text-muted-foreground">Customers, partners, and admins</p>
        </div>
        <ServerListToolbar
          search={list.search}
          onSearchChange={list.setSearch}
          searchPlaceholder="Search name, email, role…"
          totalRecords={list.totalRecords}
          isLoading={list.isFetching}
          onRefresh={() => void list.refetch()}
          className="w-full sm:w-auto"
        />
      </CardHeader>
      <CardContent className="p-0">
        <VirtualDataTable
          tableId="admin-users"
          columns={columns}
          rows={list.rows}
          getRowId={(u) => u.id}
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
                icon={Users}
                title={list.search ? 'No matches' : 'No users'}
                description={
                  list.search ? 'Try a different search.' : 'Users will appear as they register.'
                }
              />
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
