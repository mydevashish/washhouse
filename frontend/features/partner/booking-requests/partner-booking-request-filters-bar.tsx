'use client';

import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  BOOKING_REQUEST_PRIORITIES,
  BOOKING_REQUEST_PRIORITY_LABELS,
  BOOKING_REQUEST_STATUSES,
  BOOKING_REQUEST_STATUS_LABELS,
} from '@/features/admin/booking-requests/constants';
import type { BookingRequestListFilters } from '@/features/partner/booking-requests/types';

type Props = {
  filters: BookingRequestListFilters;
  onChange: (next: BookingRequestListFilters) => void;
};

export function PartnerBookingRequestFiltersBar({ filters, onChange }: Props) {
  const [search, setSearch] = useState(filters.q ?? '');
  const [phone, setPhone] = useState(filters.phone ?? '');

  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...filters, q: search || undefined, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...filters, phone: phone || undefined, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const set = (patch: Partial<BookingRequestListFilters>) =>
    onChange({ ...filters, ...patch, page: 1 });

  return (
    <div className="sticky top-0 z-20 space-y-2 rounded-lg bg-background/95 pb-1 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/40 p-2.5 ring-1 ring-border/60">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Search
          </label>
          <Input
            className="h-8 text-xs"
            placeholder="Code, name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Phone
          </label>
          <Input
            className="h-8 text-xs"
            placeholder="+91 / 10-digit"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </label>
          <Select
            className="h-8 min-h-0 py-1 text-xs"
            value={filters.status ?? ''}
            onChange={(e) => set({ status: e.target.value || undefined })}
          >
            <option value="">All</option>
            {BOOKING_REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BOOKING_REQUEST_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[120px]">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Priority
          </label>
          <Select
            className="h-8 min-h-0 py-1 text-xs"
            value={filters.priority ?? ''}
            onChange={(e) => set({ priority: e.target.value || undefined })}
          >
            <option value="">All</option>
            {BOOKING_REQUEST_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {BOOKING_REQUEST_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[120px]">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            From
          </label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={filters.created_from?.slice(0, 10) ?? ''}
            onChange={(e) =>
              set({
                created_from: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
              })
            }
          />
        </div>
        <div className="min-w-[120px]">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            To
          </label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={filters.created_to?.slice(0, 10) ?? ''}
            onChange={(e) =>
              set({
                created_to: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
              })
            }
          />
        </div>
      </div>
      <p className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
        <Filter className="h-3 w-3" aria-hidden />
        Your laundry only · SLA-sorted · phone CRM scoped
      </p>
    </div>
  );
}
