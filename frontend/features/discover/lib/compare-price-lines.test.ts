import { getComparePriceLines, comparePriceAriaSummary } from './compare-price-lines';
import type { LaundryListItem } from '@/services/laundries';

const base: LaundryListItem = {
  id: '1',
  name: 'Test',
  slug: 'test',
  city: 'Bengaluru',
  avg_rating: '4.5',
  review_count: 1,
  is_verified: true,
};

describe('getComparePriceLines', () => {
  it('returns empty when no owner prices', () => {
    expect(getComparePriceLines(base)).toEqual([]);
    expect(comparePriceAriaSummary(base)).toBeNull();
  });

  it('shows wash fold and shirt when both exist', () => {
    const lines = getComparePriceLines({
      ...base,
      wash_fold_from_inr: '79.00',
      shirt_dry_clean_from_inr: '69.00',
    });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ key: 'wash_fold', amountLabel: '₹79', unitSuffix: '/kg' });
    expect(lines[1]).toMatchObject({ key: 'shirt', amountLabel: '₹69' });
  });
});
