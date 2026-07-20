import {
  PRICING_PRODUCT_PHOTOS,
  resolveProductPhotoKey,
} from '@/features/marketing/pricing/pricing-product-images';

describe('resolveProductPhotoKey', () => {
  it('maps winter jackets to distinct garment frames', () => {
    expect(
      resolveProductPhotoKey('winter-jacket-cotton-denim', 'Jacket (cotton/denim)'),
    ).toBe('jacket_denim');
    expect(resolveProductPhotoKey('winter-jacket-puffer', 'Jacket (puffer)')).toBe(
      'jacket_puffer',
    );
    expect(resolveProductPhotoKey('winter-jacket-leather', 'Jacket (leather)')).toBe(
      'jacket_leather',
    );
  });

  it('maps overcoats before generic coats', () => {
    expect(
      resolveProductPhotoKey('winter-overcoat-leather', 'Overcoat (leather)'),
    ).toBe('overcoat_leather');
    expect(
      resolveProductPhotoKey('winter-overcoat-men-women', 'Overcoat (men/women)'),
    ).toBe('overcoat');
  });

  it('maps men shirts and women sarees', () => {
    expect(resolveProductPhotoKey('men-shirt-tshirt', 'Shirt / T-shirt')).toBe('shirt');
    expect(resolveProductPhotoKey('women-saree-heavy', 'Saree (heavy)')).toBe('saree');
  });

  it('does not map petticoat to coat', () => {
    expect(resolveProductPhotoKey('women-petticoat', 'Petticoat')).toBe('skirt');
  });

  it('maps generic kids jackets without a material subtype', () => {
    expect(
      resolveProductPhotoKey('kids-full-jacket-normal', 'Full jacket (normal)'),
    ).toBe('jacket_denim');
    expect(
      resolveProductPhotoKey('kids-half-jacket-normal', 'Half jacket (normal)'),
    ).toBe('jacket_denim');
  });

  it('maps turban, burkha, and patiala/salwar', () => {
    expect(resolveProductPhotoKey('men-turban', 'Turban')).toBe('cap');
    expect(resolveProductPhotoKey('women-burkha', 'Burkha')).toBe('gown');
    expect(resolveProductPhotoKey('women-patiala-salwar', 'Patiala / Salwar')).toBe(
      'lower',
    );
  });

  it('returns null for unknown garments', () => {
    expect(resolveProductPhotoKey('custom-widget', 'Custom Widget')).toBeNull();
  });

  it('resolved keys point at local catalog WebP tiles', () => {
    const key = resolveProductPhotoKey('men-shirt-tshirt', 'Shirt / T-shirt');
    expect(key).toBe('shirt');
    expect(PRICING_PRODUCT_PHOTOS[key!].src).toBe('/catalog/men/shirt.webp');
    expect(PRICING_PRODUCT_PHOTOS[key!].src).not.toMatch(/unsplash/i);
  });
});
