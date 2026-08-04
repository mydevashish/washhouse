/** India mobile helpers for Customer Desk search (E.164 +91). */

/** Digits-only, then prefer +91XXXXXXXXXX for 10-digit mobiles. */
export function normalizeIndianPhoneInput(raw: string): string {
  const trimmed = raw.trim().replace(/[\s()-]/g, '');
  const digits = trimmed.replace(/\D/g, '');

  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  if (trimmed.startsWith('+') && digits.length >= 10) return `+${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return trimmed;
}

export function isValidIndianMobileE164(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

/** Digits for wa.me / tel: (no leading +). */
export function phoneDigitsForDeepLink(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildCustomerWhatsAppUrl(phone: string, message?: string): string {
  const digits = phoneDigitsForDeepLink(phone);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
