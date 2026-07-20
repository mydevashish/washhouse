import { resolveCatalogPhotoKey } from '@/features/marketing/catalog/resolve-catalog-photo-key';
import { resolveWashhouseCatalogPhoto } from '@/features/marketing/catalog/washhouse-catalog-photos';

describe('resolveCatalogPhotoKey', () => {
  it('maps winter jackets to distinct garment frames', () => {
    expect(
      resolveCatalogPhotoKey('winter-jacket-cotton-denim', 'Jacket (cotton/denim)'),
    ).toBe('jacket_denim');
    expect(resolveCatalogPhotoKey('winter-jacket-puffer', 'Jacket (puffer)')).toBe(
      'jacket_puffer',
    );
    expect(resolveCatalogPhotoKey('winter-jacket-leather', 'Jacket (leather)')).toBe(
      'jacket_leather',
    );
  });

  it('maps overcoats before generic coats', () => {
    expect(
      resolveCatalogPhotoKey('winter-overcoat-leather', 'Overcoat (leather)'),
    ).toBe('overcoat_leather');
    expect(
      resolveCatalogPhotoKey('winter-overcoat-men-women', 'Overcoat (men/women)'),
    ).toBe('overcoat');
  });

  it('maps men shirts and women sarees', () => {
    expect(resolveCatalogPhotoKey('men-shirt-tshirt', 'Shirt / T-shirt')).toBe('shirt');
    expect(resolveCatalogPhotoKey('women-saree-heavy', 'Saree (heavy)')).toBe('saree');
  });

  it('does not map petticoat to coat', () => {
    expect(resolveCatalogPhotoKey('women-petticoat', 'Petticoat')).toBe('skirt');
  });

  it('maps generic kids jackets without a material subtype', () => {
    expect(
      resolveCatalogPhotoKey('kids-full-jacket-normal', 'Full jacket (normal)'),
    ).toBe('jacket_denim');
    expect(
      resolveCatalogPhotoKey('kids-half-jacket-normal', 'Half jacket (normal)'),
    ).toBe('jacket_denim');
  });

  it('maps turban, burkha, and patiala/salwar', () => {
    expect(resolveCatalogPhotoKey('men-turban', 'Turban')).toBe('cap');
    expect(resolveCatalogPhotoKey('women-burkha', 'Burkha')).toBe('gown');
    expect(resolveCatalogPhotoKey('women-patiala-salwar', 'Patiala / Salwar')).toBe(
      'lower',
    );
  });

  it('returns null for unknown garments', () => {
    expect(resolveCatalogPhotoKey('custom-widget', 'Custom Widget')).toBeNull();
  });

  it('resolves catalog slugs to local /catalog/ WebP tiles', () => {
    const photo = resolveWashhouseCatalogPhoto('men-shirt-tshirt', 'Shirt / T-shirt');
    expect(photo?.src).toBe('/catalog/men/shirt.webp');
    expect(photo?.src).toMatch(/^\/catalog\/.+\.webp$/);
    expect(photo?.src).not.toMatch(/unsplash/i);
  });
});
