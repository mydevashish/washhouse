import { formatFromRupee } from '@/features/marketing/pricing/lib/format-from-inr';
import { groupMarketplaceFromByCategory } from '@/features/marketing/pricing/lib/group-from-categories';
import type { MarketplaceFromItem } from '@/features/marketing/pricing/types';
import { washhouseSuggestedFromItems } from '@/features/marketing/pricing/washhouse-suggested-from';

describe('formatFromRupee', () => {
  it('prefixes from for INR values', () => {
    expect(formatFromRupee('69.00')).toBe('from ₹69');
  });

  it('returns em dash for empty', () => {
    expect(formatFromRupee(null)).toBe('—');
  });
});

describe('groupMarketplaceFromByCategory', () => {
  it('groups WashHouse fallback into category order', () => {
    const groups = groupMarketplaceFromByCategory(washhouseSuggestedFromItems());
    expect(groups.map((g) => g.category)).toEqual([
      'laundry_by_kg',
      'men',
      'women',
      'kids',
      'winter',
      'household',
    ]);
    const men = groups.find((g) => g.category === 'men');
    expect(men?.showDryClean).toBe(true);
    expect(men?.showPress).toBe(true);
    expect(men?.items.some((i) => i.slug === 'men-shirt-tshirt')).toBe(true);
  });

  it('hides empty columns for by-kg', () => {
    const items: MarketplaceFromItem[] = [
      {
        catalog_item_id: '1',
        slug: 'kg-wash-fold',
        name: 'Wash & Fold',
        category: 'laundry_by_kg',
        unit: 'kg',
        sort_order: 10,
        currency: 'INR',
        price_mode: 'single',
        source: 'suggested',
        from_dry_clean_inr: null,
        from_press_inr: null,
        from_price_inr: '79.00',
        from_dry_clean_paise: null,
        from_press_paise: null,
        from_price_paise: 7900,
      },
    ];
    const [group] = groupMarketplaceFromByCategory(items);
    expect(group).toBeDefined();
    expect(group!.showSingleRate).toBe(true);
    expect(group!.showDryClean).toBe(false);
    expect(group!.showPress).toBe(false);
  });
});
