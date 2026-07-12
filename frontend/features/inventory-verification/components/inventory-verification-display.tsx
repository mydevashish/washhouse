'use client';

import { ClipboardList } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatOrderTimestamp } from '@/features/orders/lib/order-status-meta';
import {
  INVENTORY_ITEM_TYPES,
  type InventoryVerification,
} from '@/services/inventory-verification';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  pending_customer: 'Awaiting your confirmation',
  locked: 'Confirmed & locked',
  change_pending: 'Change pending admin approval',
};

type InventoryVerificationDisplayProps = {
  verification: InventoryVerification;
  className?: string;
  title?: string;
  description?: string;
  showStatus?: boolean;
};

export function InventoryVerificationDisplay({
  verification,
  className,
  title = 'Pickup inventory',
  description = 'Item counts recorded at pickup.',
  showStatus = true,
}: InventoryVerificationDisplayProps) {
  const nonZero = verification.items.filter((i) => i.quantity > 0);

  return (
    <Card className={cn('rounded-2xl border-0 shadow-soft ring-1 ring-border/60', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" aria-hidden />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        {showStatus && (
          <p className="text-xs text-muted-foreground">
            {STATUS_LABEL[verification.status] ?? verification.status}
            {' · '}
            Recorded {formatOrderTimestamp(verification.recorded_at)}
            {verification.locked_at && (
              <> · Locked {formatOrderTimestamp(verification.locked_at)}</>
            )}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {INVENTORY_ITEM_TYPES.map((type) => {
            const line = verification.items.find((i) => i.item_type === type);
            const qty = line?.quantity ?? 0;
            return (
              <div key={type} className={cn('rounded-lg px-3 py-2', qty > 0 ? 'bg-muted/60' : 'opacity-50')}>
                <dt className="text-xs text-muted-foreground">{line?.label ?? type}</dt>
                <dd className="text-lg font-bold tabular-nums">{qty}</dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-4 text-sm font-semibold text-foreground">
          Total items: <span className="tabular-nums">{verification.total_quantity}</span>
        </p>
        {nonZero.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No items recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
