'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  Eye,
  MoreHorizontal,
  ArrowUpCircle,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Select } from '@/components/ui/select';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import {
  DisputePriorityBadge,
  DisputeStatusBadge,
  DisputeTypeBadge,
} from '@/features/admin/disputes/dispute-badges';
import { DisputeAssigneeCell } from '@/features/admin/disputes/dispute-assignee-cell';
import { DisputeDetailDrawer } from '@/features/admin/disputes/dispute-detail-drawer';
import { DisputeFiltersBar } from '@/features/admin/disputes/dispute-filters-bar';
import { DisputeMetricsCards } from '@/features/admin/disputes/dispute-metrics-cards';
import { DisputeSlaCell } from '@/features/admin/disputes/dispute-sla-cell';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  bulkDisputeAction,
  downloadDisputeExport,
  getDisputeAdminMetrics,
  getDisputeAdminTable,
  getDisputeAssignees,
  type DisputeAdminRow,
  type DisputeTableFilters,
} from '@/services/disputes';
import { useAuthStore } from '@/store/auth.store';

const DEFAULT_FILTERS: DisputeTableFilters = {
  page: 1,
  page_size: 25,
  sort_by: 'created_at',
  sort_dir: 'desc',
};

export function AdminDisputesDatatable() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [filters, setFilters] = useState<DisputeTableFilters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');

  const filterKey = useMemo(() => ({ ...filters }), [filters]);

  const assigneesQ = useQuery({
    queryKey: queryKeys.adminDisputeAssignees(),
    queryFn: getDisputeAssignees,
    staleTime: STALE.adminDashboard,
  });

  const metricsQ = useQuery({
    queryKey: queryKeys.adminDisputeMetrics(),
    queryFn: getDisputeAdminMetrics,
    staleTime: STALE.adminDashboard,
  });

  const tableQ = useQuery({
    queryKey: queryKeys.adminDisputesTable(filterKey),
    queryFn: () => getDisputeAdminTable(filterKey),
    staleTime: 30_000,
  });

  const invalidateDisputes = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminDisputesTable(filterKey) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminDisputeMetrics() });
  };

  const bulkM = useMutation({
    mutationFn: (input: { action: 'escalate' | 'close' | 'assign'; assigned_to_user_id?: string }) =>
      bulkDisputeAction({
        complaint_ids: Array.from(selected),
        action: input.action,
        assigned_to_user_id: input.assigned_to_user_id,
        note:
          input.action === 'escalate'
            ? 'Bulk escalated from datatable'
            : input.action === 'close'
              ? 'Bulk closed'
              : 'Bulk assigned from datatable',
      }),
    onSuccess: (r) => {
      toast.success(`Updated ${r.updated} disputes`);
      setSelected(new Set());
      setBulkAssigneeId('');
      invalidateDisputes();
    },
    onError: () => toast.error('Bulk action failed'),
  });

  const assignees = assigneesQ.data ?? [];
  const rows = tableQ.data?.items ?? [];

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const columns = useMemo<VirtualColumnDef<DisputeAdminRow>[]>(
    () => [
      {
        id: 'select',
        header: (
          <input
            type="checkbox"
            checked={rows.length > 0 && selected.size === rows.length}
            onChange={toggleAll}
            aria-label="Select all"
            className="h-4 w-4 rounded border-border"
          />
        ),
        cell: (r) => (
          <input
            type="checkbox"
            checked={selected.has(r.id)}
            onChange={() => toggleOne(r.id)}
            aria-label={`Select dispute ${r.id}`}
            className="h-4 w-4 rounded border-border"
          />
        ),
      },
      {
        id: 'id',
        header: 'Dispute ID',
        sortable: true,
        cell: (r) => (
          <span className="font-mono text-[11px]">{r.id.slice(0, 8).toUpperCase()}</span>
        ),
      },
      {
        id: 'tracking_code',
        header: 'Order',
        sortable: true,
        cell: (r) => (
          <span className="font-mono text-xs">{r.tracking_code ? `#${r.tracking_code}` : '—'}</span>
        ),
      },
      {
        id: 'customer_name',
        header: 'Customer',
        sortable: true,
        className: 'max-w-[120px] truncate',
        cell: (r) => r.customer_name,
      },
      {
        id: 'laundry_name',
        header: 'Laundry',
        sortable: true,
        className: 'max-w-[120px] truncate',
        cell: (r) => r.laundry_name ?? '—',
      },
      {
        id: 'type',
        header: 'Type',
        cell: (r) => <DisputeTypeBadge label={r.type_label} type={r.complaint_type} />,
      },
      {
        id: 'priority',
        header: 'Priority',
        sortable: true,
        cell: (r) => <DisputePriorityBadge label={r.priority_label} priority={r.priority} />,
      },
      {
        id: 'sla_status',
        header: 'SLA Status',
        cell: (r) => <DisputeSlaCell row={r} />,
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        cell: (r) => <DisputeStatusBadge label={r.status_label} status={r.status} />,
      },
      {
        id: 'assigned_to_name',
        header: 'Assigned To',
        sortable: true,
        cell: (r) => (
          <DisputeAssigneeCell
            row={r}
            assignees={assignees}
            filterKey={filterKey}
          />
        ),
      },
      {
        id: 'created_at',
        header: 'Created',
        sortable: true,
        cell: (r) => (
          <ClientDate iso={r.created_at} mode="datetime" className="text-xs text-muted-foreground" />
        ),
      },
      {
        id: 'updated_at',
        header: 'Updated',
        sortable: true,
        cell: (r) => (
          <ClientDate iso={r.updated_at} mode="datetime" className="text-xs text-muted-foreground" />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: (r) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setDrawerId(r.id)}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            View
          </Button>
        ),
      },
    ],
    [rows.length, selected, assignees, filterKey],
  );

  const handleSort = (columnId: string) => {
    setFilters((f) => ({
      ...f,
      sort_by: columnId === 'type' ? 'type' : columnId,
      sort_dir: f.sort_by === columnId && f.sort_dir === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadDisputeExport(filterKey, 'csv');
    } finally {
      setExporting(false);
    }
  };

  const filterMyOpen = () => {
    if (!currentUserId) return;
    setFilters((f) => ({
      ...f,
      assigned_to: currentUserId,
      unassigned_only: false,
      resolution_status: 'open',
      page: 1,
    }));
  };

  const filterUnassigned = () => {
    setFilters((f) => ({
      ...f,
      assigned_to: undefined,
      unassigned_only: true,
      resolution_status: 'open',
      page: 1,
    }));
  };

  const filterNearSlaBreach = () => {
    setFilters((f) => ({
      ...f,
      sla_status: 'at_risk',
      resolution_status: 'open',
      page: 1,
    }));
  };

  const filterBreachedSla = () => {
    setFilters((f) => ({
      ...f,
      sla_status: 'breached',
      resolution_status: 'open',
      page: 1,
    }));
  };

  const handleBulkAssign = () => {
    if (!bulkAssigneeId) {
      toast.error('Select an assignee');
      return;
    }
    bulkM.mutate({ action: 'assign', assigned_to_user_id: bulkAssigneeId });
  };

  return (
    <div className="space-y-4">
      <DisputeMetricsCards
        metrics={metricsQ.data}
        loading={metricsQ.isLoading}
        onMyOpenClick={currentUserId ? filterMyOpen : undefined}
        onUnassignedClick={filterUnassigned}
        onNearSlaBreachClick={filterNearSlaBreach}
        onBreachedSlaClick={filterBreachedSla}
      />

      <DisputeFiltersBar
        filters={filters}
        assignees={assignees}
        onChange={setFilters}
        onExport={handleExport}
        exporting={exporting}
      />

      {tableQ.isError && (
        <InfoBanner variant="destructive" title="Could not load disputes">
          {getApiErrorMessage(tableQ.error)}
        </InfoBanner>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <span className="text-xs font-medium">{selected.size} selected</span>
          <Select
            className="h-7 min-h-0 w-[200px] py-0.5 text-xs"
            value={bulkAssigneeId}
            onChange={(e) => setBulkAssigneeId(e.target.value)}
            aria-label="Bulk assign to"
          >
            <option value="">Assign to…</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.role_label})
              </option>
            ))}
          </Select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            disabled={bulkM.isPending || !bulkAssigneeId}
            onClick={handleBulkAssign}
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Assign
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            disabled={bulkM.isPending}
            onClick={() => bulkM.mutate({ action: 'escalate' })}
          >
            <ArrowUpCircle className="h-3.5 w-3.5" aria-hidden />
            Escalate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            disabled={bulkM.isPending}
            onClick={() => bulkM.mutate({ action: 'close' })}
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden />
            Close
          </Button>
        </div>
      )}

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm"
            onClick={() => setDrawerId(r.id)}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                <DisputeTypeBadge label={r.type_label} type={r.complaint_type} />
                <DisputePriorityBadge label={r.priority_label} priority={r.priority} />
                <DisputeStatusBadge label={r.status_label} status={r.status} />
              </div>
              <DisputeSlaCell row={r} compact />
              <p className="text-sm font-medium">{r.customer_name}</p>
              <p className="text-xs text-muted-foreground">
                {r.laundry_name ?? '—'} · #{r.tracking_code ?? '—'}
              </p>
              <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <DisputeAssigneeCell row={r} assignees={assignees} filterKey={filterKey} compact />
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
        {!rows.length && !tableQ.isLoading && (
          <EmptyState icon={MoreHorizontal} title="No disputes" description="Adjust filters." />
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <AdminPanel bodyClassName="p-0">
          <VirtualDataTable
            tableId="admin-disputes"
            columns={columns}
            rows={rows}
            getRowId={(r) => r.id}
            sort={{ columnId: filters.sort_by ?? 'created_at', direction: filters.sort_dir ?? 'desc' }}
            onToggleSort={handleSort}
            page={tableQ.data?.page ?? 1}
            pageCount={tableQ.data?.total_pages ?? 1}
            pageSize={filters.page_size ?? 25}
            pageStart={((tableQ.data?.page ?? 1) - 1) * (filters.page_size ?? 25) + 1}
            pageEnd={Math.min(
              (tableQ.data?.page ?? 1) * (filters.page_size ?? 25),
              tableQ.data?.total ?? 0,
            )}
            filteredCount={tableQ.data?.total ?? 0}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            onPageSizeChange={(s) => setFilters((f) => ({ ...f, page_size: s, page: 1 }))}
            emptyState={
              <EmptyState icon={MoreHorizontal} title="No disputes" description="Adjust filters." />
            }
          />
        </AdminPanel>
      </div>

      {/* Mobile pagination */}
      <div className="flex items-center justify-between md:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={(filters.page ?? 1) <= 1}
          onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {tableQ.data?.page ?? 1} / {tableQ.data?.total_pages ?? 1}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={(filters.page ?? 1) >= (tableQ.data?.total_pages ?? 1)}
          onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
        >
          Next
        </Button>
      </div>

      <DisputeDetailDrawer
        disputeId={drawerId}
        open={Boolean(drawerId)}
        onOpenChange={(o) => !o && setDrawerId(null)}
      />
    </div>
  );
}
