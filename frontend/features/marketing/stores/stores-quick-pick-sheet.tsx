'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Loader2, MapPin, MessageCircle, Phone, Store } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  pickNearestOrFeatured,
  resolveStartPrice,
} from '@/features/discover/lib/laundry-meta';
import { useGeolocation } from '@/hooks/use-geolocation';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { MARKETING_STORES_HREF } from '@/lib/navigation/marketing-nav';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import { getContactInfo, trackContactEvent } from '@/services/customer-experience';
import { listLaundries, type LaundryListItem } from '@/services/laundries';
import { useAuthStore } from '@/store/auth.store';

const CONTACT_SOURCE = 'stores_quick_pick';
const PREVIEW_COUNT = 3;

type StoresQuickPickSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatFromPrice(laundry: LaundryListItem): string | null {
  const price = resolveStartPrice(laundry);
  if (price == null) return null;
  return `From ₹${Math.round(price)}`;
}

function QuickPickRow({ laundry }: { laundry: LaundryListItem }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const storeHref = `/discover/${laundry.id}`;
  const loginRedirect = `/login?redirect=${encodeURIComponent(storeHref)}`;
  const fromPrice = formatFromPrice(laundry);

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
  const showCall = Boolean(c?.contact_available && c.show_call);
  const showWhatsApp = Boolean(c?.contact_available && c.show_whatsapp);

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
    <li className="rounded-xl border border-border/80 bg-card px-3 py-3">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden
        >
          <MapPin className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{laundry.name}</p>
          <p className="text-sm text-muted-foreground">{laundry.city}</p>
          {fromPrice && (
            <p className="mt-0.5 text-sm tabular-nums text-foreground/80">{fromPrice}</p>
          )}
        </div>
      </div>
      <div
        className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3"
        role="group"
        aria-label={`Actions for ${laundry.name}`}
      >
        <Button type="button" size="sm" variant="secondary" className="h-10 gap-1.5" asChild>
          <Link href={storeHref}>
            <Store className="h-3.5 w-3.5" aria-hidden />
            View
          </Link>
        </Button>
        {showCall && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-10 gap-1.5"
            disabled={trackM.isPending}
            aria-label={
              c?.requires_login ? `Sign in to call ${laundry.name}` : `Call ${laundry.name}`
            }
            onClick={() => void handleCall()}
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Call
          </Button>
        )}
        {showWhatsApp && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-10 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
            disabled={trackM.isPending}
            aria-label={
              c?.requires_login
                ? `Sign in for WhatsApp with ${laundry.name}`
                : `WhatsApp ${laundry.name}`
            }
            onClick={() => void handleWhatsApp()}
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            WhatsApp
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * Bottom sheet listing up to 3 nearest (GPS) or featured stores.
 * Mount only after first open — keeps sticky CTA bundle light (no maps SDK).
 */
export function StoresQuickPickSheet({ open, onOpenChange }: StoresQuickPickSheetProps) {
  const reduceMotion = usePrefersReducedMotion();
  const geo = useGeolocation();

  const listQ = useQuery({
    queryKey: queryKeys.laundries(),
    queryFn: () => listLaundries(),
    staleTime: STALE.laundries,
    enabled: open,
  });

  useEffect(() => {
    if (!open || geo.status !== 'idle') return;
    void geo.request();
  }, [open, geo.status, geo.request]);

  const preview = pickNearestOrFeatured(listQ.data ?? [], geo.position, PREVIEW_COUNT);
  const usingNearMe = Boolean(geo.position) && preview.length > 0;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={!reduceMotion}
    >
      <DrawerContent
        className={cn(
          'max-h-[85vh]',
          reduceMotion && '[&_[data-vaul-handle]]:transition-none',
        )}
        aria-describedby="stores-quick-pick-desc"
      >
        <DrawerHeader>
          <DrawerTitle>Nearby stores</DrawerTitle>
          <DrawerDescription id="stores-quick-pick-desc">
            {usingNearMe
              ? 'Closest partners from your location. Call, WhatsApp, or open a store.'
              : 'Featured partners. Allow location for nearest, or browse the full directory.'}
          </DrawerDescription>
        </DrawerHeader>

        {listQ.isLoading && (
          <div
            className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
            role="status"
            aria-busy="true"
          >
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
            Loading stores…
          </div>
        )}

        {listQ.isError && (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground" role="alert">
            Could not load stores. Open the full directory instead.
          </p>
        )}

        {!listQ.isLoading && !listQ.isError && preview.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground" role="status">
            No stores available yet. Check back soon.
          </p>
        )}

        {preview.length > 0 && (
          <ul className="space-y-3 pb-2" aria-label="Quick pick stores">
            {preview.map((laundry) => (
              <QuickPickRow key={laundry.id} laundry={laundry} />
            ))}
          </ul>
        )}

        <DrawerFooter className="gap-2 border-0 pt-2">
          <Button asChild size="lg" className="h-12 min-h-12 w-full gap-2 rounded-full">
            <Link href={MARKETING_STORES_HREF} onClick={() => onOpenChange(false)}>
              See all stores
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <DrawerClose asChild>
            <Button type="button" variant="ghost" className="h-11 min-h-11 w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
