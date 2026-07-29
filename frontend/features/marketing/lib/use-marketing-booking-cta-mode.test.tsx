import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useMarketingBookingCtaMode } from '@/features/marketing/lib/use-marketing-booking-cta-mode';
import * as onlineBooking from '@/lib/online-booking';
import { getPublicAppConfig } from '@/services/app-config';

jest.mock('@/services/app-config', () => ({
  getPublicAppConfig: jest.fn(),
}));

jest.mock('@/lib/online-booking', () => {
  const actual = jest.requireActual('@/lib/online-booking');
  return {
    ...actual,
    isOnlineBookingEnabledFromEnv: jest.fn(),
    warnOnlineBookingFlagMismatch: jest.fn(),
  };
});

const getPublicAppConfigMock = getPublicAppConfig as jest.MockedFunction<typeof getPublicAppConfig>;
const isOnlineBookingEnabledFromEnv = onlineBooking.isOnlineBookingEnabledFromEnv as jest.MockedFunction<
  typeof onlineBooking.isOnlineBookingEnabledFromEnv
>;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useMarketingBookingCtaMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stays offline when env disables online booking', () => {
    isOnlineBookingEnabledFromEnv.mockReturnValue(false);

    const { result } = renderHook(() => useMarketingBookingCtaMode(), { wrapper });

    expect(result.current.onlineBooking).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(getPublicAppConfigMock).not.toHaveBeenCalled();
  });

  it('optimistically uses env while /config loads', async () => {
    isOnlineBookingEnabledFromEnv.mockReturnValue(true);
    let resolveConfig: (value: { online_booking_enabled: boolean }) => void = () => {};
    getPublicAppConfigMock.mockReturnValue(
      new Promise((resolve) => {
        resolveConfig = resolve;
      }),
    );

    const { result } = renderHook(() => useMarketingBookingCtaMode(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.onlineBooking).toBe(true);

    resolveConfig({ online_booking_enabled: false });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.onlineBooking).toBe(false);
  });

  it('follows API online_booking_enabled when env allows', async () => {
    isOnlineBookingEnabledFromEnv.mockReturnValue(true);
    getPublicAppConfigMock.mockResolvedValue({ online_booking_enabled: true });

    const { result } = renderHook(() => useMarketingBookingCtaMode(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.onlineBooking).toBe(true);
  });
});
