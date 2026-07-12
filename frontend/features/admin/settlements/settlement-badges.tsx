'use client';

import { cn } from '@/lib/utils';
import { SETTLEMENT_STATUS_LABELS, type SettlementStatus } from '@/services/settlements';

const STATUS_STYLES: Record<SettlementStatus, string> = {
  pending: 'bg-warning-muted text-warning',
  approved: 'bg-primary/10 text-primary',
  processing: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  paid: 'bg-success-muted text-success',
  failed: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
  on_hold: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
};

export function SettlementStatusBadge({ status }: { status: SettlementStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        STATUS_STYLES[status],
      )}
    >
      {SETTLEMENT_STATUS_LABELS[status]}
    </span>
  );
}
