'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { DisputeAnalyticsCharts } from '@/features/admin/dispute-analytics/dispute-analytics-charts';
import { DisputeAnalyticsFiltersBar } from '@/features/admin/dispute-analytics/dispute-analytics-filters';
import {
  DisputeTypeBreakdownPanel,
  HighRiskEntitiesPanel,
} from '@/features/admin/dispute-analytics/dispute-analytics-panels';
import { DisputeOverviewCards } from '@/features/admin/dispute-analytics/dispute-overview-cards';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  downloadDisputeAnalyticsExport,
  getDisputeAnalyticsCharts,
  getDisputeAnalyticsDashboard,
  type DisputeAnalyticsFilters,
} from '@/services/dispute-analytics';

const DEFAULT_FILTERS: DisputeAnalyticsFilters = {
  period: 'last_30_days',
};

export function AdminDisputeAnalyticsView() {
  const [filters, setFilters] = useState<DisputeAnalyticsFilters>(DEFAULT_FILTERS);
  const [exporting, setExporting] = useState(false);

  const filterKey = useMemo(() => ({ ...filters }), [filters]);

  const dashboardQ = useQuery({
    queryKey: queryKeys.adminDisputeAnalytics(filterKey),
    queryFn: () => getDisputeAnalyticsDashboard(filterKey),
    staleTime: STALE.adminDashboard,
  });

  const chartsQ = useQuery({
    queryKey: queryKeys.adminDisputeCharts(filterKey),
    queryFn: () => getDisputeAnalyticsCharts(filterKey),
    staleTime: STALE.adminDashboard,
  });

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(true);
    try {
      await downloadDisputeAnalyticsExport(filterKey, format);
    } finally {
      setExporting(false);
    }
  };

  const dash = dashboardQ.data;

  return (
    <AdminContent className="space-y-4">
      <AdminPageHeader
        title="Dispute analytics"
        description="Open vs resolved disputes, resolution time, refund exposure, and risk hotspots."
        actions={
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
            <Link href="/admin/disputes">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Back to queue
            </Link>
          </Button>
        }
      />

      <DisputeAnalyticsFiltersBar
        filters={filters}
        onChange={setFilters}
        onExport={handleExport}
        exporting={exporting}
      />

      {(dashboardQ.isError || chartsQ.isError) && (
        <InfoBanner variant="destructive" title="Could not load dispute analytics">
          Refresh to try again.
        </InfoBanner>
      )}

      <DisputeOverviewCards overview={dash?.overview} loading={dashboardQ.isLoading} />

      <div className="grid gap-4 xl:grid-cols-2">
        <DisputeTypeBreakdownPanel
          rows={dash?.top_dispute_types ?? []}
          loading={dashboardQ.isLoading}
        />
        <DisputeAnalyticsCharts data={chartsQ.data} loading={chartsQ.isLoading} />
      </div>

      <HighRiskEntitiesPanel
        customers={dash?.high_risk_customers ?? []}
        laundries={dash?.high_risk_laundries ?? []}
        loading={dashboardQ.isLoading}
      />
    </AdminContent>
  );
}

export function DisputeAnalyticsLink() {
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
      <Link href="/admin/disputes/analytics">
        <BarChart3 className="h-3.5 w-3.5" aria-hidden />
        Analytics
      </Link>
    </Button>
  );
}
