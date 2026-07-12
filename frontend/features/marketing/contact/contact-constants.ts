/** Public contact details — override via NEXT_PUBLIC_* env vars (no secrets). */

function envOrDefault(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value || fallback;
}

export const CONTACT_CONFIG = {
  supportEmail: envOrDefault('NEXT_PUBLIC_SUPPORT_EMAIL', 'support@washhouse.in'),
  phone: envOrDefault('NEXT_PUBLIC_SUPPORT_PHONE', '+91 98765 43210'),
  whatsapp: envOrDefault('NEXT_PUBLIC_WHATSAPP_NUMBER', '+91 98765 43210'),
  businessHours: envOrDefault('NEXT_PUBLIC_BUSINESS_HOURS', 'Mon–Sat, 9:00 AM – 7:00 PM IST'),
  officeAddress: envOrDefault(
    'NEXT_PUBLIC_OFFICE_ADDRESS',
    'The WashHouse Laundry & Dryclean\n[Street address placeholder]\nBengaluru, Karnataka 560001\nIndia',
  ),
} as const;

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
