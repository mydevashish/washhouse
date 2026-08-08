/**
 * Customers & Orders Hub — orders-tab queue state.
 *
 * URL contract (P2 + P4):
 *   ?chip=needs_action|ready_today|walk_in|doorstep|unpaid|today|all
 *   ?q=…&status=…&source=…&payment=…
 *   ?phone=…&customer=… — customer-scoped queue (desk/directory handoff)
 *   chip=print navigates to print center (not a list filter).
 *
 * Shortcuts use `chip=`; the filter bar uses `status` / `source` / `payment`.
 */

import type { PartnerOrdersBucket } from '@/services/partner';

export const PARTNER_ORDERS_HUB_CHIPS = [
  'needs_action',
  'ready_today',
  'walk_in',
  'doorstep',
  'unpaid',
  'today',
  'all',
  'print',
] as const;

export type PartnerOrdersHubChip = (typeof PARTNER_ORDERS_HUB_CHIPS)[number];

/** Chips that filter the orders list (excludes print navigation). */
export type PartnerOrdersHubListChip = Exclude<PartnerOrdersHubChip, 'print'>;

export type PartnerOrdersHubChipDef = {
  id: PartnerOrdersHubChip;
  label: string;
  /** Short hint for screen readers / title. */
  description: string;
};

export const PARTNER_ORDERS_HUB_CHIP_DEFS: readonly PartnerOrdersHubChipDef[] = [
  { id: 'needs_action', label: 'Needs action', description: 'Orders waiting for accept or reject' },
  { id: 'ready_today', label: 'Ready today', description: 'Orders marked ready for handover' },
  { id: 'walk_in', label: 'Walk-in', description: 'Counter walk-in orders' },
  { id: 'doorstep', label: 'Doorstep', description: 'Online and assisted doorstep orders' },
  { id: 'unpaid', label: 'Unpaid', description: 'Pending payment or COD' },
  { id: 'today', label: 'Today', description: 'Orders created today' },
  { id: 'all', label: 'All', description: 'Clear shortcut filters' },
  { id: 'print', label: 'Print', description: 'Open print center' },
] as const;

export const PARTNER_ORDERS_PRINT_HREF = '/partner/floor/print';

export type PartnerOrdersQueueUrlState = {
  chip: PartnerOrdersHubListChip;
  q: string;
  status: string;
  source: string;
  payment: string;
  /** Customer-scoped queue (from desk/directory). */
  phone: string;
  /** Display name when scoped. */
  customer: string;
};

export type PartnerCustomerScope = {
  phone: string;
  name: string;
} | null;

export type PartnerOrdersQueueApiFilters = {
  bucket: PartnerOrdersBucket;
  status?: string;
  order_source?: string;
  payment_status?: string;
  created_today?: boolean;
};

const LIST_CHIPS = new Set<string>([
  'needs_action',
  'ready_today',
  'walk_in',
  'doorstep',
  'unpaid',
  'today',
  'all',
]);

/** Unknown chip → All (deep-link safe). */
export function parsePartnerOrdersHubChip(
  value: string | null | undefined,
): PartnerOrdersHubListChip {
  if (value && LIST_CHIPS.has(value)) return value as PartnerOrdersHubListChip;
  return 'all';
}

export function isPartnerOrdersPrintChip(value: string | null | undefined): boolean {
  return value === 'print';
}

type ChipPreset = {
  bucket?: PartnerOrdersBucket;
  status?: string;
  source?: string;
  payment?: string;
  createdToday?: boolean;
};

const CHIP_PRESETS: Record<PartnerOrdersHubListChip, ChipPreset> = {
  needs_action: { bucket: 'action' },
  ready_today: { status: 'ready' },
  walk_in: { source: 'walk_in' },
  doorstep: { source: 'doorstep' },
  unpaid: { payment: 'unpaid' },
  today: { createdToday: true },
  all: {},
};

/** Map chip + optional filter-bar overrides → API list params. */
export function resolvePartnerOrdersQueueApiFilters(
  state: PartnerOrdersQueueUrlState,
): PartnerOrdersQueueApiFilters {
  const preset = CHIP_PRESETS[state.chip] ?? CHIP_PRESETS.all;
  const status = state.status || preset.status;
  const source = state.source || preset.source;
  const payment = state.payment || preset.payment;
  const createdToday = state.chip === 'today' || Boolean(preset.createdToday);

  // Needs-action uses bucket=action unless the filter bar pinned an explicit status.
  const bucket: PartnerOrdersBucket =
    state.chip === 'needs_action' && !status ? 'action' : 'all';

  return {
    bucket,
    status: status || undefined,
    order_source: source || undefined,
    payment_status: payment || undefined,
    created_today: createdToday || undefined,
  };
}

