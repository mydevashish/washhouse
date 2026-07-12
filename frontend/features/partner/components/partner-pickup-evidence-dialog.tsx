'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PickupEvidenceGallery, PickupEvidenceUpload } from '@/features/pickup-evidence';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerPickupEvidence } from '@/services/pickup-evidence';
import type { PartnerOrder } from '@/services/partner';

type PartnerPickupEvidenceDialogProps = {
  order: PartnerOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PartnerPickupEvidenceDialog({
  order,
  open,
  onOpenChange,
}: PartnerPickupEvidenceDialogProps) {
  const queryClient = useQueryClient();
  const orderId = order?.id ?? '';

  const evidenceQ = useQuery({
    queryKey: queryKeys.pickupEvidence(orderId, 'partner'),
    queryFn: () => listPartnerPickupEvidence(orderId),
    enabled: open && Boolean(orderId),
  });

  const hasEvidence = (evidenceQ.data?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pickup evidence</DialogTitle>
          <DialogDescription>
            Order #{order?.tracking_code ?? '—'} — upload photos before marking picked up.
          </DialogDescription>
        </DialogHeader>
        {evidenceQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!evidenceQ.isLoading && !hasEvidence && order && (
          <PickupEvidenceUpload
            orderId={order.id}
            onUploaded={() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.pickupEvidence(order.id, 'partner') });
              void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrders() });
            }}
          />
        )}
        {hasEvidence && evidenceQ.data && (
          <PickupEvidenceGallery
            photos={evidenceQ.data}
            title="Uploaded pickup evidence"
            description="Immutable — cannot be edited after upload."
            className="border-0 shadow-none ring-0"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
