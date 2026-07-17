import { getPricingTagLines } from '@/features/marketing/pricing/lib/tag-price-lines';
import type { MarketplaceFromItem } from '@/features/marketing/pricing/types';

function baseItem(overrides: Partial<MarketplaceFromItem> = {}): MarketplaceFromItem {
  return {
    catalog_item_id: '1',
    slug: 'shirt',
    name: 'Shirt',
    category: 'men',
    unit: 'piece',
    sort_order: 1,
    currency: 'INR',
    price_mode: 'dual',
    source: 'suggested',
    from_dry_clean_inr: '99.00',
    from_press_inr: '49.00',
    from_price_inr: null,
    from_dry_clean_paise: 9900,
    from_press_paise: 4900,
    from_price_paise: null,
    ...overrides,
  };
}

describe('getPricingTagLines', () => {
  it('labels dry clean and press when both columns are shown', () => {
    const lines = getPricingTagLines(baseItem(), {
      showDryClean: true,
      showPress: true,
      showSingleRate: false,
    });
    expect(lines).toEqual([
      { service: 'Dry clean', amountInr: '99.00' },
      { service: 'Press', amountInr: '49.00' },
    ]);
  });

  it('omits service label for single-rate items', () => {
    const lines = getPricingTagLines(
      baseItem({
        price_mode: 'single',
        from_dry_clean_inr: null,
        from_press_inr: null,
        from_price_inr: '79.00',
        from_dry_clean_paise: null,
        from_press_paise: null,
        from_price_paise: 7900,
      }),
      { showDryClean: false, showPress: false, showSingleRate: true },
    );
    expect(lines).toEqual([{ service: null, amountInr: '79.00' }]);
  });
});
