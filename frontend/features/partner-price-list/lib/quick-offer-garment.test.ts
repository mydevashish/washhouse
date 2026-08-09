import type { PartnerPriceListItem } from '@/features/partner-price-list/types';
import {
  upsertPayloadFromSuggested,
  upsertPayloadDisableOffer,
} from '@/features/partner-price-list/lib/quick-offer-garment';

describe('quick-offer-garment', () => {
  const base: PartnerPriceListItem = {
    catalog_item_id: '11111111-1111-1111-1111-111111111111',
    slug: 'mens-shirt',
    name: 'Shirt',
    category: 'men',
    unit: 'piece',
    sort_order: 1,
    currency: 'INR',
    suggested_dry_clean_inr: '80',
    suggested_press_inr: '40',
    suggested_price_inr: null,
    suggested_dry_clean_paise: 8000,
    suggested_press_paise: 4000,
    suggested_price_paise: null,
    dry_clean_inr: null,
    press_inr: null,
    price_inr: null,
    dry_clean_paise: null,
    press_paise: null,
    price_paise: null,
    is_offered: null,
    has_override: false,
    allows_press: true,
    price_mode: 'dual',
  };

  it('builds dual upsert from suggested prices', () => {
    expect(upsertPayloadFromSuggested(base)).toEqual({
      catalog_item_id: base.catalog_item_id,
      dry_clean_inr: '80',
      press_inr: '40',
      is_offered: true,
    });
  });

  it('builds disable upsert', () => {
    expect(upsertPayloadDisableOffer({ ...base, is_offered: true, dry_clean_inr: '90' })).toMatchObject({
      is_offered: false,
      dry_clean_inr: '90',
    });
  });
});
