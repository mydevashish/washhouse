import { isOnlineBookingEnabledFromEnv } from '@/lib/online-booking';

describe('isOnlineBookingEnabledFromEnv', () => {
  const original = process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING;
    } else {
      process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING = original;
    }
  });

  it('defaults to true when unset', () => {
    delete process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING;
    expect(isOnlineBookingEnabledFromEnv()).toBe(true);
  });

  it('returns false for false / 0 string values', () => {
    process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING = 'false';
    expect(isOnlineBookingEnabledFromEnv()).toBe(false);

    process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING = 'FALSE';
    expect(isOnlineBookingEnabledFromEnv()).toBe(false);
  });

  it('returns true for true / 1 string values', () => {
    process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING = 'true';
    expect(isOnlineBookingEnabledFromEnv()).toBe(true);

    process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING = '1';
    expect(isOnlineBookingEnabledFromEnv()).toBe(true);
  });
});
