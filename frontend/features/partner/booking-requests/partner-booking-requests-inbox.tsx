'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Eye, MoreHorizontal, Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { VirtualDataTable, type VirtualColumnDef } from '@/components/data-table/virtual-data-table';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import {
  BookingRequestPriorityBadge,
  BookingRequestStatusBadge,
} from '@/features/admin/booking-requests/booking-request-badges';
import { BookingRequestSlaCell } from '@/features/admin/booking-requests/booking-request-sla-cell';
import { BOOKING_REQUEST_SERVICE_LABELS } from '@/features/admin/booking-requests/constants';
import {
  usePartnerBookingRequestsBadge,
  usePartnerBookingRequestsList,
} from '@/features/partner/booking-requests/hooks';
import { PartnerBookingRequestCreateDialog } from '@/features/partner/booking-requests/partner-booking-request-create-dialog';
import { PartnerBookingRequestDetailDrawer } from '@/features/partner/booking-requests/partner-booking-request-detail-drawer';
import { PartnerBookingRequestFiltersBar } from '@/features/partner/booking-requests/partner-booking-request-filters-bar';
import { PartnerBookingRequestInboxMetrics } from '@/features/partner/booking-requests/partner-booking-request-inbox-metrics';
import { PartnerBookingRequestPhoneTimelineDrawer } from '@/features/partner/booking-requests/partner-booking-request-phone-timeline';
import type {
  BookingRequestListFilters,
  BookingRequestRow,
  PartnerBookingCreatePrefill,
} from '@/features/partner/booking-requests/types';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { getApiErrorMessage } from '@/lib/api-error-message';

const DEFAULT_FILTERS: BookingRequestListFilters = {
  page: 1,
  page_size: 20,
  sort: 'sla',
};

export function PartnerBookingRequestsInbox() {
  const searchParams = useSearchParams();
  const phoneFromUrl = searchParams.get('phone');

  const [filters, setFilters] = useState<BookingRequestListFilters>(() => ({
    ...DEFAULT_FILTERS,
    phone: phoneFromUrl ?? undefined,
  }));
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [phoneTimeline, setPhoneTimeline] = useState<string | null>(phoneFromUrl);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<PartnerBookingCreatePrefill | null>(null);

  useEffect(() => {
    if (!phoneFromUrl) return;
    setFilters((f) => ({ ...f, phone: phoneFromUrl, page: 1 }));
    setPhoneTimeline(phoneFromUrl);
  }, [phoneFromUrl]);

  const filterKey = useMemo(() => ({ ...filters }), [filters]);
  const tableQ = usePartnerBookingRequestsList(filterKey);
  const badgeQ = usePartnerBookingRequestsBadge();
  const rows = tableQ.data?.items ?? [];
  const assignedTotal = badgeQ.data?.total ?? 0;

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

  const openCreate = (prefill?: PartnerBookingCreatePrefill) => {
    setCreatePrefill(prefill ?? null);
    setCreateOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PartnerBookingRequestInboxMetrics
          inbox={tableQ.data?.inbox}
          assignedTotal={assignedTotal}
          loading={tableQ.isLoading || badgeQ.isLoading}
          onAssignedClick={() => setFilters((f) => ({ ...f, status: 'assigned', page: 1 }))}
          onOverdueClick={() =>
            setFilters((f) => ({
              ...f,
              status: 'assigned',
              page: 1,
            }))
          }
          onContactedClick={() => setFilters((f) => ({ ...f, status: 'contacted', page: 1 }))}
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

      <PartnerBookingRequestFiltersBar filters={filters} onChange={setFilters} />

      {tableQ.isError && (
        <InfoBanner variant="destructive" title="Could not load booking requests">
          {getApiErrorMessage(tableQ.error)}
        </InfoBanner>
      )}

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
              </p>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
        {!rows.length && !tableQ.isLoading && (
          <EmptyState
            icon={MoreHorizontal}
            title="No assigned booking requests"
            description="When ops assigns a Book Now lead to your laundry, it appears here."
          />
        )}
      </div>

      <div className="hidden md:block">
        <PartnerPanel bodyClassName="p-0">
          <VirtualDataTable
            tableId="partner-booking-requests"
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
                title="No assigned booking requests"
                description="When ops assigns a Book Now lead to your laundry, it appears here."
              />
            }
          />
        </PartnerPanel>
      </div>

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

      <PartnerBookingRequestDetailDrawer
        requestId={drawerId}
        open={Boolean(drawerId)}
        onOpenChange={(o) => !o && setDrawerId(null)}
        onViewPhoneTimeline={(phone) => setPhoneTimeline(phone)}
      />

      <PartnerBookingRequestPhoneTimelineDrawer
        phone={phoneTimeline}
        open={Boolean(phoneTimeline)}
        onOpenChange={(o) => !o && setPhoneTimeline(null)}
        onOpenRequest={(id) => setDrawerId(id)}
        onCreateForPhone={(phone, name) => {
          setPhoneTimeline(null);
          openCreate({ phone, customer_name: name });
        }}
      />

      <PartnerBookingRequestCreateDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreatePrefill(null);
        }}
        prefill={createPrefill}
        onCreated={(id) => setDrawerId(id)}
      />
    </div>
  );
}
