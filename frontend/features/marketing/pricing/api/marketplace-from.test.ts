import { loadMarketplaceFromItems } from '@/features/marketing/pricing/api/marketplace-from';
import { washhouseSuggestedFromItems } from '@/features/marketing/pricing/washhouse-suggested-from';

describe('loadMarketplaceFromItems', () => {
  const originalFetch = global.fetch;
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it('returns the local fallback when API URL is unset', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    await expect(loadMarketplaceFromItems()).resolves.toEqual(washhouseSuggestedFromItems());
  });

  it('passes an abort signal so hung APIs cannot stall the build', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api/v1';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(loadMarketplaceFromItems()).resolves.toEqual(washhouseSuggestedFromItems());
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/catalog/marketplace-from',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('returns the local fallback when the request is aborted', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api/v1';
    global.fetch = jest.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')) as unknown as typeof fetch;

    await expect(loadMarketplaceFromItems()).resolves.toEqual(washhouseSuggestedFromItems());
  });
});
