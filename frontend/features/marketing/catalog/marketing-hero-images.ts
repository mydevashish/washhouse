export type MarketingHeroPhoto = {
  src: string;
  alt: string;
};

/**
 * Full-bleed 16∶9 marketing heroes (1920×1080 WebP).
 * Regenerate via `python scripts/download-marketing-heroes.py`.
 *
 * Do not reuse catalog product tiles (`/catalog/**`) for carousel LCP —
 * those masters are 4∶3 tiles at 1200×900.
 */
export const MARKETING_HERO_IMAGES = {
  welcome: {
    src: '/marketing/heroes/welcome.webp',
    alt: 'Neatly folded stacks of freshly laundered clothes in a bright WashHouse care studio',
  },
  services: {
    src: '/marketing/heroes/services.webp',
    alt: 'Commercial front-load washers in a modern professional laundry facility',
  },
  franchise: {
    src: '/marketing/heroes/franchise.webp',
    alt: 'WashHouse partner storefront with washers visible through the entrance',
  },
  delivery: {
    src: '/marketing/heroes/delivery.webp',
    alt: 'WashHouse courier holding a laundry delivery box at a doorstep pickup',
  },
} as const satisfies Record<string, MarketingHeroPhoto>;

/** Carousel slide scrims — headline lives in the adjacent text column. */
export const MARKETING_HERO_SLIDE_OVERLAYS = {
  welcome:
    'bg-gradient-to-br from-brand-500/20 via-transparent to-sky-500/15 dark:from-brand-900/35 dark:via-brand-950/20 dark:to-sky-500/12',
  fabrics:
    'bg-gradient-to-tr from-sky-500/15 via-transparent to-brand-500/20 dark:from-sky-500/12 dark:via-transparent dark:to-brand-600/28',
  franchise:
    'bg-gradient-to-bl from-brand-900/20 via-transparent to-brand-500/15 dark:from-brand-950/40 dark:via-brand-900/15 dark:to-brand-600/22',
  delivery:
    'bg-gradient-to-r from-brand-500/15 via-transparent to-sky-500/20 dark:from-brand-600/22 dark:via-transparent dark:to-sky-500/16',
} as const;

export type MarketingDecorativeBanner = {
  photo: MarketingHeroPhoto;
  /** Scrim keeping foreground / text-on-hero WCAG AA over the photo (light + dark). */
  overlayClassName: string;
};

/**
 * Decorative full-bleed backgrounds behind marketing copy.
 * Consumers must use `alt=""` and `aria-hidden` on the Image — text lives in the overlay.
 */
export const MARKETING_DECORATIVE_BANNERS = {
  brandCta: {
    photo: MARKETING_HERO_IMAGES.services,
    overlayClassName:
      'bg-gradient-to-r from-brand-900/95 via-brand-600/90 to-brand-900/95 dark:from-brand-950/97 dark:via-brand-800/92 dark:to-brand-950/97',
  },
  brandFranchise: {
    photo: MARKETING_HERO_IMAGES.franchise,
    overlayClassName:
      'bg-gradient-to-br from-brand-900/95 via-brand-800/90 to-brand-900/95 dark:from-brand-950/97 dark:via-brand-900/93 dark:to-brand-950/97',
  },
  pageHeroFreshLaundry: {
    photo: MARKETING_HERO_IMAGES.welcome,
    overlayClassName:
      'bg-gradient-to-t from-background via-background/92 to-background/70 dark:from-background dark:via-background/95 dark:to-background/82',
  },
  pageHeroStoreInterior: {
    photo: MARKETING_HERO_IMAGES.franchise,
    overlayClassName:
      'bg-gradient-to-t from-background via-background/92 to-background/70 dark:from-background dark:via-background/95 dark:to-background/82',
  },
} as const satisfies Record<string, MarketingDecorativeBanner>;
