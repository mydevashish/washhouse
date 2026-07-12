'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, PackageCheck } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeliveryProofDisplay } from '@/features/delivery-proof';
import { queryKeys } from '@/lib/query-keys';
import { getAdminDeliveryProof } from '@/services/delivery-proof';

type AdminDeliveryProofDialogProps = {
  orderId: string | null;
  trackingCode: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminDeliveryProofDialog({
  orderId,
  trackingCode,
  open,
  onOpenChange,
}: AdminDeliveryProofDialogProps) {
  const proofQ = useQuery({
    queryKey: queryKeys.deliveryProof(orderId ?? '', 'admin'),
    queryFn: () => getAdminDeliveryProof(orderId!),
    enabled: open && Boolean(orderId),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" aria-hidden />
            Delivery proof
          </DialogTitle>
          <DialogDescription>
            Order #{trackingCode ?? '—'} — photo captured at delivery (read-only).
          </DialogDescription>
        </DialogHeader>
        {proofQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {proofQ.data === null && !proofQ.isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">No delivery proof for this order.</p>
        )}
        {proofQ.data && (
          <DeliveryProofDisplay
            photo={proofQ.data}
            title="Delivery photo"
            description="Admin view — immutable delivery record."
            showDeviceInfo
            className="border-0 shadow-none ring-0"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
