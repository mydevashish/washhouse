'use client';

import { Loader2, Shield } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClientDate } from '@/components/ui/client-date';
import { PartnerStatusBadge } from '@/features/partner/components/partner-status-badge';
import { PartnerOrderSourceBadge, isWalkInOrder } from '@/features/partner/components/partner-order-source-badge';
import { PickupEvidenceGallery, PickupEvidenceUpload } from '@/features/pickup-evidence';
import {
  InventoryVerificationDisplay,
  InventoryVerificationForm,
} from '@/features/inventory-verification';
import { formatInr } from '@/features/discover/detail/order-pricing';
import {
  getPartnerAdvanceLabel,
  getPartnerNextStatus,
  isOrderActive,
  isOrderNeedsAction,
} from '@/features/partner/lib/partner-status';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerPickupEvidence } from '@/services/pickup-evidence';
import { getPartnerInventoryVerification } from '@/services/inventory-verification';
import { getPartnerDeliveryVerification } from '@/services/delivery-otp';
import { getPartnerCustodyTimeline } from '@/services/custody-timeline';
import { getPartnerDeliveryProof } from '@/services/delivery-proof';
import { DeliveryOtpVerifyForm } from '@/features/delivery-otp';
import { CustodyTimelineDialog } from '@/features/chain-of-custody';
import { DeliveryProofDisplay, DeliveryProofUpload } from '@/features/delivery-proof';
import type { PartnerOrder } from '@/services/partner';
import { cn } from '@/lib/utils';

type PartnerOrderCardProps = {
  order: PartnerOrder;
  onAccept: () => void;
  onReject: () => void;
  onAdvance: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  isAdvancing?: boolean;
  onEvidenceUploaded?: () => void;
};

