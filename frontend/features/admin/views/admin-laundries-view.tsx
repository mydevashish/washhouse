'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ServerListToolbar } from '@/components/data-table/server-list-toolbar';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminCreateLaundry } from '@/features/admin/admin-create-laundry';
import { LaundryStatusBadge } from '@/features/admin/lib/admin-badges';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { formatIndiaDate } from '@/lib/datetime';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import {
  listLaundriesManagement,
  setLaundryCommission,
  type AdminLaundryManagementRow,
} from '@/services/admin';

export function AdminLaundriesView() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');

  const list = useServerList({
    queryKey: queryKeys.adminLaundriesManagement(),
    fetcher: listLaundriesManagement,
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
  });

  const saveCommission = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number | null }) => setLaundryCommission(id, rate),
    onSuccess: () => {
      toast.success('Commission updated');
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminLaundriesManagement() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminAuditLogs() });
    },
    onError: () => toast.error('Update failed'),
  });

  const columns = useMemo<VirtualColumnDef<AdminLaundryManagementRow>[]>(
    () => [
      { id: 'name', header: 'Laundry', sortable: true, className: 'font-medium', cell: (r) => r.name },
      { id: 'owner_name', header: 'Owner', sortable: true, cell: (r) => r.owner_name },
      { id: 'city', header: 'City', sortable: true, cell: (r) => r.city },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        cell: (r) => <LaundryStatusBadge status={r.status} />,
      },
      {
        id: 'effective_commission_rate',
        header: 'Commission',
        sortable: true,
        cell: (r) => (
          <div className="space-y-0.5 text-sm">
            <p className="font-semibold tabular-nums">{r.effective_commission_rate}%</p>
            <p className="text-xs text-muted-foreground">
              {r.custom_commission_rate ? 'Custom' : `Global ${r.global_commission_rate}%`}
            </p>
          </div>
        ),
      },
      {
        id: 'orders_count',
        header: 'Orders',
        sortable: true,
        className: 'tabular-nums',
        cell: (r) => r.orders_count,
      },
      {
        id: 'revenue_inr',
        header: 'Revenue',
        sortable: true,
        className: 'tabular-nums font-medium',
        cell: (r) => formatInr(Number(r.revenue_inr)),
      },
      {
        id: 'rating',
        header: 'Rating',
        cell: (r) => (
          <span className="text-sm">
            {Number(r.rating).toFixed(1)}{' '}
            <span className="text-muted-foreground">({r.review_count})</span>
          </span>
        ),
      },
      {
        id: 'created_at',
        header: 'Created',
        sortable: true,
        className: 'text-muted-foreground whitespace-nowrap',
        cell: (r) => formatIndiaDate(r.created_at),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (r) =>
          editingId === r.id ? (
            <div className="flex items-center gap-1">
              <Input
                className="h-8 w-16"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
                aria-label="Commission percent"
              />
              <Button
                type="button"
                size="sm"
                disabled={saveCommission.isPending}
                onClick={() =>
                  saveCommission.mutate({
                    id: r.id,
                    rate: editRate.trim() === '' ? null : Number(editRate),
                  })
                }
              >
                Save
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingId(r.id);
                setEditRate(r.custom_commission_rate ?? '');
              }}
            >
              Edit %
            </Button>
          ),
      },
    ],
    [editingId, editRate, saveCommission.isPending],
  );

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Laundries"
        actions={
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => document.getElementById('create-laundry')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create
          </Button>
        }
      />

      {list.isError ? (
        <QueryErrorState
          title="Could not load laundries"
          onRetry={() => void list.refetch()}
          isRetrying={list.isFetching}
        />
      ) : null}

      <AdminPanel
        meta={<span className="tabular-nums">{list.totalRecords} registered</span>}
        toolbar={
          <ServerListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder="Search…"
            totalRecords={list.totalRecords}
            isLoading={list.isFetching}
            onRefresh={() => void list.refetch()}
          />
        }
        bodyClassName="p-0"
      >
        {list.isLoading && list.rows.length === 0 ? (
          <Skeleton className="m-4 h-64 rounded-xl" />
        ) : (
          <VirtualDataTable
            tableId="admin-laundries-mgmt"
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
              <p className="py-10 text-center text-sm text-muted-foreground">No laundries found.</p>
            }
          />
        )}
      </AdminPanel>

      <div id="create-laundry">
        <AdminCreateLaundry />
      </div>
    </AdminContent>
  );
}
