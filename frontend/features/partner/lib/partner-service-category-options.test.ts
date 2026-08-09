import {
  buildPartnerServiceCategoryOptions,
  partnerCategoryOptionFromName,
  resolvePartnerServiceCategorySlug,
} from '@/features/partner/lib/partner-service-category-options';

describe('partner service category options', () => {
  it('falls back when API returns an empty list', () => {
    expect(buildPartnerServiceCategoryOptions([], [])).toEqual([{ slug: 'wash', name: 'Wash' }]);
  });

  it('includes partner-defined custom options', () => {
    const options = buildPartnerServiceCategoryOptions(
      [{ slug: 'wash', name: 'Wash' }],
      [],
      [{ slug: 'leather-care', name: 'Leather care' }],
    );
    expect(options.some((o) => o.slug === 'leather-care' && o.name === 'Leather care')).toBe(true);
  });

  it('builds slug from a display name', () => {
    expect(partnerCategoryOptionFromName('Leather care')).toEqual({
      slug: 'leather-care',
      name: 'Leather care',
    });
  });

  it('merges API slugs with legacy service category strings', () => {
    const options = buildPartnerServiceCategoryOptions(
      [{ slug: 'dry-clean', name: 'Dry Clean' }],
      ['dry_clean', 'wash'],
    );
    expect(options.map((o) => o.slug)).toEqual(expect.arrayContaining(['dry-clean', 'wash']));
    expect(resolvePartnerServiceCategorySlug('dry_clean', options)).toBe('dry-clean');
  });
});
