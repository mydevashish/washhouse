import {
  buildNewOrderHref,
  buildPartnerCreateOrderHref,
} from '@/features/partner/customer-desk/phone';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import type { CustomerInsightRow, CustomerInsightsDashboard, CustomerSegment } from '@/services/customer-insights';

export type CustomerSoftTag = 'new' | 'regular' | 'at_risk';

export type CustomerSoftTagMeta = {
  id: CustomerSoftTag;
  label: string;
  /** Text label for screen readers (not color-only). */
  description: string;
  className: string;
};

const SOFT_TAG_META: Record<CustomerSoftTag, CustomerSoftTagMeta> = {
  new: {
    id: 'new',
    label: 'New',
    description: 'New customer',
    className: 'bg-info-muted text-info ring-1 ring-info/30',
  },
  regular: {
    id: 'regular',
    label: 'Regular',
    description: 'Regular customer',
    className: 'bg-success-muted text-success ring-1 ring-success/30',
  },
  at_risk: {
    id: 'at_risk',
    label: 'At risk',
    description: 'At-risk customer',
    className: 'bg-warning-muted text-warning ring-1 ring-warning/30',
  },
};

/** Map insights segments into the three soft tags owners scan quickly. */
export function customerSoftTag(segment: CustomerSegment | string): CustomerSoftTagMeta {
  if (segment === 'new') return SOFT_TAG_META.new;
  if (segment === 'at_risk' || segment === 'inactive') return SOFT_TAG_META.at_risk;
  return SOFT_TAG_META.regular;
}

export function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

/** Digits-only for tel: / wa.me; prefer India 91 prefix when 10-digit mobile. */
export function normalizeIndiaPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

export function whatsappHref(phone: string | null | undefined): string | null {
  const normalized = normalizeIndiaPhone(phone);
  return normalized ? `https://wa.me/${normalized}` : null;
}

export function telHref(phone: string | null | undefined): string | null {
  const normalized = normalizeIndiaPhone(phone);
  return normalized ? `tel:+${normalized}` : null;
}

export function newOrderPrefillHref(
  customer: Pick<CustomerInsightRow, 'name' | 'phone'>,
  mode: 'walk_in' | 'assisted' = 'walk_in',
): string {
  if (!customer.phone?.trim()) {
    return buildPartnerCreateOrderHref({ mode });
  }
  return buildNewOrderHref(customer.phone, customer.name, mode);
}

/** Desk history for this customer (user_id preferred). */
export function deskPrefillHref(
  customer: Pick<CustomerInsightRow, 'user_id' | 'phone'>,
): string {
  if (customer.user_id) {
    return buildOrdersHubPath('/partner/orders', 'desk', { user_id: customer.user_id });
  }
  if (customer.phone) {
    return buildOrdersHubPath('/partner/orders', 'desk', { phone: customer.phone });
  }
  return buildOrdersHubPath('/partner/orders', 'desk');
}

/** Orders queue filtered to this customer’s phone. */
export function customerScopedOrdersHref(
  customer: Pick<CustomerInsightRow, 'name' | 'phone'>,
): string | null {
  if (!customer.phone?.trim()) return null;
  const params = new URLSearchParams();
  params.set('phone', customer.phone.trim());
  params.set('q', customer.phone.trim());
  if (customer.name?.trim()) params.set('customer', customer.name.trim());
  return `/partner/orders?${params.toString()}`;
}

export type CustomerCrmInsights = {
  newThisWeek: number;
  repeatRatePct: number | null;
  topCustomers: CustomerInsightRow[];
};

/** Count customers whose first order falls in the last 7 days (partner-visible rows). */
export function countNewCustomersThisWeek(
  rows: CustomerInsightRow[],
  now: Date = new Date(),
): number {
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return rows.filter((row) => {
    if (!row.first_order_at) return false;
    const t = new Date(row.first_order_at).getTime();
    return !Number.isNaN(t) && t >= weekAgo;
  }).length;
}

export function buildCustomerCrmInsights(
  dashboard: CustomerInsightsDashboard | undefined,
  topRows: CustomerInsightRow[],
): CustomerCrmInsights {
  const total = dashboard?.total_customers ?? 0;
  const repeat = dashboard?.lists.repeat ?? 0;
  return {
    newThisWeek: dashboard?.new_this_week ?? 0,
    repeatRatePct: total > 0 ? Math.round((repeat / total) * 100) : null,
    topCustomers: topRows.slice(0, 5),
  };
}

export function filterCustomerRows(
  rows: CustomerInsightRow[],
  query: string,
): CustomerInsightRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const phone = row.phone ?? '';
    return `${row.name} ${phone}`.toLowerCase().includes(q);
  });
}
