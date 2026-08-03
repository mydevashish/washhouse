/**
 * Pre-launch: hide invented “live” KPI counts on marketing / discover / about.
 * Flip via `NEXT_PUBLIC_PRELAUNCH_STATS=false` (or default below) when real API/DB stats ship.
 * Display copy matches AppPromoSection store badges (“Coming Soon”).
 */

function boolEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

/** Default `true` until launch. Override: `NEXT_PUBLIC_PRELAUNCH_STATS`. */
export const PRELAUNCH_STATS = boolEnv(process.env.NEXT_PUBLIC_PRELAUNCH_STATS, true);

/** Consistent phrase across stats surfaces and app store badges. */
export const PRELAUNCH_STAT_VALUE = 'Coming Soon';

export function resolveStatValue(liveValue: string): string {
  return PRELAUNCH_STATS ? PRELAUNCH_STAT_VALUE : liveValue;
}
