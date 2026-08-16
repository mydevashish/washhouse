import { buildStorefrontSavePayload, type StorefrontData } from '@/services/storefront';

const baseline: StorefrontData = {
  laundry_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  template_id: 'premium',
  is_published: true,
  logo_url: null,
  cover_url: 'https://example.com/cover.jpg',
  brand_primary: '#1e3a5f',
  brand_secondary: '#c9a227',
  tagline: 'Quality laundry',
  brand_story: 'Our story',
  years_in_business: 5,
  owner_name: 'Raj',
  contact_phone: '+919876543210',
  whatsapp_number: '+919876543210',
  show_call: true,
  show_whatsapp: true,
  show_callback: true,
  approval_status: 'approved',
  working_hours: { Mon: '9–6' },
  pickup_radius_km: '5',
  delivery_radius_km: '8',
  facilities: ['Steam Iron'],
  highlights: [{ title: 'Trusted', description: 'Local favourite' }],
  gallery: [],
  machines: [],
  team: [],
  certifications: [],
  videos: [],
  completeness_score: 42,
};

describe('buildStorefrontSavePayload', () => {
  it('creates a dirty diff without read-only fields', () => {
    const draft: StorefrontData = {
      ...baseline,
      tagline: 'Updated tagline',
      completeness_score: 99,
      approval_status: 'approved',
    };

    const payload = buildStorefrontSavePayload(draft, baseline);

    expect(payload).toEqual({ tagline: 'Updated tagline' });
    expect(payload).not.toHaveProperty('laundry_id');
    expect(payload).not.toHaveProperty('completeness_score');
    expect(payload).not.toHaveProperty('approval_status');
  });

  it('returns empty payload when nothing changed', () => {
    expect(buildStorefrontSavePayload(baseline, baseline)).toEqual({});
  });
});
