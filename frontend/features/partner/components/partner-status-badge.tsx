import { getOrderStatusLabel } from '@/features/orders/lib/order-status-meta';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-warning-muted text-warning',
  pickup_assigned: 'bg-info-muted text-info',
  picked_up: 'bg-accent text-accent-foreground',
  washing: 'bg-secondary text-secondary-foreground',
  ironing: 'bg-muted text-foreground',
  ready: 'bg-success-muted text-success',
  out_for_delivery: 'bg-primary/15 text-primary',
  delivered: 'bg-muted text-muted-foreground',
  cancelled: 'bg-danger-muted text-danger',
};

export function PartnerStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold',
        STATUS_STYLE[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {getOrderStatusLabel(status)}
    </span>
  );
}
