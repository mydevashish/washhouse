'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Eye, MoreHorizontal, Plus } from 'lucide-react';

import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import {
  BookingRequestPriorityBadge,
  BookingRequestStatusBadge,
} from '@/features/admin/booking-requests/booking-request-badges';
import { BookingRequestCreateDialog } from '@/features/admin/booking-requests/booking-request-create-dialog';
import { BookingRequestDetailDrawer } from '@/features/admin/booking-requests/booking-request-detail-drawer';
import { BookingRequestFiltersBar } from '@/features/admin/booking-requests/booking-request-filters-bar';
import { BookingRequestInboxMetrics } from '@/features/admin/booking-requests/booking-request-inbox-metrics';
import {
  BookingRequestPhoneTimelineDrawer,
  type CreatePrefill,
} from '@/features/admin/booking-requests/booking-request-phone-timeline';
import { BookingRequestSlaCell } from '@/features/admin/booking-requests/booking-request-sla-cell';
import {
  BOOKING_REQUEST_SERVICE_LABELS,
} from '@/features/admin/booking-requests/constants';
import { useAdminBookingRequestsList } from '@/features/admin/booking-requests/hooks';
import type {
  BookingRequestListFilters,
  BookingRequestRow,
} from '@/features/admin/booking-requests/types';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { STALE } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';
import { listAllLaundries } from '@/services/admin';

const DEFAULT_FILTERS: BookingRequestListFilters = {
  page: 1,
  page_size: 20,
  sort: 'sla',
  unassigned: false,
};

