'use client';

import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AdminFilterBar, AdminFilterField } from '@/features/admin/components/admin-panel';
import {
  DISPUTE_PRIORITIES,
  DISPUTE_PRIORITY_LABELS,
  DISPUTE_STATUSES,
  DISPUTE_STATUS_LABELS,
  DISPUTE_TYPES,
  type DisputeAssignee,
  type DisputeTableFilters,
} from '@/services/disputes';
import { DISPUTE_SLA_STATUSES } from '@/features/admin/disputes/dispute-sla-cell';

type Props = {
  filters: DisputeTableFilters;
  assignees: DisputeAssignee[];
  onChange: (next: DisputeTableFilters) => void;
  onExport: () => void;
  exporting?: boolean;
};

export function DisputeFiltersBar({ filters, assignees, onChange, onExport, exporting }: Props) {
  const [search, setSearch] = useState(filters.q ?? '');

  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...filters, q: search || undefined, page: 1 });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const set = (patch: Partial<DisputeTableFilters>) =>
    onChange({ ...filters, ...patch, page: 1 });

  const handleAssignedChange = (value: string) => {
    if (value === '__unassigned__') {
      set({ assigned_to: undefined, unassigned_only: true });
      return;
    }
    set({
      assigned_to: value || undefined,
      unassigned_only: false,
    });
  };

  const assignedValue = filters.unassigned_only ? '__unassigned__' : (filters.assigned_to ?? '');

  return (
    <div className="sticky top-0 z-20 space-y-2 rounded-lg bg-background/95 pb-1 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <AdminFilterBar>
        <AdminFilterField label="Search" className="min-w-[200px] flex-1">
          <Input
            className="h-8 text-xs"
            placeholder="ID, order, customer, laundry, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </AdminFilterField>
        <AdminFilterField label="Status">
          <Select
            className="h-8 min-h-0 py-1 text-xs"
            value={filters.status ?? ''}
            onChange={(e) => set({ status: e.target.value || undefined })}
          >
            <option value="">All</option>
            {DISPUTE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DISPUTE_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </AdminFilterField>
        <AdminFilterField label="Assigned to">
          <Select
            className="h-8 min-h-0 py-1 text-xs min-w-[160px]"
            value={assignedValue}
            onChange={(e) => handleAssignedChange(e.target.value)}
          >
            <option value="">All assignees</option>
            <option value="__unassigned__">Unassigned only</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.role_label})
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
            {DISPUTE_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {DISPUTE_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </AdminFilterField>
        <AdminFilterField label="Type">
          <Select
            className="h-8 min-h-0 py-1 text-xs"
            value={filters.complaint_type ?? ''}
            onChange={(e) => set({ complaint_type: e.target.value || undefined })}
          >
            <option value="">All</option>
            {DISPUTE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </AdminFilterField>
        <AdminFilterField label="SLA status">
          <Select
            className="h-8 min-h-0 py-1 text-xs"
            value={filters.sla_status ?? ''}
            onChange={(e) => set({ sla_status: e.target.value || undefined })}
          >
            <option value="">All</option>
            {DISPUTE_SLA_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </AdminFilterField>
        <AdminFilterField label="Resolution">
          <Select
            className="h-8 min-h-0 py-1 text-xs"
            value={filters.resolution_status ?? ''}
            onChange={(e) => set({ resolution_status: e.target.value || undefined })}
          >
            <option value="">All</option>
            <option value="open">Open / active</option>
            <option value="resolved">Resolved / closed</option>
          </Select>
        </AdminFilterField>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={exporting}
          onClick={onExport}
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Export
        </Button>
      </AdminFilterBar>
      <p className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
        <Filter className="h-3 w-3" aria-hidden />
        Server-side filters · debounced search · sticky filter bar
      </p>
    </div>
  );
}
