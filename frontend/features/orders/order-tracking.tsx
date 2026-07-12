'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Copy,
  Package,
  RefreshCw,
  Radio,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import {
  buildOrderTimeline,
  formatEstimatedDelivery,
  getOrderStatusLabel,
  trackingProgressPercent,
} from '@/features/orders/lib/order-status-meta';
import {
  ORDER_TRACKING_POLL_MS,
  useOrderTrackingLive,
} from '@/features/orders/hooks/use-order-tracking-live';
import { OrderReviewForm } from '@/features/orders/order-review-form';
import { OrderTimeline } from '@/features/orders/order-timeline';
import { OrderTrackingSkeleton } from '@/features/orders/order-tracking-skeleton';
import { PickupEvidenceGallery } from '@/features/pickup-evidence';
import { PickupEvidenceTimelineNote } from '@/features/pickup-evidence/components/pickup-evidence-timeline-note';
import { InventoryConfirmationBanner } from '@/features/inventory-verification';
import { ChainOfCustodyTimeline } from '@/features/chain-of-custody';
import { DeliveryOtpCustomerCard } from '@/features/delivery-otp';
import { DeliveryProofDisplay } from '@/features/delivery-proof';
import { FileDisputeForm } from '@/features/disputes/components/file-dispute-form';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getOrder } from '@/services/orders';
import { cn } from '@/lib/utils';

