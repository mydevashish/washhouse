'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PickupEvidenceGallery } from '@/features/pickup-evidence';
import { queryKeys } from '@/lib/query-keys';
import { listAdminPickupEvidence } from '@/services/pickup-evidence';

type AdminPickupEvidenceDialogProps = {
  orderId: string | null;
  trackingCode: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminPickupEvidenceDialog({
  orderId,
  trackingCode,
  open,
  onOpenChange,
}: AdminPickupEvidenceDialogProps) {
  const evidenceQ = useQuery({
    queryKey: queryKeys.pickupEvidence(orderId ?? '', 'admin'),
    queryFn: () => listAdminPickupEvidence(orderId!),
    enabled: open && Boolean(orderId),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pickup evidence</DialogTitle>
          <DialogDescription>
            Order #{trackingCode ?? '—'} — photos captured at pickup (read-only).
          </DialogDescription>
        </DialogHeader>
        {evidenceQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {evidenceQ.data && evidenceQ.data.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No pickup photos for this order.</p>
        )}
        {evidenceQ.data && evidenceQ.data.length > 0 && (
          <PickupEvidenceGallery
            photos={evidenceQ.data}
            title="Pickup photos"
            description="Admin view — immutable evidence record."
            className="border-0 shadow-none ring-0"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
