'use client';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { ClientDate } from '@/components/ui/client-date';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { getOrderStatusLabel } from '@/features/orders/lib/order-status-meta';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerOrders, type PartnerOrder } from '@/services/partner';

/**
 * Order-activity snapshot until a dedicated partner audit API ships.
 * Pages the real `GET /partner/orders` list (default 10) — same data on mobile and desktop.
 */
export function PartnerAuditView() {
  const enabled = usePartnerQueriesEnabled();
  const list = useServerList<PartnerOrder>({
    queryKey: queryKeys.partnerOrders({ surface: 'audit' }),
    fetcher: (params) =>
      listPartnerOrders({
        ...params,
        bucket: 'all',
        sort_by: params.sort_by ?? 'pickup_at',
        sort_order: params.sort_order ?? 'desc',
      }),
    defaultSort: { sort_by: 'pickup_at', sort_order: 'desc' },
    defaultPageSize: 10,
    enabled,
  });

  const orders = list.rows;

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Activity log"
        description="Recent order activity at your laundry. Full audit trail coming soon."
      />

      <PartnerPanel meta={`${list.totalRecords} records`} bodyClassName="p-0">
        {list.isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : list.isError ? (
          <div className="p-4">
            <QueryErrorState
              title="Could not load activity"
              message={getApiErrorMessage(list.error)}
              onRetry={() => void list.refetch()}
              isRetrying={list.isFetching}
            />
          </div>
        ) : orders.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <>
            <ul className="divide-y divide-border/50 md:hidden">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium">#{o.tracking_code}</span>
                    <PartnerStatusBadge status={o.status} />
                  </div>
                  <p className="text-foreground">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    <ClientDate iso={o.pickup_at} />
                  </p>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Time</th>
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        <ClientDate iso={o.pickup_at} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">#{o.tracking_code}</td>
                      <td className="px-4 py-2.5">{o.customer_name}</td>
                      <td className="px-4 py-2.5 text-xs">
                        Order {getOrderStatusLabel(o.status).toLowerCase()}
                      </td>
                      <td className="px-4 py-2.5">
                        <PartnerStatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/50 px-2 py-2">
              <DataTablePagination
                page={list.page}
                pageCount={list.pageCount}
                pageSize={list.pageSize}
                pageStart={list.pageStart}
                pageEnd={list.pageEnd}
                totalCount={list.totalRecords}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
              />
            </div>
          </>
        )}
      </PartnerPanel>
    </PartnerContent>
  );
}
