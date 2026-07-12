/**
 * Motion design tokens. Use these everywhere.
 * See `.cursor/rules/18-animation-usage.md`.
 */
export const easing = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  spring: { type: 'spring' as const, stiffness: 220, damping: 24 },
};

export const duration = {
  fast: 0.15,
  base: 0.22,
  slow: 0.36,
};
