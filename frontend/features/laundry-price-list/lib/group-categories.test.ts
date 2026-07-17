import { formatRupee, rupeeAriaLabel } from '@/features/laundry-price-list/lib/format-inr';
import { groupPriceListByCategory } from '@/features/laundry-price-list/lib/group-categories';
import type { LaundryPriceListItem } from '@/features/laundry-price-list/types';

function item(
  partial: Partial<LaundryPriceListItem> &
    Pick<LaundryPriceListItem, 'catalog_item_id' | 'name' | 'category'>,
): LaundryPriceListItem {
  return {
    slug: partial.slug ?? partial.catalog_item_id,
    unit: 'piece',
    sort_order: 10,
    currency: 'INR',
    price_mode: 'dual',
    dry_clean_inr: null,
    press_inr: null,
    price_inr: null,
    dry_clean_paise: null,
    press_paise: null,
    price_paise: null,
    ...partial,
  };
}

describe('formatRupee', () => {
  it('formats whole and decimal amounts', () => {
    expect(formatRupee('75.00')).toBe('₹75');
    expect(formatRupee('75.50')).toBe('₹75.5');
    expect(formatRupee(null)).toBe('—');
  });

  it('provides accessible rupee labels', () => {
    expect(rupeeAriaLabel('75.00')).toBe('75 rupees');
    expect(rupeeAriaLabel(null)).toBe('Not available');
  });
});

describe('groupPriceListByCategory', () => {
  it('hides empty dry-clean / press columns per category', () => {
    const groups = groupPriceListByCategory([
      item({
        catalog_item_id: '1',
        name: 'Shirt',
        category: 'men',
        dry_clean_inr: '75.00',
        press_inr: '20.00',
      }),
      item({
        catalog_item_id: '2',
        name: 'Cap',
        category: 'men',
        dry_clean_inr: '39.00',
        press_inr: null,
      }),
      item({
        catalog_item_id: '3',
        name: 'Wash & Fold',
        category: 'laundry_by_kg',
        unit: 'kg',
        price_mode: 'single',
        price_inr: '85.00',
      }),
    ]);

    expect(groups).toHaveLength(2);
    const kg = groups.find((g) => g.category === 'laundry_by_kg');
    expect(kg?.showSingleRate).toBe(true);
    expect(kg?.showDryClean).toBe(false);
    expect(kg?.showPress).toBe(false);

    const men = groups.find((g) => g.category === 'men');
    expect(men?.showDryClean).toBe(true);
    expect(men?.showPress).toBe(true);
    expect(men?.items).toHaveLength(2);
  });
});
