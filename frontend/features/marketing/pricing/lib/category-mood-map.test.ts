import {
  getPricingCategoryMood,
  PRICING_CATEGORY_MOOD,
} from '@/features/marketing/pricing/pricing-category-mood-map';

describe('pricing category mood map', () => {
  it('assigns exactly one mood variant per catalog category', () => {
    const variants = Object.values(PRICING_CATEGORY_MOOD);
    expect(variants).toHaveLength(6);
    expect(new Set(variants).size).toBeGreaterThanOrEqual(3);
  });

  it('uses steam / hang / fabric for atelier photo edges', () => {
    expect(getPricingCategoryMood('laundry_by_kg')).toBe('steam');
    expect(getPricingCategoryMood('men')).toBe('hang');
    expect(getPricingCategoryMood('women')).toBe('fabric');
    expect(getPricingCategoryMood('kids')).toBe('fabric');
    expect(getPricingCategoryMood('winter')).toBe('hang');
    expect(getPricingCategoryMood('household')).toBe('fabric');
  });
});
