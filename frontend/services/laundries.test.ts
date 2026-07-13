import { parseLaundryListPayload } from '@/services/laundries';

describe('parseLaundryListPayload', () => {
  const item = {
    id: '1',
    name: 'Quick Wash',
    slug: 'demo-quick-wash-koramangala',
    city: 'Bengaluru',
    avg_rating: '4.60',
    review_count: 1,
    is_verified: true,
  };

  it('returns arrays unchanged', () => {
    expect(parseLaundryListPayload([item])).toEqual([item]);
  });

  it('unwraps paginated search-shaped payloads', () => {
    expect(
      parseLaundryListPayload({
        items: [item],
        total: 1,
        limit: 20,
        offset: 0,
      }),
    ).toEqual([item]);
  });

  it('returns an empty array for unknown shapes', () => {
    expect(parseLaundryListPayload(null)).toEqual([]);
    expect(parseLaundryListPayload({ data: [item] })).toEqual([]);
  });
});
