import { permanentRedirect } from 'next/navigation';

import {
  buildPartnerOrdersQueuePath,
  chipPresetUrlPatch,
} from '@/features/partner/orders-hub/partner-orders-hub-queue';
import { buildNewOrderHref } from '@/features/partner/customer-desk/phone';

export const metadata = { title: 'Partner · Walk-in orders' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Legacy Walk-in list → Customers & Orders hub Walk-in lens.
 * Prefill create intents (phone / mode) land on New Order instead.
 */
export default async function PartnerWalkInOrdersRedirectPage({ searchParams }: PageProps) {
  const incoming = await searchParams;
  const phone = firstString(incoming.phone)?.trim();
  const name = firstString(incoming.name)?.trim();
  const modeRaw = firstString(incoming.mode)?.trim();
  const mode = modeRaw === 'assisted' ? 'assisted' : modeRaw === 'walk_in' ? 'walk_in' : null;

  if (phone) {
    permanentRedirect(buildNewOrderHref(phone, name, mode ?? 'walk_in'));
  }
  if (mode) {
    permanentRedirect(`/partner/new-order?mode=${mode}`);
  }

  const patch = chipPresetUrlPatch('walk_in');
  permanentRedirect(buildPartnerOrdersQueuePath(patch));
}
