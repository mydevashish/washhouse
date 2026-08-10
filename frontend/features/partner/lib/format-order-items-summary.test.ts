import { describe, expect, it } from 'vitest';

import { formatOrderItemsSummary } from '@/features/partner/lib/format-order-items-summary';

describe('formatOrderItemsSummary', () => {
  it('aggregates duplicate service lines', () => {
    expect(
      formatOrderItemsSummary([
        { service_name: 'Shirt · Wash', quantity: 2 },
        { service_name: 'Shirt · Wash', quantity: 1 },
        { service_name: 'Pant · Iron', quantity: 1 },
      ]),
    ).toBe('3 × Shirt · Wash, 1 Pant · Iron');
  });

  it('returns null when empty', () => {
    expect(formatOrderItemsSummary([])).toBeNull();
    expect(formatOrderItemsSummary(undefined)).toBeNull();
  });
});
