import { Badge } from '@/components/ui/badge';

export { OrderStatusBadge } from '@/features/orders/order-status-badge';

export function UserRoleBadge({ role }: { role: string }) {
  const variant =
    role === 'admin' || role === 'super_admin'
      ? 'default'
      : role === 'partner'
        ? 'info'
        : 'secondary';
  const label = role.replace(/_/g, ' ');
  return <Badge variant={variant} className="capitalize">
    {label}
  </Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'paid' || status === 'captured' || status === 'succeeded'
      ? 'success'
      : status === 'failed' || status === 'refunded'
        ? 'destructive'
        : status === 'pending'
          ? 'warning'
          : 'outline';
  return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
}

export function LaundryStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'approved'
      ? 'success'
      : status === 'pending_approval'
        ? 'warning'
        : status === 'rejected'
          ? 'destructive'
          : 'outline';
  return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
}
