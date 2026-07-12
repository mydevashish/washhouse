'use client';

import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryVerificationDisplay } from '@/features/inventory-verification/components/inventory-verification-display';
import { confirmInventory, type InventoryVerification } from '@/services/inventory-verification';

type InventoryConfirmationBannerProps = {
  orderId: string;
  verification: InventoryVerification;
  onConfirmed?: () => void;
};

export function InventoryConfirmationBanner({
  orderId,
  verification,
  onConfirmed,
}: InventoryConfirmationBannerProps) {
  if (verification.is_locked) {
    return (
      <InventoryVerificationDisplay
        verification={verification}
        title="Verified pickup inventory"
        description="You confirmed these item counts. The record is locked."
      />
    );
  }

  async function confirm() {
    try {
      await confirmInventory(orderId);
      toast.success('Inventory confirmed and locked');
      onConfirmed?.();
    } catch {
      toast.error('Could not confirm inventory');
    }
  }

  return (
    <Card className="rounded-2xl border-amber-500/40 ring-2 ring-amber-500/15">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-amber-600" aria-hidden />
          Confirm pickup inventory
        </CardTitle>
        <CardDescription>
          Your laundry partner recorded the items below. Confirm to lock this record for disputes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <InventoryVerificationDisplay verification={verification} showStatus={false} className="shadow-none ring-0" />
        <Button type="button" className="min-h-[44px] w-full" onClick={() => void confirm()}>
          Confirm inventory
        </Button>
      </CardContent>
    </Card>
  );
}

export function InventoryConfirmationBannerSkeleton() {
  return (
    <Card>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
