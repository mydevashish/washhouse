import { Badge } from '@/components/ui/badge';
import type { PartnerOrder } from '@/services/partner';

export function isWalkInOrder(order: Pick<PartnerOrder, 'order_source'>): boolean {
  return order.order_source === 'walk_in';
}

export function PartnerOrderSourceBadge({ order }: { order: Pick<PartnerOrder, 'order_source'> }) {
  if (!isWalkInOrder(order)) return null;
  return (
    <Badge variant="info" className="shrink-0">
      Walk-in
    </Badge>
  );
}
