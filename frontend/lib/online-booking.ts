import { abortSignalAfter } from '@/lib/abort-signal-after';

/** Client-side online booking feature flag (NEXT_PUBLIC_*). */

function boolEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

export function isOnlineBookingEnabledFromEnv(): boolean {
  return boolEnv(process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING, true);
}

/**
 * When env allows online booking, `/config` `online_booking_enabled` is the runtime source of truth.
 * Falls back to env when the API response is missing (server fetch errors).
 */
export function resolveOnlineBookingEnabled(
  envAllows: boolean,
  apiEnabled: boolean | null | undefined,
): boolean {
  if (!envAllows) return false;
  if (apiEnabled === null || apiEnabled === undefined) return envAllows;
  return apiEnabled;
}

/** Dev-only: warn when frontend env and backend `/config` disagree. */
export function warnOnlineBookingFlagMismatch(
  envAllows: boolean,
  apiEnabled: boolean,
): void {
  if (process.env.NODE_ENV !== 'development') return;
  if (envAllows === apiEnabled) return;

  console.warn(
    '[DLM] Online booking flag mismatch: ' +
      `NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=${String(envAllows)} but ` +
      `GET /config returned online_booking_enabled=${String(apiEnabled)}. ` +
      'The UI follows the API when the frontend env allows online booking. ' +
      'Set FEATURE_ONLINE_BOOKING (backend/.env) and NEXT_PUBLIC_FEATURE_ONLINE_BOOKING ' +
      '(frontend/.env) to the same value, then restart uvicorn and pnpm dev.',
  );
}

/** Cap build/SSR waits so a down or firewalled API cannot stall `next build`. */
export const ONLINE_BOOKING_CONFIG_FETCH_TIMEOUT_MS = 5_000;

/** Server components — fetch backend `/config` without caching. */
export async function fetchOnlineBookingEnabledFromApi(): Promise<boolean | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/config`, {
      cache: 'no-store',
      signal: abortSignalAfter(ONLINE_BOOKING_CONFIG_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { online_booking_enabled?: boolean } };
    const value = json.data?.online_booking_enabled;
    return typeof value === 'boolean' ? value : null;
  } catch {
    return null;
  }
}

/** @deprecated Prefer isOnlineBookingEnabledFromEnv() — reads env at call time. */
export const onlineBookingConfig = {
  get clientEnabled() {
    return isOnlineBookingEnabledFromEnv();
  },
} as const;
