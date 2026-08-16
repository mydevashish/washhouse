'use client';

import { useQuery } from '@tanstack/react-query';
import {
  PartnerHubCouponsModalContent,
  PartnerHubCouponsPillarCard,
} from '@/features/partner/orders-hub/workspace/partner-hub-coupons-workspace';
import {
  PartnerHubServicesModalContent,
  PartnerHubServicesPillarCard,
} from '@/features/partner/orders-hub/workspace/partner-hub-services-workspace';
import { Package, Users } from 'lucide-react';
import { useCallback, useState } from 'react';

import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { usePartnerHubCreateOrder } from '@/features/partner/orders-hub/workspace/partner-hub-create-order';
import { PartnerHubPillarCard } from '@/features/partner/orders-hub/workspace/partner-hub-pillar-card';
import { PartnerHubPillarGrid } from '@/features/partner/orders-hub/workspace/partner-hub-pillar-grid';
import { PartnerHubCustomersCreateDialog } from '@/features/partner/orders-hub/workspace/partner-hub-customers-create-dialog';
import {
  PartnerHubCustomersWorkspaceBody,
  PartnerHubCustomersWorkspaceToolbar,
  usePartnerHubCustomersList,
} from '@/features/partner/orders-hub/workspace/partner-hub-customers-workspace';
import {
  PartnerHubOrdersWorkspaceBody,
  PartnerHubOrdersWorkspaceToolbar,
  usePartnerHubOrdersKpis,
  usePartnerHubOrdersList,
} from '@/features/partner/orders-hub/workspace/partner-hub-orders-workspace';
import {
  PartnerHubWorkspaceModalGate,
} from '@/features/partner/orders-hub/workspace/partner-hub-workspace-modal';
import {
  PartnerHubWorkspacePagination,
  partnerHubPaginationFromList,
} from '@/features/partner/orders-hub/workspace/partner-hub-workspace-pagination';
import { usePartnerHubWorkspaceUrl } from '@/features/partner/orders-hub/workspace/use-partner-hub-workspace-url';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getPartnerCustomerInsightsDashboard } from '@/services/customer-insights';

function PartnerHubCustomersPillarCard() {
  const enabled = usePartnerQueriesEnabled();
  const { setWorkspace } = usePartnerHubWorkspaceUrl();

  const dashboardQ = useQuery({
    queryKey: queryKeys.partnerCustomerInsightsDashboard(),
    queryFn: getPartnerCustomerInsightsDashboard,
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const total = dashboardQ.data?.total_customers;
  const newWeek = dashboardQ.data?.new_this_week ?? 0;

  return (
    <PartnerHubPillarCard
      id="customers"
      title="Customers"
      icon={Users}
      loading={dashboardQ.isLoading}
      primaryMetric={total != null ? `${total} total` : '—'}
      secondaryMetric={dashboardQ.isError ? 'Tap to retry' : `+${newWeek} this week`}
      onOpen={() => setWorkspace('customers')}
    />
  );
}

function PartnerHubOrdersPillarCard() {
  const enabled = usePartnerQueriesEnabled();
  const { setWorkspace } = usePartnerHubWorkspaceUrl();
  const { needsAction } = usePartnerHubOrdersKpis();

  const dashboardQ = useQuery({
    queryKey: queryKeys.partnerCustomerInsightsDashboard(),
    queryFn: getPartnerCustomerInsightsDashboard,
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const total = dashboardQ.data?.orders_count_all_time;
  const week = dashboardQ.data?.orders_count_this_week ?? 0;
  const secondary =
    dashboardQ.isError
      ? 'Tap to retry'
      : needsAction > 0
        ? `${week} this week · ${needsAction} need action`
        : `${week} this week`;

  return (
    <PartnerHubPillarCard
      id="orders"
      title="Orders"
      icon={Package}
      loading={dashboardQ.isLoading}
      primaryMetric={total != null ? `${total} total` : '—'}
      secondaryMetric={secondary}
      onOpen={() => setWorkspace('orders')}
    />
  );
}

function PartnerHubOrdersModalContent() {
  const { openCreateOrder } = usePartnerHubCreateOrder();
  const { setWorkspace } = usePartnerHubWorkspaceUrl();
  const list = usePartnerHubOrdersList();
  const { needsAction } = usePartnerHubOrdersKpis();
  const enabled = usePartnerQueriesEnabled();
  const dashboardQ = useQuery({
    queryKey: queryKeys.partnerCustomerInsightsDashboard(),
    queryFn: getPartnerCustomerInsightsDashboard,
    enabled,
    staleTime: STALE.adminDashboard,
  });
  const paginationProps = list.data ? partnerHubPaginationFromList(list.data) : null;

  const startCreate = useCallback(() => {
    setWorkspace(null);
    openCreateOrder();
  }, [openCreateOrder, setWorkspace]);

  return (
    <PartnerHubWorkspaceModalGate
      workspaceId="orders"
      title="Orders"
      description="Search all orders — paginated, 10 per page."
      toolbar={
        <PartnerHubOrdersWorkspaceToolbar
          searchInput={list.search}
          onSearchChange={(v) => list.setSearch(v)}
          onNewOrder={startCreate}
        />
      }
      footer={
        paginationProps ? (
          <PartnerHubWorkspacePagination {...paginationProps} onPageChange={list.setPage} />
        ) : null
      }
    >
      <PartnerHubOrdersWorkspaceBody
        list={list}
        weekCount={dashboardQ.data?.orders_count_this_week}
        needsAction={needsAction}
      />
    </PartnerHubWorkspaceModalGate>
  );
}

function PartnerHubCustomersModalContent() {
  const [createOpen, setCreateOpen] = useState(false);
  const list = usePartnerHubCustomersList();
  const paginationProps = list.data ? partnerHubPaginationFromList(list.data) : null;

  return (
    <>
      <PartnerHubWorkspaceModalGate
        workspaceId="customers"
        title="Customers"
        description="Search your directory — paginated, 10 per page."
        toolbar={
          <PartnerHubCustomersWorkspaceToolbar
            searchInput={list.search}
            onSearchChange={(v) => list.setSearch(v)}
            onAddCustomer={() => setCreateOpen(true)}
          />
        }
        footer={
          paginationProps ? (
            <PartnerHubWorkspacePagination {...paginationProps} onPageChange={list.setPage} />
          ) : null
        }
      >
        <PartnerHubCustomersWorkspaceBody list={list} onAddCustomer={() => setCreateOpen(true)} />
      </PartnerHubWorkspaceModalGate>
      <PartnerHubCustomersCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

/** Workspace modals driven by `?workspace=` — shared by hub pillars and `/partner/orders`. */
export function PartnerHubWorkspaceModals() {
  return (
    <>
      <PartnerHubCustomersModalContent />
      <PartnerHubOrdersModalContent />
      <PartnerHubCouponsModalContent />
      <PartnerHubServicesModalContent />
    </>
  );
}

/** Four pillar tiles + workspace modals (CRUD inside each modal). */
export function PartnerHubPillarsRow() {
  return (
    <>
      <PartnerHubPillarGrid>
        <PartnerHubCustomersPillarCard />
        <PartnerHubOrdersPillarCard />
        <PartnerHubCouponsPillarCard />
        <PartnerHubServicesPillarCard />
      </PartnerHubPillarGrid>
      <PartnerHubWorkspaceModals />
    </>
  );
}
