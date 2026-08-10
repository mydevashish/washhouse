'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent } from '@/features/partner/components/partner-content';
import { PartnerOrderSourceBadge, isWalkInOrder } from '@/features/partner/components/partner-order-source-badge';
import { PartnerOrderStatusStepper } from '@/features/partner/components/partner-order-status-stepper';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import {
  PartnerOpsSectionLabel,
  PartnerOpsSurface,
} from '@/features/partner/components/ops-visual';
import { PartnerOrderCard } from '@/features/partner/partner-order-card';
import { ColorTokenChip } from '@/features/partner-shop-floor/components/color-token-chip';
import { PrintOrderActions } from '@/features/partner-shop-floor/components/print-order-actions';
import {
  getPrintLifecycleEmphasis,
  getPrintLifecycleHint,
} from '@/features/partner-shop-floor/lib/print-lifecycle';
import {
  usePartnerOrderMutations,
  usePartnerQueriesEnabled,
} from '@/features/partner/hooks/use-partner-operations';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getPartnerOrder } from '@/services/partner';

type PartnerOrderDetailViewProps = {
  orderId: string;
};

export function PartnerOrderDetailView({ orderId }: PartnerOrderDetailViewProps) {
  const enabled = usePartnerQueriesEnabled();
  const orderQ = useQuery({
    queryKey: queryKeys.partnerOrder(orderId),
    queryFn: () => getPartnerOrder(orderId),
    enabled: enabled && Boolean(orderId),
    staleTime: STALE.partnerAnalytics,
  });
  const { acceptMutation, rejectMutation, advanceOrder, advanceMutation } =
    usePartnerOrderMutations();

  const order = orderQ.data;

  if (orderQ.isLoading) {
    return (
      <PartnerContent className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </PartnerContent>
    );
  }

  if (orderQ.isError || !order) {
    return (
      <PartnerContent>
        <QueryErrorState
          title="Could not load order"
          message={getApiErrorMessage(orderQ.error, 'Order not found or failed to load')}
          onRetry={() => void orderQ.refetch()}
          isRetrying={orderQ.isFetching}
        />
        <Button type="button" variant="outline" className="mt-4" asChild>
          <Link href="/partner/orders">Back to orders</Link>
        </Button>
      </PartnerContent>
    );
  }

  const tax = Number(order.cgst_inr) + Number(order.sgst_inr);
  const printEmphasis = getPrintLifecycleEmphasis(order.status);
  const printHint = getPrintLifecycleHint(order.status);
  const walkIn = isWalkInOrder(order);

  return (
    <PartnerContent className="space-y-5">
      <PartnerOpsSurface variant="muted" className="!p-4 sm:!p-5">
        <header className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="page-title">Order #{order.tracking_code}</h1>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{order.customer_name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {order.token_code ? (
              <ColorTokenChip
                colorToken={order.color_token}
                tokenCode={order.token_code}
                size="md"
                showLabel
              />
            ) : null}
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href="/partner/orders" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Orders
              </Link>
            </Button>
            <PartnerStatusBadge status={order.status} />
          </div>
        </header>
      </PartnerOpsSurface>

      <div className="grid gap-4 sm:grid-cols-2">
        <PartnerOpsSurface variant="muted" className="!p-4">
          <PartnerOpsSectionLabel>Customer details</PartnerOpsSectionLabel>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{order.customer_name}</p>
              <PartnerOrderSourceBadge order={order} />
              {order.token_code ? (
                <ColorTokenChip
                  colorToken={order.color_token}
                  tokenCode={order.token_code}
                  size="sm"
                />
              ) : null}
            </div>
            {order.customer_phone ? (
              <p className="text-muted-foreground">{order.customer_phone}</p>
            ) : null}
            <p className="text-muted-foreground">
              Payment:{' '}
              <span className="font-medium capitalize text-foreground">{order.payment_status}</span>
            </p>
          </div>
        </PartnerOpsSurface>

        <PartnerOpsSurface variant="muted" className="!p-4">
          <PartnerOpsSectionLabel>Order information</PartnerOpsSectionLabel>
          <div className="mt-3 space-y-1 text-sm">
            <p className="font-semibold font-mono">#{order.tracking_code}</p>
            <p className="text-muted-foreground">
              Source: {walkIn ? 'Walk-in' : 'Doorstep / online'}
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
              Status: <PartnerStatusBadge status={order.status} />
            </p>
            <p className="text-muted-foreground">
              Total:{' '}
              <span className="font-medium tabular-nums text-foreground">
                {formatInr(Number(order.total_inr))}
              </span>
            </p>
          </div>
        </PartnerOpsSurface>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <PartnerOpsSurface className="!p-4">
          <PartnerOpsSectionLabel>Line items</PartnerOpsSectionLabel>
          {order.items.length === 0 ? (
            <p className="mt-4 text-center text-sm text-muted-foreground">No line items.</p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-3xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Service</th>
                      <th className="px-4 py-2 font-semibold">Qty</th>
                      <th className="px-4 py-2 font-semibold">Rate</th>
                      <th className="px-4 py-2 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {order.items.map((item, idx) => (
                      <tr key={`${item.service_name}-${idx}`}>
                        <td className="px-4 py-2 font-medium">{item.service_name}</td>
                        <td className="px-4 py-2 tabular-nums">{item.quantity}</td>
                        <td className="px-4 py-2 tabular-nums">
                          {formatInr(
                            item.quantity > 0
                              ? Number(item.line_total_inr) / item.quantity
                              : 0,
                          )}
                        </td>
                        <td className="px-4 py-2 tabular-nums font-medium">
                          {formatInr(Number(item.line_total_inr ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </PartnerOpsSurface>

        <PartnerOpsSurface variant="muted" className="!p-4" data-testid="partner-order-print-panel">
          <PartnerOpsSectionLabel>Status & dispatch</PartnerOpsSectionLabel>
          <div className="mt-3 space-y-4">
            <PartnerStatusBadge status={order.status} />
            <PartnerOrderStatusStepper
              currentStatus={order.status}
              orderSource={order.order_source}
            />
            <div className="space-y-2 text-sm">
              <p>
                Pickup:{' '}
                <span className="font-medium">
                  <ClientDate iso={order.pickup_at} mode="datetime" />
                </span>
              </p>
              <p>
                Delivery:{' '}
                <span className="font-medium">
                  <ClientDate iso={order.delivery_at} mode="datetime" />
                </span>
              </p>
            </div>
            <div className="space-y-2 border-t border-border/60 pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatInr(Number(order.subtotal_inr))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="tabular-nums">{formatInr(Number(order.delivery_fee_inr))}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST</span>
                  <span className="tabular-nums">{formatInr(tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/60 pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatInr(Number(order.total_inr))}</span>
              </div>
            </div>
            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="text-xs text-muted-foreground">{printHint}</p>
              <PrintOrderActions
                orderId={order.id}
                orderStatus={order.status}
                size="default"
                emphasize={printEmphasis}
                className="sm:justify-start"
              />
            </div>
          </div>
        </PartnerOpsSurface>
      </div>

      <PartnerPanel title="Actions" description="Advance fulfillment and upload evidence" bodyClassName="p-4">
        <div className="max-w-xl">
          <PartnerOrderCard
            order={order}
            onAccept={() => acceptMutation.mutate(order.id)}
            onReject={() => rejectMutation.mutate(order.id)}
            onAdvance={() => advanceOrder(order.id, order.status, order.order_source)}
            isAccepting={acceptMutation.isPending}
            isRejecting={rejectMutation.isPending}
            isAdvancing={advanceMutation.isPending}
            onEvidenceUploaded={() => void orderQ.refetch()}
          />
          {(acceptMutation.isPending || advanceMutation.isPending) && (
            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Updating order…
            </p>
          )}
        </div>
      </PartnerPanel>
    </PartnerContent>
  );
}
