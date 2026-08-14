import {
  buildCatalogClothWallTiles,
  buildGarmentClothWallTiles,
  buildServiceClothWallTiles,
  filterTilesByCategory,
  resolveClothWallTiles,
} from '@/features/partner-shop-floor/lib/cloth-wall-items';
import type { GarmentCatalogItem } from '@/services/partner-garment-catalog';
import type { PartnerPriceListItem } from '@/features/partner-price-list/types';
import type { ServiceCatalogItem } from '@/services/customer-experience';

const shirt: PartnerPriceListItem = {
  catalog_item_id: 'shirt-1',
  slug: 'men-shirt-tshirt',
  name: 'Shirt / T-shirt',
  category: 'men',
  unit: 'piece',
  sort_order: 10,
  currency: 'INR',
  suggested_dry_clean_inr: '69',
  suggested_press_inr: '15',
  suggested_price_inr: null,
  suggested_dry_clean_paise: 6900,
  suggested_press_paise: 1500,
  suggested_price_paise: null,
  dry_clean_inr: '69',
  press_inr: '15',
  price_inr: null,
  dry_clean_paise: 6900,
  press_paise: 1500,
  price_paise: null,
  is_offered: true,
  has_override: true,
  allows_press: true,
  price_mode: 'dual',
};

describe('cloth-wall-items', () => {
  it('builds tiles from offered catalog rows and skips non-offered', () => {
    const tiles = buildCatalogClothWallTiles([
      shirt,
      { ...shirt, catalog_item_id: 'x', is_offered: false, slug: 'men-trouser' },
    ]);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]?.hinglish).toBe('Shirt');
    expect(tiles[0]?.photo.src).toContain('/catalog/');
  });

  it('falls back to laundry_services when building service tiles', () => {
    const services: ServiceCatalogItem[] = [
      {
        id: 'svc-1',
        name: 'Wash & Fold',
        category: 'wash',
        unit: 'kg',
        price_inr: '79',
        is_active: true,
        catalog_status: 'active',
      },
    ];
    const tiles = buildServiceClothWallTiles(services);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]?.source).toBe('service');
  });

  it('filters by category chip', () => {
    const tiles = buildCatalogClothWallTiles([shirt]);
    expect(filterTilesByCategory(tiles, 'men')).toHaveLength(1);
    expect(filterTilesByCategory(tiles, 'women')).toHaveLength(0);
  });

  it('builds garment catalog tiles with dry clean and press prices', () => {
    const garment: GarmentCatalogItem = {
      id: 'g1',
      laundry_id: 'l1',
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
    const tiles = buildGarmentClothWallTiles([garment]);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]?.source).toBe('garment');
    expect(tiles[0]?.dryCleanInr).toBe(59);
    expect(tiles[0]?.pressInr).toBe(15);
    expect(tiles[0]?.photo.src).toContain('/catalog/');
  });

  it('prefers garment catalog over price list in resolveClothWallTiles', () => {
    const garment: GarmentCatalogItem = {
      id: 'g2',
      laundry_id: 'l1',
      category: 'men',
      name: 'Jeans',
      garment_code: 'JE',
      image_url: null,
      resolved_image_url: null,
      platform_catalog_item_id: null,
      is_visible: true,
      sort_order: 0,
      rates: { dry_cleaning: { price_inr: '79.00', price_paise: 7900 } },
    };
    const resolved = resolveClothWallTiles({
      garmentItems: [garment],
      priceListItems: [shirt],
      services: [],
    });
    expect(resolved.source).toBe('garment');
    expect(resolved.tiles[0]?.name).toBe('Jeans');
  });

  it('skips hidden garment rows for cloth wall', () => {
    const hidden: GarmentCatalogItem = {
      id: 'g3',
      laundry_id: 'l1',
      category: 'men',
      name: 'Hidden',
      garment_code: 'HD',
      image_url: null,
      resolved_image_url: null,
      platform_catalog_item_id: null,
      is_visible: false,
      sort_order: 0,
      rates: { dry_cleaning: { price_inr: '10.00', price_paise: 1000 } },
    };
    expect(buildGarmentClothWallTiles([hidden])).toHaveLength(0);
  });
});
