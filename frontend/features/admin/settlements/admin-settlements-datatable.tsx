'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { SettlementStatusBadge } from '@/features/admin/settlements/settlement-badges';
import { SettlementDetailDrawer } from '@/features/admin/settlements/settlement-detail-drawer';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  approveSettlement,
  getSettlementTable,
  processSettlement,
  releaseSettlementPayout,
  type SettlementFilters,
  type SettlementRow,
} from '@/services/settlements';

type Props = {
  filters: SettlementFilters;
  onFiltersChange: (patch: Partial<SettlementFilters>) => void;
};

export function AdminSettlementsDatatable({ filters, onFiltersChange }: Props) {
  const queryClient = useQueryClient();
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const filterKey = useMemo(() => ({ ...filters }), [filters]);

  const tableQ = useQuery({
    queryKey: queryKeys.adminSettlementsTable(filterKey),
    queryFn: () => getSettlementTable(filterKey),
    staleTime: STALE.adminDashboard,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminSettlementsTable(filterKey) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminSettlementDashboard() });
  };

  const actionM = useMutation({
    mutationFn: async (input: { id: string; action: 'approve' | 'process' | 'release' }) => {
      if (input.action === 'approve') return approveSettlement(input.id);
      if (input.action === 'process') return processSettlement(input.id);
      return releaseSettlementPayout(input.id, `PAY-${input.id.slice(0, 8).toUpperCase()}`);
    },
    onSuccess: () => {
      toast.success('Settlement updated');
      invalidate();
    },
    onError: () => toast.error('Action failed'),
  });

  const rows = tableQ.data?.items ?? [];

  const columns = useMemo<VirtualColumnDef<SettlementRow>[]>(
    () => [
      {
        id: 'settlement_code',
        header: 'Settlement ID',
        cell: (r) => <span className="font-mono text-xs">{r.settlement_code}</span>,
      },
      { id: 'laundry_name', header: 'Laundry', cell: (r) => r.laundry_name },
      { id: 'partner_name', header: 'Partner', cell: (r) => r.partner_name },
      {
        id: 'period',
        header: 'Period',
        cell: (r) => (
          <span className="text-xs text-muted-foreground">
            <ClientDate iso={r.period_start} mode="date" /> – <ClientDate iso={r.period_end} mode="date" />
          </span>
        ),
      },
      { id: 'orders_count', header: 'Orders', cell: (r) => r.orders_count },
      { id: 'gross', header: 'Gross', cell: (r) => formatInr(Number(r.gross_revenue_inr)) },
      { id: 'commission', header: 'Commission', cell: (r) => formatInr(Number(r.commission_inr)) },
      { id: 'refunds', header: 'Refunds', cell: (r) => formatInr(Number(r.refund_inr)) },
      { id: 'net', header: 'Net', cell: (r) => <span className="font-medium">{formatInr(Number(r.net_amount_inr))}</span> },
      { id: 'status', header: 'Status', cell: (r) => <SettlementStatusBadge status={r.status} /> },
      { id: 'created_at', header: 'Created', cell: (r) => <ClientDate iso={r.created_at} mode="datetime" /> },
      {
        id: 'paid_at',
        header: 'Paid',
        cell: (r) => (r.paid_at ? <ClientDate iso={r.paid_at} mode="datetime" /> : '—'),
      },
      {
        id: 'actions',
        header: '',
        cell: (r) => (
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDrawerId(r.id)}>
              <Eye className="h-3.5 w-3.5" aria-hidden />
            </Button>
            {r.status === 'pending' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                disabled={actionM.isPending}
                onClick={() => actionM.mutate({ id: r.id, action: 'approve' })}
              >
                Approve
              </Button>
            )}
            {r.status === 'approved' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                disabled={actionM.isPending}
                onClick={() => actionM.mutate({ id: r.id, action: 'process' })}
              >
                Process
              </Button>
            )}
            {r.status === 'processing' && (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-7 text-[10px]"
                disabled={actionM.isPending}
                onClick={() => actionM.mutate({ id: r.id, action: 'release' })}
              >
                Release
              </Button>
            )}
          </div>
        ),
      },
    ],
    [actionM.isPending],
  );

  const handleSort = (columnId: string) => {
    const dir = filters.sort_by === columnId && filters.sort_dir === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ sort_by: columnId, sort_dir: dir, page: 1 });
  };

  return (
    <>
      <AdminPanel bodyClassName="p-0">
        <VirtualDataTable
          tableId="admin-settlements"
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          sort={{ columnId: filters.sort_by ?? 'created_at', direction: filters.sort_dir ?? 'desc' }}
          onToggleSort={handleSort}
          page={tableQ.data?.page ?? 1}
          pageCount={tableQ.data?.total_pages ?? 1}
          pageSize={filters.page_size ?? 25}
          pageStart={((tableQ.data?.page ?? 1) - 1) * (filters.page_size ?? 25) + (rows.length ? 1 : 0)}
          pageEnd={Math.min((tableQ.data?.page ?? 1) * (filters.page_size ?? 10), tableQ.data?.total_records ?? 0)}
          filteredCount={tableQ.data?.total_records ?? 0}
          onPageChange={(p) => onFiltersChange({ page: p })}
          onPageSizeChange={(s) => onFiltersChange({ page_size: s, page: 1 })}
          emptyState={
            <EmptyState icon={MoreHorizontal} title="No settlements" description="Run a settlement batch to create payouts." />
          }
        />
      </AdminPanel>

      <SettlementDetailDrawer
        settlementId={drawerId}
        open={Boolean(drawerId)}
        onOpenChange={(open) => !open && setDrawerId(null)}
        onUpdated={invalidate}
      />
    </>
  );
}
