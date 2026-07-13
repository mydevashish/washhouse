import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { DEFAULT_FILTERS } from '@/features/discover/listing/filter-laundries';
import { useLaundryDiscovery } from '@/features/discover/hooks/use-laundry-discovery';
import { listLaundries } from '@/services/laundries';

jest.mock('@/services/laundries', () => {
  const actual = jest.requireActual<typeof import('@/services/laundries')>('@/services/laundries');
  return {
    ...actual,
    listLaundries: jest.fn(),
    searchLaundries: jest.fn(),
  };
});

const mockedListLaundries = listLaundries as jest.MockedFunction<typeof listLaundries>;

const demoItems = [
  {
    id: 'a',
    name: 'Quick Wash Koramangala',
    slug: 'demo-quick-wash-koramangala',
    city: 'Bengaluru',
    avg_rating: '4.60',
    review_count: 128,
    is_verified: true,
  },
  {
    id: 'b',
    name: 'Sparkle Clean Indiranagar',
    slug: 'demo-sparkle-indiranagar',
    city: 'Bengaluru',
    avg_rating: '4.80',
    review_count: 256,
    is_verified: true,
  },
  {
    id: 'c',
    name: 'FreshFold HSR Layout',
    slug: 'demo-freshfold-hsr',
    city: 'Bengaluru',
    avg_rating: '4.40',
    review_count: 89,
    is_verified: true,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useLaundryDiscovery', () => {
  beforeEach(() => {
    mockedListLaundries.mockResolvedValue(demoItems);
  });

  it('surfaces API laundries through client filters with default caps', async () => {
    const { result } = renderHook(() => useLaundryDiscovery(DEFAULT_FILTERS), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.enriched).toHaveLength(3);
    expect(result.current.filtered).toHaveLength(3);
  });

  it('does not report zero filtered results while the list query is still pending', () => {
    mockedListLaundries.mockImplementation(() => new Promise(() => undefined));

    const { result } = renderHook(() => useLaundryDiscovery(DEFAULT_FILTERS), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.filtered).toHaveLength(0);
  });
});