/** Apply a chip preset into URL fields (clears conflicting filter-bar values). */
export function chipPresetUrlPatch(chip: PartnerOrdersHubListChip): {
  chip: string | null;
  status: string | null;
  source: string | null;
  payment: string | null;
} {
  const preset = CHIP_PRESETS[chip];
  return {
    chip: chip === 'all' ? null : chip,
    status: preset.status ?? null,
    source: preset.source ?? null,
    payment: preset.payment ?? null,
  };
}

export function parsePartnerOrdersQueueUrlState(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): PartnerOrdersQueueUrlState {
  const phone = (searchParams.get('phone') ?? '').trim();
  const qRaw = (searchParams.get('q') ?? '').trim();
  return {
    chip: parsePartnerOrdersHubChip(searchParams.get('chip')),
    // Customer scope without explicit q still filters via phone.
    q: qRaw || phone,
    status: (searchParams.get('status') ?? '').trim(),
    source: (searchParams.get('source') ?? '').trim(),
    payment: (searchParams.get('payment') ?? '').trim(),
    phone,
    customer: (searchParams.get('customer') ?? '').trim(),
  };
}

export function parsePartnerCustomerScope(
  state: Pick<PartnerOrdersQueueUrlState, 'phone' | 'customer'>,
): PartnerCustomerScope {
  if (!state.phone) return null;
  return { phone: state.phone, name: state.customer };
}

const QUEUE_KEYS = ['chip', 'q', 'status', 'source', 'payment'] as const;
const CUSTOMER_SCOPE_KEYS = ['phone', 'customer'] as const;

/**
 * Build hub path for orders tab with queue params.
 * Drops empty values; omits `tab` when orders (default).
 */
export function buildPartnerOrdersQueuePath(
  patch: Partial<{
    chip: string | null;
    q: string | null;
    status: string | null;
    source: string | null;
    payment: string | null;
    phone: string | null;
    customer: string | null;
  }>,
  current?: URLSearchParams | null,
): string {
  const params = new URLSearchParams();
  if (current) {
    current.forEach((value, key) => {
      if (key === 'tab') return;
      if ((QUEUE_KEYS as readonly string[]).includes(key)) return;
      if ((CUSTOMER_SCOPE_KEYS as readonly string[]).includes(key)) {
        // Handled below from patch / current merge.
        return;
      }
      params.append(key, value);
    });
  }

  const base = parsePartnerOrdersQueueUrlState(current ?? new URLSearchParams());
  const next = {
    chip: patch.chip !== undefined ? patch.chip : base.chip === 'all' ? null : base.chip,
    q: patch.q !== undefined ? patch.q : base.q || null,
    status: patch.status !== undefined ? patch.status : base.status || null,
    source: patch.source !== undefined ? patch.source : base.source || null,
    payment: patch.payment !== undefined ? patch.payment : base.payment || null,
    phone: patch.phone !== undefined ? patch.phone : base.phone || null,
    customer: patch.customer !== undefined ? patch.customer : base.customer || null,
  };

  if (next.chip) params.set('chip', next.chip);
  if (next.q) params.set('q', next.q);
  if (next.status) params.set('status', next.status);
  if (next.source) params.set('source', next.source);
  if (next.payment) params.set('payment', next.payment);
  if (next.phone) params.set('phone', next.phone);
  if (next.customer) params.set('customer', next.customer);

  const qs = params.toString();
  return qs ? `/partner/orders?${qs}` : '/partner/orders';
}

export const PARTNER_ORDER_STATUS_FILTERS = [
  { value: '', label: 'Any status' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'picked_up', label: 'Picked up' },
  { value: 'washing', label: 'Washing' },
  { value: 'ironing', label: 'Ironing' },
  { value: 'ready', label: 'Ready' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const PARTNER_ORDER_SOURCE_FILTERS = [
  { value: '', label: 'Any source' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'doorstep', label: 'Doorstep' },
  { value: 'online', label: 'Online' },
  { value: 'assisted_partner', label: 'Assisted' },
] as const;

export const PARTNER_ORDER_PAYMENT_FILTERS = [
  { value: '', label: 'Any payment' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending_cod', label: 'Pending COD' },
  { value: 'paid', label: 'Paid' },
] as const;
