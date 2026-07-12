'use client';

import { useMemo, useState } from 'react';

import { ServerListToolbar } from '@/components/data-table/server-list-toolbar';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  AdminContent,
} from '@/features/admin/components/admin-content';
import { AdminFilterBar, AdminFilterField, AdminPanel } from '@/features/admin/components/admin-panel';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { formatIndiaDateTime } from '@/lib/datetime';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listAdminAuditLogs, type AdminAuditListParams, type AdminAuditLogRow } from '@/services/admin';

export function AdminAuditView() {
  const [filters, setFilters] = useState<AdminAuditListParams>({});

  const list = useServerList<AdminAuditLogRow, AdminAuditListParams>({
    queryKey: queryKeys.adminAuditLogs(),
    fetcher: listAdminAuditLogs,
    filters,
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
  });

  const columns: VirtualColumnDef<AdminAuditLogRow>[] = useMemo(
    () => [
      {
        id: 'timestamp',
        header: 'Time',
        sortable: true,
        className: 'whitespace-nowrap font-mono text-xs text-muted-foreground',
        cell: (r) => formatIndiaDateTime(r.timestamp),
      },
      { id: 'user_name', header: 'User', sortable: true, cell: (r) => r.user_name },
      {
        id: 'role',
        header: 'Role',
        className: 'text-xs text-muted-foreground',
        cell: (r) => r.role ?? '—',
      },
      { id: 'entity', header: 'Entity', sortable: true, className: 'text-xs', cell: (r) => r.entity },
      {
        id: 'action',
        header: 'Action',
        sortable: true,
        cell: (r) => <code className="text-xs">{r.action}</code>,
      },
      {
        id: 'new_value',
        header: 'Change',
        cell: (r) => (
          <span className="block max-w-[160px] truncate text-xs text-muted-foreground" title={r.new_value ?? undefined}>
            {r.new_value ?? r.old_value ?? '—'}
          </span>
        ),
      },
      {
        id: 'ip_address',
        header: 'IP',
        className: 'hidden font-mono text-xs text-muted-foreground xl:table-cell',
        cell: (r) => r.ip_address ?? '—',
      },
    ],
    [],
  );

  return (
    <AdminContent className="space-y-4">
      <AdminPageHeader title="Audit logs" description="Platform change history." />

      <AdminFilterBar>
        <AdminFilterField label="Entity">
          <Select
            value={filters.resource_type ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, resource_type: e.target.value || undefined }))}
            className="h-9 w-full"
            aria-label="Entity"
          >
            <option value="">All</option>
            <option value="laundry">Laundry</option>
            <option value="commission_global">Commission</option>
            <option value="user">User</option>
          </Select>
        </AdminFilterField>
        <AdminFilterField label="Action">
          <Input
            placeholder="Action code"
            value={filters.action ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value || undefined }))}
            className="h-9"
          />
        </AdminFilterField>
        <AdminFilterField label="From">
          <Input
            type="date"
            value={filters.created_from?.slice(0, 10) ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, created_from: e.target.value || undefined }))}
            className="h-9"
          />
        </AdminFilterField>
        <AdminFilterField label="To">
          <Input
            type="date"
            value={filters.created_to?.slice(0, 10) ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, created_to: e.target.value || undefined }))}
            className="h-9"
          />
        </AdminFilterField>
      </AdminFilterBar>

      <AdminPanel
        toolbar={
          <ServerListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder="User, action, entity…"
            totalRecords={list.totalRecords}
            isLoading={list.isFetching}
            onRefresh={() => void list.refetch()}
          />
        }
        bodyClassName="p-0"
      >
        <VirtualDataTable
          tableId="admin-audit"
          columns={columns}
          rows={list.rows}
          getRowId={(r) => r.id}
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
            <p className="py-10 text-center text-sm text-muted-foreground">No events match your filters.</p>
          }
        />
      </AdminPanel>
    </AdminContent>
  );
}
