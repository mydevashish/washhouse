import { Badge } from '@/components/ui/badge';
import { getOrderStatusLabel } from '@/features/orders/lib/order-status-meta';

export function OrderStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'delivered'
      ? 'success'
      : status === 'cancelled'
        ? 'destructive'
        : status === 'confirmed'
          ? 'warning'
          : 'info';
  return <Badge variant={variant}>{getOrderStatusLabel(status)}</Badge>;
}
