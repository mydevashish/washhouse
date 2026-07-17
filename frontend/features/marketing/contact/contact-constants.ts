/** Public contact details — override via NEXT_PUBLIC_* env vars (no secrets). */

export const CONTACT_SUBJECTS = [
  { value: 'general', label: 'General' },
  { value: 'order-help', label: 'Order help' },
  { value: 'franchise', label: 'Franchise' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'legal-privacy', label: 'Legal / Privacy' },
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]['value'];

/** Anchor for the public contact message form (sticky-nav aware via scroll-mt). */
export const CONTACT_FORM_ANCHOR = 'contact-form';

/**
 * Build a contact URL with optional subject pre-select and form hash.
 * Used by marketing CTAs that deep-link into the contact form.
 */
export function buildContactHref(
  subject?: ContactSubject,
  options?: { hash?: string | false },
): string {
  const path = subject ? `/contact?subject=${subject}` : '/contact';
  if (options?.hash === false) return path;
  const hash = options?.hash === undefined ? CONTACT_FORM_ANCHOR : options.hash;
  return hash ? `${path}#${hash}` : path;
}
function envOrDefault(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value || fallback;
}

export const CONTACT_CONFIG = {
  supportEmail: envOrDefault('NEXT_PUBLIC_SUPPORT_EMAIL', 'thewashhousesolutions@gmail.com'),
  phone: envOrDefault('NEXT_PUBLIC_SUPPORT_PHONE', '+91 99777 51122'),
  whatsapp: envOrDefault('NEXT_PUBLIC_WHATSAPP_NUMBER', '+91 99777 51122'),
  businessHours: envOrDefault('NEXT_PUBLIC_BUSINESS_HOURS', 'Mon–Sat, 9:00 AM – 7:00 PM IST'),
  officeAddress: envOrDefault(
    'NEXT_PUBLIC_OFFICE_ADDRESS',
    'The WashHouse Laundry & Dryclean\nKoramangala 5th Block\nBengaluru, Karnataka 560095\nIndia',
  ),
} as const;

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'x' | 'youtube';

export type SocialLink = {
  platform: SocialPlatform;
  href: string;
  label: string;
};

const SOCIAL_DEFAULTS: Record<SocialPlatform, { href: string; label: string }> = {
  facebook: { href: 'https://facebook.com/washhouse', label: 'Facebook' },
  instagram: { href: 'https://instagram.com/washhouse', label: 'Instagram' },
  linkedin: { href: 'https://linkedin.com/company/washhouse', label: 'LinkedIn' },
  x: { href: 'https://x.com/washhouse', label: 'X (Twitter)' },
  youtube: { href: 'https://youtube.com/@washhouse', label: 'YouTube' },
};

const SOCIAL_ENV_KEYS: Record<SocialPlatform, string> = {
  facebook: 'NEXT_PUBLIC_FACEBOOK_URL',
  instagram: 'NEXT_PUBLIC_INSTAGRAM_URL',
  linkedin: 'NEXT_PUBLIC_LINKEDIN_URL',
  x: 'NEXT_PUBLIC_X_URL',
  youtube: 'NEXT_PUBLIC_YOUTUBE_URL',
};

export const SOCIAL_LINKS: readonly SocialLink[] = (
  Object.keys(SOCIAL_DEFAULTS) as SocialPlatform[]
).map((platform) => ({
  platform,
  href: envOrDefault(SOCIAL_ENV_KEYS[platform], SOCIAL_DEFAULTS[platform].href),
  label: SOCIAL_DEFAULTS[platform].label,
}));

/** Digits-only phone for tel: / wa.me links. */
export function contactPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildTelHref(phone: string): string {
  const digits = contactPhoneDigits(phone);
  return digits.startsWith('91') ? `tel:+${digits}` : `tel:+91${digits}`;
}

export function buildWhatsAppHref(phone: string, message?: string): string {
  const digits = contactPhoneDigits(phone);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
