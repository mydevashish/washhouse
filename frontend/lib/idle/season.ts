import type { IdleAnimationTheme, SeasonMode } from '@/lib/session-config';

/** Resolve animation theme from env + calendar (Northern Hemisphere). */
export function resolveIdleAnimation(
  seasonMode: SeasonMode,
  idleAnimation: IdleAnimationTheme,
): Exclude<IdleAnimationTheme, 'auto'> {
  if (idleAnimation !== 'auto') return idleAnimation;
  if (seasonMode !== 'auto') return seasonMode as Exclude<IdleAnimationTheme, 'auto'>;

  const month = new Date().getMonth(); // 0–11
  if (month === 11 || month <= 1) return 'snow';
  if (month >= 2 && month <= 4) return 'summer';
  if (month >= 5 && month <= 8) return 'rain';
  if (month === 9 || month === 10) return 'autumn';
  return 'snow';
}
