import { z } from 'zod';

import { normalizeIndianPhoneInput } from '@/features/partner/customer-desk/phone';

export { normalizeIndianPhoneInput };

/** Inline copy for partner phone fields (spec F02). */
export const PARTNER_PHONE_INLINE_ERROR =
  'Enter a valid 10-digit mobile number (starts with 6–9)';

/** Strip non-digits and cap at 10 while typing (drops leading 91 country code). */
export function formatPhoneInputDisplay(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 10);
}

/** Display digits-only in inputs when stored value is E.164 +91… */
export function partnerPhoneDisplayValue(stored: string): string {
  if (!stored.trim()) return '';
  const trimmed = stored.trim();
  if (trimmed.startsWith('+91')) return trimmed.slice(3);
  return formatPhoneInputDisplay(trimmed);
}

/** Exactly 10 Indian mobile digits starting 6–9. */
export function isValidIndianMobileDigits(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}

export function isValidIndianMobileE164(phone: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

function digitsFromPartnerPhoneInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('+91')) return trimmed.slice(3);
  return trimmed.replace(/\D/g, '');
}

/** Normalize display / partial input to E.164 when exactly 10 valid digits. */
export function partnerPhoneToE164(raw: string): string {
  const digits = digitsFromPartnerPhoneInput(raw);
  if (isValidIndianMobileDigits(digits)) return `+91${digits}`;
  return normalizeIndianPhoneInput(raw);
}

export const partnerPhoneFieldSchema = z
  .string()
  .trim()
  .min(1, PARTNER_PHONE_INLINE_ERROR)
  .transform(partnerPhoneToE164)
  .refine(isValidIndianMobileE164, { message: PARTNER_PHONE_INLINE_ERROR });

/** True when stored / typed value is a valid partner mobile (E.164 +91). */
export function isPartnerPhoneReady(raw: string): boolean {
  return isValidIndianMobileE164(partnerPhoneToE164(raw));
}

/**
 * Field-level error for inline validation.
 * Shows error once 10 digits are present but invalid, or when `requireComplete` and not 10 digits.
 */
export function getPartnerPhoneFieldError(
  raw: string,
  opts?: { requireComplete?: boolean },
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return opts?.requireComplete ? PARTNER_PHONE_INLINE_ERROR : null;

  const digits = digitsFromPartnerPhoneInput(trimmed);
  const core = digits.length > 10 ? digits.slice(-10) : digits;

  if (core.length === 10 && !isValidIndianMobileDigits(core)) {
    return PARTNER_PHONE_INLINE_ERROR;
  }
  if (digits.length > 10) {
    return PARTNER_PHONE_INLINE_ERROR;
  }
  if (opts?.requireComplete && core.length !== 10) {
    return PARTNER_PHONE_INLINE_ERROR;
  }
  return null;
}

/** Customers directory / desk search — allow empty, name ≥2 chars, or valid 10-digit mobile. */
export function canRunPartnerCustomerSearch(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;

  const digits = trimmed.replace(/\D/g, '');
  const looksLikePhone = digits.length > 0 && /^[\d\s+\-()+ ]+$/.test(trimmed);

  if (looksLikePhone) {
    const core = digits.length > 10 ? digits.slice(-10) : digits;
    return isValidIndianMobileDigits(core) && (digits.length === 10 || (digits.length === 12 && digits.startsWith('91')));
  }

  return trimmed.length >= 2;
}

/** Search bar error when input looks like phone but is not valid. */
export function getPartnerCustomerSearchError(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, '');
  const looksLikePhone = digits.length > 0 && /^[\d\s+\-()+ ]+$/.test(trimmed);

  if (looksLikePhone && !canRunPartnerCustomerSearch(trimmed)) {
    const core = digits.length > 10 ? digits.slice(-10) : digits;
    if (core.length >= 10 || digits.length > 10) {
      return PARTNER_PHONE_INLINE_ERROR;
    }
    return null;
  }
  if (!looksLikePhone && trimmed.length === 1) {
    return 'Enter at least 2 characters (name or phone)';
  }
  return null;
}
