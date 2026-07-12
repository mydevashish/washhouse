'use client';

import { Download, FileSpreadsheet, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AdminFilterBar, AdminFilterField } from '@/features/admin/components/admin-panel';
import type { RevenueAnalyticsFilters, RevenuePeriod } from '@/services/revenue-analytics';

const PERIODS: { value: RevenuePeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];

const STATUSES = ['approved', 'pending_approval', 'suspended', 'rejected'];

const STATES = ['Karnataka', 'Maharashtra', 'Telangana', 'Tamil Nadu', 'Delhi', 'West Bengal'];

type Props = {
  filters: RevenueAnalyticsFilters;
  onChange: (next: RevenueAnalyticsFilters) => void;
  onExport: (format: 'csv' | 'xlsx' | 'pdf') => void;
  exporting?: boolean;
};

export function RevenueAnalyticsFiltersBar({ filters, onChange, onExport, exporting }: Props) {
  const set = (patch: Partial<RevenueAnalyticsFilters>) =>
    onChange({ ...filters, ...patch, page: 1 });

  return (
    <AdminFilterBar className="flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <AdminFilterField label="Period" className="min-w-[140px]">
        <Select
          className="h-8 min-h-0 py-1 text-xs"
          value={filters.period ?? 'last_30_days'}
          onChange={(e) => set({ period: e.target.value as RevenuePeriod })}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </AdminFilterField>

      {filters.period === 'custom' && (
        <>
          <AdminFilterField label="From">
            <Input
              type="date"
              className="h-8 text-xs"
              value={filters.date_from?.slice(0, 10) ?? ''}
              onChange={(e) => set({ date_from: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
            />
          </AdminFilterField>
          <AdminFilterField label="To">
            <Input
              type="date"
              className="h-8 text-xs"
              value={filters.date_to?.slice(0, 10) ?? ''}
              onChange={(e) => set({ date_to: e.target.value ? `${e.target.value}T23:59:59Z` : undefined })}
            />
          </AdminFilterField>
        </>
      )}

      <AdminFilterField label="City">
        <Input
          className="h-8 text-xs"
          placeholder="e.g. Bengaluru"
          value={filters.city ?? ''}
          onChange={(e) => set({ city: e.target.value || undefined })}
        />
      </AdminFilterField>

      <AdminFilterField label="State">
        <Select
          className="h-8 min-h-0 py-1 text-xs"
          value={filters.state ?? ''}
          onChange={(e) => set({ state: e.target.value || undefined })}
        >
          <option value="">All states</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </AdminFilterField>

      <AdminFilterField label="Status">
        <Select
          className="h-8 min-h-0 py-1 text-xs"
          value={filters.status ?? ''}
          onChange={(e) => set({ status: e.target.value || undefined })}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </AdminFilterField>

      <AdminFilterField label="Min revenue">
        <Input
          type="number"
          className="h-8 w-24 text-xs"
          placeholder="0"
          value={filters.revenue_min ?? ''}
          onChange={(e) =>
            set({ revenue_min: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </AdminFilterField>

      <div className="ml-auto flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={exporting}
          onClick={() => onExport('csv')}
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          CSV
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={exporting}
          onClick={() => onExport('xlsx')}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
          Excel
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={exporting}
          onClick={() => onExport('pdf')}
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Report
        </Button>
      </div>
    </AdminFilterBar>
  );
}
