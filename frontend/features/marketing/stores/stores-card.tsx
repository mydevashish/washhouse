'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MapPin, MessageCircle, Phone, Store } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getContactInfo, trackContactEvent } from '@/services/customer-experience';
import type { LaundryListItem } from '@/services/laundries';
import { useAuthStore } from '@/store/auth.store';

const CONTACT_SOURCE = 'stores_directory';

type StoresCardProps = {
  laundry: LaundryListItem;
  className?: string;
};

/** Slim marketing directory row — name + city + compact contact/view actions. */
export function StoresCard({ laundry, className }: StoresCardProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const storeHref = `/discover/${laundry.id}`;
  const loginRedirect = `/login?redirect=${encodeURIComponent(storeHref)}`;

  const contactQ = useQuery({
    queryKey: ['contact-info', laundry.id],
    queryFn: () => getContactInfo(laundry.id),
    staleTime: 60_000,
  });

  const trackM = useMutation({
    mutationFn: (event_type: string) =>
      trackContactEvent(laundry.id, { event_type, source: CONTACT_SOURCE }),
  });

  const c = contactQ.data;
  const showCall = Boolean(c?.show_call);
  const showWhatsApp = Boolean(c?.show_whatsapp);
  const showContactActions = Boolean(c?.contact_available && (showCall || showWhatsApp));

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

  return (
    <article
      className={cn(
        'rounded-xl border border-border/80 bg-card px-4 py-4',
        'transition-colors hover:border-primary/40 hover:bg-muted/40',
        className,
      )}
      aria-label={`${laundry.name}, ${laundry.city}`}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden
        >
          <MapPin className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">{laundry.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{laundry.city}</p>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3"
        role="group"
        aria-label={`Actions for ${laundry.name}`}
      >
        {showContactActions && showCall && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-11 w-11 shrink-0 sm:h-9 sm:w-9"
            disabled={trackM.isPending}
            aria-label={
              c?.requires_login
                ? `Sign in to call ${laundry.name}`
                : `Call ${laundry.name}`
            }
            onClick={() => void handleCall()}
          >
            <Phone className="h-4 w-4" aria-hidden />
          </Button>
        )}
        {showContactActions && showWhatsApp && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-11 w-11 shrink-0 border-emerald-500/30 text-emerald-700 sm:h-9 sm:w-9 dark:text-emerald-400"
            disabled={trackM.isPending}
            aria-label={
              c?.requires_login
                ? `Sign in for WhatsApp with ${laundry.name}`
                : `WhatsApp ${laundry.name}`
            }
            onClick={() => void handleWhatsApp()}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
          </Button>
        )}
        <Button type="button" size="sm" className="ml-auto gap-1.5" asChild>
          <Link href={storeHref}>
            <Store className="h-3.5 w-3.5" aria-hidden />
            View store
          </Link>
        </Button>
      </div>
    </article>
  );
}
