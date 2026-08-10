'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { PartnerCreateOrderDialog } from '@/features/partner/components/partner-create-order-dialog';
import { PartnerDashboardAnalyticsChart } from '@/features/partner/components/partner-dashboard-analytics-chart';
import { PartnerDashboardCreateSuccessPanel } from '@/features/partner/components/partner-dashboard-create-success-panel';
import { PartnerDashboardOwnerBriefStrip } from '@/features/partner/components/partner-dashboard-owner-brief-strip';
import { PartnerDashboardRecentOrders } from '@/features/partner/components/partner-dashboard-recent-orders';
import { PartnerDashboardTagsSection } from '@/features/partner/components/partner-dashboard-tags-section';
import { PartnerQuickOverview } from '@/features/partner/components/partner-quick-overview';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getOperationsDashboard } from '@/services/operations';
import type { WalkInOrder } from '@/services/partner-walk-in-orders';

export function PartnerLaundryDashboardView() {
  const queriesEnabled = usePartnerQueriesEnabled();
  const successRef = useRef<HTMLDivElement>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<WalkInOrder | null>(null);

  const opsQ = useQuery({
    queryKey: queryKeys.partnerOperationsDashboard(),
    queryFn: getOperationsDashboard,
    enabled: queriesEnabled,
    staleTime: STALE.adminDashboard,
  });

  const createHubHref = buildOrdersHubPath('/partner/orders', 'create');

  return (
    <PartnerContent className="space-y-5">
      {opsQ.isError ? (
        <QueryErrorState
          title="Could not load operations summary"
          message={getApiErrorMessage(opsQ.error, 'Operations summary failed to load')}
          onRetry={() => void opsQ.refetch()}
          isRetrying={opsQ.isFetching}
        />
      ) : null}

      <PartnerPageHeader
        title="Command desk"
        description="Period pulse, chart, recent queue, and quick create — full workspace lives in Customers & Orders."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setCreateDialogOpen(true)}>
              Create order
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={createHubHref} data-testid="partner-dashboard-open-full-workspace">
                Open full workspace
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/partner/orders">Orders hub</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]" aria-label="Operations overview">
        <PartnerQuickOverview />
        <PartnerDashboardAnalyticsChart />
      </section>

      <PartnerDashboardOwnerBriefStrip />

      <PartnerDashboardRecentOrders onCreateOrder={() => setCreateDialogOpen(true)} />

      <PartnerDashboardTagsSection />

      {createdOrder ? (
        <PartnerDashboardCreateSuccessPanel
          ref={successRef}
          order={createdOrder}
          onAddAnother={() => {
            setCreatedOrder(null);
            setCreateDialogOpen(true);
          }}
        />
      ) : null}

      <PartnerCreateOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onOrderCreated={(result) => {
          if (result.kind === 'walk_in') {
            setCreatedOrder(result.order);
          }
        }}
      />
    </PartnerContent>
  );
}
