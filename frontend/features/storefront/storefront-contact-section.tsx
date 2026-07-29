'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { MessageCircle, Navigation, Phone, PhoneCall } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCardInView } from '@/features/marketing/stores/use-card-in-view';
import { pickDirectionsUrl } from '@/lib/geo';
import { cn } from '@/lib/utils';
import {
  getContactInfo,
  requestCallback,
  trackContactEvent,
} from '@/services/customer-experience';
import { useAuthStore } from '@/store/auth.store';

export function StorefrontContactSection({
  laundryId,
  laundryName,
  className,
}: {
  laundryId: string;
  laundryName: string;
  className?: string;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  /** Defer contact GET until near viewport — keeps storefront LCP free of contact latency. */
  const { ref, inView } = useCardInView<HTMLDivElement>('200px 0px');

  const contactQ = useQuery({
    queryKey: ['contact-info', laundryId],
    queryFn: () => getContactInfo(laundryId),
    staleTime: 60_000,
    enabled: inView,
  });

  const trackM = useMutation({
    mutationFn: (event_type: string) =>
      trackContactEvent(laundryId, { event_type, source: 'storefront' }),
  });

  const callbackM = useMutation({
    mutationFn: () =>
      requestCallback(laundryId, { phone, preferred_time: preferredTime || undefined }),
    onSuccess: () => {
      toast.success('Callback requested — the shop will contact you soon.');
      setPhone('');
      setPreferredTime('');
    },
    onError: () => toast.error('Could not request callback'),
  });

  const c = contactQ.data;

  const requireLogin = () => {
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleCall = async () => {
    if (c?.requires_login) {
      requireLogin();
      return;
    }
    let nextPhone = c?.phone;
    if (user?.role === 'customer') {
      const updated = await trackM.mutateAsync('call_click');
      nextPhone = updated.phone ?? nextPhone;
    }
    if (nextPhone) window.location.href = `tel:${nextPhone}`;
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

  const handleDirections = async () => {
    if (!c?.show_directions) return;
    if (user?.role === 'customer') {
      await trackM.mutateAsync('directions_click');
    }
    const url = pickDirectionsUrl(c);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showShell = contactQ.isFetching && !c;
  const noChannels =
    c != null && !c.contact_available && !c.show_callback && !c.show_directions;

  // Sentinel only until near viewport — avoids empty "Contact" chrome competing with LCP.
  if (!inView) {
    return <div ref={ref} className="h-px w-full" aria-hidden />;
  }

  if (noChannels) return null;

  return (
    <section
      aria-labelledby="contact-actions-heading"
      className={cn(
        'rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-6 shadow-soft',
        className,
      )}
    >
      <h2 id="contact-actions-heading" className="text-xl font-bold">
        Contact {laundryName}
      </h2>

      {showShell ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-busy="true">
          <span className="sr-only">Loading contact options</span>
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      ) : null}

      {c ? (
        <>
          {c.requires_login && (
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to call, WhatsApp, or request a callback.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {c.show_call && (
              <Button type="button" className="gap-2" onClick={() => void handleCall()}>
                <Phone className="h-4 w-4" aria-hidden />
                {c.requires_login ? 'Sign in to call' : 'Call shop'}
              </Button>
            )}
            {c.show_whatsapp && (
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                onClick={() => void handleWhatsApp()}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {c.requires_login ? 'Sign in for WhatsApp' : 'WhatsApp shop'}
              </Button>
            )}
            {c.show_directions && (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={trackM.isPending}
                onClick={() => void handleDirections()}
              >
                <Navigation className="h-4 w-4" aria-hidden />
                Directions
              </Button>
            )}
          </div>

          {c.show_callback && !c.offline_booking_mode && user?.role === 'customer' && (
            <div className="mt-5 space-y-3 rounded-xl border border-border/50 bg-background/80 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <PhoneCall className="h-4 w-4 text-primary" aria-hidden />
                Request a callback
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="callback-phone">Your phone</Label>
                  <Input
                    id="callback-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91…"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="callback-time">Preferred time (optional)</Label>
                  <Input
                    id="callback-time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="Today 4–6 PM"
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!phone.trim() || callbackM.isPending}
                onClick={() => callbackM.mutate()}
              >
                Request callback
              </Button>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
