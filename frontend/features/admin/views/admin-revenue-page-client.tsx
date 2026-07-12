'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AdminRevenuePanel } from '@/features/admin/admin-revenue-panel';
import { AdminTransactionsTable } from '@/features/admin/admin-transactions-table';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getAdminDashboard } from '@/services/admin';

export function AdminRevenuePageClient() {
  const dashboardQ = useQuery({
    queryKey: queryKeys.adminDashboard(),
    queryFn: getAdminDashboard,
    staleTime: STALE.adminDashboard,
  });

  return (
    <AdminContent className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminPageHeader
          title="Revenue"
          description="Platform revenue KPIs and payment transactions."
          className="sm:flex-1"
        />
        <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
          <Link href="/admin/revenue/analytics">
            <BarChart3 className="h-4 w-4" aria-hidden />
            Laundry revenue analytics
          </Link>
        </Button>
      </div>
      <AdminRevenuePanel
        data={dashboardQ.data}
        isLoading={dashboardQ.isLoading}
        isError={dashboardQ.isError}
      />
      <AdminTransactionsTable />
    </AdminContent>
  );
}
