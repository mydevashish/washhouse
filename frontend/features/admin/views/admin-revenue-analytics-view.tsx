'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import { InfoBanner } from '@/components/ui/info-banner';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminTopLaundriesWidget } from '@/features/admin/revenue-analytics/admin-top-laundries-widget';
import { LaundryRevenueDetailSheet } from '@/features/admin/revenue-analytics/laundry-revenue-detail-sheet';
import { LaundryRevenueTable } from '@/features/admin/revenue-analytics/laundry-revenue-table';
import { RevenueAnalyticsCharts } from '@/features/admin/revenue-analytics/revenue-analytics-charts';
import { RevenueAnalyticsFiltersBar } from '@/features/admin/revenue-analytics/revenue-analytics-filters';
import { RevenueAnalyticsSubPanels } from '@/features/admin/revenue-analytics/revenue-analytics-sub-panels';
import { RevenueKpiInsights } from '@/features/admin/revenue-analytics/revenue-kpi-insights';
import { RevenueOverviewCards } from '@/features/admin/revenue-analytics/revenue-overview-cards';
import { TopLaundriesLeaderboard } from '@/features/admin/revenue-analytics/top-laundries-leaderboard';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  downloadRevenueExport,
  getLaundryRevenueDetail,
  getLaundryRevenueTable,
  getRevenueAnalyticsDashboard,
  getRevenueCharts,
  type RevenueAnalyticsFilters,
} from '@/services/revenue-analytics';

const DEFAULT_FILTERS: RevenueAnalyticsFilters = {
  period: 'last_30_days',
  page: 1,
  page_size: 25,
  sort_by: 'revenue',
  sort_dir: 'desc',
};

export function AdminRevenueAnalyticsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const laundryParam = searchParams.get('laundry');

  const [filters, setFilters] = useState<RevenueAnalyticsFilters>(DEFAULT_FILTERS);
  const [selectedLaundryId, setSelectedLaundryId] = useState<string | null>(laundryParam);
  const [exporting, setExporting] = useState(false);

  const filterKey = useMemo(() => ({ ...filters }), [filters]);

  const dashboardQ = useQuery({
    queryKey: queryKeys.adminRevenueAnalytics(filterKey),
    queryFn: () => getRevenueAnalyticsDashboard(filterKey),
    staleTime: STALE.adminDashboard,
  });

  const tableQ = useQuery({
    queryKey: queryKeys.adminRevenueLaundries(filterKey),
    queryFn: () => getLaundryRevenueTable(filterKey),
    staleTime: STALE.adminDashboard,
  });

  const chartsQ = useQuery({
    queryKey: queryKeys.adminRevenueCharts(filterKey),
    queryFn: () => getRevenueCharts(filterKey),
    staleTime: STALE.adminDashboard,
  });

  const detailQ = useQuery({
    queryKey: queryKeys.adminRevenueLaundryDetail(selectedLaundryId ?? '', filterKey),
    queryFn: () => getLaundryRevenueDetail(selectedLaundryId!, filterKey),
    enabled: Boolean(selectedLaundryId),
    staleTime: STALE.adminDashboard,
  });

  const openDetail = useCallback(
    (laundryId: string) => {
      setSelectedLaundryId(laundryId);
      router.replace(`/admin/revenue/analytics?laundry=${laundryId}`, { scroll: false });
    },
    [router],
  );

  const closeDetail = useCallback(
    (open: boolean) => {
      if (!open) {
        setSelectedLaundryId(null);
        router.replace('/admin/revenue/analytics', { scroll: false });
      }
    },
    [router],
  );

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(true);
    try {
      await downloadRevenueExport(filterKey, format);
    } finally {
      setExporting(false);
    }
  };

  const dash = dashboardQ.data;

  return (
    <AdminContent className="space-y-4">
      <AdminPageHeader
        title="Laundry revenue analytics"
        description="Revenue, commission, refunds, and disputes by laundry, partner, and location."
      />

      <RevenueAnalyticsFiltersBar
        filters={filters}
        onChange={setFilters}
        onExport={handleExport}
        exporting={exporting}
      />

      {(dashboardQ.isError || tableQ.isError) && (
        <InfoBanner variant="destructive" title="Could not load revenue analytics">
          Refresh to try again.
        </InfoBanner>
      )}

      <RevenueOverviewCards
        overview={dash?.overview}
        loading={dashboardQ.isLoading}
        onTopLaundryClick={() => {
          const top = dash?.top_laundries[0];
          if (top) openDetail(top.laundry_id);
        }}
      />

      {dash?.insights && <RevenueKpiInsights insights={dash.insights} />}

      <div className="grid gap-4 xl:grid-cols-2">
        <TopLaundriesLeaderboard
          rows={dash?.top_laundries ?? []}
          onSelect={openDetail}
        />
        <RevenueAnalyticsCharts data={chartsQ.data} loading={chartsQ.isLoading} />
      </div>

      {dash && (
        <RevenueAnalyticsSubPanels
          commission={dash.commission}
          refunds={dash.refunds}
          disputes={dash.disputes}
        />
      )}

      <LaundryRevenueTable
        rows={tableQ.data?.items ?? []}
        total={tableQ.data?.total ?? 0}
        page={tableQ.data?.page ?? 1}
        totalPages={tableQ.data?.total_pages ?? 1}
        loading={tableQ.isLoading}
        onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        onView={openDetail}
      />

      <LaundryRevenueDetailSheet
        open={Boolean(selectedLaundryId)}
        onOpenChange={closeDetail}
        detail={detailQ.data}
        loading={detailQ.isLoading}
      />
    </AdminContent>
  );
}
