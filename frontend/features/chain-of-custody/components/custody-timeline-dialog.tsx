'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Shield } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChainOfCustodyTimeline } from '@/features/chain-of-custody/components/chain-of-custody-timeline';
import { queryKeys } from '@/lib/query-keys';
import type { CustodyTimeline } from '@/services/custody-timeline';

type CustodyTimelineDialogProps = {
  orderId: string | null;
  trackingCode: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queryFn: (orderId: string) => Promise<CustodyTimeline>;
  scope: 'partner' | 'admin';
};

export function CustodyTimelineDialog({
  orderId,
  trackingCode,
  open,
  onOpenChange,
  queryFn,
  scope,
}: CustodyTimelineDialogProps) {
  const timelineQ = useQuery({
    queryKey: queryKeys.custodyTimeline(orderId ?? '', scope),
    queryFn: () => queryFn(orderId!),
    enabled: open && Boolean(orderId),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden />
            Chain of custody
          </DialogTitle>
          <DialogDescription>
            Order #{trackingCode ?? '—'} — immutable audit trail of every handoff.
          </DialogDescription>
        </DialogHeader>
        {timelineQ.isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {timelineQ.data && (
          <ChainOfCustodyTimeline events={timelineQ.data.events} showMetadata />
        )}
      </DialogContent>
    </Dialog>
  );
}
