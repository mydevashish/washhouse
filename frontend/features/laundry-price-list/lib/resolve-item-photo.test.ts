import { resolvePriceListItemPhoto } from '@/features/laundry-price-list/lib/resolve-item-photo';

describe('resolvePriceListItemPhoto', () => {
  it('resolves known catalog slugs to product tiles', () => {
    const photo = resolvePriceListItemPhoto('men-shirt-tshirt', 'Shirt / T-shirt', 'men');
    expect(photo.src).toBe('/catalog/men/shirt.webp');
    expect(photo.alt).toMatch(/shirt/i);
  });

  it('falls back to category hero when slug is unknown', () => {
    const photo = resolvePriceListItemPhoto('custom-widget', 'Custom Widget', 'women');
    expect(photo.src).toBe('/catalog/women/saree-normal.webp');
  });
});
