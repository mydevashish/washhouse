import { getOrderStatusIcon, getOrderStatusLabel } from '@/features/orders/lib/order-status-meta';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-warning-muted text-warning',
  pickup_assigned: 'bg-info-muted text-info',
  picked_up: 'bg-brand-50 text-brand-900 dark:bg-brand-900/50 dark:text-brand-50',
  washing: 'bg-warning-muted text-warning',
  ironing: 'bg-muted text-foreground',
  ready: 'bg-success-muted text-success',
  out_for_delivery: 'bg-primary/15 text-primary',
  delivered: 'bg-muted text-foreground',
  cancelled: 'bg-danger-muted text-danger',
};

export function PartnerStatusBadge({ status }: { status: string }) {
  const label = getOrderStatusLabel(status);
  const Icon = getOrderStatusIcon(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        STATUS_STYLE[status] ?? 'bg-muted text-foreground',
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
