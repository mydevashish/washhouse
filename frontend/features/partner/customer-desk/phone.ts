/** India mobile helpers for Partner Customer Desk search (E.164 +91). */

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

export function phoneDigitsForDeepLink(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildCustomerWhatsAppUrl(phone: string, message?: string): string {
  const digits = phoneDigitsForDeepLink(phone);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** New Order workspace deep link (walk-in or assisted) with phone/name prefill. */
export function buildNewOrderHref(
  phone: string,
  name?: string | null,
  mode: 'walk_in' | 'assisted' = 'walk_in',
): string {
  const params = new URLSearchParams();
  params.set('phone', phone);
  if (name?.trim()) params.set('name', name.trim());
  params.set('mode', mode);
  return `/partner/new-order?${params.toString()}`;
}

/** @deprecated Prefer buildNewOrderHref — kept for walk-in list deep links. */
export function buildWalkInPrefillHref(phone: string, name?: string | null): string {
  return buildNewOrderHref(phone, name, 'walk_in');
}
