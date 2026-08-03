'use client';

import { InfoBanner } from '@/components/ui/info-banner';
import {
  BOOKING_REQUEST_STATUS_LABELS,
  type BookingRequestStatus,
} from '@/features/admin/booking-requests/constants';
import type { BookingRequestRow } from '@/features/admin/booking-requests/types';

const OPEN_STATUSES = new Set<string>([
  'new',
  'reviewing',
  'assigned',
  'contacted',
  'confirmed',
]);

export function openRequestsForPhone(rows: BookingRequestRow[] | undefined): BookingRequestRow[] {
  if (!rows?.length) return [];
  return rows.filter((r) => OPEN_STATUSES.has(r.status));
}

type Props = {
  openRequests: BookingRequestRow[];
  loading?: boolean;
  scopeNote?: string;
};

export function BookingRequestDuplicateBanner({ openRequests, loading, scopeNote }: Props) {
  if (loading || openRequests.length === 0) return null;

  const preview = openRequests.slice(0, 3);
  return (
    <InfoBanner variant="warning" title="Open request already exists">
      <p>
        This phone has {openRequests.length} open booking request
        {openRequests.length === 1 ? '' : 's'}
        {scopeNote ? ` (${scopeNote})` : ''}. Creating another is allowed — ops will see both.
      </p>
      <ul className="mt-1.5 space-y-0.5 font-mono text-xs">
        {preview.map((r) => (
          <li key={r.id}>
            {r.public_code} ·{' '}
            {BOOKING_REQUEST_STATUS_LABELS[r.status as BookingRequestStatus] ?? r.status}
            {r.assigned_laundry_name ? ` · ${r.assigned_laundry_name}` : ''}
          </li>
        ))}
        {openRequests.length > preview.length ? (
          <li className="text-muted-foreground">+{openRequests.length - preview.length} more</li>
        ) : null}
      </ul>
    </InfoBanner>
  );
}

/** True when input looks like a complete Indian mobile (ready for by-phone lookup). */
export function looksLikeIndianMobile(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(digits)) return true;
  if (/^91[6-9]\d{9}$/.test(digits)) return true;
  return false;
}
