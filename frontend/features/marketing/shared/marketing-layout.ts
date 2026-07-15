/** Shared layout tokens for marketing homepage sections */

export const MARKETING_SECTION_PY = 'py-12 sm:py-16 lg:py-20';

export const MARKETING_CONTAINER = 'mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8';

/** Hero headline scale: 360 → 414 → 768 → 1024 → 1280/1440 */
export const MARKETING_HERO_HEADLINE =
  'text-3xl font-bold uppercase leading-tight tracking-tight text-foreground text-balance sm:text-4xl md:text-5xl lg:text-6xl';

/** Solid card fallback below md — disables backdrop-filter on low-end devices */
export const GLASS_MOBILE_SOLID_CARD =
  'max-md:border max-md:border-border/60 max-md:bg-card max-md:shadow-soft max-md:[backdrop-filter:none] max-md:[-webkit-backdrop-filter:none]';

/** Transparent wrapper fallback (how-it-works / why-choose section shells) */
export const GLASS_MOBILE_TRANSPARENT =
  'max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:[backdrop-filter:none] max-md:[-webkit-backdrop-filter:none]';

/** Solid fallback for glass on dark / gradient backgrounds — WCAG AA contrast (mobile only) */
export const GLASS_MOBILE_ON_DARK =
  'max-md:border max-md:border-white/20 max-md:bg-brand-900/95 max-md:[backdrop-filter:none] max-md:[-webkit-backdrop-filter:none]';

/** Dark glass over photo/gradient sections — use GlassSurface variant="onDark"; children carry text-on-hero */
export const GLASS_ON_DARK_GRADIENT = 'shadow-none';

/** Stats band glass over brand gradient — solid dark mobile fallback */
export const GLASS_MOBILE_ON_BRAND =
  'max-md:border max-md:border-white/20 max-md:bg-brand-900 max-md:[backdrop-filter:none] max-md:[-webkit-backdrop-filter:none]';

/** Dark stat cards on brand gradient (md+) — pairs with text-on-hero tokens */
export const GLASS_DESKTOP_ON_BRAND =
  'md:border md:border-white/20 md:bg-brand-900 md:shadow-none md:[backdrop-filter:none] md:[-webkit-backdrop-filter:none]';

/** Stats band cards — all breakpoints; dark surface + text-on-hero */
export const GLASS_ON_BRAND =
  'border border-white/25 bg-brand-900 text-on-hero [backdrop-filter:none] [-webkit-backdrop-filter:none]';

/** Vertical rhythm between hero fold and stats band */
export const MARKETING_STATS_SECTION_PY = 'pt-8 pb-8 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-12';

/** Hero split layout — shared by carousel + static fallback */
export const MARKETING_HERO_GRID =
  'grid min-h-[28rem] w-full grid-cols-1 lg:grid-cols-2 lg:items-stretch';

export const MARKETING_HERO_TEXT_COL =
  'order-1 flex min-h-0 min-w-0 flex-col justify-center bg-gradient-to-br from-background via-background to-brand-50/40 p-4 pb-16 dark:to-brand-900/10 sm:p-6 sm:pb-16 lg:justify-start lg:overflow-visible lg:p-8 lg:pb-8 xl:p-10';

export const MARKETING_HERO_IMAGE_COL =
  'relative order-2 min-h-[14rem] w-full overflow-hidden sm:min-h-[18rem] lg:min-h-0 lg:self-stretch';

/** Fills the image column height without absolute positioning (avoids grid collapse). */
export const MARKETING_HERO_IMAGE_FRAME =
  'relative h-full min-h-[14rem] w-full sm:min-h-[18rem] lg:min-h-full';
