export type LoginAudience = 'customer' | 'partner' | 'admin';

export type LoginAudienceCopy = {
  title: string;
  description: string;
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

export function loginHrefForAudience(audience: Exclude<LoginAudience, 'customer'>): string {
  return `/login?audience=${audience}`;
}
