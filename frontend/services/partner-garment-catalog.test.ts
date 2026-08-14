import {
  GARMENT_CATALOG_DEFAULT_PAGE_SIZE,
  GARMENT_SERVICE_TYPES,
  garmentPrimaryPriceInr,
  garmentServiceTypeLabel,
  type GarmentCatalogItem,
} from '@/services/partner-garment-catalog';

describe('partner-garment-catalog helpers', () => {
  it('exposes 11 service types matching backend enum', () => {
    expect(GARMENT_SERVICE_TYPES).toHaveLength(11);
    expect(GARMENT_SERVICE_TYPES).toContain('dry_cleaning');
    expect(GARMENT_SERVICE_TYPES).toContain('wash_n_iron');
  });

  it('garmentPrimaryPriceInr prefers dry clean then press', () => {
    const item: GarmentCatalogItem = {
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
      },
    };
    expect(garmentPrimaryPriceInr(item)).toBe('59.00');
  });

  it('garmentServiceTypeLabel returns readable copy', () => {
    expect(garmentServiceTypeLabel('dry_cleaning')).toBe('Dry clean');
    expect(garmentServiceTypeLabel('steam_press')).toBe('Steam press');
  });

  it('uses spec default page size 20', () => {
    expect(GARMENT_CATALOG_DEFAULT_PAGE_SIZE).toBe(20);
  });
});
