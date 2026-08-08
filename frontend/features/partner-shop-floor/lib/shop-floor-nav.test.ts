import { PARTNER_NAV_SECTIONS } from '@/features/partner/lib/partner-nav';
import {
  SHOP_FLOOR_HOME_TILES,
  SHOP_FLOOR_NAV_ITEMS,
  countShopFloorNavItems,
  getShopFloorPageTitle,
  isShopFloorNavActive,
} from '@/features/partner-shop-floor/lib/shop-floor-nav';

describe('shop floor nav', () => {
  it('has exactly 4 home tiles and 5 nav items (4 + More)', () => {
    expect(SHOP_FLOOR_HOME_TILES).toHaveLength(4);
    expect(countShopFloorNavItems()).toBe(5);
    expect(SHOP_FLOOR_NAV_ITEMS.map((i) => i.label)).toEqual([
      'Naya Order',
      'Aaj ka Kaam',
      'Ready / Diya',
      'Print',
      'More',
    ]);
  });

  it('keeps Advanced Mode nav denser than Shop Floor (Owner Command Center pillars)', () => {
    const advancedCount = PARTNER_NAV_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
    expect(advancedCount).toBeGreaterThan(countShopFloorNavItems());
    expect(advancedCount).toBe(18);
  });

  it('activates destinations correctly', () => {
    expect(isShopFloorNavActive('/partner/floor/today', '/partner/floor/today')).toBe(true);
    expect(isShopFloorNavActive('/partner/floor/ready', '/partner/floor/today')).toBe(false);
    expect(isShopFloorNavActive('/partner/floor/new', '/partner/floor/new')).toBe(true);
    expect(isShopFloorNavActive('/partner', '/partner/floor/new')).toBe(false);
  });

  it('titles shop floor home and destinations', () => {
    expect(getShopFloorPageTitle('/partner')).toBe('Shop Floor');
    expect(getShopFloorPageTitle('/partner/floor/print')).toBe('Print');
    expect(getShopFloorPageTitle('/partner/floor/more')).toBe('More');
  });
});
