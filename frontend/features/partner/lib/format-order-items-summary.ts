import type { OrderItem } from '@/services/orders';

/** Human-readable intake summary for post-create success (e.g. "2 × Shirt · Wash, 1 × Pant"). */
export function formatOrderItemsSummary(
  items: Pick<OrderItem, 'service_name' | 'quantity'>[] | undefined,
): string | null {
  if (!items?.length) return null;

  const counts = new Map<string, number>();
  for (const item of items) {
    const label = item.service_name.trim() || 'Item';
    counts.set(label, (counts.get(label) ?? 0) + Math.max(1, item.quantity));
  }

  const parts = [...counts.entries()].map(([name, qty]) =>
    qty === 1 ? `1 ${name}` : `${qty} × ${name}`,
  );

  return parts.join(', ');
}
