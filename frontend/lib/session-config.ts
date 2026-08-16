/** Client session / idle policy (NEXT_PUBLIC_*). */

export type IdleAnimationTheme =
  | 'auto'
  | 'snow'
  | 'rain'
  | 'summer'
  | 'autumn'
  | 'diwali'
  | 'christmas'
  | 'newyear';

export type SeasonMode = 'auto' | IdleAnimationTheme;

function numEnv(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function boolEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

/** Customer / admin / marketing fallback when env is unset (do not shorten). */
export const CUSTOMER_SESSION_DEFAULTS = {
  idleMinutes: 10,
  warningMinutes: 2,
} as const;

/** Partner counter shifts — longer idle before warning (spec F01). */
export const PARTNER_SESSION_DEFAULTS = {
  idleMinutes: 60,
  warningMinutes: 5,
} as const;

export type SessionTimingConfig = {
  idleMinutes: number;
  warningMinutes: number;
  idleMs: number;
  warningMs: number;
  enableIdleAnimations: boolean;
  seasonMode: SeasonMode;
  idleAnimation: IdleAnimationTheme;
};

/**
 * Route-aware idle policy. Env vars override defaults for all portals when set.
 * Partner routes default to 60m idle / 5m warning; others stay 10m / 2m.
 */
export function resolveSessionConfig(isPartnerPortal: boolean): SessionTimingConfig {
  const fallback = isPartnerPortal ? PARTNER_SESSION_DEFAULTS : CUSTOMER_SESSION_DEFAULTS;
  const idleMinutes = numEnv(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES, fallback.idleMinutes);
  const warningMinutes = numEnv(
    process.env.NEXT_PUBLIC_SESSION_WARNING_MINUTES,
    fallback.warningMinutes,
  );
  return {
    idleMinutes,
    warningMinutes,
    idleMs: idleMinutes * 60_000,
    warningMs: warningMinutes * 60_000,
    enableIdleAnimations: boolEnv(process.env.NEXT_PUBLIC_ENABLE_IDLE_ANIMATIONS, true),
    seasonMode: (process.env.NEXT_PUBLIC_SEASON_MODE ?? 'auto') as SeasonMode,
    idleAnimation: (process.env.NEXT_PUBLIC_IDLE_ANIMATION ?? 'auto') as IdleAnimationTheme,
  };
}

/** Legacy export — customer/admin defaults (animations, logging). Idle timing prefers `resolveSessionConfig`. */
export const sessionConfig = resolveSessionConfig(false);

export const SERVER_INSTANCE_STORAGE_KEY = 'dlm.serverInstanceId';
export const SESSION_SYNC_CHANNEL = 'dlm-session-sync';
export const SESSION_SYNC_STORAGE_KEY = 'dlm.session.lastActivity';

export type SessionLogoutReason = 'idle_expired' | 'server_restart' | 'manual';

export const SESSION_LOGOUT_MESSAGES: Record<SessionLogoutReason, string> = {
  idle_expired: 'Session expired due to inactivity.',
  server_restart: 'System updated. Please login again.',
  manual: 'You have been signed out.',
};
