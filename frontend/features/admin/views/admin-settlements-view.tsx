'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { InfoBanner } from '@/components/ui/info-banner';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminSettlementsDatatable } from '@/features/admin/settlements/admin-settlements-datatable';
import { SettlementFiltersBar } from '@/features/admin/settlements/settlement-filters-bar';
import { SettlementOverviewCards } from '@/features/admin/settlements/settlement-overview-cards';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { SettlementAnalyticsPanel } from '@/features/admin/settlements/settlement-analytics-panel';
import { SettlementAuditPanel } from '@/features/admin/settlements/settlement-audit-panel';
import {
  downloadSettlementExport,
  getSettlementAnalytics,
  getSettlementDashboard,
  runSettlementBatch,
  type SettlementFilters,
} from '@/services/settlements';

const DEFAULT_FILTERS: SettlementFilters = {
  page: 1,
  page_size: 25,
  sort_by: 'created_at',
  sort_dir: 'desc',
};

export function AdminSettlementsView() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SettlementFilters>(DEFAULT_FILTERS);
  const [exporting, setExporting] = useState(false);
  const [running, setRunning] = useState(false);

  const filterKey = useMemo(() => ({ ...filters }), [filters]);

  const dashboardQ = useQuery({
    queryKey: queryKeys.adminSettlementDashboard(),
    queryFn: getSettlementDashboard,
    staleTime: STALE.adminDashboard,
  });

  const analyticsQ = useQuery({
    queryKey: queryKeys.adminSettlementAnalytics(),
    queryFn: getSettlementAnalytics,
    staleTime: STALE.adminDashboard,
  });

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(true);
    try {
      await downloadSettlementExport(filterKey, format);
    } finally {
      setExporting(false);
    }
  };

  const handleRunBatch = async () => {
    setRunning(true);
    try {
      const r = await runSettlementBatch();
      toast.success(`Created ${r.settlements_created} settlements (${r.eligibility_updated} orders updated)`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminSettlementsTable(filterKey) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminSettlementDashboard() });
    } catch {
      toast.error('Settlement batch failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <AdminContent className="space-y-4">
      <AdminPageHeader
        title="Settlement & payouts"
        description="Automatic partner settlements after the 48-hour dispute window — approve, process, and release payouts."
      />

      <SettlementFiltersBar
        filters={filters}
        onChange={setFilters}
        onExport={handleExport}
        onRunBatch={handleRunBatch}
        exporting={exporting}
        running={running}
      />

      {dashboardQ.isError && (
        <InfoBanner variant="destructive" title="Could not load settlement dashboard">
          Refresh to try again.
        </InfoBanner>
      )}

      <SettlementOverviewCards dashboard={dashboardQ.data} loading={dashboardQ.isLoading} />

      <SettlementAnalyticsPanel analytics={analyticsQ.data} loading={analyticsQ.isLoading} />

      <AdminSettlementsDatatable
        filters={filterKey}
        onFiltersChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
      />

      <SettlementAuditPanel />
    </AdminContent>
  );
}
