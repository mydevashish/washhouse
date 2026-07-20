import { resolveCatalogPhotoKey } from '@/features/marketing/catalog/resolve-catalog-photo-key';
import { resolveWashhouseCatalogPhoto } from '@/features/marketing/catalog/washhouse-catalog-photos';
import { SPECIAL_CARE_ITEMS } from '@/features/marketing/home/special-care-items';

describe('SPECIAL_CARE_ITEMS catalog photo keys', () => {
  it('maps wedding, saree, and leather-jacket tiles via resolveCatalogPhotoKey', () => {
    expect(
      resolveCatalogPhotoKey('wedding-sherwani', 'Wedding / Sherwani'),
    ).toBe('sherwani');
    expect(resolveCatalogPhotoKey('sarees', 'Sarees')).toBe('saree');
    expect(
      resolveCatalogPhotoKey('leather-jackets', 'Leather Jackets'),
    ).toBe('jacket_leather');
  });

  it('wedding, saree, and leather-jacket tiles match resolved catalog photos', () => {
    const targets = [
      { slug: 'wedding-sherwani', label: 'Wedding / Sherwani', key: 'sherwani' },
      { slug: 'sarees', label: 'Sarees', key: 'saree' },
      { slug: 'leather-jackets', label: 'Leather Jackets', key: 'jacket_leather' },
    ] as const;

    for (const { slug, label, key } of targets) {
      expect(resolveCatalogPhotoKey(slug, label)).toBe(key);
      const item = SPECIAL_CARE_ITEMS.find((i) => i.slug === slug);
      const resolved = resolveWashhouseCatalogPhoto(slug, label);
      expect(item).toBeDefined();
      expect(resolved?.src).toBe(item!.image);
    }
  });

  it('every tile uses a local catalog WebP with descriptive alt', () => {
    for (const item of SPECIAL_CARE_ITEMS) {
      expect(item.image).toMatch(/^\/catalog\/.+\.webp$/);
      expect(item.image).not.toMatch(/unsplash/i);
      expect(item.imageAlt.length).toBeGreaterThan(12);
    }
  });

  it('gives each special-care tile a unique image', () => {
    const srcs = SPECIAL_CARE_ITEMS.map((item) => item.image);
    expect(new Set(srcs).size).toBe(srcs.length);
  });
});
