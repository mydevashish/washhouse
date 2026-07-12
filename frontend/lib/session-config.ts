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

export const sessionConfig = {
  idleMinutes: numEnv(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES, 10),
  warningMinutes: numEnv(process.env.NEXT_PUBLIC_SESSION_WARNING_MINUTES, 2),
  enableIdleAnimations: boolEnv(process.env.NEXT_PUBLIC_ENABLE_IDLE_ANIMATIONS, true),
  seasonMode: (process.env.NEXT_PUBLIC_SEASON_MODE ?? 'auto') as SeasonMode,
  idleAnimation: (process.env.NEXT_PUBLIC_IDLE_ANIMATION ?? 'auto') as IdleAnimationTheme,
  get idleMs() {
    return this.idleMinutes * 60_000;
  },
  get warningMs() {
    return this.warningMinutes * 60_000;
  },
} as const;

export const SERVER_INSTANCE_STORAGE_KEY = 'dlm.serverInstanceId';
export const SESSION_SYNC_CHANNEL = 'dlm-session-sync';
export const SESSION_SYNC_STORAGE_KEY = 'dlm.session.lastActivity';

export type SessionLogoutReason = 'idle_expired' | 'server_restart' | 'manual';

export const SESSION_LOGOUT_MESSAGES: Record<SessionLogoutReason, string> = {
  idle_expired: 'Session expired due to inactivity.',
  server_restart: 'System updated. Please login again.',
  manual: 'You have been signed out.',
};
