'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';

import { pickDirectionsUrl } from '@/lib/geo';
import {
  getContactInfo,
  trackContactEvent,
  type ContactInfo,
} from '@/services/customer-experience';
import { useAuthStore } from '@/store/auth.store';

export type StoreContactSource = 'stores_quick_pick' | 'stores_directory';

/**
 * Emerald outline only — never primary brand blue fill on WhatsApp.
 * Pair with `variant="outline"`.
 */
export const STORE_WHATSAPP_OUTLINE_CLASS =
  'border-emerald-500/40 bg-transparent text-emerald-700 hover:bg-emerald-500/5 hover:text-emerald-800 dark:border-emerald-400/35 dark:text-emerald-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300';

type UseStoreContactActionsOptions = {
  laundryId: string;
  laundryName: string;
  source: StoreContactSource;
  /** When false, contact query stays idle (e.g. directory card not in view). Default true. */
  enabled?: boolean;
};

function resolveDirectionsUrl(c: ContactInfo | undefined): string | null {
  if (!c) return null;
  if (c.show_directions) {
    const picked = pickDirectionsUrl(c);
    if (picked) return picked;
  }
  return c.map_url ?? null;
}

/**
 * Shared Call / WhatsApp / Get Location gating + tracking for marketing store surfaces.
 * Never puts tel: / wa.me / map URLs in markup for login-gated guests — handlers redirect instead.
 */
export function useStoreContactActions({
  laundryId,
  laundryName,
  source,
  enabled = true,
}: UseStoreContactActionsOptions) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const storeHref = `/discover/${laundryId}`; 
  const loginRedirect = `/login?redirect=${encodeURIComponent(storeHref)}`;

  const contactQ = useQuery({
    queryKey: ['contact-info', laundryId],
    queryFn: () => getContactInfo(laundryId),
    staleTime: 60_000,
    enabled,
  });

  const trackM = useMutation({
    mutationFn: (event_type: string) =>
      trackContactEvent(laundryId, { event_type, source }),
  });

  const c = contactQ.data;
  const showCall = Boolean(c?.contact_available && c?.show_call);
  const showWhatsApp = Boolean(c?.contact_available && c?.show_whatsapp);
  const directionsUrl = resolveDirectionsUrl(c);
  const showDirections = Boolean(directionsUrl);
  const showContactActions = Boolean(showCall || showWhatsApp || showDirections);

  const requireLogin = () => {
    router.push(loginRedirect);
  };

  const handleCall = async () => {
    if (c?.requires_login) {
      requireLogin();
      return;
    }
    let phone = c?.phone;
    if (user?.role === 'customer') {
      const updated = await trackM.mutateAsync('call_click');
      phone = updated.phone ?? phone;
    }
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = async () => {
    if (c?.requires_login) {
      requireLogin();
      return;
    }
    let url = c?.whatsapp_url;
    if (user?.role === 'customer') {
      const updated = await trackM.mutateAsync('whatsapp_click');
      url = updated.whatsapp_url ?? url;
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleGetLocation = async () => {
    if (c?.requires_login) {
      requireLogin();
      return;
    }
    if (user?.role === 'customer' && c?.show_directions) {
      await trackM.mutateAsync('directions_click');
    }
    const url = resolveDirectionsUrl(c);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return {
    storeHref,
    contact: c,
    showCall,
    showWhatsApp,
    showDirections,
    showContactActions,
    isPending: trackM.isPending,
    isContactLoading: contactQ.isLoading,
    callAriaLabel: c?.requires_login
      ? `Sign in to Call Store for ${laundryName}`
      : `Call Store for ${laundryName}`,
    whatsappAriaLabel: c?.requires_login
      ? `Sign in to Message Store for ${laundryName}`
      : `Message Store for ${laundryName}`,
    directionsAriaLabel: c?.requires_login
      ? `Sign in to Get Location for ${laundryName}`
      : `Get Location for ${laundryName}`,
    handleCall,
    handleWhatsApp,
    handleGetLocation,
  };
}
