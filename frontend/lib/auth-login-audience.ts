export type LoginAudience = 'customer' | 'partner' | 'admin';

export type LoginAudienceCopy = {
  /** Auth card heading. */
  title: string;
  /** Shorter document title when the card title is long (optional). */
  navbarTitle?: string;
  description: string;
  /** Secondary text link under the card (e.g. partner/admin → Staff portal). */
  backHref: string;
  backLabel: string;
  showOtpTab: boolean;
  footerPrompt?: string;
  footerHref?: string;
  footerLinkText?: string;
};

const AUDIENCE_COPY: Record<LoginAudience, LoginAudienceCopy> = {
  customer: {
    title: 'Sign in',
    description: 'Book doorstep laundry or manage your orders.',
    backHref: '/discover',
    backLabel: 'Browse laundries',
    showOtpTab: true,
    footerPrompt: 'New here?',
    footerHref: '/register',
    footerLinkText: 'Create account',
  },
  partner: {
    title: 'Laundry partner sign in',
    navbarTitle: 'Laundry login',
    description: 'Manage orders, pickups, deliveries, and your storefront.',
    backHref: '/staff',
    backLabel: 'Staff portal',
    showOtpTab: false,
    footerPrompt: 'Need a partner account?',
    footerHref: '/franchise#apply',
    footerLinkText: 'Apply for franchise',
  },
  admin: {
    title: 'Admin sign in',
    navbarTitle: 'Admin login',
    description: 'Platform operations, laundry approvals, settlements, and analytics.',
    backHref: '/staff',
    backLabel: 'Staff portal',
    showOtpTab: false,
    footerPrompt: 'Customer booking?',
    footerHref: '/stores',
    footerLinkText: 'Browse laundries',
  },
};

export function parseLoginAudience(value: string | null): LoginAudience {
  if (value === 'partner' || value === 'admin') return value;
  return 'customer';
}

export function getLoginAudienceCopy(audience: LoginAudience): LoginAudienceCopy {
  return AUDIENCE_COPY[audience];
}

/** Document title for a login audience (MarketingNavbar has no page H1). */
export function getLoginPageTitle(audience: LoginAudience): string {
  const copy = AUDIENCE_COPY[audience];
  return copy.navbarTitle ?? copy.title;
}

export function loginHrefForAudience(audience: Exclude<LoginAudience, 'customer'>): string {
  return `/login?audience=${audience}`;
}
