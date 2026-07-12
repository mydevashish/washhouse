'use client';

import { Download, FileSpreadsheet, FileText, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { AdminFilterBar, AdminFilterField } from '@/features/admin/components/admin-panel';
import type { SettlementFilters, SettlementStatus } from '@/services/settlements';
import { SETTLEMENT_STATUS_LABELS } from '@/services/settlements';

const STATUSES: SettlementStatus[] = ['pending', 'approved', 'processing', 'paid', 'failed', 'cancelled', 'on_hold'];

type Props = {
  filters: SettlementFilters;
  onChange: (next: SettlementFilters) => void;
  onExport: (format: 'csv' | 'xlsx' | 'pdf') => void;
  onRunBatch: () => void;
  exporting?: boolean;
  running?: boolean;
};

export function SettlementFiltersBar({
  filters,
  onChange,
  onExport,
  onRunBatch,
  exporting,
  running,
}: Props) {
  const set = (patch: Partial<SettlementFilters>) => onChange({ ...filters, ...patch, page: 1 });

  return (
    <AdminFilterBar className="flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <AdminFilterField label="Status" className="min-w-[140px]">
        <Select
          className="h-8 min-h-0 py-1 text-xs"
          value={filters.status ?? ''}
          onChange={(e) => set({ status: (e.target.value || undefined) as SettlementStatus | undefined })}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {SETTLEMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </AdminFilterField>

      <Button
        type="button"
        variant="default"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        disabled={running}
        onClick={onRunBatch}
      >
        <Play className="h-3.5 w-3.5" aria-hidden />
        Run settlement batch
      </Button>

      <div className="ml-auto flex flex-wrap gap-1.5">
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={exporting} onClick={() => onExport('csv')}>
          <Download className="h-3.5 w-3.5" aria-hidden />
          CSV
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={exporting} onClick={() => onExport('xlsx')}>
          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
          Excel
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={exporting} onClick={() => onExport('pdf')}>
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Report
        </Button>
      </div>
    </AdminFilterBar>
  );
}
