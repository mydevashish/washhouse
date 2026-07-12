'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { InfoBanner } from '@/components/ui/info-banner';
import { AdminApprovalQueue } from '@/features/admin/admin-approval-queue';
import { AdminCommissionSettings } from '@/features/admin/admin-commission-settings';
import { AdminCreateLaundry } from '@/features/admin/admin-create-laundry';
import { AdminLaundriesList } from '@/features/admin/admin-laundries-list';
import { AdminOrdersTable } from '@/features/admin/admin-orders-table';
import { AdminRevenuePanel } from '@/features/admin/admin-revenue-panel';
import { AdminTransactionsTable } from '@/features/admin/admin-transactions-table';
import { AdminGrowthBanner, AdminStatCards } from '@/features/admin/admin-stat-cards';
import { AdminTabNav, type AdminTab } from '@/features/admin/admin-tab-nav';
import { AdminUsersTable } from '@/features/admin/admin-users-table';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getAdminDashboard } from '@/services/admin';

export function AdminDashboard() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [tab, setTab] = useState<AdminTab>('overview');

  const dashboardQ = useQuery({
    queryKey: queryKeys.adminDashboard(),
    queryFn: getAdminDashboard,
    enabled: Boolean(accessToken),
    staleTime: STALE.adminDashboard,
  });

  const pendingCount = dashboardQ.data?.laundries_pending ?? 0;

  return (
    <div className="space-y-6 pb-16">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-primary">DLM Admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Platform control center
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Approve franchise partners, monitor orders, and track marketplace growth.
        </p>
      </header>

      <AdminGrowthBanner data={dashboardQ.data} />

      {dashboardQ.isError && (
        <InfoBanner variant="destructive" title="Could not load dashboard stats">
          Some figures may be outdated. Try refreshing the page.
        </InfoBanner>
      )}

      <AdminTabNav
        active={tab}
        onChange={setTab}
        badges={{ approvals: pendingCount }}
      />

      {tab === 'overview' && (
        <div className="space-y-6">
          <AdminStatCards data={dashboardQ.data} isLoading={dashboardQ.isLoading} />
          {pendingCount > 0 && (
            <InfoBanner variant="warning" title={`${pendingCount} laundry approval${pendingCount === 1 ? '' : 's'} waiting`}>
              <button
                type="button"
                className="mt-2 font-semibold text-primary underline"
                onClick={() => setTab('approvals')}
              >
                Review now →
              </button>
            </InfoBanner>
          )}
          <AdminApprovalQueue />
          <AdminCreateLaundry />
          <AdminCommissionSettings />
        </div>
      )}

      {tab === 'approvals' && (
        <div className="space-y-6">
          <AdminApprovalQueue />
          <AdminCreateLaundry />
          <AdminLaundriesList />
        </div>
      )}

      {tab === 'orders' && <AdminOrdersTable />}

      {tab === 'users' && <AdminUsersTable />}

      {tab === 'revenue' && (
        <div className="space-y-6">
          <AdminRevenuePanel
            data={dashboardQ.data}
            isLoading={dashboardQ.isLoading}
            isError={dashboardQ.isError}
          />
          <AdminTransactionsTable />
          <AdminCommissionSettings />
        </div>
      )}
    </div>
  );
}
