'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { collectPartnerOrderPayment } from '@/services/partner';
import type { PartnerOrder } from '@/services/partner';
import { queryKeys } from '@/lib/query-keys';

type Props = {
  order: PartnerOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollected: (orderId: string) => void;
};

export function PartnerPaymentCollectionDialog({ order, open, onOpenChange, onCollected }: Props) {
  const queryClient = useQueryClient();
  const pending = order ? Number(order.pending_inr ?? 0) : 0;
  const [amount, setAmount] = useState<string>(String(pending));
  const [method, setMethod] = useState<'cash' | 'wallet' | 'upi'>('cash');

  const mutation = useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: any }) =>
      collectPartnerOrderPayment(orderId, payload),
    onSuccess: (_, { orderId }) => {
      toast.success('Payment recorded');
      void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrder(orderId) });
      onCollected(orderId);
      onOpenChange(false);
    },
    onError: () => toast.error('Could not record payment'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Collect payment</DialogTitle>
          <DialogDescription>
            Order #{order?.tracking_code ?? '—'} — record payment before marking delivered.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <label className="block text-sm text-muted-foreground">Amount to collect (₹)</label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full" />

          <label className="block text-sm text-muted-foreground">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm"
          >
            <option value="cash">Cash</option>
            <option value="wallet">Wallet</option>
            <option value="upi">UPI</option>
          </select>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!order) return;
                const parsed = Number(amount || 0);
                mutation.mutate({ orderId: order.id, payload: { amount_inr: parsed, method } });
              }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving…' : 'Record & continue'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