export function OrderTracking({ orderId }: { orderId: string }) {
  const mounted = useMounted();
  const { mode, isLive, pollIntervalMs } = useOrderTrackingLive(orderId);

  const orderQ = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => getOrder(orderId),
    staleTime: STALE.orderTracking,
    refetchInterval: (query) => {
      if (pollIntervalMs === false) return false;
      const status = query.state.data?.status;
      if (status === 'delivered' || status === 'cancelled') return false;
      return pollIntervalMs;
    },
    refetchIntervalInBackground: false,
  });

  const isLoading = orderQ.isLoading;
  const isRefetching = orderQ.isFetching && !orderQ.isLoading;

  if (isLoading) return <OrderTrackingSkeleton />;

  if (orderQ.error || !orderQ.data) {
    return (
      <EmptyState
        icon={Package}
        title="Order not found"
        description="This order may have been removed or you do not have access."
        action={{ label: 'Back to orders', href: '/orders' }}
      />
    );
  }

  const order = orderQ.data;
  const events = order.events ?? [];
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const isTerminal = isCancelled || isDelivered;
  const timelineSteps = isCancelled ? [] : buildOrderTimeline(order.status, events);
  const progress = trackingProgressPercent(order.status);

  function copyTrackingCode() {
    void navigator.clipboard.writeText(order.tracking_code);
    toast.success('Tracking code copied');
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-1">
      <nav>
        <Link
          href="/orders"
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Your orders
        </Link>
      </nav>

      <Card className="overflow-hidden border-0 shadow-pop">
        <div
          className={cn(
            'p-4 text-on-hero sm:p-5',
            isCancelled && 'bg-muted text-foreground',
            isDelivered && !isCancelled && 'bg-success text-success-foreground',
            !isDelivered && !isCancelled && 'bg-hero-gradient',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-on-hero-muted">Live tracking</p>
            {mounted && !isTerminal && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                  isLive ? 'bg-primary-foreground/20 text-on-hero' : 'bg-primary-foreground/10 text-on-hero-muted',
                )}
                role="status"
              >
                {isLive ? (
                  <>
                    <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden />
                    Live
                  </>
                ) : mode === 'connecting' ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Connecting…
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5" aria-hidden />
                    Updates every {ORDER_TRACKING_POLL_MS / 1000}s
                  </>
                )}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={copyTrackingCode}
            className="mt-2 flex items-center gap-2"
            aria-label={`Copy tracking code ${order.tracking_code}`}
          >
            <span className="text-3xl font-bold tracking-tight">#{order.tracking_code}</span>
            <Copy className="h-5 w-5 opacity-80" aria-hidden />
          </button>
          <p className="mt-4 text-2xl font-bold">{getOrderStatusLabel(order.status)}</p>
          <p className="mt-1 text-sm text-on-hero-muted">{formatInr(Number(order.total_inr))} total</p>

          {!isCancelled && (
            <div className="mt-4 rounded-lg bg-primary-foreground/15 p-3 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                <CalendarClock className="h-4 w-4" aria-hidden />
                Estimated delivery
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatEstimatedDelivery(order.delivery_at)}
              </p>
            </div>
          )}

          {!isCancelled && (
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs font-medium">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-primary-foreground/25">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <CardContent className="flex justify-end border-t border-border p-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            disabled={isRefetching}
            onClick={() => void orderQ.refetch()}
          >
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
            Refresh status
          </Button>
        </CardContent>
      </Card>

      {isCancelled && (
        <InfoBanner variant="destructive" icon={AlertCircle} title="Order cancelled">
          This order was cancelled. Contact support if you need help.
        </InfoBanner>
      )}

      {!isCancelled && (
        <section aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="text-lg font-bold text-foreground">
            Order journey
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We update each step as your clothes move through our partner laundry.
          </p>
          <Card className="mt-4 rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <OrderTimeline steps={timelineSteps} />
              <PickupEvidenceTimelineNote events={events} />
            </CardContent>
          </Card>
        </section>
      )}

      {(order.custody_timeline?.events?.length ?? 0) > 0 && (
        <section aria-labelledby="custody-heading">
          <h2 id="custody-heading" className="text-lg font-bold text-foreground">
            Chain of custody
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every handoff on your order — who did what and when.
          </p>
          <Card className="mt-4 rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
            <CardContent className="p-5 sm:p-6">
              <ChainOfCustodyTimeline events={order.custody_timeline!.events} />
            </CardContent>
          </Card>
        </section>
      )}

      {(order.pickup_evidence?.length ?? 0) > 0 && (
        <section aria-labelledby="pickup-evidence-heading">
          <h2 id="pickup-evidence-heading" className="sr-only">
            Pickup evidence photos
          </h2>
          <PickupEvidenceGallery photos={order.pickup_evidence ?? []} />
        </section>
      )}

      {order.inventory_verification && (
        <section aria-labelledby="inventory-heading">
          <h2 id="inventory-heading" className="sr-only">
            Pickup inventory
          </h2>
          <InventoryConfirmationBanner
            orderId={orderId}
            verification={order.inventory_verification}
            onConfirmed={() => void orderQ.refetch()}
          />
        </section>
      )}

      {order.delivery_proof && (
        <section aria-labelledby="delivery-proof-heading">
          <h2 id="delivery-proof-heading" className="sr-only">
            Delivery proof photo
          </h2>
          <DeliveryProofDisplay photo={order.delivery_proof} />
        </section>
      )}

      {order.status === 'out_for_delivery' && (
        <section aria-labelledby="delivery-otp-heading">
          <h2 id="delivery-otp-heading" className="sr-only">
            Delivery verification code
          </h2>
          <DeliveryOtpCustomerCard orderId={orderId} verification={order.delivery_verification} />
        </section>
      )}

      {order.delivery_verification?.is_verified && order.status === 'delivered' && (
        <section aria-labelledby="delivery-verified-heading">
          <h2 id="delivery-verified-heading" className="sr-only">
            Delivery verification status
          </h2>
          <DeliveryOtpCustomerCard orderId={orderId} verification={order.delivery_verification} />
        </section>
      )}

      {(isDelivered || isCancelled || order.status === 'out_for_delivery') && (
        <section aria-labelledby="dispute-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="dispute-heading" className="text-lg font-bold text-foreground">
              Something wrong?
            </h2>
            <Link href="/disputes" className="text-sm font-semibold text-primary hover:underline">
              Dispute center
            </Link>
          </div>
          <div className="mt-3">
            <FileDisputeForm orderId={orderId} trackingCode={order.tracking_code} />
          </div>
        </section>
      )}

      <section aria-labelledby="items-heading">
        <h2 id="items-heading" className="text-lg font-bold text-foreground">
          Your items
        </h2>
        <Card className="mt-3 rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
          <CardContent className="divide-y divide-border p-0">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-4 px-5 py-4 text-sm">
                <span className="text-foreground">
                  {item.service_name}{' '}
                  <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="shrink-0 font-bold tabular-nums">
                  {formatInr(Number(item.line_total_inr))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {isDelivered && <OrderReviewForm laundryId={order.laundry_id} orderId={order.id} />}
    </div>
  );
}
