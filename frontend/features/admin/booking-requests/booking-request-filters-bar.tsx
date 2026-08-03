'use client';

import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AdminFilterBar, AdminFilterField } from '@/features/admin/components/admin-panel';
import {
  BOOKING_REQUEST_PRIORITIES,
  BOOKING_REQUEST_PRIORITY_LABELS,
  BOOKING_REQUEST_STATUSES,
  BOOKING_REQUEST_STATUS_LABELS,
} from '@/features/admin/booking-requests/constants';
import type { BookingRequestListFilters } from '@/features/admin/booking-requests/types';
import type { AdminLaundryRow } from '@/services/admin';

type Props = {
  filters: BookingRequestListFilters;
  laundries: AdminLaundryRow[];
  onChange: (next: BookingRequestListFilters) => void;
};

export function BookingRequestFiltersBar({ filters, laundries, onChange }: Props) {
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

  const assignmentValue = filters.unassigned
    ? '__unassigned__'
    : (filters.assigned_laundry_id ?? '');

  const handleAssignment = (value: string) => {
    if (value === '__unassigned__') {
      set({ unassigned: true, assigned_laundry_id: undefined });
      return;
    }
    set({
      unassigned: false,
      assigned_laundry_id: value || undefined,
    });
  };

  const approved = laundries.filter((l) => l.status === 'approved');

  return (
    <div className="sticky top-0 z-20 space-y-2 rounded-lg bg-background/95 pb-1 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <AdminFilterBar>
        <AdminFilterField label="Search" className="min-w-[160px] flex-1">
          <Input
            className="h-8 text-xs"
            placeholder="Code, name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </AdminFilterField>
        <AdminFilterField label="Phone" className="min-w-[140px]">
          <Input
            className="h-8 text-xs"
            placeholder="+91 / 10-digit"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
          />
        </AdminFilterField>
        <AdminFilterField label="Status">
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
        </AdminFilterField>
        <AdminFilterField label="Assignment">
          <Select
            className="h-8 min-h-0 min-w-[160px] py-1 text-xs"
            value={assignmentValue}
            onChange={(e) => handleAssignment(e.target.value)}
          >
            <option value="">All</option>
            <option value="__unassigned__">Unassigned only</option>
            {approved.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </AdminFilterField>
        <AdminFilterField label="Priority">
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
        </AdminFilterField>
        <AdminFilterField label="From">
          <Input
            type="date"
            className="h-8 text-xs"
            value={filters.created_from?.slice(0, 10) ?? ''}
            onChange={(e) =>
              set({
                created_from: e.target.value
                  ? `${e.target.value}T00:00:00.000Z`
                  : undefined,
              })
            }
          />
        </AdminFilterField>
        <AdminFilterField label="To">
          <Input
            type="date"
            className="h-8 text-xs"
            value={filters.created_to?.slice(0, 10) ?? ''}
            onChange={(e) =>
              set({
                created_to: e.target.value
                  ? `${e.target.value}T23:59:59.999Z`
                  : undefined,
              })
            }
          />
        </AdminFilterField>
        <AdminFilterField label="Deleted">
          <Select
            className="h-8 min-h-0 py-1 text-xs"
            value={filters.include_deleted ? '1' : ''}
            onChange={(e) => set({ include_deleted: e.target.value === '1' })}
          >
            <option value="">Hide deleted</option>
            <option value="1">Include deleted</option>
          </Select>
        </AdminFilterField>
      </AdminFilterBar>
      <p className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
        <Filter className="h-3 w-3" aria-hidden />
        SLA-sorted inbox · phone CRM · sticky filters
      </p>
    </div>
  );
}
