import {
  garmentPriceChips,
  nextGarmentVisibility,
  visibleGarmentServiceColumns,
} from '@/features/partner/garment-catalog/lib/garment-catalog-display';
import type { GarmentCatalogItem } from '@/services/partner-garment-catalog';

const sampleItem: GarmentCatalogItem = {
  id: '1',
  laundry_id: '2',
  category: 'men',
  name: 'T Shirt',
  garment_code: 'TF',
  image_url: null,
  resolved_image_url: null,
  platform_catalog_item_id: null,
  is_visible: true,
  sort_order: 0,
  rates: {
    dry_cleaning: { price_inr: '59.00', price_paise: 5900 },
    steam_press: { price_inr: '15.00', price_paise: 1500 },
    shoe_cleaning: { price_inr: '0.00', price_paise: 0 },
  },
};

describe('garment-catalog-display', () => {
  it('garmentPriceChips hides zero shoe clean and shows primary services', () => {
    const chips = garmentPriceChips(sampleItem);
    expect(chips).toHaveLength(2);
    expect(chips[0]).toMatchObject({ type: 'dry_cleaning', inr: '59.00' });
    expect(chips[1]).toMatchObject({ type: 'steam_press', inr: '15.00' });
  });

  it('nextGarmentVisibility toggles visibility flag', () => {
    expect(nextGarmentVisibility(true)).toBe(false);
    expect(nextGarmentVisibility(false)).toBe(true);
  });

  it('visibleGarmentServiceColumns lists only priced columns on page', () => {
    const cols = visibleGarmentServiceColumns([sampleItem]);
    expect(cols).toContain('dry_cleaning');
    expect(cols).toContain('steam_press');
    expect(cols).not.toContain('shoe_cleaning');
  });
});
