/** Client-side online booking feature flag (NEXT_PUBLIC_*). */

function boolEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

export function isOnlineBookingEnabledFromEnv(): boolean {
  return boolEnv(process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING, true);
}

/** @deprecated Prefer isOnlineBookingEnabledFromEnv() — reads env at call time. */
export const onlineBookingConfig = {
  get clientEnabled() {
    return isOnlineBookingEnabledFromEnv();
  },
} as const;
