import {
  isOnlineBookingEnabledFromEnv,
  resolveOnlineBookingEnabled,
  warnOnlineBookingFlagMismatch,
} from '@/lib/online-booking';

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

describe('resolveOnlineBookingEnabled', () => {
  it('returns false when env disallows online booking', () => {
    expect(resolveOnlineBookingEnabled(false, true)).toBe(false);
    expect(resolveOnlineBookingEnabled(false, false)).toBe(false);
  });

  it('uses API value when env allows and API responds', () => {
    expect(resolveOnlineBookingEnabled(true, true)).toBe(true);
    expect(resolveOnlineBookingEnabled(true, false)).toBe(false);
  });

  it('falls back to env when API value is missing', () => {
    expect(resolveOnlineBookingEnabled(true, null)).toBe(true);
    expect(resolveOnlineBookingEnabled(true, undefined)).toBe(true);
  });
});

describe('warnOnlineBookingFlagMismatch', () => {
  const originalEnv = process.env.NODE_ENV;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    warnSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it('warns when env and API disagree in development', () => {
    warnOnlineBookingFlagMismatch(true, false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('flag mismatch'));
  });

  it('does not warn when values match', () => {
    warnOnlineBookingFlagMismatch(true, true);
    warnOnlineBookingFlagMismatch(false, false);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn in production', () => {
    process.env.NODE_ENV = 'production';
    warnOnlineBookingFlagMismatch(true, false);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
