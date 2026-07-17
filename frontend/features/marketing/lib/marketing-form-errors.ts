import { CONTACT_CONFIG } from '@/features/marketing/contact/contact-constants';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { isNetworkError } from '@/lib/api-errors';

/**
 * Actionable submit errors for public marketing forms (contact / franchise).
 * Distinguishes unreachable API from validation / rate-limit / server messages.
 */
export function getMarketingSubmitErrorMessage(error: unknown, fallback: string): string {
  if (isNetworkError(error)) {
    return `We couldn't reach our servers. Please try again shortly, or email ${CONTACT_CONFIG.supportEmail}.`;
  }
  return getApiErrorMessage(error, fallback);
}
