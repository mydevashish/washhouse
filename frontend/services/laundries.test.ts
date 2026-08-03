import { api } from '@/lib/api';
import {
  listLaundries,
  parseLaundryListPayload,
  PUBLIC_LAUNDRY_LIST_PAGE_SIZE,
} from '@/services/laundries';

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockedGet = api.get as jest.MockedFunction<typeof api.get>;

function item(id: string, name: string) {
  return {
    id,
    name,
    slug: `slug-${id}`,
    city: 'Bengaluru',
    avg_rating: '4.00',
    review_count: 1,
    is_verified: true,
  };
}

describe('parseLaundryListPayload', () => {
  const sample = item('1', 'Quick Wash');

  it('returns arrays unchanged', () => {
    expect(parseLaundryListPayload([sample])).toEqual([sample]);
  });

  it('unwraps paginated search-shaped payloads', () => {
    expect(
      parseLaundryListPayload({
        items: [sample],
        total: 1,
        limit: 20,
        offset: 0,
      }),
    ).toEqual([sample]);
  });

  it('returns an empty array for unknown shapes', () => {
    expect(parseLaundryListPayload(null)).toEqual([]);
    expect(parseLaundryListPayload({ data: [sample] })).toEqual([]);
  });
});

describe('listLaundries', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('requests the public page size (not the old default of 20)', async () => {
    mockedGet.mockResolvedValue({
      data: {
        data: [item('a', 'A')],
        meta: { request_id: '', timestamp: '', pagination: { total: 1, has_next: false } },
      },
    });

    await listLaundries();

    expect(mockedGet).toHaveBeenCalledWith(
      '/laundries',
      expect.objectContaining({
        params: expect.objectContaining({
          limit: PUBLIC_LAUNDRY_LIST_PAGE_SIZE,
          offset: 0,
        }),
      }),
    );
  });

  it('pages until has_next is false so low-rated new stores are not truncated', async () => {
    const page1 = Array.from({ length: PUBLIC_LAUNDRY_LIST_PAGE_SIZE }, (_, i) =>
      item(`p1-${i}`, `High ${i}`),
    );
    const page2 = [item('newbie', 'Brand New Zero Star')];

    mockedGet
      .mockResolvedValueOnce({
        data: {
          data: page1,
          meta: {
            request_id: '',
            timestamp: '',
            pagination: { total: 101, has_next: true },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: page2,
          meta: {
            request_id: '',
            timestamp: '',
            pagination: { total: 101, has_next: false },
          },
        },
      });

    const items = await listLaundries();

    expect(mockedGet).toHaveBeenCalledTimes(2);
    expect(mockedGet.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        params: expect.objectContaining({
          limit: PUBLIC_LAUNDRY_LIST_PAGE_SIZE,
          offset: PUBLIC_LAUNDRY_LIST_PAGE_SIZE,
        }),
      }),
    );
    expect(items).toHaveLength(PUBLIC_LAUNDRY_LIST_PAGE_SIZE + 1);
    expect(items.at(-1)?.name).toBe('Brand New Zero Star');
  });
});
