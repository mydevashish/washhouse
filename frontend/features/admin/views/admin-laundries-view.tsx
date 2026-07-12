'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { Input } from '@/components/ui/input';
import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminCreateLaundry } from '@/features/admin/admin-create-laundry';
import { LaundryStatusBadge } from '@/features/admin/lib/admin-badges';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { formatIndiaDate } from '@/lib/datetime';
import { useDataTableState } from '@/lib/table/use-data-table-state';
import { queryKeys } from '@/lib/query-keys';
import { listLaundriesManagement, setLaundryCommission, type AdminLaundryManagementRow } from '@/services/admin';

function filterLaundry(row: AdminLaundryManagementRow, q: string) {
  const s = q.toLowerCase();
  return (
    row.name.toLowerCase().includes(s) ||
    row.owner_name.toLowerCase().includes(s) ||
    row.city.toLowerCase().includes(s) ||
    row.status.toLowerCase().includes(s)
  );
}

export function AdminLaundriesView() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState('');

  const laundriesQ = useQuery({
    queryKey: queryKeys.adminLaundriesManagement(),
    queryFn: listLaundriesManagement,
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

  const data = laundriesQ.data ?? [];
  const table = useDataTableState({
    data,
    filterFn: filterLaundry,
    getSortValue: (row, col) => {
      if (col === 'revenue_inr') return Number(row.revenue_inr);
      if (col === 'orders_count') return row.orders_count;
      if (col === 'effective_commission_rate') return Number(row.effective_commission_rate);
      if (col === 'name') return row.name;
      if (col === 'created_at') return row.created_at;
      return '';
    },
    defaultSort: { columnId: 'created_at', direction: 'desc' },
    defaultPageSize: 25,
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
            {Number(r.rating).toFixed(1)} <span className="text-muted-foreground">({r.review_count})</span>
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

      <AdminPanel
        meta={<span className="tabular-nums">{data.length} registered</span>}
        toolbar={
          <Input
            type="search"
            placeholder="Search…"
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
            className="h-9 w-48 sm:w-56"
            aria-label="Search laundries"
          />
        }
        bodyClassName="p-0"
      >
        <VirtualDataTable
          tableId="admin-laundries-mgmt"
          columns={columns}
          rows={table.pageRows}
          getRowId={(r) => r.id}
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
          emptyState={<p className="py-10 text-center text-sm text-muted-foreground">No laundries found.</p>}
        />
      </AdminPanel>

      <div id="create-laundry">
        <AdminCreateLaundry />
      </div>
    </AdminContent>
  );
}
