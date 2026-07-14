import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useOnlineBookingEnabled } from '@/lib/hooks/use-online-booking-enabled';

const getPublicAppConfig = jest.fn();

jest.mock('@/services/app-config', () => ({
  getPublicAppConfig: (...args: unknown[]) => getPublicAppConfig(...args),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useOnlineBookingEnabled', () => {
  const original = process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING;

  beforeEach(() => {
    getPublicAppConfig.mockReset();
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING;
    } else {
      process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING = original;
    }
  });

  it('returns offline when env disallows online booking without calling API', async () => {
    process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING = 'false';

    const { result } = renderHook(() => useOnlineBookingEnabled(), { wrapper });

    expect(result.current).toEqual({ enabled: false, isLoading: false });
    expect(getPublicAppConfig).not.toHaveBeenCalled();
  });

  it('uses API online_booking_enabled when env allows', async () => {
    process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING = 'true';
    getPublicAppConfig.mockResolvedValue({ online_booking_enabled: false });

    const { result } = renderHook(() => useOnlineBookingEnabled(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.enabled).toBe(false);
    expect(getPublicAppConfig).toHaveBeenCalled();
  });

  it('reports loading before API resolves', () => {
    process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING = 'true';
    getPublicAppConfig.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useOnlineBookingEnabled(), { wrapper });

    expect(result.current).toEqual({ enabled: false, isLoading: true });
  });
});