export function AdminBookingRequestsDatatable() {
  const [filters, setFilters] = useState<BookingRequestListFilters>(DEFAULT_FILTERS);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [phoneTimeline, setPhoneTimeline] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<CreatePrefill | null>(null);

  const filterKey = useMemo(() => ({ ...filters }), [filters]);

  const laundriesQ = useQuery({
    queryKey: queryKeys.adminLaundries(),
    queryFn: listAllLaundries,
    staleTime: STALE.adminDashboard,
  });

  const tableQ = useAdminBookingRequestsList(filterKey);
  const rows = tableQ.data?.items ?? [];
  const laundries = laundriesQ.data ?? [];

  const columns = useMemo<VirtualColumnDef<BookingRequestRow>[]>(
    () => [
      {
        id: 'public_code',
        header: 'Code',
        cell: (r) => <span className="font-mono text-xs font-semibold">{r.public_code}</span>,
      },
      {
        id: 'sla',
        header: 'SLA',
        sortable: true,
        cell: (r) => (
          <BookingRequestSlaCell
            slaBadge={r.sla_badge}
            slaAgeSeconds={r.sla_age_seconds}
            createdAt={r.created_at}
          />
        ),
      },
      {
        id: 'customer_name',
        header: 'Customer',
        className: 'max-w-[140px] truncate',
        cell: (r) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{r.customer_name}</p>
            <button
              type="button"
              className="font-mono text-[11px] text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setPhoneTimeline(r.phone_e164);
              }}
            >
              {r.phone_e164}
            </button>
          </div>
        ),
      },
      {
        id: 'service_type',
        header: 'Service',
        className: 'max-w-[120px] truncate',
        cell: (r) => BOOKING_REQUEST_SERVICE_LABELS[r.service_type] ?? r.service_type,
      },
      {
        id: 'priority',
        header: 'Priority',
        sortable: true,
        cell: (r) => <BookingRequestPriorityBadge priority={r.priority} />,
      },
      {
        id: 'status',
        header: 'Status',
        sortable: true,
        cell: (r) => <BookingRequestStatusBadge status={r.status} />,
      },
      {
        id: 'assigned_laundry_name',
        header: 'Laundry',
        className: 'max-w-[140px] truncate',
        cell: (r) => r.assigned_laundry_name ?? '—',
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
    [],
  );

  const handleSort = (columnId: string) => {
    const allowed = new Set(['sla', 'created_at', 'priority', 'status']);
    if (!allowed.has(columnId)) return;
    setFilters((f) => {
      const current = f.sort ?? 'sla';
      const currentField = current.replace(/^-/, '');
      if (columnId === 'sla') return { ...f, sort: 'sla', page: 1 };
      if (currentField === columnId && !current.startsWith('-')) {
        return { ...f, sort: `-${columnId}`, page: 1 };
      }
      return { ...f, sort: columnId, page: 1 };
    });
  };

  const sortColumn = (filters.sort ?? 'sla').replace(/^-/, '');
  const sortDir: 'asc' | 'desc' = (filters.sort ?? 'sla').startsWith('-') ? 'desc' : 'asc';

  const openCreate = (prefill?: CreatePrefill) => {
    setCreatePrefill(prefill ?? null);
    setCreateOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BookingRequestInboxMetrics
          inbox={tableQ.data?.inbox}
          loading={tableQ.isLoading}
          onNewClick={() =>
            setFilters((f) => ({ ...f, status: 'new', unassigned: false, page: 1 }))
          }
          onReviewingClick={() =>
            setFilters((f) => ({ ...f, status: 'reviewing', unassigned: false, page: 1 }))
          }
          onOverdueClick={() =>
            setFilters((f) => ({
              ...f,
              status: 'new,reviewing,assigned',
              unassigned: false,
              page: 1,
            }))
          }
          onUnassignedClick={() =>
            setFilters((f) => ({
              ...f,
              unassigned: true,
              assigned_laundry_id: undefined,
              status: undefined,
              page: 1,
            }))
          }
        />
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => openCreate()}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New request
        </Button>
      </div>

      <BookingRequestFiltersBar
        filters={filters}
        laundries={laundries}
        onChange={setFilters}
      />

      {tableQ.isError && (
        <InfoBanner variant="destructive" title="Could not load booking requests">
          {getApiErrorMessage(tableQ.error)}
        </InfoBanner>
      )}

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {tableQ.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        )}
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm"
            onClick={() => setDrawerId(r.id)}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                <span className="font-mono text-xs font-semibold">{r.public_code}</span>
                <BookingRequestStatusBadge status={r.status} />
                <BookingRequestPriorityBadge priority={r.priority} />
              </div>
              <BookingRequestSlaCell
                slaBadge={r.sla_badge}
                slaAgeSeconds={r.sla_age_seconds}
                createdAt={r.created_at}
                compact
              />
              <p className="text-sm font-medium">{r.customer_name}</p>
              <p className="font-mono text-xs text-muted-foreground">{r.phone_e164}</p>
              <p className="text-xs text-muted-foreground">
                {BOOKING_REQUEST_SERVICE_LABELS[r.service_type] ?? r.service_type}
                {' · '}
                {r.assigned_laundry_name ?? 'Unassigned'}
              </p>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
        {!rows.length && !tableQ.isLoading && (
          <EmptyState
            icon={MoreHorizontal}
            title="No booking requests"
            description="Unassigned Book Now leads will land here."
          />
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <AdminPanel bodyClassName="p-0">
          <VirtualDataTable
            tableId="admin-booking-requests"
            columns={columns}
            rows={rows}
            getRowId={(r) => r.id}
            sort={{ columnId: sortColumn, direction: sortDir }}
            onToggleSort={handleSort}
            page={tableQ.data?.page ?? 1}
            pageCount={tableQ.data?.total_pages ?? 1}
            pageSize={filters.page_size ?? 20}
            pageStart={((tableQ.data?.page ?? 1) - 1) * (filters.page_size ?? 20) + 1}
            pageEnd={Math.min(
              (tableQ.data?.page ?? 1) * (filters.page_size ?? 20),
              tableQ.data?.total ?? 0,
            )}
            filteredCount={tableQ.data?.total ?? 0}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            onPageSizeChange={(s) => setFilters((f) => ({ ...f, page_size: s, page: 1 }))}
            emptyState={
              <EmptyState
                icon={MoreHorizontal}
                title="No booking requests"
                description="Unassigned Book Now leads will land here."
              />
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

      <BookingRequestDetailDrawer
        requestId={drawerId}
        open={Boolean(drawerId)}
        onOpenChange={(o) => !o && setDrawerId(null)}
        laundries={laundries}
        onViewPhoneTimeline={(phone) => setPhoneTimeline(phone)}
      />

      <BookingRequestPhoneTimelineDrawer
        phone={phoneTimeline}
        open={Boolean(phoneTimeline)}
        onOpenChange={(o) => !o && setPhoneTimeline(null)}
        onOpenRequest={(id) => setDrawerId(id)}
        onCreateForPhone={(phone, name) => {
          setPhoneTimeline(null);
          openCreate({ phone, customer_name: name });
        }}
      />

      <BookingRequestCreateDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreatePrefill(null);
        }}
        laundries={laundries}
        prefill={createPrefill}
        onCreated={(id) => setDrawerId(id)}
      />
    </div>
  );
}