export function PartnerOrderCard({
  order,
  onAccept,
  onReject,
  onAdvance,
  isAccepting,
  isRejecting,
  isAdvancing,
  onEvidenceUploaded,
}: PartnerOrderCardProps) {
  const queryClient = useQueryClient();
  const [custodyOpen, setCustodyOpen] = useState(false);
  const walkIn = isWalkInOrder(order);
  const needsAction = isOrderNeedsAction(order.status, order.order_source);
  const nextLabel = getPartnerAdvanceLabel(order.status, order.order_source);
  const nextStatus = getPartnerNextStatus(order.status, order.order_source);
  const busy = isAccepting || isRejecting || isAdvancing;
  const needsPickupEvidence = !walkIn && order.status === 'pickup_assigned';

  const needsInventory = !walkIn && order.status === 'pickup_assigned';

  const evidenceQ = useQuery({
    queryKey: queryKeys.pickupEvidence(order.id, 'partner'),
    queryFn: () => listPartnerPickupEvidence(order.id),
    enabled: needsPickupEvidence || order.status === 'picked_up',
  });

  const inventoryQ = useQuery({
    queryKey: queryKeys.inventoryVerification(order.id, 'partner'),
    queryFn: () => getPartnerInventoryVerification(order.id),
    enabled: needsInventory || order.status === 'picked_up',
  });

  const needsDeliveryOtp = !walkIn && order.status === 'out_for_delivery';
  const deliveryQ = useQuery({
    queryKey: queryKeys.deliveryVerification(order.id, 'partner'),
    queryFn: () => getPartnerDeliveryVerification(order.id),
    enabled: needsDeliveryOtp,
  });

  const deliveryProofQ = useQuery({
    queryKey: queryKeys.deliveryProof(order.id, 'partner'),
    queryFn: () => getPartnerDeliveryProof(order.id),
    enabled: needsDeliveryOtp || order.status === 'delivered',
  });

  const hasEvidence = (evidenceQ.data?.length ?? 0) > 0;
  const hasInventory = (inventoryQ.data?.total_quantity ?? 0) > 0;
  const hasDeliveryProof = Boolean(deliveryProofQ.data);
  const canMarkPickedUp = (!needsPickupEvidence || hasEvidence) && (!needsInventory || hasInventory);

  return (
    <Card
      className={cn(
        needsAction && 'border-primary/40 ring-2 ring-primary/15',
        order.status === 'cancelled' && 'opacity-70',
      )}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-semibold text-foreground">#{order.tracking_code}</p>
              <PartnerOrderSourceBadge order={order} />
            </div>
            <p className="mt-0.5 truncate text-sm text-foreground">{order.customer_name}</p>
            {order.customer_phone && (
              <p className="truncate text-xs text-muted-foreground">{order.customer_phone}</p>
            )}
          </div>
          <PartnerStatusBadge status={order.status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{formatInr(Number(order.total_inr))}</strong> total
          </span>
          <span>
            Pickup <ClientDate iso={order.pickup_at} mode="datetime" />
          </span>
        </div>

        {order.items.length > 0 && (
          <ul className="rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.service_name} × {item.quantity}
              </li>
            ))}
          </ul>
        )}

        {needsAction && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              className="min-h-[44px] w-full"
              disabled={busy}
              onClick={onAccept}
            >
              {isAccepting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                'Accept order'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] w-full border-danger/40 text-danger hover:bg-danger-muted"
              disabled={busy}
              onClick={onReject}
            >
              {isRejecting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                'Reject order'
              )}
            </Button>
          </div>
        )}

        {needsPickupEvidence && !hasEvidence && (
          <PickupEvidenceUpload
            orderId={order.id}
            onUploaded={() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.pickupEvidence(order.id, 'partner') });
              void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrders() });
              onEvidenceUploaded?.();
            }}
          />
        )}

        {needsInventory && (
          <InventoryVerificationForm
            orderId={order.id}
            verification={inventoryQ.data ?? null}
            onSaved={() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.inventoryVerification(order.id, 'partner') });
              void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrders() });
            }}
          />
        )}

        {!needsInventory && inventoryQ.data && inventoryQ.data.total_quantity > 0 && (
          <InventoryVerificationDisplay
            verification={inventoryQ.data}
            className="shadow-none ring-0"
            title="Recorded inventory"
          />
        )}

        {hasEvidence && evidenceQ.data && (
          <PickupEvidenceGallery
            photos={evidenceQ.data}
            title="Uploaded pickup evidence"
            description="Immutable record — cannot be edited after upload."
            className="shadow-none ring-0"
          />
        )}

        {!needsAction && isOrderActive(order.status) && nextStatus && nextLabel && !needsDeliveryOtp && (
          <Button
            type="button"
            className="min-h-[44px] w-full"
            disabled={busy || (needsPickupEvidence && !hasEvidence) || (needsInventory && !hasInventory)}
            onClick={onAdvance}
          >
            {isAdvancing ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              nextLabel
            )}
          </Button>
        )}

        {needsDeliveryOtp && !hasDeliveryProof && (
          <DeliveryProofUpload
            orderId={order.id}
            disabled={busy}
            onUploaded={() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.deliveryProof(order.id, 'partner') });
              void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrders() });
            }}
          />
        )}

        {hasDeliveryProof && deliveryProofQ.data && (
          <DeliveryProofDisplay
            photo={deliveryProofQ.data}
            title="Uploaded delivery proof"
            description="Immutable record — cannot be edited after upload."
            className="shadow-none ring-0"
          />
        )}

        {needsDeliveryOtp && hasDeliveryProof && (
          <DeliveryOtpVerifyForm
            orderId={order.id}
            verification={deliveryQ.data}
            disabled={busy}
            onVerified={() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrders() });
              void queryClient.invalidateQueries({ queryKey: queryKeys.deliveryVerification(order.id, 'partner') });
            }}
          />
        )}

        {needsDeliveryOtp && !hasDeliveryProof && (
          <p className="text-center text-xs text-muted-foreground">
            Upload delivery proof before entering the customer OTP.
          </p>
        )}

        {(needsPickupEvidence || needsInventory) && !canMarkPickedUp && (
          <p className="text-center text-xs text-muted-foreground">
            {needsPickupEvidence && !hasEvidence && 'Upload pickup photos. '}
            {needsInventory && !hasInventory && 'Record item inventory '}
            before marking picked up.
          </p>
        )}

        {order.status === 'delivered' && (
          <p className="text-center text-sm font-medium text-success">Completed</p>
        )}
        {order.status === 'cancelled' && (
          <p className="text-center text-sm font-medium text-danger">Cancelled</p>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full gap-2"
          onClick={() => setCustodyOpen(true)}
        >
          <Shield className="h-4 w-4" aria-hidden />
          Chain of custody
        </Button>
      </CardContent>

      <CustodyTimelineDialog
        orderId={order.id}
        trackingCode={order.tracking_code}
        open={custodyOpen}
        onOpenChange={setCustodyOpen}
        queryFn={getPartnerCustodyTimeline}
        scope="partner"
      />
    </Card>
  );
}
