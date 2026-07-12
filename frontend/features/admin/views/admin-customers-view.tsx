'use client';

import { useMemo } from 'react';

import { ServerListToolbar } from '@/components/data-table/server-list-toolbar';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { UserRoleBadge } from '@/features/admin/lib/admin-badges';
import { formatIndiaDate } from '@/lib/datetime';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listAdminUsers, type AdminUserRow } from '@/services/admin';

export function AdminCustomersView() {
  const list = useServerList({
    queryKey: [...queryKeys.adminUsers(), 'customers'],
    fetcher: listAdminUsers,
    filters: { role: 'customer' },
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
  });

  const columns: VirtualColumnDef<AdminUserRow>[] = useMemo(
    () => [
      { id: 'full_name', header: 'Name', sortable: true, className: 'font-medium', cell: (u) => u.full_name },
      { id: 'email', header: 'Email', sortable: true, className: 'text-muted-foreground', cell: (u) => u.email ?? '—' },
      {
        id: 'is_email_verified',
        header: 'Verified',
        cell: (u) => (u.is_email_verified ? 'Yes' : 'No'),
      },
      { id: 'role', header: 'Role', cell: (u) => <UserRoleBadge role={u.role} /> },
      {
        id: 'created_at',
        header: 'Joined',
        sortable: true,
        className: 'text-muted-foreground',
        cell: (u) => formatIndiaDate(u.created_at),
      },
    ],
    [],
  );

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Customers"
        description="Registered customers, verification status, and order history."
      />

      <AdminPanel
        meta={<span className="tabular-nums">{list.totalRecords.toLocaleString()} total</span>}
        toolbar={
          <ServerListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder="Search customers…"
            totalRecords={list.totalRecords}
            isLoading={list.isFetching}
            onRefresh={() => void list.refetch()}
          />
        }
        bodyClassName="p-0"
      >
        <VirtualDataTable
          tableId="admin-customers"
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
          emptyState={<p className="py-10 text-center text-sm text-muted-foreground">No customers match.</p>}
        />
      </AdminPanel>
    </AdminContent>
  );
}
