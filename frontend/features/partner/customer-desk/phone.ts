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

import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

export type PartnerCreateFulfillment = 'walk_in' | 'doorstep';

/** Customers & Orders → Create order tab with optional prefill. */
export function buildPartnerCreateOrderHref(opts?: {
  phone?: string | null;
  name?: string | null;
  fulfillment?: PartnerCreateFulfillment;
  /** @deprecated Prefer `fulfillment`; `assisted` maps to doorstep. */
  mode?: 'walk_in' | 'assisted';
}): string {
  const params = new URLSearchParams();
  if (opts?.phone?.trim()) params.set('phone', opts.phone.trim());
  if (opts?.name?.trim()) params.set('name', opts.name.trim());
  const fulfillment =
    opts?.fulfillment ?? (opts?.mode === 'assisted' ? 'doorstep' : 'walk_in');
  if (fulfillment === 'doorstep') params.set('fulfillment', 'doorstep');
  return buildOrdersHubPath('/partner/orders', 'create', params);
}

/** New Order workspace deep link (walk-in or assisted) with phone/name prefill. */
export function buildNewOrderHref(
  phone: string,
  name?: string | null,
  mode: 'walk_in' | 'assisted' = 'walk_in',
): string {
  return buildPartnerCreateOrderHref({ phone, name, mode });
}

/** @deprecated Prefer buildNewOrderHref — kept for walk-in list deep links. */
export function buildWalkInPrefillHref(phone: string, name?: string | null): string {
  return buildNewOrderHref(phone, name, 'walk_in');
}

/** Desk tab deep link with phone or user_id prefill. */
export function buildDeskPrefillHref(opts: {
  phone?: string | null;
  user_id?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set('tab', 'desk');
  if (opts.user_id?.trim()) params.set('user_id', opts.user_id.trim());
  else if (opts.phone?.trim()) params.set('phone', opts.phone.trim());
  return `/partner/orders?${params.toString()}`;
}

/**
 * Orders tab scoped to one customer (P4).
 * Sets `phone` (+ optional `customer` label) and `q` so the queue search API filters.
 */
export function buildCustomerScopedOrdersHref(
  phone: string,
  name?: string | null,
): string {
  const params = new URLSearchParams();
  const trimmed = phone.trim();
  params.set('phone', trimmed);
  params.set('q', trimmed);
  if (name?.trim()) params.set('customer', name.trim());
  return `/partner/orders?${params.toString()}`;
}
